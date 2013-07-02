var Hoek = require('hoek');

var internals = {};

internals.Auth = require('./auth');
internals.Register = require('./register');


module.exports = Hoek.merge(internals.Auth, internals.Register);