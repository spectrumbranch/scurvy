
var internals = {};
internals.data = require('./models');

var scurvy = {};

internals.Auth = require('./auth');
internals.Register = require('./register');

//internals.Register.setData(internals.data.hook);
internals.data.registerCallback(function(data) {
	console.log('test register callback');
	internals.Register.setData(data);
})
scurvy.loadModels = internals.data.loadModels;
scurvy.setupAssociationsSync = internals.data.setupAssociationsSync;
//scurvy.generateNewHash = internals.Auth.generateNewHash;

//Undergoing reorganization

//auth/login
scurvy.comparePlaintextToHash = internals.Auth.comparePlaintextToHash;
scurvy.login_validate = internals.Auth.login_validate

//register
scurvy.generateNewHash = internals.Register.generateNewHash;
scurvy.generateMetastateHashkey = internals.Register.generateMetastateHashkey;
scurvy.validateMetastateHashkey = internals.Register.validateMetastateHashkey;
scurvy.setRounds = internals.Register.setRounds;
scurvy.register_validate = internals.Register.register_validate;
scurvy.doesMetastateHashkeyHaveUser = internals.Register.doesMetastateHashkeyHaveUser;
scurvy.activateUser = internals.Register.activateUser;



//export lib
module.exports = scurvy;