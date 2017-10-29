function getExtension(filename) {
  // return filename.substr((~-filename.lastIndexOf('.') >>> 0) + 2);
  return subStrByLastChar(filename, '.');
}

function getFileName(path) {
  // return filename.substr((~-filename.lastIndexOf('/') >>> 0) + 2);
  return subStrByLastChar(path, '/');
}

function subStrByLastChar(originStr, lastStr) {
  return originStr.substr((~-originStr.lastIndexOf(lastStr) >>> 0) + 2);
}

function isEmpty(obj) {
  for (var i in obj) {
    return false;
  }
  return true;
}

module.exports = {
  getExtension: getExtension,
  getFileName: getFileName,
  subStrByLastChar: subStrByLastChar,
  isEmpty: isEmpty
};