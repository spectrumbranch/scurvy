var assert = require('assert');
var should = require('should');
var Sequelize = require('sequelize');
var async = require('async');
var scurvy = require('../');


describe('no-db-functions', function() {

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
        it('should only allow positive integers.', function(done) {
			assert.throws(function() { scurvy.setRounds(-1); }, Error);
			assert.throws(function() { scurvy.setRounds('x'); }, Error);
			assert.throws(function() { scurvy.setRounds(null); }, Error);
			assert.doesNotThrow(function() { scurvy.setRounds(10); }, Error);
			assert.throws(function() { scurvy.setRounds(5.5); }, Error);
			done();
        });
    });	
});

describe('db-functions', function() {
	var hook = {};
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
		//var hook = {};
		hook.sequelize = sequelize;
		
		scurvy.loadModels(hook);
		scurvy.setupAssociations(hook);
		
		//assert();
		
		scurvy.setupSync(hook, function(err) {
			assert(err == null);
			
			done();
		}, { force: true });
	});
	
	describe('#loadModels()', function() {
		it ('should load the models User and Metastate into the sequelize hook.', function(done_final) {
			assert(hook.User !== undefined);
			assert(hook.Metastate !== undefined);
			done_final();
		})
	});
	
	describe('#setupAssociations()', function() {
		it ('should setup the sequelize hook so that User and Metastate can be associated.', function(done_final) {
			hook.User.create({ userid: 'testassocuser', salt:'dfgfdgdfgdfg', hash:'etcetc101badhash', email: 'x@y.com' }).success(function(user) {
				hook.Metastate.create({ status: 'active', hashkey: 'etc2349badhash' }).success(function(metastate) {
					assert(metastate.UserId == undefined);
					user.setMetastate(metastate).success(function() {
						assert(user.id === metastate.UserId);
						done_final();
					});
				});
			});
		})
	});
	

	describe('#createUser() input validation', function() {
		it('should error out if the input object does not at least contain the following properties: userid, email, passwrd, status.', function(done_final) {
			async.parallel([
				function(done) {
					scurvy.createUser({}, function(err, results) {
						assert(err instanceof Error);
						done();
					});
				},
				function(done) {
					scurvy.createUser({userid: 'test12315', email: 'rw4fwsx4@sdfsf.com', passwrd: 'securePassword0101', status: ''}, function(err, results) {
						assert(err == null);
						done();
					});
				}
			], 
			function(err1, results1) {
				done_final();
			});
		});
	});
	
	
	
	describe('#verifyCredentials() input validation', function() {
		it('should error out if the input object does not at least contain the following properties: userid, passwrd.', function(done_final) {
			async.parallel([
				function(done) {
					scurvy.verifyCredentials({}, function(err, results) {
						assert(err instanceof Error);
						done();
					});
				}
			], 
			function(err1, results1) {
				done_final();
			});
		});
	});
	describe('#verifyCredentials()', function() {
		it('should return a user object for successful credentials, or returns false if there is no match.', function(done_final) {
			scurvy.createUser({ userid: 'testVerifyCred', email: 'rw4fw4@sdfsf.com', passwrd: 'myPassword201', status: 'active' }, function(err, results) {
				async.parallel([
					function(done) {
						scurvy.verifyCredentials({userid: 'testVerifyCred', passwrd: 'myPassword201'}, function(verify_err, verify_result) {
							assert(verify_err == null);
							assert(verify_result != null);
							assert(verify_result != false);
							assert(verify_result.userid == 'testVerifyCred');
							assert(verify_result.metastate != undefined);
							done();
						});
					},
					function(done) {
						scurvy.verifyCredentials({userid: 'nottheuser', passwrd: 'sdkjfsa23'}, function(verify_err, verify_result) {
							assert(verify_err == null);
							assert(verify_result == false);
							assert(verify_result.user == undefined);
							done();
						});
					}
				], 
				function(err1, results1) {
					done_final();
				});
			});
			
		});
	});
	
	describe('#activateUser()', function() {
		it('should change the metastate status of a user to active.', function(done_final) {
			scurvy.createUser({ userid: 'testActivate', email: 'z12s@sdfsf.com', passwrd: 'myPassword561', status: 'inactive' }, function(err, user) {
				scurvy.activateUser(user, function(err_activate, worked) {
					assert(err_activate == null);
					assert(worked);
					done_final();
				});
			});
		});
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


})
