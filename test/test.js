var assert = require('assert');
var Sequelize = require('sequelize');
var scurvy = require('../');
var async = require('async');

describe('Auth', function() {

	describe('#generateNewHash(),#comparePlaintextToHash()', function() {
        it('should create a hash from a plaintext password and a salt, and verify one way.', function(done) {
            var inputPassword = "myPassword01";
            
            scurvy.generateNewHash(inputPassword, function(err, result) {
                var salt = result.salt;
                var hash = result.hash;
                assert(salt.length == 29); //expected length for right now
                assert(hash.length == 60); //expected length for right now
                
                scurvy.comparePlaintextToHash(inputPassword, hash, function(err, matchA) {
                    assert(matchA == true);
                    scurvy.comparePlaintextToHash("notMyPassword", hash, function(err, matchB) {
                        assert(matchB == false);
                        scurvy.comparePlaintextToHash(hash, inputPassword, function(err, matchC) {
                            assert(matchC == false);
                            done();
                        });
                    });
                });
            });
        });
    });
});

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
			port: dbport,
			sync: { force: true },
			logging: false
		});
		var hook = {};
		hook.sequelize = sequelize;
		
		scurvy.loadModels(hook);
		scurvy.setupAssociations(hook);
		
		scurvy.setupSync(hook, function(err) {
			if (err) { console.log('Error when trying to sync scurvy tables.'); }
			
			
			done();
		}, { force: true });
	});


	describe('#createUser(),#doesMetastateHashkeyHaveUser()', function() {
        it('should check the database to find a user for a given metastate hashkey. returns true if exists, else false', function(done_final) {
			//    #doesMetastateHashkeyHaveUser() setup using #createUser()
			async.parallel([
				function(done) {
					//1.) create an inactive user with matching metastate hashkey. //should have a match
					var user_1 = {
						userid: 'someuser1',
						email: 'someuser1@email.com',
						passwrd: 'somepass1',
						status: 'inactive'
					};
					//status must be active, inactive, or deleted. if left out, status should default to inactive
					scurvy.createUser(user_1, function(err, profile) {
						console.log(JSON.stringify(err));
						assert(err == null);
						assert(profile !== null);
						assert(profile.user !== null && profile.metastate !== null);
						var hashkey_1 = profile.metastate.hashkey;
						assert(profile.metastate.status === 'inactive');
						
						//{user: user, metastate: metastate}
						done(null, hashkey_1);
					});
				},
				function(done) {
					//2.) create an active user with matching metastate hashkey. //should have no match
					var user_2 = {
						userid: 'someuser2',
						email: 'someuser2@email.com',
						passwrd: 'somepass2',
						status: 'active'
					};
					//status must be active, inactive, or deleted. if left out, status should default to inactive
					scurvy.createUser(user_2, function(err, profile) {
						assert(err == null);
						assert(profile !== null);
						assert(profile.user !== null && profile.metastate !== null);
						var hashkey_2 = profile.metastate.hashkey;
						assert(profile.metastate.status === 'active');
						
						done(null, hashkey_2);
					});
				},
				function(done) {
					//3.) create an deleted user with a matching metastate hashkey. //should have no match
					var user_3 = {
						userid: 'someuser3',
						email: 'someuser3@email.com',
						passwrd: 'somepass3',
						status: 'deleted'
					};
					//status must be active, inactive, or deleted. if left out, status should default to inactive
					scurvy.createUser(user_3, function(err, profile) {
						assert(err == null);
						assert(profile !== null);
						assert(profile.user !== null && profile.metastate !== null);
						var hashkey_3 = profile.metastate.hashkey;
						//say its missing from db, for one reason or another.
						assert(profile.metastate.status === 'deleted');
						
						done(null, hashkey_3);
					});
				}
			], function(err, hashkeys) {
				assert(err == null);
				
				async.parallel([
					function(done) {
						//1.a.) Should exist
						scurvy.doesMetastateHashkeyHaveUser(hashkeys[0], function(errHash1, hash1Exists) {
							assert(errHash1 == null);
							assert(hash1Exists);
							done();
						});
					},
					function(done) {
						//2.a.) Should not exist
						scurvy.doesMetastateHashkeyHaveUser(hashkeys[1], function(errHash2, hash2Exists) {
							assert(errHash2 == null);
							assert(!hash2Exists);
							done();
						});
					},
					function(done) {
						//3.a.) Should not exist
						scurvy.doesMetastateHashkeyHaveUser(hashkeys[2], function(errHash3, hash3Exists) {
							assert(errHash3 == null);
							assert(!hash3Exists);
							done();
						});
					}
				], 
				function(err1, results1) {
					assert(err1 == null);
					done_final();
				});
			});
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
})