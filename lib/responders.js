var settings = require('./settings');

settings('default', 'server.response.defaultMimeType', 'text/html');
settings('default', 'server.response.defaultEncoding', 'utf-8');

var get = exports.get = function (status) {
	if (_(status).isNumber()) {
		status = http.STATUS_CODES[status];
	}

	return responders[status];
};

var headers = {};

headers.contentType = function (mimetype, encoding) {
	var value;
	if (arguments.length === 2) {
		value = arguments[0] +'; ' + arguments[1];
	} else if (arguments.length === 1) {
		value = arguments[0];
	}
	return { 'Content-Type': value };
};

var statusCodes = {};
_(http.STATUS_CODES).each(function (name, code) {
	statusCodes[name] = code;
});

var responders = {
	'Continue': null,
	'Switching Protocols': null,

	'OK': require('./responders/ok'),

	'Created': function () {
		var requiredHeaders = ['Location'];
		var requiredEntityHeaders = ['Content-Type', 'Content-Length'];
		var optionalEntityHeaders = ['Etag'];
	},

	'Accepted': function (request, response) {
	},

	'Non-Authoritative Information': null, // TODO
	
	'No Content': function (request, response) {
	},

	'Reset Content': function (request, response) {
	},

	'Partial Content': function (request, response) {
		var requiredHeaders = ['Content-Type', 'Date', 'Etag', 'Content-Location'];
		var optionalHeaders = ['Content-Range', 'Content-Length', 'Expires', 'Cache-Control', 'Vary'];
	},

	'Multiple Choices': function (request, response) {
		var optionalHeaders = ['Location'];
	},

	'Moved Permanently': function (request, response) {
		var entity = null; // null
		response.writeHead(statusCodes['Moved Permanently'], _({
			'Location': redirectUrl
		}).extend(arguments[3]);
	},

	'Found': function (request, response) {
		var requiredHeaders = ['Location'];
	},

	'See Other': function (request, response) {
		var requiredHeaders = ['Location'];
	},

	'Not Modified': function (request, response) {
		var requiredHeaders = ['Date'];
		var optionalHeaders = ['Etag', 'Content-Location', 'Expires', 'Cache-Control', 'Vary'];
	},

	'Use Proxy': function (request, response) {
		var requiredHeaders = ['Location'];
	},
	
	'Temporary Redirect': null
};

module.exports = exports = function (responseCode) {
	if (_(responseCode).isFunction()) {
		responseCode = responseCode();
	}

	if (_(responseCode).isNumber()) {
		responseCode = statusCodes[responseCode];
	}

	return responders[responseCode];
};