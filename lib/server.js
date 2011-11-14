var http = require('http'),
	url = require('url'),
	_ = require('underscore');

var server = http.createServer();

exports.io = require('socket.io').listen(server);

exports.start = function (port) {
	console.log('starting http server on port ' + port);
	server.listen(port);
};

server.on('request', function (request, response) {
	console.log('request received: ', request.url);
	var parsedUrl = url.parse(request.url),
		method = request.method.toLowerCase(),
		tube = tubes.route(parsedUrl.pathname);
	
	request.parsedUrl = parsedUrl;

	var startTime = Date.now();

	function complete(response) {
		return function () {
			response.end();
			console.log(new Date() + ': ' + request.method + ' ' + request.url + ' in ' + (Date.now() - startTime) + 'ms');
		};
	}

	try {
		if (tube === undefined) {
	        response.writeHead(404, {
	            'Content-Length': 0,
	            'Content-Type': 'text/plain'
	        });
	        return complete(response);
		} else {
				return tube[method](request, response, complete(response));
		}
	} catch (e) {
		if (e.type === 'HTTP Error') {
			response.writeHead(e.statusCode, e.getHeaders());
			return complete(response);
		} else {
			throw e;
		}
	}
});

server.on('close', function () {
	console.log('server closing');
});