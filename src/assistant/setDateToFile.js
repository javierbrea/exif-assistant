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
  toAbsolute,
  resolve,
} = require("../support/files");
const { Tracer } = require("../support/tracer");

const tracer = new Tracer("Set Date");

function getParsedBaseDate({
  baseDate,
  baseDateFormat,
  dateCandidates,
  baseDateFromDateCandidates,
  dateRegex,
  baseDateFallback,
}) {
  let parsedFallbackBaseDate = null;
  if (!!baseDate) {
    return dateFromString(baseDate, baseDateFormat);
  }
  if (!!baseDateFallback) {
    parsedFallbackBaseDate = dateFromString(baseDateFallback, baseDateFormat);
  }
  if (!!baseDateFromDateCandidates) {
    const validDateString = dateCandidates.find((date) => {
      return isValidDate(
        dateFromStringUsingRegex(date, dateRegex),
        baseDateFormat,
        parsedFallbackBaseDate
      );
    });
    if (!!validDateString) {
      return dateFromString(validDateString, baseDateFormat, parsedFallbackBaseDate);
    }
  }
  return parsedFallbackBaseDate;
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

function CopyToOutput({ fileName, filePath, destFolder, fileFolder, copyIfNotModified }) {
  const isSameOutputFolder = destFolder === fileFolder;
  return async function () {
    if (!!copyIfNotModified && !isSameOutputFolder) {
      tracer.info(`${fileName}: Copying to output folder`);
      await copyFileToFolder(filePath, destFolder);
    }
  };
}

function SetDates({ fileName, filePath, setDigitized, destFolder }) {
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
    await moveAndUpdateExifDates(filePath, resolve(destFolder, fileName), datesToSet);
    return true;
  };
}

function HandleUnresolved({ fileName, copyToOutput, moveToIfUnresolved, filePath, destFolder }) {
  return async function () {
    tracer.warn(`${fileName}: File type is not supported`);
    if (!!moveToIfUnresolved) {
      tracer.info(`${fileName}: Moving to ${moveToIfUnresolved} subfolder`);
      return moveOrCopyFileToSubfolder(filePath, destFolder, moveToIfUnresolved);
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

function SkipOrGetFileDates({ handleUnresolved, filePath, copyToOutput, fileName, modify }) {
  const fileIsNotSupported = FileIsNotSupported({ handleUnresolved, filePath });
  const dateOriginalHasToBeModified = DateOriginalHasToBeModified({
    copyToOutput,
    fileName,
    modify,
  });
  return async function () {
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

function FindFirstValidDate(isDate) {
  return function (dateCandidates) {
    return dateCandidates.find((date) => {
      return isDate(date);
    });
  };
}

async function setDateToFile(
  filePath,
  {
    dateCandidates = [],
    outputFolder,
    date,
    dateFormat, // TODO, support array
    dateRegex, // TODO, support array
    baseDate,
    baseDateFormat, // TODO, support array in dateFormat. Remove this one
    baseDateFromDateCandidates = true,
    baseDateFallback,
    dateFallback,
    dateFallbackFormat, // TODO, support array in dateFormat. Remove this one
    modify = false,
    fromDigitized = true,
    fromFileName = true,
    fromDateCandidates = true,
    setDigitized = true,
    copyIfNotModified,
    moveToIfUnresolved,
  }
) {
  const fileName = getFileName(filePath);
  const fileFolder = dirName(filePath);
  const destFolder = toAbsolute(outputFolder || fileFolder);
  const parsedBaseDate = getParsedBaseDate({
    baseDate,
    baseDateFormat,
    dateCandidates,
    baseDateFromDateCandidates,
    baseDateFallback,
    dateRegex,
  });

  const copyToOutput = CopyToOutput({
    fileName,
    filePath,
    destFolder,
    fileFolder,
    copyIfNotModified,
  });
  const isDate = IsDate({ dateFormat, parsedBaseDate, dateRegex });
  const findFirstValidDate = FindFirstValidDate(isDate);
  const formatForExif = FormatForExif({
    dateFormat,
    parsedBaseDate,
    dateRegex,
  });
  const setDates = SetDates({
    fileName,
    filePath,
    setDigitized,
    destFolder,
  });
  const handleUnresolved = HandleUnresolved({
    fileName,
    copyToOutput,
    moveToIfUnresolved,
    filePath,
    destFolder,
  });
  const skipOrGetFileDates = SkipOrGetFileDates({
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

  // Set date if date option is present
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
  if (fromFileName && isDate(fileNameWithoutExtension)) {
    return setDates(formatForExif(fileNameWithoutExtension), "file name");
  }

  // Set date from date candidates
  const validDateFromCandidates = findFirstValidDate(dateCandidates);
  if (fromDateCandidates && !!validDateFromCandidates) {
    return setDates(formatForExif(validDateFromCandidates), "date candidate");
  }

  // Set date from dateFallback
  if (!!dateFallback) {
    return setDates(formatDateForExif(dateFallback, dateFallbackFormat), "dateFallback option");
  }

  tracer.verbose(`${fileName}: No date was found to set`);
  await handleUnresolved();

  return false;
}

module.exports = {
  setDateToFile,
};
