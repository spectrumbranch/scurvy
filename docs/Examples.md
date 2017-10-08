Usage Without Database Features
-------------------------------

This is a simple example that does not require use of any database:

```
var scurvy = require('scurvy').createInstance();

var my_secure_password = 'password01'; //uber secure

var salt = "";
var hashed_password = "";
var validated = false;

function main() {
	hashPassword(function() {
		validate_credentials(function() {
			console.log("Does it match? " + validated);
		});
	});
}

function hashPassword(callback) {
	//Generate a salt and hash from a password.
	scurvy.generateNewHash(my_secure_password, function (err, result) {
		salt = result.salt;
		hashed_password = result.hash;
		callback();
	});
}

function validate_credentials(callback) {
	scurvy.comparePlaintextToHash(my_secure_password, hash, function(err, matches) {
		validated = matches;
		callback();
	});
}

```




Usage With Database Features
------------------------------------------

Scurvy has the option to take advantage of the powerful features of sequelizejs (http://sequelizejs.com) to manage persistence of user information in a database. As of right now, only mysql has been tested, but probably can be used with other databases supported by sequelize, with slight modification.

It is suggested to follow a convention of encapsulation when using database features with scurvy.
So for example, we have the following files in our project:

```
/lib/models/index.js
```
Inside we have:
```
var Sequelize = require('sequelize');

//console.log("process.env.NODE_ENV: [" + process.env.NODE_ENV + "]");

var database_config_to_use = '';
switch (process.env.NODE_ENV) {
    case 'test_travis':
        database_config_to_use = '../../config/database.test_travis';
        break;
    case undefined:
    case 'production':
    case 'development':
        database_config_to_use = '../../config/database';
        break;
}
var dbconfig = require(database_config_to_use).config;

var dbname = dbconfig.db;
var dbhostname = dbconfig.hostname;
var dbport = dbconfig.port;
var dbuser = dbconfig.user;
var dbpassword = dbconfig.password;

var sequelize = new Sequelize(dbname, dbuser, dbpassword, {
    host: dbhostname,
    port: dbport,
    dialect: 'mysql'
});

//list all custom models that will be loaded
var models = [
    {
        name: "Map", /*What we want to be able to reference the model as in code*/
        file: "map" /*the name of the model file in the same directory as this, doesn't need the .js*/
    },
	{
		name: "Tile2D",
		file: "tile2d"
	}
];

//load models dynamically
models.forEach(function(model) {
    module.exports[model.name] = sequelize.import(__dirname + '/' + model.file); 
});

module.exports.init = function(virt_modules, done) {
	for (var i = 0; i < virt_modules.length; i++) {
		virt_modules[i].loadModels(module.exports);
	}
	(function(model) {
		//define all associations

		
		//Obtain reference to scurvy from a central location
		var scurvy = require('../').Scurvy;
		
		//scurvy associations
		scurvy.setupAssociations(model);

		//custom model associations
		model.User.hasMany(model.Map);
		model.Map.belongsTo(model.User);
		model.Map.hasMany(model.Tile2D);
		model.Tile2D.belongsTo(model.Map);
        
		//ensure tables are created with the fields and associations

		//scurvy tables
		scurvy.setupSync(model, function(err) {
			if (err) { console.log('Error when trying to sync scurvy tables.'); }

			//custom models tables
			model.Map.sync().success(function() {
				model.Tile2D.sync().success(function() {
					//callback
					done();
				}).error(function(error) { console.log("Error during Tile2D.sync(): " + error); });
			}).error(function(error) { console.log("Error during Map.sync(): " + error); });
		});
    })(module.exports);
};

//export the connection
module.exports.sequelize = sequelize;
```

Scurvy follows the sequelize convention for creating models. Any custom model that would integrate with scurvy's models (```User``` and ```Metastate```) would need to follow the sequelize model convention as well. The Tile2D and Map custom models in the example are as follows:

```
/lib/models/Map.js
```

```
module.exports = function(sequelize, DataTypes) {
    var Map = sequelize.define("Map", {
        name: {
            type: DataTypes.STRING(30),
            validate: {
                isAlphanumeric: true
            }
        },
        width_tiles: {
            type: DataTypes.INTEGER(11).UNSIGNED
        },
        height_tiles: {
            type: DataTypes.INTEGER(11).UNSIGNED
        },
        square_size: {
            type: DataTypes.INTEGER(11).UNSIGNED
        }
    }, {
        freezeTableName: true
    });

    return Map;
};
```

```
/lib/models/Tile2D.js
```

```
module.exports = function(sequelize, DataTypes) {
    var Tile2D = sequelize.define("Tile2D", {
        name: {
            type: DataTypes.STRING(30),
            validate: {
                isAlphanumeric: true
            }
        },
        index: {
            type: DataTypes.INTEGER(11).UNSIGNED
        },
        tileset_id: {
            type: DataTypes.INTEGER(11).UNSIGNED
        },
        tile_id: {
            type: DataTypes.INTEGER(11).UNSIGNED
        }
    }, {
        freezeTableName: true
    });

    return Tile2D;
};
```

(in progress, to be continued)
TODO: ```/lib/index.js``` that calls init on ```/lib/models/index.js```



___

Extending the User Model
========================

Say you want your `User` to have a `Preference` where you can set what `theme` the user picked in your application.
This is a one to one relationship. Create `Preference` as a `sequelize` model and associate as you would normally given the `sequelize` API.

`
preference.js
`
```
module.exports = function(sequelize, DataTypes) {
    var Preference = sequelize.define("Preference", {
        theme: {
            type: DataTypes.STRING(30)
        }
    }, {
        freezeTableName: true
    });
    return Preference;
};
```

`
Setting up associations.
`
```
model.User.hasOne(model.Preference);
model.Preference.belongsTo(model.User);
```
