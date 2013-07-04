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

console.log('scurvy:lib/models');

exports.loadModels = function(hook) {
	
	//load models dynamically
	internals.models.forEach(function(model) {
		hook[model.name] = hook.sequelize.import(__dirname + '/' + model.file); 
	});

}