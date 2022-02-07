function isString(value) {
  return typeof value === "string";
}

function isArray(value) {
  return Array.isArray(value);
}

function isNumber(value) {
  return typeof value === "number" && isFinite(value);
}

function isUndefined(value) {
  return typeof value === "undefined";
}

function compactArray(arr) {
  return arr.filter((item) => !!item);
}

function lastItem(arr) {
  return arr[arr.length - 1];
}

module.exports = {
  isString,
  isNumber,
  isArray,
  isUndefined,
  compactArray,
  lastItem,
};
