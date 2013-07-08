var Bcrypt = require('bcrypt');
var internals = {};

internals.register = function() {

}

internals.confirm = function() {

}
internals.bcryptRounds = 10;

internals.flashback = function(input) {
	var output = input.replace(/\$/g, '_');
	return output;
}

internals.flashforward = function(input) {
	var output = input.replace(/_/g, '$');
	return output;
}
internals.generateNewHash = function(input, callback) {
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

internals.generateMetastateHashkey = function (email, salt, callback) {
	Bcrypt.hash(email, salt, function(err, crypted) {
		var result = {
			hashkey: internals.flashback(crypted)
		};
		callback(null, result);
	});
}

internals.validateMetastateHashkey = function (hashkey, email, callback) {
    Bcrypt.compare(email, internals.flashforward(hashkey), function(err, result) {
        if (err) {
            console.log("Error in auth.internals.validateMetastateHashkey(): " + err);
        }
        callback(err, result);
    });
}

//requires sequelize
internals.doesMetastateHashkeyHaveUser = function(hashkey, callback) {
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

//requires hapi
internals.register_validate = function(Hapi) {
	var S = Hapi.types.String;
	return {
		userid: S().required().min(5).max(30),
		passwrd: S().required().min(8),
		passwrd0: S().required().min(8),
		email: S().email().required().max(50)
	}
}

internals.activateUser = function(input, callback) {
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

internals.setData = function(data) {
	internals.data = data;
}

internals.setRounds = function(input) {
	if (!(input > 0) || input % 1 != 0) {
		throw new Error("scurvy.setRounds only accepts positive integers.");
	} else {
		internals.bcryptRounds = input;
	}
}

exports.generateNewHash = internals.generateNewHash;
exports.setData = internals.setData;
exports.register_validate = internals.register_validate;
exports.doesMetastateHashkeyHaveUser = internals.doesMetastateHashkeyHaveUser;
exports.activateUser = internals.activateUser;
exports.generateMetastateHashkey = internals.generateMetastateHashkey;
exports.validateMetastateHashkey = internals.validateMetastateHashkey;
exports.setRounds = internals.setRounds;