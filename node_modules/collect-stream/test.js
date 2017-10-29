import { default as test } from 'tape';
import { default as through } from 'through';
import collect from './';

test('string', t => {
  t.plan(2);
  
  var stream = through();
  
  process.nextTick(() => {
    stream.queue('foo');
    stream.queue('bar');
    stream.queue(null);
  });
  
  collect(stream, (err, data) => {
    t.error(err);
    t.deepEqual(data, 'foobar');
  });
});

test('buffer', t => {
  t.plan(3);

  var stream = through();

  process.nextTick(() => {
    stream.queue(new Buffer('foo'));
    stream.queue(new Buffer('bar'));
    stream.queue(null);
  });

  collect(stream, (err, data) => {
    t.error(err);
    t.ok(Buffer.isBuffer(data));
    t.equal(data.toString(), 'foobar');
  });
});

test('object', t => {
  t.plan(2);

  var stream = through();

  process.nextTick(() => {
    stream.queue({ foo: true });
    stream.queue({ bar: true });
    stream.queue(null);
  });

  collect(stream, (err, data) => {
    t.error(err);
    t.deepEqual(data, [
      { foo: true },
      { bar: true }
    ]);
  });
});

test('concat-stream options', t => {
  t.plan(2);

  var stream = through();
  process.nextTick(() => {
    stream.queue([{ foo: true }]);
    stream.queue([{ bar: true }]);
    stream.queue(null);
  });

  collect(stream, {
    encoding: 'object'
  }, (err, data) => {
    t.error(err);
    t.deepEqual(data, [
      [{ foo: true }],
      [{ bar: true }]
    ]);
  });
});

test('error', t => {
  t.plan(1);
  
  var stream = through();
  process.nextTick(() => {
    stream.emit('error', new Error);
  });
  
  collect(stream, (err, data) => {
    t.ok(err);
  });
});
