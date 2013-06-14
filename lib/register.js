var internals = {};

internals.register = function() {

}

internals.confirm = function() {

}

//requires sequelize
internals.doesMetastateHashkeyHaveUser = function(hashkey, callback) {
	internals.data.Metastate.find({
		hashkey: hashkey
	}).success(function(metastate) {
		if (metastate != null) {
			internals.data.User.find({
				id: metastate.UserId
			}).success(function(user) {
				if (user != null) {
					//validated!
					callback(null, true);
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