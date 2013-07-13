var Bcrypt = require('bcrypt');

var internals = {};

internals.bcryptRounds = 10;

internals.data = require('./models');

//internals.Auth = require('./auth');
//internals.Register = require('./register');

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


var scurvy = {};

//hooks directly to data
scurvy.loadModels = internals.data.loadModels;
scurvy.setupAssociations = internals.data.setupAssociations;
scurvy.setupSync = internals.data.setupSync;


//Undergoing reorganization

//auth/login
//scurvy.comparePlaintextToHash = internals.Auth.comparePlaintextToHash;
//scurvy.login_validate = internals.Auth.login_validate

//register
//scurvy.createUser = internals.Register.createUser;
//scurvy.generateNewHash = internals.Register.generateNewHash;
//scurvy.generateMetastateHashkey = internals.Register.generateMetastateHashkey;
//scurvy.validateMetastateHashkey = internals.Register.validateMetastateHashkey;
//scurvy.setRounds = internals.Register.setRounds;
//scurvy.register_validate = internals.Register.register_validate;
//scurvy.doesMetastateHashkeyHaveUser = internals.Register.doesMetastateHashkeyHaveUser;
//scurvy.activateUser = internals.Register.activateUser;
//scurvy.verify



scurvy.comparePlaintextToHash = function(plaintext, hash, callback) {
    Bcrypt.compare(plaintext, hash, function(err, result) {
        if (err) {
            console.log("Error in scurvy.comparePlaintextToHash(): " + err);
        }
        callback(err, result);
    });
}
//TODO test that Hapi dependency works ok
scurvy.login_validate = function(Hapi) {
	var S = Hapi.types.String;
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
        if (err) {
            console.log("Error in auth.internals.validateMetastateHashkey(): " + err);
        }
        callback(err, result);
    });
}

//requires sequelize
scurvy.doesMetastateHashkeyHaveUser = function(hashkey, callback) {
	console.log('confirm:hashkey: ' + hashkey);
	internals.data.Metastate.find({ //err
		where: {
			hashkey: hashkey,
			status: 'inactive'
		}
	}).success(function(metastate) {
		if (metastate != null) {
			console.log('confirm:metastate user_id: ' + metastate.UserId);
			internals.data.User.find({
				where: {
					id: metastate.UserId
				}
			}).success(function(user) {
				if (user != null) {
					console.log('confirm:user.email : ' + user.email);
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


//TODO: params validation
scurvy.verifyCredentials = function(credentials, callback) {
	var userid_input = credentials.userid; //TODO: cannot be blank
	var password_input = credentials.passwrd; //TODO: cannot be blank

	internals.data.User.find({ where: { userid: userid_input }, include: [ internals.data.Metastate ] }).success(function(user) {
		if (user) {
			if (user.metastate.status == 'active') {
				scurvy.comparePlaintextToHash(password_input, user.hash, function (err, matches) {
					if (err) {
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
}

//TODO: params validation
scurvy.createUser = function(params, callback) {
	var userid = params.userid; //TODO: cannot be blank
	var email = params.email; //TODO: cannot be blank
	var passwrd = params.passwrd; //TODO: cannot be blank
	var status = params.status; //TODO: must be active, inactive, or deleted. if left out, default to inactive

	var User = internals.data.User;
	var Metastate = internals.data.Metastate;
	
	scurvy.generateNewHash(passwrd, function(err, hashcake) {
		var salt = hashcake.salt;
		var hash = hashcake.hash;
		
		User.create({ userid: userid, email: email, salt: salt, hash: hash }).success(function(user) {
			console.log("successfully created user " + userid);
			
			scurvy.generateMetastateHashkey(email, salt, function(err1, result) {
				if (err1) { console.log("error when generating metastate hashkey:" + err1); }
				
				var hashkey = result.hashkey;
				
				Metastate.create({ status: status, hashkey: hashkey }).success(function(metastate) {
					console.log("successfully created metastate");
					user.setMetastate(metastate).success(function() {
						//successfully saved
						console.log("successfully saved user to metastate association for email " + email + " and hashkey " + hashkey + ".");
						callback(null, {user: user, metastate: metastate});
					});
				});//if error?
			});
		}).error(function(error) {
			callback(error, null);
		});
	});
};

//requires hapi
scurvy.register_validate = function(Hapi) {
	var S = Hapi.types.String;
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
		console.log('auth.activateUser(): success! User has been activated!');
		callback(null, true);
	}).error(function(err) {
		console.log("auth.activateUser(): error");
		console.log(err);
		callback(err, false);
	});
}

//internals.setData = function(data) {
//	internals.data = data;
//}

scurvy.setRounds = function(input) {
	if (!(input > 0) || input % 1 != 0) {
		throw new Error("scurvy.setRounds only accepts positive integers.");
	} else {
		internals.bcryptRounds = input;
	}
}






//export lib
module.exports = scurvy;
