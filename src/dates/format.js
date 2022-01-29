const { format, isValid, parseISO, parse } = require("date-fns");

function dateFromString(string, stringDateFormat, baseDate) {
  if (!stringDateFormat) {
    return parseISO(string);
  }
  return parse(string, stringDateFormat, baseDate || new Date());
}

function isDate(string, stringDateFormat, baseDate) {
  return isValid(dateFromString(string, stringDateFormat, baseDate));
}

function formatForExif(string, stringDateFormat, baseDate) {
  return format(dateFromString(string, stringDateFormat, baseDate), "yyyy:MM:dd HH:mm:ss");
}

module.exports = {
  dateFromString,
  formatForExif,
  isDate,
};
