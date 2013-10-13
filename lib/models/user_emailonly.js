module.exports = function(sequelize, DataTypes) {
    var User = sequelize.define("User", {
		email: {
			type: DataTypes.STRING(50),
			validate: {
				isEmail: true
			},
			unique: true
		},
		salt: {
			type: DataTypes.STRING(29)
		},
		hash: {
			type: DataTypes.STRING(60)
		}
    }, {
        freezeTableName: true
    });

    return User;
};