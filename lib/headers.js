var _ = require('underscore');

var filters = {
	lastModified: function (date) {
		return ['Last-Modified', new Date(date).toUTCString()];
	},
	contentType: function (text) {
		return text;
	}
};

module.exports = exports = function headers(options) {
	var headers = {};
	_(options).each(function (value, key) {
		var header = filters[key](value);
		headers[header[0]] = header[1];
	});
	return headers;
};