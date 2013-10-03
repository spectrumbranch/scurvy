var Bcrypt = require('bcrypt');
var Joi = require('joi');
var Hoek = require('hoek');

var internals = {};

var config_default = {
	showTrace: false
};
var config = internals.config = config_default;

exports.configure = function(config_input) {
	config = Hoek.applyToDefaults(config_default, config_input);
};

internals.bcryptRounds = 10;

internals.data = require('./models');

internals.data.registerCallback(function(data) {
	internals.data = data;
})

internals.flashback = function(input) {
	var output = input.replace(/\$/g, '_');
	return output;
}

internals.flashforward = function(input) {
	var output = input.replace(/_/g, '$');
	return output;
}


var scurvy = internals.scurvy = {};

//hooks directly to data
scurvy.loadModels = internals.data.loadModels;
scurvy.setupAssociations = internals.data.setupAssociations;
scurvy.setupSync = internals.data.setupSync;


scurvy.comparePlaintextToHash = function(plaintext, hash, callback) {
    Bcrypt.compare(plaintext, hash, function(err, result) {
        if (config.showTrace && err) {
            console.log("Error in scurvy.comparePlaintextToHash(): " + err);
        }
        callback(err, result);
    });
}

scurvy.login_validate = function() {
	var S = Joi.types.String;
	return {
		userid: S().required().min(5).max(30),
		passwrd: S().required().min(8),
		view: S()
	}
}



internals.register = function() {

}

internals.confirm = function() {

}



scurvy.generateNewHash = function(input, callback) {
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

scurvy.generateMetastateHashkey = function (email, salt, callback) {
	Bcrypt.hash(email, salt, function(err, crypted) {
		var result = {
			hashkey: internals.flashback(crypted)
		};
		callback(null, result);
	});
}

scurvy.validateMetastateHashkey = function (hashkey, email, callback) {
    Bcrypt.compare(email, internals.flashforward(hashkey), function(err, result) {
        if (config.showTrace && err) {
            console.log("Error in auth.internals.validateMetastateHashkey(): " + err);
        }
        callback(err, result);
    });
}

//requires sequelize
scurvy.doesMetastateHashkeyHaveUser = function(hashkey, callback) {
	if (config.showTrace) {
		console.log('confirm:hashkey: ' + hashkey);
	}
	internals.data.Metastate.find({ //err
		where: {
			hashkey: hashkey,
			status: 'inactive'
		}
	}).success(function(metastate) {
		if (metastate != null) {
			if (config.showTrace) {
				console.log('confirm:metastate user_id: ' + metastate.UserId);
			}
			internals.data.User.find({
				where: {
					id: metastate.UserId
				}
			}).success(function(user) {
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

scurvy.verifyCredentials = function(credentials, callback) {
	//validation
	var S = Joi.Types.String;
	var verifyCredentialsValidation = {
		userid: S().required(),
		passwrd: S().required()
	};
	
	var parameter_validation_errors = Joi.validate(credentials, verifyCredentialsValidation);

	if (parameter_validation_errors == null) {
		var userid_input = credentials.userid;
		var password_input = credentials.passwrd;
		internals.data.User.find({ where: { userid: userid_input }, include: [ internals.data.Metastate ] }).success(function(user) {
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
		callback(new Error('credentials object must contain the following fields: userid, passwrd'));
	}
}

scurvy.createUser = function(params, callback) {
	//filter
	// if status is left out, default to inactive
	if (!params.status || params.status == '') {
		params.status = 'inactive';
	}
	
	//validation
	var S = Joi.Types.String;
	var createUserValidation = {
		userid: S().required(),
		email: S().required(),
		passwrd: S().required(),
		status: S().valid('active', 'inactive', 'deleted')
	};

	var parameter_validation_errors = Joi.validate(params, createUserValidation);

	if (parameter_validation_errors == null) {
		var userid = params.userid;
		var email = params.email;
		var passwrd = params.passwrd;
		var status = params.status;
	
		scurvy.generateNewHash(passwrd, function(err, hashcake) {
			var User = internals.data.User;
			var Metastate = internals.data.Metastate;
			
			var salt = hashcake.salt;
			var hash = hashcake.hash;
			
			User.create({ userid: userid, email: email, salt: salt, hash: hash }).success(function(user) {
				if (config.showTrace) {
					console.log("successfully created user " + userid);
				}
				scurvy.generateMetastateHashkey(email, salt, function(err1, result) {
					if (config.showTrace && err1) {
						console.log("error when generating metastate hashkey:" + err1);
					}
					
					var hashkey = result.hashkey;
					
					Metastate.create({ status: status, hashkey: hashkey }).success(function(metastate) {
						if (config.showTrace) {
							console.log("successfully created metastate");
						}
						user.setMetastate(metastate).success(function() {
							//successfully saved
							if (config.showTrace) {
								console.log("successfully saved user to metastate association for email " + email + " and hashkey " + hashkey + ".");
							}
							callback(null, {user: user, metastate: metastate});
						});
					});//if error?
				});
			}).error(function(error) {
				callback(error, null);
			});
		});
	} else { 
		callback(new Error('params object must contain the following fields: userid, email, passwrd, status'));
	}
};

//requires hapi -- TODO: should this just use joi instead?
scurvy.register_validate = function() {
	var S = Joi.types.String;
	return {
		userid: S().required().min(5).max(30),
		passwrd: S().required().min(8),
		passwrd0: S().required().min(8),
		email: S().email().required().max(50)
	}
}

scurvy.activateUser = function(input, callback) {
	var metastate = input.metastate;
	metastate.updateAttributes({
		status: 'active'
	}).success(function() {
		if (config.showTrace) {
			console.log('auth.activateUser(): success! User has been activated!');
		}
		callback(null, true);
	}).error(function(err) {
		if (config.showTrace) {
			console.log("auth.activateUser(): error");
			console.log(err);
		}
		callback(err, false);
	});
}

scurvy.setRounds = function(input) {
	if (!(input > 0) || input % 1 != 0) {
		throw new Error("scurvy.setRounds only accepts positive integers.");
	} else {
		internals.bcryptRounds = input;
	}
}






//export lib
module.exports = scurvy;