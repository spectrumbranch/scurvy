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

exports.setupAssociationsSync = function(model) {
	model.User.hasOne(model.Metastate);
	model.Metastate.belongsTo(model.User);
}

exports.loadModels = function(hook) {
	//load models dynamically
	internals.models.forEach(function(model) {
		hook[model.name] = hook.sequelize.import(__dirname + '/' + model.file);
	});
	exports.hook = hook;
	//exports.hook.test();
	for (var i = 0; i < exports.callbacks.length; i++) {
		exports.callbacks[i](hook);
	}
}

exports.callbacks = [];

exports.registerCallback = function(callback) {
	exports.callbacks.push(callback);
}