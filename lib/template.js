var path = require('path');
var fs = require('fs');
var _ = require('underscore');

var baseDir = exports.baseDir = './templates/';
var engines = exports.engines = {
    'underscore-ejs': {
		compile: function (text) {
			return text;
		},
		exec: function (template, context) {
			return _(template).template(context);
		}
	}
};
var engine = exports.engine = 'underscore-ejs';

exports.getTemplate = function (templateName) {
	var templateText = fs.readFileSync(
        path.join(baseDir, templateName), 
        'utf-8'
    );
    
    return engines[engine].compile(templateText);
};

exports.exec = function (template, context) {
	return engines[engine].exec(template, context);
};