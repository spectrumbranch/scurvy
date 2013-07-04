var Hoek = require('hoek');

var internals = {};
internals.data = require('./models');

internals.Auth = require('./auth');
internals.Register = require('./register');

internals.scurvy = Hoek.merge(internals.Auth, internals.Register);

internals.scurvy.loadModels = internals.data.loadModels;
internals.scurvy.test = function() {
	console.log("SCURVY TEST OK");
}

module.exports = internals.scurvy;
