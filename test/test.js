var assert = require('assert');
var scurvy = require('../');
//var async = require('async'); //TODO cleanup later

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
