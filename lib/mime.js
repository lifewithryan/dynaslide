var fs = require('fs');
var path = require('path');
var _ = require('underscore');

// TODO: this should really load data from /etc/mime.types and fall back to unix magic

var mimeTypes = {
	'audio/aiff': ['aif', 'aiff', 'aifc'],
	'audio/basic': ['au'],
	'audio/x-mpegurl': ['m3u'],
	'audio/wav': ['wav'],
	'text/plain': ['txt', 'log'],
    'text/html': ['html', 'htm', 'shtml'],
    'text/xml': ['xml'],
    'text/javascript': ['js'],
    'text/css': ['css'],
    'text/x-component': ['htc'],
    'image/x-icon': ['ico'],
    'image/jpeg': ['jpg', 'jpeg', 'jpe'],
    'image/gif': ['gif'],
    'image/png': ['png'],
    'image/x-portable-pixmap': ['ppm'],
    'image/tiff': ['tif', 'tiff'],
    'image/xbm': ['xbm'],
    'image/xpm': ['xpm'],
    'application/x-gzip': ['gz'],
    'application/postscript': ['eps', 'ps'],
    'application/x-tar': ['tar'],
    'application/x-compressed': ['tgz'],
    'application/x-compress': ['z'],
    'application/zip': ['zip'],
    'video/fli': ['fli'],
    'video/mpeg': ['m1v', 'm2a', 'm2v', 'mpa'],
    'application/x-troff-man': ['man'],
    'application/rtf': ['rtf'],
    'audio/midi': ['mid', 'midi'],
    'audio/mod': ['mod'],
    'audio/mpeg': ['mp2', 'mp3', 'mpga']
};

var extensions = {};

_(mimeTypes).each(function (extensionses, mimeType) {
	extensionses.forEach(function (extension) {
		extensions[extension] = mimeType;
	});
});

exports.getMIMEType = function (filePath) {
	return extensions[path.extname(filePath).substr(1)];
};