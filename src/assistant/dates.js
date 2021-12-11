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

async function setDate(
  filePath,
  {
    folderName,
    outputFolder,
    date,
    fallbackDate,
    modify = false,
    fromDigitized = true,
    fromFile = true,
    fromFolder = true,
    setDigitized = true,
    moveUnknownToSubfolder,
  } = {}
) {
  const fileName = path.basename(filePath);
  const tracer = new Tracer("Set Date");

  const traceSet = (newValue, valueFrom) => {
    const setDigitedMessage = setDigitized ? ` and ${HUMAN_DATE_TIME_DIGITIZED_PROPERTY}` : "";
    tracer.info(
      `${fileName}: Setting ${HUMAN_DATE_TIME_ORIGINAL_PROPERTY}${setDigitedMessage} to ${newValue}, from ${valueFrom}`
    );
  };

  if (!(await isSupportedFile(filePath))) {
    tracer.warn(`${fileName}: File type is not supported`);
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
  if (!!moveUnknownToSubfolder) {
    tracer.info(
      `Moving ${fileName} to ${moveUnknownToSubfolder} subfolder because no date was found`
    );
    await moveFileToSubfolder(filePath, moveUnknownToSubfolder);
    return false;
  }

  tracer.verbose(`${fileName}: No date was found to set. Skipping`);

  return false;
}

module.exports = {
  setDate,
};
