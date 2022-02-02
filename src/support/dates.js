const { format, isValid, parseISO, parse } = require("date-fns");

const EXIF_DATE_FORMAT = "yyyy:MM:dd HH:mm:ss";
const LOGS_DATE_FORMAT = "yyyy-MM-dd HH:mm:ss";

function dateFromString(string, stringDateFormat, baseDate) {
  if (!stringDateFormat) {
    return parseISO(string);
  }
  return parse(string, stringDateFormat, baseDate || new Date());
}

function isValidDate(string, stringDateFormat, baseDate) {
  return isValid(dateFromString(string, stringDateFormat, baseDate));
}

function formatForExif(string, stringDateFormat, baseDate) {
  return format(dateFromString(string, stringDateFormat, baseDate), EXIF_DATE_FORMAT);
}

function formatForLogsFromExif(exifDate) {
  return format(dateFromString(exifDate, EXIF_DATE_FORMAT), LOGS_DATE_FORMAT);
}

function dateFromStringUsingRegex(string, dateRegex) {
  if (!dateRegex) {
    return string;
  }
  const regexResult = new RegExp(dateRegex).exec(string);
  return regexResult && regexResult[1];
}

module.exports = {
  dateFromString,
  formatForExif,
  formatForLogsFromExif,
  isValidDate,
  dateFromStringUsingRegex,
};
