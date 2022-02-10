const chalk = require("chalk");

const NORMAL_COLOR = "white";
const ACCENT_COLOR = "whiteBright";
const POSITIVE_COLOR = "green";
const NEGATIVE_COLOR = "red";
const NEUTRAL_COLOR = "yellow";

const DISPLAY_NULL = "-";
const CURRENT_PATH = ".";

const { isUndefined, isNull, isBoolean } = require("../support/utils");
const { pathSep } = require("../support/files");

function displayBoolean(value) {
  return value === true ? "y" : DISPLAY_NULL;
}

function format(value) {
  if (isNull(value) || isUndefined(value)) {
    return DISPLAY_NULL;
  }
  if (isBoolean(value)) {
    return displayBoolean(value);
  }
  return value;
}

function shortPath(filePath) {
  if (!filePath.length) {
    return CURRENT_PATH;
  }
  const filePathWithPrefix = filePath.startsWith(CURRENT_PATH)
    ? filePath
    : `${CURRENT_PATH}${pathSep}${filePath}`;
  if (filePathWithPrefix.length > 35) {
    return `${filePathWithPrefix.slice(0, 6)}[...]${filePathWithPrefix.slice(-18)}`;
  }
  return filePathWithPrefix;
}

function formatAll(values) {
  return Object.keys(values).reduce((newValues, key) => {
    newValues[key] = format(newValues[key]);
    return newValues;
  }, values);
}

function normal(text) {
  return chalk[NORMAL_COLOR](format(text));
}

function accent(text) {
  return chalk[ACCENT_COLOR](format(text));
}

function positive(text) {
  return chalk[POSITIVE_COLOR](format(text));
}

function negative(text) {
  return chalk[NEGATIVE_COLOR](format(text));
}

function neutral(text) {
  return chalk[NEUTRAL_COLOR](format(text));
}

function bold(text) {
  return chalk.bold(format(text));
}

function strong(text) {
  return bold(text);
}

function isPositiveValue(value) {
  return value !== null && value > 0;
}

function conditionalReverse(amount) {
  return isPositiveValue(amount) ? negative(amount) : positive(amount);
}

function conditional(amount, reverse) {
  if (reverse) {
    return conditionalReverse(amount);
  }
  return isPositiveValue(amount) ? positive(amount) : negative(amount);
}

function strongAccent(text) {
  return strong(accent(text));
}

function strongNeutral(amount) {
  return strong(neutral(amount));
}

function strongConditional(amount, reverse) {
  return strong(conditional(amount, reverse));
}

module.exports = {
  shortPath,
  normal,
  accent,
  positive,
  negative,
  neutral,
  strong,
  conditional,
  strongAccent,
  strongNeutral,
  strongConditional,
  formatAll,
};
