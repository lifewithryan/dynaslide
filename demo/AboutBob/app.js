var tubes = require('tubes');

var model = new tubes.model.Model({
    name: 'Bob Dobbs',
    age: 34,
    favoriteColor: 'red'
});

model.on('updated', function (data) {
    tubes.emit('data updated', data);
});


tubes('/', 'root').connect()
    .toTemplate('detail.html', model.fields);

tubes('/form', 'form').connect()
    .get.toTemplate('form.html', model.fields)
    .post.toPostRedirect('/', function (data, complete) {
        model.set(data);
        complete();
    });

tubes('/style.css', 'style').connect()
    .toFileStream('./approot/style.css', 'text/css');

tubes(/^\/js\/(.*)$/, 'js').connect()
    .toFileStream(function () {
        return './approot/js/' + this[0];
    }, 'text/javascript');


tubes.sendInternetsThru(3000);