const { format, isValid, isMatch, parseISO, parse } = require("date-fns");

const { isArray, isEmpty } = require("./utils");

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

function findDateStringUsingRegexs(string, dateRegexs = []) {
  if (isEmpty(dateRegexs)) {
    return string;
  }
  const firstMatch = dateRegexs.reduce((previousResult, dateRegex) => {
    if (!!previousResult) {
      return previousResult;
    }
    const regexResult = new RegExp(dateRegex).exec(string);
    return regexResult && regexResult[1];
  }, null);
  return firstMatch || string;
}

module.exports = {
  dateFromString,
  formatForExif,
  formatForLogsFromExif,
  isValidDate,
  findDateStringUsingRegexs,
};
