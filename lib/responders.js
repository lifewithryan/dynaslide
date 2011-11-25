var _ = require('underscore');

var settings = require('./settings');

settings('default', 'server.response.defaultContentType', 'text/html; charset=UTF-8');

var responders = {
	'Continue': null,
	'Switching Protocols': null,
	'OK': require('./responders/ok'),
	'Created': null,
	'Accepted': null,
	'Non-Authoritative Information': null,
	'No Content': null,
	'Reset Content': null,
	'Partial Content': null,
	'Multiple Choices': null,
	'Moved Permanently': null,
	'Found': null,
	'See Other': require('./responders/see-other'),
	'Not Modified': require('./responders/not-modified'),
	'Use Proxy': null,
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

var get = exports.get = function (status) {
	if (_(status).isNumber()) {
		status = http.STATUS_CODES[status];
	}

	return responders[status];
};
