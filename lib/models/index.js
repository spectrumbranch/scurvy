var internals = {};

//models that are not affected by config
internals.models = [
	{
        name: "Metastate",
        file: "metastate"
    }
];

internals.usermodel_userid = {
	name: "User",
	file: "user"
};
internals.usermodel_emailonly = {
	name: "User",
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
	model.User.hasOne(model.Metastate);
	model.Metastate.belongsTo(model.User);
}

exports.setupSync = function(model, callback, syncParams) {
	if (syncParams === 'undefined' || syncParams == null) {
		syncParams = {};
	}
	model.User.sync(syncParams).success(function() {
		model.Metastate.sync(syncParams).success(function() {
			callback(null, true);
		}).error(function(error) {
			if (config.showTrace) {
				console.log("SCURVY: Error during Metastate.sync(): " + error);
			}
			callback(error, false);
		});
	}).error(function(error) {
		if (config.showTrace) {
			console.log("SCURVY: Error during User.sync(): " + error);
		}
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