module.exports = function(sequelize, DataTypes) {
    var Preference = sequelize.define("Preference", {
        color: {
            type: DataTypes.STRING(30)
        }
    }, {
        freezeTableName: true
    });
    return Preference;
};