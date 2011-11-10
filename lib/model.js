var _ = require('underscore');
var EventEmitter = require('events').EventEmitter;

var Model = exports.Model = function Model(fields) {
	EventEmitter.call(this);
	this.fields = fields || {};
};
Model.prototype = _(new EventEmitter).extend({
	set: function (field, value) {
		var model = this;
		if (arguments.length === 1) {
			_(arguments[0]).each(function (value, key) {
				model.set(key, value);
			});
			this.emit('updated', this.fields);
		} else {
			this.fields[field] = value;
			this.emit('field updated', { field: field, value: value });
		}
	},
	get: function (field) {
		return this.field[field];
	}
});
