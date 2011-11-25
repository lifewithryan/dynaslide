module.exports = exports = function settings(name) {
	// name: return setting
	// name, setting: set setting for current environment
	// environment, name, setting: set setting for environment
	var environment, name, setting;
	if (arguments.length === 1) {
		environment = exports.currentEnvironment;
		name = arguments[0];
	} else if (arguments.length === 2) {
		environment = exports.currentEnvironment;
		name = arguments[0];
		setting = arguments[1];
	} else if (arguments.length === 3) {
		environment = arguments[0];
		name = arguments[1];
		setting = arguments[2];
	}

	if (!(environment in exports._settings)) {
		exports._settings[environment] = {};
	}
	
	var environmentSettings = exports._settings[environment];
	var splitName = name.split('.');
	if (arguments.length === 1) {
		var value = environmentSettings;
		while (splitName.length > 0) {
			value = value[splitName.shift()];
		}
		return value;
	} else {
		var index;
		var tree = environmentSettings;
		while (splitName.length > 1) {
			index = splitName.shift();
			if (index in tree) {
				tree = tree[index];
			} else {
				tree[index] = {};
				tree = tree[index];
			}
		}
		tree[splitName.shift()] = setting;
		return exports;
	}
};
exports.currentEnvironment = 'default';
exports._settings = {
	'default': {}
};