var plist = require('./xmlPlistParser');
var bplist = require('./bplistParser');

exports.parse = function(aStringOrBuffer) {
  var results,
    firstByte = aStringOrBuffer[0];
  try {
    if (firstByte === 60 || firstByte === '<' || firstByte == 239) {
      results = plist.parse(aStringOrBuffer.toString());
    }
    else if (firstByte === 98) {
      results = bplist.parseBuffer(aStringOrBuffer)[0];
    }
    else {
      console.error("Unable to determine format for plist aStringOrBuffer: '%s'", aStringOrBuffer);
      results = {};
    }
  }
  catch (e) {
    throw Error("'%s' has errors", aFile);
  }
  return results;
};
