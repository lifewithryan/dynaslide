var fs = require('fs'),
	qs = require('qs'),
    path = require('path'),
	_ = require('underscore'),
    crypto = require('crypto'),
	sanitize = require('validator').sanitize,
    errors = require('./errors'),
    mime = require('./mime'),
    template = require('./template');

exports.toTemplate = function (templateName, getContext) {
	if (!_(getContext).isFunction()) {
		var staticContext = getContext;
		getContext = function () { return staticContext; };
	}

    var templ = template.getTemplate(templateName);

	return function (request, response, complete) {
		var safeContext = {};
		_(getContext()).each(function (value, key) {
			if (_(value).isString()) {
				safeContext[key] = sanitize(value).xss();
			} else {
				safeContext[key] = value;
			}
		});

        if (templ.streaming) {
            templ.pipe(response, { end: false });
            templ.on('end', function () {
                return complete();
            });
        } else {
            var responseBody = template.exec(templ, safeContext);
            response.writeHead(200, {
                'Content-Length': responseBody.length,
                'Content-Type': 'text/html'
            });
            response.write(responseBody);
            complete();
        }
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


function generateEtag(filePath, stat) {
    return crypto.createHash('md5')
        .update(stat.ctime + stat.mtime + filePath) // adding last few characters of file would be more resilient
        .digest(encoding='hex');
}

function modifiedSince(request, stat) {
    var header = request.headers['if-modified-since'];
    if (header) {
        var requestTime = new Date(header).getTime();
        var modifiedTime = new Date(stat.mtime).getTime();
        return modifiedTime > requestTime;
    } else {
        return true;
    }
}

exports.toFileStream = function (filePath, mimeType) {
    var tube = this;
    return function (request, response, complete) {
        fs.stat(filePath, function (err, stat) {
            //var etag = generateEtag(filePath, stat)

            if (err) {
                console.log('returning 404 file not found');
                throw new errors.HTTPError('Not Found');
            }

            if (!modifiedSince(request, stat)) {
                response.writeHead(304, {
                    'Date': new Date()
                });
                return complete();
            }

            response.writeHead(200, {
                'Content-Type': mimeType + '; charset=UTF-8',
                'Content-Length': fs.statSync(filePath).size,
                'Last-Modified': new Date(stat.mtime).toUTCString(),
                //'Etag': etag
            });

            var stream = fs.createReadStream(filePath);
            stream.pipe(response, { end: false });
            stream.on('end', function () {
                return complete();
            });
        });
    };
};


exports.toDirectory = function (basePath) {
    var tube = this;
    return function (request, response, complete) {
        var requestPath, relativeFilePath, filePath, mimetype, responderFn;

        requestPath = request.parsedUrl.pathname;

        if (_(tube.path).isString()) {
            relativeFilePath = requestPath.substr(tube.path.length - 1);
        } else if (_(tube.path).isRegExp()) {
            var match = tube.path.exec(requestPath)[1];
            relativeFilePath = requestPath.substr(match.length - 1);
        }

        filePath = path.join(basePath, relativeFilePath);

        mimetype = mime.getMimeType(filePath);

        responderFn = exports.toFileStream(filePath, mimetype);
        responderFn.call(tube, request, response, complete);
    };
};