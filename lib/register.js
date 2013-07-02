var internals = {};

internals.register = function() {

}

internals.confirm = function() {

}

//requires sequelize
internals.doesMetastateHashkeyHaveUser = function(hashkey, callback) {
	console.log('confirm:hashkey: ' + hashkey);
	internals.data.Metastate.find({ //err
		where: {
			hashkey: hashkey,
			status: 'inactive'
		}
	}).success(function(metastate) {
		if (metastate != null) {
			console.log('confirm:metastate user_id: ' + metastate.UserId);
			internals.data.User.find({
				where: {
					id: metastate.UserId
				}
			}).success(function(user) {
				if (user != null) {
					console.log('confirm:user.email : ' + user.email);
					//validated!
					callback(null, { user: user, metastate: metastate});
				} else {
					//not a match!
					callback(null, false);
				}
			});
		} else {
			//not a match!
			callback(null, false);
		}
	});
}

//requires hapi
internals.register_validate = function(Hapi) {
	var S = Hapi.types.String;
	return {
		userid: S().required().min(5).max(30),
		passwrd: S().required().min(8),
		passwrd0: S().required().min(8),
		email: S().email().required().max(50)
	}
}



exports.doesMetastateHashkeyHaveUser = internals.doesMetastateHashkeyHaveUser;