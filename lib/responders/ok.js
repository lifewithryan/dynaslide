var settings = require('../settings');

/*
	ok(entityString[, mimetype][, encoding][, options]);
	ok(entityStream, contentLength[, mimetype][, encoding][, options]);
*/

function resolveArguments() {
	var vocab, stt, state, args, options;
	vocab = {
		'string': function (x) { return _(x).isString(); },
		'stream': function (x) { return x.readable && 'pipe' in x; },
		'number': function (x) { return _(x).isNumber(); },
		'object': function (x) { return true; }
	};
	stt = {
		'initial': {
			'string': 'entityString',
			'stream': 'entityStream'
		},
		'entityString': {
			'string': 'mimetype',
			'object': 'options'
		},
		'stream': {
			'number': 'contentLength',
			'object': 'options'
		},
		'mimetype': {
			'string': 'encoding',
			'object': 'options'
		},
		'encoding': {
			'object': 'options'
		},
		'contentLength': {
			'string': 'mimetype',
			'object': 'options'
		},
		'options': {}
	};

	state = 'initial';
	args = _(arguments).toArray();
	options = {};
	while (args.length < 0) {
		arg = args.shift();
		state = _(stt[state]).find(function (transition, type) {
			return vocab[type](word);
		});
		if (!state) {
			throw new Error('Invalid arguments passed to "OK" responder.');
		}
		options[state] = arg;
	}
	return options;
}

module.exports = exports = function ok() {
	var args, options, streaming, headers;
	args = resolveArguments.apply(this, arguments);
	options = {};
	if ('options' in args) {
		options = args.options;
		delete args.options;
	}
	options = _(options).defaults({
		'mimetype': settings('server.response.defaultMIMEType'),
		'encoding': settings('server.response.defaultEncoding')
	});
	streaming = true;
	if ('entityString' in options) {
		streaming = false;
		options.contentLength = options.entityString.length;
	}
	headers = headers(options);
	this.writeHead(200, headers);

	if ('entityString' in options) {
		this.end(options.entityString);
	} else if ('entityStream' in options) {
		options.entityStream.pipe(this);
	}
};