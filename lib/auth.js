var internals = {};

internals.bcryptRounds = 10;

internals.generateNewHash = function(input, callback) {
    var bcrypt = require('bcrypt');

    var start = Date.now();
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

internals.compareHashToPlaintext = function(plaintext, hash, callback) {
    var bcrypt = require('bcrypt');
    
    bcrypt.compare(plaintext, hash, function(err, result) {
        if (err) {
            console.log("Error in auth.internals.compareHashToPlaintext(): " + err);
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
exports.compareHashToPlaintext = internals.compareHashToPlaintext;
exports.setRounds = function(input) {
	if (!(input > 0)) {
		throw new Error("");
	} else {
		internals.bcryptRounds = input;
	}
}
