var internals = {};
internals.models = [
    {
        name: "User",
        file: "user"
    },  {
        name: "Metastate",
        file: "metastate"
    }
];

exports.setupAssociations = function(model) {
	model.User.hasOne(model.Metastate);
	model.Metastate.belongsTo(model.User);
}

exports.setupSync = function(model, callback) {
	model.User.sync().success(function() {
		model.Metastate.sync().success(function() {
			callback(null);
		}).error(function(error) {
			console.log("SCURVY: Error during Metastate.sync(): " + error);
			callback(error);
		});
	}).error(function(error) {
		console.log("SCURVY: Error during User.sync(): " + error);
		callback(error);
	});
}

exports.loadModels = function(hook) {
	//load models dynamically
	internals.models.forEach(function(model) {
		hook[model.name] = hook.sequelize.import(__dirname + '/' + model.file);
	});
	exports.hook = hook;
	
	for (var i = 0; i < exports.callbacks.length; i++) {
		exports.callbacks[i](hook);
	}
}

exports.callbacks = [];

exports.registerCallback = function(callback) {
	exports.callbacks.push(callback);
}