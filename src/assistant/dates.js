const path = require("path");

const { isSupportedFile, readExifDates, moveAndUpdateExifDates } = require("../exif/fileMethods");
const {
  HUMAN_DATE_TIME_ORIGINAL_PROPERTY,
  HUMAN_DATE_TIME_DIGITIZED_PROPERTY,
} = require("../exif/data");
const { formatForExif, isDate, dateFromString } = require("../dates/format");
const { moveOrCopyFileToSubfolder, removeExtension } = require("../files/utils");
const { Tracer } = require("../support/tracer");

const tracer = new Tracer("Set Date");

function TraceSetDate(fileName, setDigitized) {
  return function (newValue, valueFrom) {
    const setDigitedMessage = setDigitized ? ` and ${HUMAN_DATE_TIME_DIGITIZED_PROPERTY}` : "";
    tracer.info(
      `${fileName}: Setting ${HUMAN_DATE_TIME_ORIGINAL_PROPERTY}${setDigitedMessage} to ${newValue}, from ${valueFrom}`
    );
  };
}

function getDateUsingDateRegex(string, dateRegex) {
  if (!dateRegex) {
    return string;
  }
  const regexResult = new RegExp(dateRegex).exec(string);
  return regexResult && regexResult[1];
}

function IsDateAccordingToOptions(format, parsedBaseDate, dateRegex) {
  return function (date) {
    return isDate(getDateUsingDateRegex(date, dateRegex), format, parsedBaseDate);
  };
}

function FormatForExifAccordingToOptions(format, parsedBaseDate, dateRegex) {
  return function (date) {
    return formatForExif(getDateUsingDateRegex(date, dateRegex), format, parsedBaseDate);
  };
}

async function setDate(
  filePath,
  {
    folderName, // TODO, accept array of folder names in order to check parent folder names
    outputFolder,
    date,
    format,
    baseDate,
    dateRegex,
    baseDateFormat,
    modify = false,
    fromDigitized = true,
    fromFile = true,
    fromFolder = true,
    setDigitized = true,
    moveUnknownToSubfolder,
  } = {}
) {
  let parsedBaseDate, isDateAccordingToOptions, formatForExifAccordingToOptions;
  const fileName = path.basename(filePath);

  const traceSet = TraceSetDate(fileName, setDigitized);

  if (!!baseDate) {
    if (!isDate(baseDate, baseDateFormat)) {
      tracer.warn(`baseDate option is not a valid date. Skipping`);
      return false;
    }
    parsedBaseDate = dateFromString(baseDate, baseDateFormat);
  }

  isDateAccordingToOptions = IsDateAccordingToOptions(format, parsedBaseDate, dateRegex);
  formatForExifAccordingToOptions = FormatForExifAccordingToOptions(
    format,
    parsedBaseDate,
    dateRegex
  );

  if (!!date && !isDateAccordingToOptions(date)) {
    tracer.warn(`date option is not a valid date. Skipping`);
    return false;
  }

  if (!(await isSupportedFile(filePath))) {
    tracer.warn(`${fileName}: File type is not supported. Skipping`);
    return false;
  }

  const setDates = async (originalDate) => {
    const datesToSet = {
      [HUMAN_DATE_TIME_ORIGINAL_PROPERTY]: originalDate,
    };
    // Set also DateTimeDigitized if setDigited option is enabled
    if (setDigitized) {
      datesToSet[HUMAN_DATE_TIME_DIGITIZED_PROPERTY] = originalDate;
    }
    await moveAndUpdateExifDates(filePath, path.resolve(outputFolder, fileName), datesToSet);
    return true;
  };

  // Skip if date already exists in file
  const dates = await readExifDates(filePath);
  if (!modify && dates[HUMAN_DATE_TIME_ORIGINAL_PROPERTY]) {
    tracer.verbose(`${fileName}: Already has ${HUMAN_DATE_TIME_ORIGINAL_PROPERTY}. Skipping`);
    return false;
  }

  // Set date if present
  if (!!date) {
    const dateToSet = formatForExifAccordingToOptions(date);
    traceSet(dateToSet, "date option");
    return setDates(dateToSet);
  }

  // Copy DateTimeDigitized to DateTimeOriginal if present
  if (fromDigitized && dates[HUMAN_DATE_TIME_DIGITIZED_PROPERTY]) {
    traceSet(dates[HUMAN_DATE_TIME_DIGITIZED_PROPERTY], HUMAN_DATE_TIME_DIGITIZED_PROPERTY);
    return setDates(dates[HUMAN_DATE_TIME_DIGITIZED_PROPERTY]);
  }

  // Set date from file name
  const fileNameWithoutExtension = removeExtension(fileName);
  if (fromFile && isDateAccordingToOptions(fileNameWithoutExtension)) {
    const dateToSet = formatForExifAccordingToOptions(fileNameWithoutExtension);
    traceSet(dateToSet, "file name");
    return setDates(dateToSet);
  }

  // Set date from folder name
  if (fromFolder && isDateAccordingToOptions(folderName)) {
    const dateToSet = formatForExifAccordingToOptions(folderName);
    traceSet(dateToSet, "folder name");
    return setDates(dateToSet);
  }

  // Set date from fallback date
  if (!!baseDate) {
    const dateToSet = formatForExifAccordingToOptions(baseDate);
    traceSet(dateToSet, "baseDate option");
    return setDates(dateToSet);
  }

  // Move to unkown subfolder
  if (!!moveUnknownToSubfolder) {
    tracer.info(
      `${fileName}: Moving to ${moveUnknownToSubfolder} subfolder because no date was found`
    );
    await moveOrCopyFileToSubfolder(filePath, outputFolder, moveUnknownToSubfolder);
    return false;
  }

  tracer.verbose(`${fileName}: No date was found to set. Skipping`);

  return false;
}

module.exports = {
  setDate,
};
