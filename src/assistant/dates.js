const { isSupportedFile, readExifDates, moveAndUpdateExifDates } = require("../exif/fileMethods");
const {
  HUMAN_DATE_TIME_ORIGINAL_PROPERTY,
  HUMAN_DATE_TIME_DIGITIZED_PROPERTY,
} = require("../exif/data");
const {
  formatForExif: formatDateForExif,
  isValidDate,
  dateFromString,
  formatForLogsFromExif,
  dateFromStringUsingRegex,
} = require("../support/dates");
const {
  moveOrCopyFileToSubfolder,
  removeExtension,
  copyFileToFolder,
  getFileName,
  dirName,
  resolve,
} = require("../support/files");
const { Tracer } = require("../support/tracer");

const tracer = new Tracer("Set Date");

function getParsedBaseDate(baseDate, baseDateFormat) {
  if (!!baseDate && !!isValidDate(baseDate, baseDateFormat)) {
    return dateFromString(baseDate, baseDateFormat);
  }
  return null;
}

function TraceSetDate({ fileName, setDigitized }) {
  return function (newValue, valueFrom) {
    const setDigitedMessage = setDigitized ? ` and ${HUMAN_DATE_TIME_DIGITIZED_PROPERTY}` : "";
    tracer.info(
      `${fileName}: Setting ${HUMAN_DATE_TIME_ORIGINAL_PROPERTY}${setDigitedMessage} to ${formatForLogsFromExif(
        newValue
      )}, from ${valueFrom}`
    );
  };
}

function IsDate({ dateFormat, parsedBaseDate, dateRegex }) {
  return function (date) {
    return isValidDate(dateFromStringUsingRegex(date, dateRegex), dateFormat, parsedBaseDate);
  };
}

function FormatForExif({ dateFormat, parsedBaseDate, dateRegex }) {
  return function (date) {
    return formatDateForExif(
      dateFromStringUsingRegex(date, dateRegex),
      dateFormat,
      parsedBaseDate
    );
  };
}

function CopyToOutput({ fileName, filePath, outputFolder, copyAll }) {
  const isSameOutputFolder = outputFolder === dirName(filePath);
  return async function () {
    if (!!copyAll && !isSameOutputFolder) {
      tracer.info(`${fileName}: Copying to output folder`);
      await copyFileToFolder(filePath, outputFolder);
    }
  };
}

function SetDates({ fileName, filePath, setDigitized, outputFolder }) {
  const traceSetDate = TraceSetDate({ fileName, setDigitized });
  return async function (dateOriginal, from) {
    const datesToSet = {
      [HUMAN_DATE_TIME_ORIGINAL_PROPERTY]: dateOriginal,
    };
    // Set also DateTimeDigitized if setDigited option is enabled
    if (setDigitized) {
      datesToSet[HUMAN_DATE_TIME_DIGITIZED_PROPERTY] = dateOriginal;
    }
    traceSetDate(dateOriginal, from);
    await moveAndUpdateExifDates(filePath, resolve(outputFolder, fileName), datesToSet);
    return true;
  };
}

function OptionsAreValid({ isDate, baseDate, parsedBaseDate, date }) {
  return function () {
    if (!!baseDate && !parsedBaseDate) {
      tracer.warn(`baseDate option is not a valid date`);
      return false;
    }

    if (!!date && !isDate(date)) {
      tracer.warn(`date option is not a valid date`);
      return false;
    }

    return true;
  };
}

function HandleUnresolved({ fileName, copyToOutput, moveUnresolvedTo, filePath, outputFolder }) {
  return async function () {
    tracer.warn(`${fileName}: File type is not supported`);
    if (!!moveUnresolvedTo) {
      tracer.info(`${fileName}: Moving to ${moveUnresolvedTo} subfolder`);
      return moveOrCopyFileToSubfolder(filePath, outputFolder, moveUnresolvedTo);
    }
    return copyToOutput();
  };
}

function FileIsNotSupported({ handleUnresolved, filePath }) {
  return async function () {
    if (await isSupportedFile(filePath)) {
      return false;
    }
    await handleUnresolved();
    return true;
  };
}

