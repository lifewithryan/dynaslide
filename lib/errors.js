var _ = require('underscore');

var statusCodes = {
	'Bad Request': 400,
	'Unauthorized': 401,
	'Payment Required': 402,
	'Forbidden': 403,
	'Not Found': 404,
	'Method Not Allowed': 405,
	'Not Acceptable': 406,
	'Proxy Authentication Required': 407,
	'Request Timeout': 408,
	'Conflict': 409,
	'Gone': 410,
	'Length Required': 411,
	'Precondition Failed': 412,
	'Request Entity Too Large': 413,
	'Request-URI Too Long': 414,
	'Unsupported Media Type': 415,
	'Requested Range Not Satisfiable': 416,
	'Expectation Failed': 417,
	'Internal Server Error': 500,
	'Not Implemented': 501,
	'Bad Gateway': 502,
	'Service Unavailable': 503,
	'Gateway Timeout': 504,
	'HTTP Version Not Supported': 505
};

var HTTPError = exports.HTTPError = function (id) {
	this.type = 'HTTP Error';
	this.statusCode = null;

	if (_(id).isString()) {
		this.statusCode = statusCodes[id];
	} else {
		this.statusCode = id;
	}

	if (this.statusCode === 405) {
		var allowedMethods = arguments[1];
		if (allowedMethods) {
			this.allowedMethods = _(allowedMethods).map(function (m) { return m.toUpperCase(); }).join(', ');
		} else {
			throw new Error('Allowed methods must be specified for a "405 Not Allowed" response');
		}
	}
};

HTTPError.prototype.getHeaders = function () {
	return {};
};