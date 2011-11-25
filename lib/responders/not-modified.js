var headers = require('../headers');

module.exports = exports = function notModified(date, options) {
	options = options || {};
	options.date = date;
	this.writeHead(304, headers(options));
	this.end();
};