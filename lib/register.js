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