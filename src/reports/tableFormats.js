const chalk = require("chalk");

const NORMAL_COLOR = "white";
const ACCENT_COLOR = "whiteBright";
const POSITIVE_COLOR = "green";
const NEGATIVE_COLOR = "red";
const NEUTRAL_COLOR = "yellow";

const DISPLAY_NULL = "-";

function format(value) {
  if (value === null) {
    return DISPLAY_NULL;
  }
  return value;
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

function conditionalReverse(amount) {
  return amount > 0 ? negative(amount) : positive(amount);
}

function conditional(amount, reverse) {
  if (reverse) {
    return conditionalReverse(amount);
  }
  return amount > 0 ? positive(amount) : negative(amount);
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
