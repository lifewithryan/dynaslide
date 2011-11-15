var path = require('path'),
	_ = require('underscore'),
	connectors = require('./connectors');

var knownMethods = ['get', 'put', 'post', 'delete'];

function Tube(path, name) {
	this.name = name;
	this.path = path;
	
	var allowedMethods = [];
	this.allowedMethods = function (newMethods) {
		if (newMethods) {
			allowedMethods = newMethods;
			return this;
		} else {
			return allowedMethods;
		}
	};

	var tube = this;
	_(knownMethods).each(function (method) {
		tube[method] = function (request, response, complete) {
			throw new errors.HTTPError(405, tube.allowedMethods());
		};
	});
}
Tube.prototype = {
	matchesPath: function (path) {
		if (_(this.path).isString()) {
			if (this.path[this.path.length - 1] === '*') {
				console.log('path.substr: ', path.substr(0, this.path.length - 1));
				console.log('this.path: ', this.path.substr(0, this.path.length - 1));
				return path.substr(0, this.path.length - 1) === this.path.substr(0, this.path.length - 1);
			} else {
				return path === this.path;
			}
		} else if (_(this.path).isRegExp()) {
			return this.path.test(path);
		}
	},
	connect: function () {
		var tube = this;

		function createConnector(method) {
			var parent = this;
			var c = {
				to: function (handler) {
					if (_(handler).isFunction()) {
						tube.
						tube.responders[method] = handler;
					} else {
						_(tube.responders).extend(handler);
					}
					return parent;
				}
			};
			_(connectors).each(function (fn, name) {
				c[name] = function () {
					tube[method] = fn.apply(tube, arguments);
					return parent;
				};
			});
			return c;
		}

		var connector = createConnector.call({}, 'get');

		_(knownMethods).each(function (method) {
			connector[method] = createConnector.call(connector, method);
		});

		return connector;
	},
	emit: function (event, data) {
		tubes.server.io.sockets.of(this.path).emit(event, data);
		return this;
	},
	on: function () {
		tubes.server.io.sockets.of(this.path).on(event, handler);
		return this;
	}
};

var _tubes = {};

module.exports = tubes = function tubes() {
	var name, path;
	if (arguments.length === 0) {
		return _tubes;
	} else if (arguments.length === 1) {
		name = arguments[0];
		return _tubes[name];
	} else if (arguments.length === 2) {
		path = arguments[0], name = arguments[1];
		_tubes[name] = new Tube(path, name);
		return _tubes[name];
	}
};

tubes.route = function (path) {
	return _(_tubes).find(function (tube, name) {
		return tube.matchesPath(path);
	});
};

tubes.emit = function (event, data) {
	tubes.server.io.sockets.emit(event, data);
};

tubes.on = function (event, handler) {
	tubes.server.io.sockets.on(event, handler);
};

tubes.isBigTruck = function () { return false; };

tubes.sendInternetsThru = function (port) { return tubes.server.start(port); };

require('fs').readdirSync(__dirname).forEach(function (file) {
	if (file !== path.basename(__filename)) {
		tubes[path.basename(file, '.js')] = require('./' + file);
	}
});