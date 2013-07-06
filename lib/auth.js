var Bcrypt = require('bcrypt');

var internals = {};


internals.comparePlaintextToHash = function(plaintext, hash, callback) {
    Bcrypt.compare(plaintext, hash, function(err, result) {
        if (err) {
            console.log("Error in auth.internals.comparePlaintextToHash(): " + err);
        }
        callback(err, result);
    });
}
//TODO test that Hapi dependency works ok
internals.login_validate = function(Hapi) {
	var S = Hapi.types.String;
	return {
		userid: S().required().min(5).max(30),
		passwrd: S().required().min(8),
		view: S()
	}
}

exports.comparePlaintextToHash = internals.comparePlaintextToHash;

exports.login_validate = internals.login_validate;
