var assert = require('assert');
var Sequelize = require('sequelize');
var scurvy = require('../');

describe('Register', function() {
	before(function(done) {
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
		var hook = {};
		hook.sequelize = sequelize;
		
		scurvy.loadModels(hook);
		scurvy.setupAssociations(hook);
		
		scurvy.setupSync(hook, function(err) {
			if (err) { console.log('Error when trying to sync scurvy tables.'); }
			
			
			done();
		});
	});


    describe('#generateMetastateHashkey(),#validateMetastateHashkey()', function() {
        it('should create a hashkey from an email and a salt, and verify one way.', function(done) {
			var salt = "$2a$10$NX61LWLYI81/20Eo6FxfX.";
			var email = "example@someone.org";
            
            scurvy.generateMetastateHashkey(email, salt, function(err, result) {
                var hashkey = result.hashkey;
                
                assert(hashkey.length == 60); //expected length for right now
                
                scurvy.validateMetastateHashkey(hashkey, email, function(err, matchA) {
                    assert(matchA == true);
                    scurvy.validateMetastateHashkey("somebademail@elsewhere.it", hashkey, function(err, matchB) {
                        assert(matchB == false);
                        scurvy.validateMetastateHashkey(email, hashkey, function(err, matchC) {
                            assert(matchC == false);
							done();
                        });
                    });
                });
            });
        });
    });
	
	describe('#setRounds()', function() {
        it('should only allow integers.', function(done) {
			assert.throws(function() { scurvy.setRounds(-1); }, Error);
			assert.throws(function() { scurvy.setRounds('x'); }, Error);
			assert.throws(function() { scurvy.setRounds(null); }, Error);
			assert.doesNotThrow(function() { scurvy.setRounds(10); }, Error);
			assert.throws(function() { scurvy.setRounds(5.5); }, Error);
			done();
        });
    });
	
    describe('#doesMetastateHashkeyHaveUser(),#activateUser()', function() {
        it('should check the database to find a user for a given metastate hashkey. returns true if exists, else false', function(done) {
			//    #doesMetastateHashkeyHaveUser() setup
			//1.) create an inactive user with matching metastate hashkey. //should have a match
			//2.) create an active user with matching metastate hashkey. //should have no match
			//3.) create an inactive user with no matching metastate hashkey. //should have no match
			
			
            scurvy.doesMetastateHashkeyHaveUser('known hashkey', function(err, result) {
				if (!result) {
					//Goes here when no match.
				} else {
					//Goes here when there is a match. this and above satisfy #doesMetastateHashkeyHaveUser() 
					//result is an object containing user and metastate.
					scurvy.activateUser(result, function(err2, isSuccessful) {
						if (isSuccessful) {
							//Goes here if user was able to be activated
						} else {
							//Goes here if there was an error when activating user; scurvy didn't perform any action to the table
						}
					});
				}
			});
			
			assert(false);
			done();
        });
    });
	
})