var assert = require('assert');
//var async = require('async'); //TODO cleanup later

describe('Auth', function() {
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
	
	describe('#generateNewHash(),#comparePlaintextToHash()', function() {
        it('should create a hash from a plaintext password and a salt, and verify one way.', function(done) {
            var auth = require("../lib");
            var inputPassword = "myPassword01";
            
            auth.generateNewHash(inputPassword, function(err, result) {
                var salt = result.salt;
                var hash = result.hash;
                assert(salt.length == 29); //expected length for right now
                assert(hash.length == 60); //expected length for right now
                
                auth.comparePlaintextToHash(inputPassword, hash, function(err, matchA) {
                    assert(matchA == true);
                    auth.comparePlaintextToHash("notMyPassword", hash, function(err, matchB) {
                        assert(matchB == false);
                        auth.comparePlaintextToHash(hash, inputPassword, function(err, matchC) {
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
            var auth = require("../lib");
			assert.throws(function() { auth.setRounds(-1); }, Error);
			assert.throws(function() { auth.setRounds('x'); }, Error);
			assert.throws(function() { auth.setRounds(null); }, Error);
			assert.doesNotThrow(function() { auth.setRounds(10); }, Error);
			assert.throws(function() { auth.setRounds(5.5); }, Error);
			done();
        });
    });
});
