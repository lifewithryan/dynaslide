var fs = require('fs'),
	qs = require('qs'),
	_ = require('underscore'),
	sanitize = require('validator').sanitize;

exports.toTemplate = function (templateName, getContext) {

	if (!_(getContext).isFunction()) {
		var staticContext = getContext;
		getContext = function () { return staticContext; };
	}

	var template = fs.readFileSync('./templates/' + templateName, 'utf-8');

	return function (request, response, complete) {
		var safeContext = {};
		_(getContext()).each(function (value, key) {
			if (_(value).isString()) {
				safeContext[key] = sanitize(value).xss();
			} else {
				safeContext[key] = value;
			}
		});
		var responseBody = _(template).template(safeContext);
		response.writeHead(200, {
			'Content-Length': responseBody.length,
			'Content-Type': 'text/html'
		});
		response.write(responseBody);
		complete();
	};
};

exports.to404 = function () {
	return function (request, response, complete) {
	    response.writeHead(404, {
	        'Content-Length': 0,
	        'Content-Type': 'text/plain'
	    });
	    complete();
	};
};

exports.to405 = function (allowedMethods) {
	return function (request, response, complete) {
		response.writeHead(405, {
			'Content-Length': '0',
			'Content-Type': 'text/plain',
			'Allow': _(allowedMethods).map(function (m) { return m.toUpperCase(); }).join(', ')
		});
		complete();
	};
};

exports.toPostRedirect = function (newUrl, process) {
	return function (request, response, complete) {
		var requestBody = '';
		request.on('data', function (data) {
			requestBody += data;
		});

		request.on('end', function () {
			var parsedForm = qs.parse(requestBody);
			process(parsedForm, function () {
				response.writeHead(303, {
					'Content-Length': 0,
					'Content-Type': 'text/plain',
					'Location': newUrl
				});
				complete();
			});
		});
	};
};

exports.toFileStream = function (pathname, mimeType) {
	var tube = this;
	return function (request, response, complete) {

		var computedPath;
		try {
			if (_(pathname).isFunction()) {
				var urlmatch = tube.path.exec(request.parsedUrl.pathname);
				computedPath = pathname.call(urlmatch.slice(1));
			} else {
				computedPath = pathname;
			}

			response.writeHead(200, {
				'Content-Type': mimeType,
				'Content-Length': fs.statSync(computedPath).size
			});

			var stream = fs.createReadStream(computedPath);
			stream.pipe(response, { end: false });
			stream.on('end', function () {
				complete();
			});
		} catch (e) {
		    response.writeHead(404, {
		        'Content-Length': 0,
		        'Content-Type': 'text/plain'
		    });
		    complete();
		}
	};
};