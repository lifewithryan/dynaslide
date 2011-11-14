var fs = require('fs'),
	qs = require('qs'),
	_ = require('underscore'),
    crypto = require('crypto'),
	sanitize = require('validator').sanitize,
    errors = require('./errors');

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


function generateEtag(path, stat) {
    return crypto.createHash('md5')
        .update(stat.ctime + stat.mtime + path) // adding last few characters of file would be more resilient
        .digest(encoding='hex');
}

function modifiedSince(request, stat) {
    var header = request.headers['if-modified-since'];
    if (header) {
        var requestTime = new Date(header).getTime();
        var modifiedTime = new Date(stat.mtime).getTime();
        return modifiedTime > requestTime;
    } else {
        return false;
    }
}


exports.toFileStream = function (pathname, mimeType) {
    var tube = this;
    return function (request, response, complete) {
        var computedPath;
        if (_(pathname).isFunction()) {
            var urlmatch = tube.path.exec(request.parsedUrl.pathname);
            computedPath = pathname.call(urlmatch.slice(1));
        } else {
            computedPath = pathname;
        }

        fs.stat(computedPath, function (err, stat) {
            var etag = generateEtag(computedPath, stat)

            if (err) {
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
                'Content-Length': fs.statSync(computedPath).size,
                'Last-Modified': new Date(stat.mtime).toUTCString(),
                'Etag': etag
            });

            var stream = fs.createReadStream(computedPath);
            stream.pipe(response, { end: false });
            stream.on('end', function () {
                return complete();
            });
        });
    };
};
