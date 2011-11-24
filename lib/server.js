var http = require('http');
var url = require('url');
var _ = require('underscore');

var	errors = require('./errors');

var server = http.createServer();

exports.io = require('socket.io').listen(server);

exports.start = function (port) {
	console.log('starting http server on port ' + port);
	server.listen(port);
};

server.on('request', function (request, response) {
	var parsedUrl = url.parse(request.url);
	var method = request.method.toLowerCase();
	var tube = tubes.route(parsedUrl.pathname);

	request.parsedUrl = parsedUrl;

	if (parsedUrl.pathname.substr(0, 10) === '/socket.io') {
		return;
	}

	var startTime = Date.now();

	/*
	complete(<status>, [responder params]);

	*/

	function complete(response) {
		return function () {
			response.end();
			console.log(new Date() + ': ' + request.method + ' ' + request.url + ' in ' + (Date.now() - startTime) + 'ms' + ' (' + response.statusCode + ')');
		};
	}

	try {
		if (tube === undefined) {
	        throw new errors.HTTPError('Not Found');
		} else {
			return tube[method](request, response, complete(response));
		}
	} catch (e) {
		if (e.type === 'HTTP Error') {
			response.writeHead(e.statusCode, e.getHeaders());
			return complete(response)();
		} else {
			throw e;
		}
	}
});

server.on('close', function () {
	console.log('server closing');
});