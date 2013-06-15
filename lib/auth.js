var internals = {};

internals.bcryptRounds = 10;

var Bcrypt = require('bcrypt');

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

internals.comparePlaintextToHash = function(plaintext, hash, callback) {
    Bcrypt.compare(plaintext, hash, function(err, result) {
        if (err) {
            console.log("Error in auth.internals.comparePlaintextToHash(): " + err);
        }
        callback(err, result);
    });
}

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

internals.flashback = function(input) {
	var output = input.replace(/\$/g, '_');
	return output;
}
internals.flashforward = function(input) {
	var output = input.replace(/_/g, '$');
	return output;
}





exports.getBasic = function() {
    return {
		auth: { strategies: ['basic'] },
        handler: function(request) {
            request.reply('Success');
        }
    };
};
exports.getValidate = function() {
	return internals.validate;
};



exports.generateNewHash = internals.generateNewHash;
exports.comparePlaintextToHash = internals.comparePlaintextToHash;
exports.generateMetastateHashkey = internals.generateMetastateHashkey;
exports.validateMetastateHashkey = internals.validateMetastateHashkey;

exports.setRounds = function(input) {
	if (!(input > 0) || input % 1 != 0) {
		throw new Error("");
	} else {
		internals.bcryptRounds = input;
	}
}
