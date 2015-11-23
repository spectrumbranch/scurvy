module.exports = function(sequelize, DataTypes) {
    var preference = sequelize.define("preference", {
        color: {
            type: DataTypes.STRING(30)
        }
    }, {
        freezeTableName: true
    });
    return preference;
};