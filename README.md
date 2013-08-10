<img src="https://raw.github.com/spectrumbranch/scurvy/master/images/scurvy-small.png" />

scurvy
======

A reusable node.js module for handling user registration and login scenarios.

Scurvy can be used to generate hashed passwords and validate them. It also comes with [Sequelize](https://github.com/sequelize/sequelize) integration for an easy setup of Users with metadata 'Metastate' objects.
Scurvy handles the creation of tables, as it comes with built-in schemas. Use of the database features are not required, but are recommended.


MIT License

version 0.1.2, experimental

[![Build Status](https://api.travis-ci.org/spectrumbranch/scurvy.png)](http://travis-ci.org/spectrumbranch/scurvy)

Install
-------

```
npm install scurvy --save
```

Note: If you are a Windows user, you need to ensure that you have the dependencies for ```bcrypt``` found here: https://github.com/ncb000gt/node.bcrypt.js/#dependencies

Running Tests
-------------

```
npm test
```

Usage 
-----

This is a simple example that does not require use of any database:

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

Acknowledgments
===============

Logo created by Ashley Fairweather - http://starforsaken101.deviantart.com
