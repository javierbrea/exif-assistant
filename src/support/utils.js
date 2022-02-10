function isString(value) {
  return typeof value === "string";
}

function isArray(value) {
  return Array.isArray(value);
}

function isNumber(value) {
  return typeof value === "number" && isFinite(value);
}

function isNull(value) {
  return value === null;
}

function isBoolean(value) {
  return value === false || value === true;
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

function isEmpty(arr) {
  return arr.length === 0;
}

module.exports = {
  isBoolean,
  isString,
  isNull,
  isNumber,
  isArray,
  isUndefined,
  compactArray,
  lastItem,
  isEmpty,
};
