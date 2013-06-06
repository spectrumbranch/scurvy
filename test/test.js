var assert = require('assert');
//var async = require('async'); //TODO cleanup later

describe('Auth', function() {
    describe('#generateNewHash(),#compareHashToPlaintext()', function() {
        it('should create a hash from a plaintext password and a salt, and verify one way.', function(done) {
            var auth = require("../lib/auth");
            var inputPassword = "myPassword01";
            
            auth.generateNewHash(inputPassword, function(err, result) {
                var salt = result.salt;
                var hash = result.hash;
                
                console.log(salt.length);
                console.log(hash.length);
                assert(salt.length == 29); //expected length for right now
                assert(hash.length == 60); //expected length for right now
                
                auth.compareHashToPlaintext(inputPassword, hash, function(err, matchA) {
                    assert(matchA == true);
                    auth.compareHashToPlaintext("notMyPassword", hash, function(err, matchB) {
                        assert(matchB == false);
                        auth.compareHashToPlaintext(hash, inputPassword, function(err, matchC) {
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
            var auth = require("../lib/auth");
			assert.throws(function() { auth.setRounds(-1); }, Error);
			assert.throws(function() { auth.setRounds('x'); }, Error);
			assert.throws(function() { auth.setRounds(null); }, Error);
			assert.doesNotThrow(function() { auth.setRounds(10); }, Error);
			done();
        });
    });
});