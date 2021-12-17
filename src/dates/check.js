const moment = require("moment");
const { disableWarn, restoreWarn } = require("../support/console");

function isValidMomentDate(string) {
  disableWarn();
  const isValid = moment(string).isValid();
  restoreWarn();
  return isValid;
}

function isDate(string) {
  if (!string) {
    return false;
  }
  return isValidMomentDate(string);
}

module.exports = {
  isDate,
};
