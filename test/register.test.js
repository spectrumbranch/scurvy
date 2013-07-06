var assert = require('assert');
var Sequelize = require('sequelize');

describe('Register', function() {
	var database_config_to_use = '';
	switch (process.env.NODE_ENV) {
		case 'test_travis':
			database_config_to_use = './config/database.travis';
			break;
		case undefined:
		case 'production':
		case 'development':
			database_config_to_use = './config/database';
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
		port: dbport
	});


    describe('#generateMetastateHashkey(),#validateMetastateHashkey()', function() {
        it('should create a hashkey from an email and a salt, and verify one way.', function(done) {
            var auth = require("../lib");
			var salt = "$2a$10$NX61LWLYI81/20Eo6FxfX.";
			var email = "example@someone.org";
            
            auth.generateMetastateHashkey(email, salt, function(err, result) {
                var hashkey = result.hashkey;
                
                assert(hashkey.length == 60); //expected length for right now
                
                auth.validateMetastateHashkey(hashkey, email, function(err, matchA) {
                    assert(matchA == true);
                    auth.validateMetastateHashkey("somebademail@elsewhere.it", hashkey, function(err, matchB) {
                        assert(matchB == false);
                        auth.validateMetastateHashkey(email, hashkey, function(err, matchC) {
                            assert(matchC == false);
							done();
                        });
                    });
                });
            });
        });
    });
	/*
    describe('#doesMetastateHashkeyHaveUser()', function() {
        it('should check the database to find a user for a given metastate hashkey. returns true if exists, else false', function(done) {
            assert(false);
			done();
        });
    });
	*/
})