scurvy
======

A reusable node.js module for handling user registration and login scenarios.

MIT License

version 0.0.1, experimental

Install
-------

```
npm install scurvy --save
```

Running Tests
-------------

```
npm test
```

Usage
-----

```
var scurvy = require('scurvy');

var my_secure_password = 'password01'; //uber secure

var salt = "";
var hashed_password = "";
var validated = false;

function main() {
	hashPassword(function() {
		validate_credentials(function() {
			console.log("Does it match? " + validated);
		});
	});
}

function hashPassword(callback) {
	//Generate a salt and hash from a password.
	scurvy.generateNewHash(my_secure_password, function (err, result) {
		salt = result.salt;
		hashed_password = result.hash;
		callback();
	}
}

function validate_credentials(callback) {
	scurvy.comparePlaintextToHash(my_secure_password, hash, function(err, matches) {
		validated = matches;
		callback();
	});
}

```

API
---


```
scurvy.generateNewHash(input, callback)
```
Creates a 60 character hash and 29 character salt from ```input```. Calls ```callback``` when complete with method signature ```function (err, result)```. ```err``` is null when there is no error. ```result``` is an object with two fields ```salt``` and ```hash``` that are created by the hashing algorithm.  Asynchronous.


```
scurvy.comparePlaintextToHash(inputPassword, hash, callback)
```
Takes an ```inputPassword``` and  ```hash``` that was created with generateNewHash() (where inputPassword was the input) and returns a ```callback``` with method signature ```function(err, matches)``` where ```err``` is null when there is no error, and ```matches``` is true if the parameters validate. Asynchronous.

  
```
scurvy.setRounds(rounds)
```  

Optional function. Internally, rounds defaults to 10.
```rounds``` Must be integer > 0. Synchronous.

TODO:
-----
generateMetastateHashkey(),validateMetastateHashkey()
