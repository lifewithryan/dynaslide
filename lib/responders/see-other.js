var headers = require('../headers');

module.exports = exports = function seeOther(location, options) {
	options = options || {};
	options.location = location;
	this.writeHead(303, headers(options));
	this.end();
};