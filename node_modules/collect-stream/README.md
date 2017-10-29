
# collect-stream

Collect a readable stream's output and errors.

[![build status](https://secure.travis-ci.org/juliangruber/collect-stream.png)](http://travis-ci.org/juliangruber/collect-stream)

## Usage

Give it a readable stream and a function and it will call latter with the
potential error and a smart representation of the data the stream emitted.

```js
import collect from 'collect-stream';

collect(stringStream, (err, data) => {
  console.log(data); // one string
});

collect(bufferStream, (err, data) => {
  console.log(data); // one buffer
});

collect(objectStream, (err, data) => {
  console.log(data); // an array of objects
});
```

Give it options and it will pass them to [concat-stream](https://github.com/maxogden/concat-stream/).

```js
import collect from 'collect-stream';

collect(someStream, {
  encoding: 'object'
}, (err, data) => {
  console.log(data) // forced to be an array of objects
});
```

## Installation

```bash
$ npm install collect-stream
```

## License

  MIT
