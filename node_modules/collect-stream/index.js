import { default as concat } from 'concat-stream';
import { default as once } from 'once';

export default function collect(stream, opts, fn) {
  if (typeof opts === 'function') {
    fn = opts;
    opts = {};
  }
  fn = once(fn);
  stream.on('error', fn);
  stream.pipe(concat(opts, data => {
    fn(null, data);
  }));
};

