const moment = require("moment");

function isDate(string) {
  if (!string) {
    return false;
  }
  const originalWarn = console.warn;
  console.warn = () => {
    // Disable console.warn due to moment warnings on invalid date format
  };
  const isValid = moment(string).isValid();
  console.warn = originalWarn;
  return isValid;
}

module.exports = {
  isDate,
};
