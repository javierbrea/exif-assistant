const path = require("path");

const { isSupportedFile, readExifDates, moveAndUpdateExifDates } = require("../exif/fileMethods");
const {
  HUMAN_DATE_TIME_ORIGINAL_PROPERTY,
  HUMAN_DATE_TIME_DIGITIZED_PROPERTY,
} = require("../exif/data");
const { isDate } = require("../dates/check");
const { formatForExif } = require("../dates/format");
const { moveFileToSubfolder } = require("../files/move");
const { Tracer } = require("../support/tracer");

async function addOriginalDate(
  filePath,
  {
    folderName,
    outputFolder,
    date,
    fromDigitized = true,
    fromFile,
    fromFolder,
    fallbackDate,
    setDigitized = true,
    moveUnknown = true,
    unknownSubfolder,
  } = {}
) {
  const fileName = path.basename(filePath);
  const tracer = new Tracer("Add OriginalDate");

  const traceSet = (newValue, valueFrom) => {
    tracer.info(
      `Setting ${fileName} ${HUMAN_DATE_TIME_ORIGINAL_PROPERTY} to ${newValue}, from ${valueFrom}`
    );
  };

  if (!(await isSupportedFile(filePath))) {
    tracer.warn(`File type of ${fileName} is not supported`);
    return false;
  }

  const dates = await readExifDates(filePath);
  if (dates[HUMAN_DATE_TIME_ORIGINAL_PROPERTY]) {
    tracer.verbose(`File ${fileName} already has ${HUMAN_DATE_TIME_ORIGINAL_PROPERTY}. Skipping`);
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

  // Set date if present
  if (!!date) {
    traceSet(date, "date option");
    return setDates(date);
  }

  // Copy DateTimeDigitized to DateTimeOriginal if present
  if (fromDigitized && dates[HUMAN_DATE_TIME_DIGITIZED_PROPERTY]) {
    traceSet(dates[HUMAN_DATE_TIME_DIGITIZED_PROPERTY], HUMAN_DATE_TIME_DIGITIZED_PROPERTY);
    return setDates(dates[HUMAN_DATE_TIME_DIGITIZED_PROPERTY]);
  }

  // Set date from file name
  if (fromFile && isDate(fileName)) {
    const dateToSet = formatForExif(fileName);
    traceSet(dateToSet, "file name");
    return setDates(dateToSet);
  }

  // Set date from folder name
  if (fromFolder && isDate(folderName)) {
    const dateToSet = formatForExif(folderName);
    traceSet(dateToSet, "folder name");
    return setDates(dateToSet);
  }

  // Set date from fallback date
  if (!!fallbackDate) {
    const dateToSet = formatForExif(fallbackDate);
    traceSet(dateToSet, "fallbackDate option");
    return setDates(dateToSet);
  }

  // Move to unkown folder
  if (moveUnknown && !!unknownSubfolder) {
    tracer.info(`Moving ${fileName} to ${unknownSubfolder} subfolder because no date was found`);
    await moveFileToSubfolder(filePath, unknownSubfolder);
    return false;
  }

  return false;
}

module.exports = {
  addOriginalDate,
};
