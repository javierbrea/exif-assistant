const chalk = require("chalk");

const { isUndefined, isNull, isBoolean } = require("../support/utils");
const { PATH_SEP } = require("../support/files");

const NORMAL_COLOR = "white";
const ACCENT_COLOR = "whiteBright";
const POSITIVE_COLOR = "green";
const NEGATIVE_COLOR = "red";
const NEUTRAL_COLOR = "yellow";
const ROW_SEPARATOR = "_____";

const DISPLAY_NULL = "-";
const CURRENT_PATH = `.`;
const CURRENT_PATH_PREFIX = `.${PATH_SEP}`;
const PARENT_PATH_PREFIX = `..${PATH_SEP}`;

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

function startsByPathIndicator(filePath) {
  return filePath.startsWith(CURRENT_PATH_PREFIX) || filePath.startsWith(PARENT_PATH_PREFIX);
}

function shortPath(filePath) {
  if (!filePath.length) {
    return CURRENT_PATH;
  }
  const filePathWithPrefix = startsByPathIndicator(filePath)
    ? filePath
    : `${CURRENT_PATH_PREFIX}${filePath}`;
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

function isNegativeValue(value) {
  return value === null || value === 0;
}

function isPositiveValue(value, positiveThreshold) {
  if (positiveThreshold) {
    return value >= positiveThreshold;
  }
  return !isNegativeValue(value);
}

function conditional(amount, positiveThreshold) {
  if (isNegativeValue(amount)) {
    return negative(amount);
  }
  return isPositiveValue(amount, positiveThreshold) ? positive(amount) : neutral(amount);
}

function strongAccent(text) {
  return strong(accent(text));
}

function strongNeutral(amount) {
  return strong(neutral(amount));
}

function strongConditional(amount, positiveThreshold) {
  return strong(conditional(amount, positiveThreshold));
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
  ROW_SEPARATOR,
};
