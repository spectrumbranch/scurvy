var internals = {};

internals.bcryptRounds = 10;

internals.generateNewHash = function(input, callback) {
    var bcrypt = require('bcrypt');

    bcrypt.genSalt(internals.bcryptRounds, function(err, salt) {
        bcrypt.hash(input, salt, function(err, crypted) {
            var result = {
                salt: salt,
                hash: crypted
            };
            callback(null, result);
        });
    })
};

internals.comparePlaintextToHash = function(plaintext, hash, callback) {
    var bcrypt = require('bcrypt');
    
    bcrypt.compare(plaintext, hash, function(err, result) {
        if (err) {
            console.log("Error in auth.internals.comparePlaintextToHash(): " + err);
        }
        callback(err, result);
    });
}

internals.generateMetastateHashkey = function (email, salt, callback) {
	var bcrypt = require('bcrypt');
	
	bcrypt.hash(email, salt, function(err, crypted) {
		var result = {
			hashkey: crypted
		};
		callback(null, result);
	});
}

internals.validateMetastateHashkey = function (hashkey, email, callback) {
	var bcrypt = require('bcrypt');
    
    bcrypt.compare(email, hashkey, function(err, result) {
        if (err) {
            console.log("Error in auth.internals.validateMetastateHashkey(): " + err);
        }
        callback(err, result);
    });
}


var Bcrypt = require('bcrypt');

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
	if (!(input > 0)) {
		throw new Error("");
	} else {
		internals.bcryptRounds = input;
	}
}
