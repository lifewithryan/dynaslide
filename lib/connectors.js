var fs = require('fs');
var qs = require('qs');
var path = require('path');
var _ = require('underscore');
var crypto = require('crypto');
var sanitize = require('validator').sanitize;
var errors = require('./errors');
var mime = require('./mime');
var template = require('./template');

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

        complete('OK', template.exec(templ, safeContext), mime.getMIMEType(templateName));
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
                complete('See Other', newUrl);
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
            var etag = generateEtag(filePath, stat); // TODO: if-none-match, etc

            if (err) {
                throw new errors.HTTPError('Not Found');
            }

            if (!modifiedSince(request, stat)) {
                complete('Not Modified', new Date);
            }

            complete('OK', fs.createReadStream(filePath), {
                mimetype: mimeType,
                etag: etag,
                lastModified: new Date(stat.mtime)
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