var internals = {};
internals.data = require('./models');

internals.Auth = require('./auth');
internals.Register = require('./register');

internals.data.registerCallback(function(data) {
	internals.Register.setData(data);
})

var scurvy = {};

scurvy.loadModels = internals.data.loadModels;
scurvy.setupAssociations = internals.data.setupAssociations;
scurvy.setupSync = internals.data.setupSync;


//Undergoing reorganization

//auth/login
scurvy.comparePlaintextToHash = internals.Auth.comparePlaintextToHash;
scurvy.login_validate = internals.Auth.login_validate

//register
scurvy.createUser = internals.Register.createUser;
scurvy.generateNewHash = internals.Register.generateNewHash;
scurvy.generateMetastateHashkey = internals.Register.generateMetastateHashkey;
scurvy.validateMetastateHashkey = internals.Register.validateMetastateHashkey;
scurvy.setRounds = internals.Register.setRounds;
scurvy.register_validate = internals.Register.register_validate;
scurvy.doesMetastateHashkeyHaveUser = internals.Register.doesMetastateHashkeyHaveUser;
scurvy.activateUser = internals.Register.activateUser;



//export lib
module.exports = scurvy;