var Sequelize = require('sequelize');
var internals = {};

//models that are not affected by config
internals.models = [
	{
        name: "metastate",
        file: "metastate"
    }
];

internals.usermodel_userid = {
	name: "user",
	file: "user"
};
internals.usermodel_emailonly = {
	name: "user",
	file: "user_emailonly"
};

var config = {};

exports.configure = function(config_input) {
	config = config_input;
	if (config.showTrace) {
		console.log("data configuration received");
	}
}

exports.setupAssociations = function(model) {
	model.user.hasOne(model.metastate);
	model.metastate.belongsTo(model.user);
}

exports.setupSync = function(model, callback, syncParams) {
	if (syncParams === 'undefined' || syncParams == null) {
		syncParams = {};
	}
    
    model.sequelize.query('SET FOREIGN_KEY_CHECKS = 0')
    .then(function() {
        return model.sequelize.sync(syncParams);
    })
    .then(function() {
        return model.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    })
    .then(function() {
        console.log('Successfully completed Scurvy sync()!');
        callback(null, true);
    })
    .catch(function(error) {
        console.log('Error during Scurvy sync(): ', error);
        callback(error, false);
    });
}

exports.loadModels = function(hook) {
	//load models dynamically
	if (config.authSchema == 'email') {
		internals.models.push(internals.usermodel_emailonly);
	} else if (config.authSchema == 'userid') {
		internals.models.push(internals.usermodel_userid);
	}
	
	internals.models.forEach(function(model) {
		hook[model.name] = hook.sequelize.import(__dirname + '/' + model.file);
	});
	exports.hook = hook;
}