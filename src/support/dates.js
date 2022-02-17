const {
  format,
  isValid,
  isMatch,
  parseISO,
  parse,
  getSeconds,
  getMinutes,
  getHours,
  setSeconds,
  setHours,
  setMinutes,
  setDate,
  getDate,
} = require("date-fns");

const { isArray, isEmpty } = require("./utils");

const EXIF_DATE_FORMAT = "yyyy:MM:dd HH:mm:ss";
const LOGS_DATE_FORMAT = "yyyy-MM-dd HH:mm:ss";

function findFormatMatchingDateString(stringDateFormats, dateString) {
  return stringDateFormats.find((stringDateFormat) => {
    return isMatch(dateString, stringDateFormat);
  });
}

function dateFromString(dateString, stringDateFormats, baseDate) {
  const stringDateFormat = isArray(stringDateFormats)
    ? findFormatMatchingDateString(stringDateFormats, dateString)
    : stringDateFormats;
  if (!stringDateFormat) {
    return parseISO(dateString);
  }
  return parse(dateString, stringDateFormat, baseDate || new Date());
}

function isValidDate(string, stringDateFormats, baseDate) {
  return isValid(dateFromString(string, stringDateFormats, baseDate));
}

function exifStringFromDate(date) {
  return format(date, EXIF_DATE_FORMAT);
}

function dateFromExifString(dateString) {
  return dateFromString(dateString, EXIF_DATE_FORMAT);
}

function formatForExif(string, stringDateFormats, baseDate) {
  return exifStringFromDate(dateFromString(string, stringDateFormats, baseDate));
}

function formatForLogsFromExif(exifDateString) {
  return format(dateFromExifString(exifDateString), LOGS_DATE_FORMAT);
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

function getDateInfoFromExifDate(dateString) {
  if (!dateString) {
    return null;
  }
  const date = dateFromExifString(dateString);
  return {
    hours: getHours(date),
    minutes: getMinutes(date),
    seconds: getSeconds(date),
    day: getDate(date),
  };
}

function modifyTimeToExifDate(dateString, dateInfo) {
  return exifStringFromDate(
    setHours(
      setMinutes(setSeconds(dateFromExifString(dateString), dateInfo.seconds), dateInfo.minutes),
      dateInfo.hours
    )
  );
}

function modifyDayToExifDate(dateString, dateInfo) {
  return exifStringFromDate(setDate(dateFromExifString(dateString), dateInfo.day));
}

module.exports = {
  dateFromString,
  formatForExif,
  formatForLogsFromExif,
  isValidDate,
  findDateStringUsingRegexs,
  getDateInfoFromExifDate,
  modifyTimeToExifDate,
  modifyDayToExifDate,
};