function DateOriginalHasToBeModified({ fileName, copyToOutput, modify }) {
  return async function (dates) {
    if (!modify && dates[HUMAN_DATE_TIME_ORIGINAL_PROPERTY]) {
      tracer.verbose(`${fileName}: Already has ${HUMAN_DATE_TIME_ORIGINAL_PROPERTY}`);
      await copyToOutput();
      return false;
    }
    return true;
  };
}

function SkipOrGetFileDates({
  isDate,
  baseDate,
  parsedBaseDate,
  date,
  handleUnresolved,
  filePath,
  copyToOutput,
  fileName,
  modify,
}) {
  const optionsAreValid = OptionsAreValid({ isDate, baseDate, parsedBaseDate, date });
  const fileIsNotSupported = FileIsNotSupported({ handleUnresolved, filePath });
  const dateOriginalHasToBeModified = DateOriginalHasToBeModified({
    copyToOutput,
    fileName,
    modify,
  });
  return async function () {
    if (!optionsAreValid()) {
      return false;
    }

    if (await fileIsNotSupported(filePath)) {
      return false;
    }

    const dates = await readExifDates(filePath);

    if (!(await dateOriginalHasToBeModified(dates))) {
      return false;
    }
    return dates;
  };
}

async function setDate(
  filePath,
  {
    folderName, // TODO, accept array of folder names in order to check parent folder names
    outputFolder,
    date,
    dateFormat,
    dateRegex,
    baseDate,
    baseDateFormat,
    fallbackDate,
    fallbackDateFormat,
    modify = false,
    fromDigitized = true,
    fromFile = true,
    fromFolder = true,
    setDigitized = true,
    copyAll, // Copy also files not being modified
    moveUnresolvedTo,
  } = {}
) {
  const parsedBaseDate = getParsedBaseDate(baseDate, baseDateFormat);
  const fileName = getFileName(filePath);
  const copyToOutput = CopyToOutput({
    fileName,
    filePath,
    outputFolder,
    copyAll,
  });
  const isDate = IsDate({ dateFormat, parsedBaseDate, dateRegex });
  const formatForExif = FormatForExif({
    dateFormat,
    parsedBaseDate,
    dateRegex,
  });
  const setDates = SetDates({
    fileName,
    filePath,
    setDigitized,
    outputFolder,
  });
  const handleUnresolved = HandleUnresolved({
    fileName,
    copyToOutput,
    moveUnresolvedTo,
    filePath,
    outputFolder,
  });
  const skipOrGetFileDates = SkipOrGetFileDates({
    isDate,
    baseDate,
    parsedBaseDate,
    date,
    handleUnresolved,
    filePath,
    copyToOutput,
    fileName,
    modify,
  });

  const fileDates = await skipOrGetFileDates();

  if (!fileDates) {
    return false;
  }

  // Set date if present
  if (!!date) {
    return setDates(formatForExif(date), "date option");
  }

  // Copy DateTimeDigitized to DateTimeOriginal if present
  if (fromDigitized && fileDates[HUMAN_DATE_TIME_DIGITIZED_PROPERTY]) {
    return setDates(
      fileDates[HUMAN_DATE_TIME_DIGITIZED_PROPERTY],
      HUMAN_DATE_TIME_DIGITIZED_PROPERTY
    );
  }

  // Set date from file name
  const fileNameWithoutExtension = removeExtension(fileName);
  if (fromFile && isDate(fileNameWithoutExtension)) {
    return setDates(formatForExif(fileNameWithoutExtension), "file name");
  }

  // Set date from folder name
  if (fromFolder && isDate(folderName)) {
    return setDates(formatForExif(folderName), "folder name");
  }

  // Set date from fallbackDate
  if (!!fallbackDate) {
    // TODO, validate fallback date. Take into account also baseDate when formatting
    return setDates(formatDateForExif(fallbackDate, fallbackDateFormat), "fallbackDate option");
  }

  tracer.verbose(`${fileName}: No date was found to set`);
  await handleUnresolved();

  return false;
}

module.exports = {
  setDate,
};
