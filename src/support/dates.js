const { format, isValid, isMatch, parseISO, parse } = require("date-fns");

const { isArray } = require("./utils");

const EXIF_DATE_FORMAT = "yyyy:MM:dd HH:mm:ss";
const LOGS_DATE_FORMAT = "yyyy-MM-dd HH:mm:ss";

function findFormatMatchingDateString(stringDateFormats, dateString) {
  return stringDateFormats.find((stringDateFormat) => {
    return isMatch(dateString, stringDateFormat);
  });
}

function dateFromString(string, stringDateFormats, baseDate) {
  const stringDateFormat = isArray(stringDateFormats)
    ? findFormatMatchingDateString(stringDateFormats, string)
    : stringDateFormats;
  if (!stringDateFormat) {
    return parseISO(string);
  }
  return parse(string, stringDateFormat, baseDate || new Date());
}

function isValidDate(string, stringDateFormats, baseDate) {
  return isValid(dateFromString(string, stringDateFormats, baseDate));
}

function formatForExif(string, stringDateFormats, baseDate) {
  return format(dateFromString(string, stringDateFormats, baseDate), EXIF_DATE_FORMAT);
}

function formatForLogsFromExif(exifDate) {
  return format(dateFromString(exifDate, EXIF_DATE_FORMAT), LOGS_DATE_FORMAT);
}

function findDateStringUsingRegex(string, dateRegex) {
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
  findDateStringUsingRegex,
};
