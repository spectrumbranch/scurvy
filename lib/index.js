var Bcrypt = require('bcrypt');
var Joi = require('joi');
var Hoek = require('hoek');

var internals = {};



internals.bcryptRounds = 10;

internals.data = require('./models');


internals.flashback = function(input) {
	var output = input.replace(/\$/g, '_');
	return output;
}

internals.flashforward = function(input) {
	var output = input.replace(/_/g, '$');
	return output;
}


var scurvy = internals.scurvy = function() {
	//console.log('constructor');
};
var config_default = {
	showTrace: false,
	authSchema: 'userid'
};
var config = scurvy.prototype.config = config_default;
scurvy.prototype.configure = function(config_input) {
	config = Hoek.applyToDefaults(config_default, config_input);
	internals.data.configure(config);
};

//hooks directly to data
scurvy.prototype.loadModels = internals.data.loadModels;
scurvy.prototype.setupAssociations = internals.data.setupAssociations;
scurvy.prototype.setupSync = internals.data.setupSync;


scurvy.prototype.comparePlaintextToHash = function(plaintext, hash, callback) {
    Bcrypt.compare(plaintext, hash, function(err, result) {
        if (config.showTrace && err) {
            console.log("Error in scurvy.comparePlaintextToHash(): " + err);
        }
        callback(err, result);
    });
}

scurvy.prototype.generateNewHash = function(input, callback) {
    Bcrypt.genSalt(internals.bcryptRounds, function(err, salt) {
        Bcrypt.hash(input, salt, function(err, crypted) {
            var result = {
                salt: salt,
                hash: crypted
            };
            callback(null, result);
        });
    })
};

scurvy.prototype.generateMetastateHashkey = function (email, salt, callback) {
	Bcrypt.hash(email, salt, function(err, crypted) {
		var result = {
			hashkey: internals.flashback(crypted)
		};
		callback(null, result);
	});
}

scurvy.prototype.validateMetastateHashkey = function (hashkey, email, callback) {
    Bcrypt.compare(email, internals.flashforward(hashkey), function(err, result) {
        if (config.showTrace && err) {
            console.log("Error in auth.internals.validateMetastateHashkey(): " + err);
        }
        callback(err, result);
    });
}

//requires sequelize
scurvy.prototype.doesMetastateHashkeyHaveUser = function(hashkey, callback) {
	if (config.showTrace) {
		console.log('confirm:hashkey: ' + hashkey);
	}
	internals.data.hook.metastate.find({ //err
		where: {
			hashkey: hashkey,
			status: 'inactive'
		}
	}).then(function(metastate) {
		if (metastate != null) {
			if (config.showTrace) {
				console.log('confirm:metastate user_id: ' + metastate.userId);
			}
			internals.data.hook.user.find({
				where: {
					id: metastate.userId
				}
			}).then(function(user) {
				if (user != null) {
					if (config.showTrace) {
						console.log('confirm:user.email : ' + user.email);
					}
					//validated!
					callback(null, { user: user, metastate: metastate});
				} else {
					//not a match!
					callback(null, false);
				}
			});
		} else {
			//not a match!
			callback(null, false);
		}
	});
}

scurvy.prototype.verifyCredentials = function(input, callback) {
	//validation
	var S = Joi.Types.String;
	var A = Joi.Types.Array;
	var verifyCredentialsValidation = {};
	
	if (config.authSchema == 'email') {
		verifyCredentialsValidation = {
			email: S().required(),
			passwrd: S().required(),
			include: A()
		};
	} else if (config.authSchema == 'userid') {
		verifyCredentialsValidation = {
			userid: S().required(),
			passwrd: S().required(),
			include: A()
		};
	}
	var scurvy = this;
	var parameter_validation_errors = Joi.validate(input, verifyCredentialsValidation);
	//console.log(parameter_validation_errors);

	if (parameter_validation_errors == null) {
		var userSearchObj = {};
		var associationsToGet = [ internals.data.hook.metastate ];
		
		if (input.include) {
			for (var x = 0; x < input.include.length; x++) {
				associationsToGet.push(input.include[x]);
			}
		}
		if (config.authSchema == 'email') {
			userSearchObj = { email: input.email };
		} else if (config.authSchema == 'userid') {
			userSearchObj = { userid: input.userid };
		} else {
			throw new Error('Invalid configuration.');
		}
		var password_input = input.passwrd;
		internals.data.hook.user.find({ where: userSearchObj, include: associationsToGet }).then(function(user) {
			if (user) {
				if (user.metastate.status == 'active') {
					scurvy.comparePlaintextToHash(password_input, user.hash, function (err, matches) {
						if (err) {
							if (config.showTrace) {
								console.log('scurvy.verifyCredentials err from scurvy.comparePlaintextToHash() : ' + err);
							}
							callback(err, false);
						} else {
							if (matches) {
								callback(err, user);
							} else {
								callback(err, false);
							}
						}
					})
				} else {
					callback(null, false);
				}
			} else {
				callback(null, false);
			}
		})
	} else {
		if (config.authSchema == 'email') {
			callback(new Error('input object must contain the following fields: email, passwrd'));
		} else if (config.authSchema == 'userid') {
			callback(new Error('input object must contain the following fields: userid, passwrd'));
		}
	}
}

scurvy.prototype.createUser = function(params, callback) {
	//filter
	// if status is left out, default to inactive
	if (!params.status || params.status == '') {
		params.status = 'inactive';
	}
	//validation
	var S = Joi.string;
	var createUserValidation = {};
	
	if (config.authSchema == 'email') {
		createUserValidation = {
			email: S().required(),
			passwrd: S().required(),
			status: S().valid('active', 'inactive', 'deleted')
		};
	} else if (config.authSchema == 'userid') {
		createUserValidation = {
			userid: S().required(),
			email: S().required(),
			passwrd: S().required(),
			status: S().valid('active', 'inactive', 'deleted')
		};
	}

	var parameter_validation_errors = Joi.validate(params, createUserValidation);

	if (parameter_validation_errors == null) {
		var scurvy = this;
		
		var passwrd = params.passwrd;
		
		scurvy.generateNewHash(passwrd, function(err, hashcake) {
			var User = internals.data.hook.user;
			var Metastate = internals.data.hook.metastate;
			
			var salt = hashcake.salt;
			var hash = hashcake.hash;
			
			var userCreateObject = {};
			if (config.authSchema == 'email') {
				var email = params.email;
				
				var status = params.status;
				userCreateObject = { email: email, salt: salt, hash: hash };
			} else if (config.authSchema == 'userid') {
				var userid = params.userid;
				var email = params.email;
				var status = params.status;
				userCreateObject = { userid: userid, email: email, salt: salt, hash: hash };
			}
			
			User.create(userCreateObject).then(function(user) {
				if (config.showTrace) {
					if (config.authSchema == 'email') {
						console.log("successfully created user " + user.email);
					} else if (config.authSchema == 'userid') {
						console.log("successfully created user " + user.userid);
					}
				}
				scurvy.generateMetastateHashkey(email, salt, function(err1, result) {
					if (config.showTrace && err1) {
						console.log("error when generating metastate hashkey:" + err1);
					}
					
					var hashkey = result.hashkey;
					
					Metastate.create({ status: status, hashkey: hashkey }).then(function(metastate) {
						if (config.showTrace) {
							console.log("successfully created metastate");
						}
						user.setMetastate(metastate).then(function() {
							//successfully saved
							if (config.showTrace) {
								console.log("successfully saved user to metastate association for email " + email + " and hashkey " + hashkey + ".");
							}
							callback(null, {user: user, metastate: metastate});
						});
					});//if error?
				});
			}).catch(function(error) {
				callback(error, null);
			});
		});
	} else {
		if (config.authSchema == 'email') {
			callback(new Error('params object must contain the following fields: email, passwrd, status'));
		} else if (config.authSchema == 'userid') {
			callback(new Error('params object must contain the following fields: userid, email, passwrd, status'));
		}
	}
};




scurvy.prototype.activateUser = function(input, callback) {
	var metastate = input.metastate;
	metastate.updateAttributes({
		status: 'active'
	}).then(function() {
		if (config.showTrace) {
			console.log('auth.activateUser(): success! User has been activated!');
		}
		callback(null, true);
	}).catch(function(err) {
		if (config.showTrace) {
			console.log("auth.activateUser(): error");
			console.log(err);
		}
		callback(err, false);
	});
}

scurvy.prototype.setRounds = function(input) {
	if (!(input > 0) || input % 1 != 0) {
		throw new Error("scurvy.setRounds only accepts positive integers.");
	} else {
		internals.bcryptRounds = input;
	}
}






//export lib
module.exports = scurvy;

scurvy.createInstance = function (/* configuration */) {
	var Scurvy = new scurvy;
	
	Scurvy.configure(arguments[0] !== undefined ? arguments[0] : {});
	// if (arguments[0] !== undefined) {
		// Scurvy.configure(arguments[0]);
	// }
	if (Scurvy.config.showTrace) {
		console.log('Scurvy instance loaded with config: ');
		console.log(Scurvy.config);
	}
	
	
	return Scurvy;
};
