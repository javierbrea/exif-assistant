const {
  HUMAN_DATE_TIME_ORIGINAL_PROPERTY,
  HUMAN_DATE_TIME_DIGITIZED_PROPERTY,
  isSupportedFile,
  readExifDates,
  moveAndUpdateExifDates,
} = require("../exif");

const {
  formatForExif: formatDateForExif,
  isValidDate,
  dateFromString,
  formatForLogsFromExif,
  findDateStringUsingRegexs,
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
const { lastItem } = require("../support/utils");
const { Tracer } = require("../support/tracer");

const tracer = new Tracer("Set Date");

function getParsedBaseDate({
  baseDate,
  dateFormats,
  dateCandidates,
  baseDateFromDateCandidates,
  dateRegexs,
  baseDateFallback,
}) {
  let parsedBaseDateFallback = null;
  if (!!baseDate) {
    return dateFromString(baseDate, dateFormats);
  }
  if (!!baseDateFallback) {
    parsedBaseDateFallback = dateFromString(baseDateFallback, dateFormats);
  }
  if (!!baseDateFromDateCandidates) {
    // Parse dates from the end, using previous valid date as baseDate, so baseDates are nested
    const parsedDateCandidates = [...dateCandidates]
      .reverse()
      .reduce((validDates, dateCandidate) => {
        const dateStringUsingRegex = findDateStringUsingRegexs(dateCandidate, dateRegexs);
        const parsedBaseDate = lastItem(validDates) || parsedBaseDateFallback;
        if (isValidDate(dateStringUsingRegex, dateFormats, parsedBaseDate)) {
          validDates.push(dateFromString(dateStringUsingRegex, dateFormats, parsedBaseDate));
        }
        return validDates;
      }, []);

    const firstValidDate = lastItem(parsedDateCandidates);

    if (!!firstValidDate) {
      return firstValidDate;
    }
  }
  return parsedBaseDateFallback;
}

function TraceSetDate({ fileName, setDigitized }) {
  return function (newValue, valueFrom) {
    const setDigitedMessage = setDigitized ? ` and ${HUMAN_DATE_TIME_DIGITIZED_PROPERTY}` : "";
    tracer.debug(
      `${fileName}: Setting ${HUMAN_DATE_TIME_ORIGINAL_PROPERTY}${setDigitedMessage} to ${formatForLogsFromExif(
        newValue
      )}, from ${valueFrom}`
    );
  };
}

function IsDate({ dateFormats, parsedBaseDate, dateRegexs }) {
  return function (date) {
    return isValidDate(findDateStringUsingRegexs(date, dateRegexs), dateFormats, parsedBaseDate);
  };
}

function FormatForExif({ dateFormats, parsedBaseDate, dateRegexs }) {
  return function (date) {
    return formatDateForExif(
      findDateStringUsingRegexs(date, dateRegexs),
      dateFormats,
      parsedBaseDate
    );
  };
}

function CopyToOutput({
  fileName,
  filePath,
  destFolder,
  fileFolder,
  copyIfNotModified,
  report,
  dryRun,
}) {
  const isSameOutputFolder = destFolder === fileFolder;
  return async function () {
    if (!!copyIfNotModified && !isSameOutputFolder) {
      tracer.debug(`${fileName}: Copying to output folder`);
      const newFilePath = await copyFileToFolder(filePath, destFolder, dryRun);
      report.copied(newFilePath);
    }
  };
}

function SetDates({
  fileName,
  filePath,
  setDigitized,
  destFolder,
  report,
  dryRun,
  handleUnresolved,
}) {
  const traceSetDate = TraceSetDate({ fileName, setDigitized });
  return async function (dateOriginal, from) {
    const datesToSet = {
      [HUMAN_DATE_TIME_ORIGINAL_PROPERTY]: dateOriginal,
    };
    // Set also DateTimeDigitized if setDigited option is enabledx
    if (setDigitized) {
      datesToSet[HUMAN_DATE_TIME_DIGITIZED_PROPERTY] = dateOriginal;
    }

    traceSetDate(dateOriginal, from);
    const newFilePath = resolve(destFolder, fileName);

    if (!dryRun) {
      try {
        await moveAndUpdateExifDates(filePath, newFilePath, datesToSet);
        report.modified(newFilePath, datesToSet, from);
      } catch (error) {
        tracer.error(`${newFilePath}: Error writing Exif`, error.message);
        await handleUnresolved();
      }
    }
  };
}

function HandleUnresolved({
  fileName,
  copyToOutput,
  moveToIfUnresolved,
  filePath,
  destFolder,
  report,
  dryRun,
}) {
  return async function () {
    if (!!moveToIfUnresolved) {
      tracer.debug(`${fileName}: Moving to ${moveToIfUnresolved} subfolder`);
      const newFilePath = await moveOrCopyFileToSubfolder(
        filePath,
        destFolder,
        moveToIfUnresolved,
        dryRun
      );
      report.moved(newFilePath);
      return;
    }
    return copyToOutput();
  };
}

function FileIsNotSupported({ filePath }) {
  return async function () {
    if (await isSupportedFile(filePath)) {
      return false;
    }
    tracer.debug(`${filePath}: File type is not supported`);
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
  handleUnresolved,
  filePath,
  copyToOutput,
  fileName,
  modify,
  report,
}) {
  const fileIsNotSupported = FileIsNotSupported({ filePath });
  const dateOriginalHasToBeModified = DateOriginalHasToBeModified({
    copyToOutput,
    fileName,
    modify,
  });
  return async function () {
    if (await fileIsNotSupported(filePath)) {
      await handleUnresolved();
      report.notSupported();
      return;
    }

    const dates = await readExifDates(filePath); // TODO, file is read twice
    report.supported(dates);

    if (!(await dateOriginalHasToBeModified(dates))) {
      return;
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

// TODO, split into two methods. One should calculate what to do and write report. Another should make modifications based on report. So, a confirm prompt can be implemented
async function setDateToFile(
  filePath,
  {
    dateCandidates = [],
    outputFolder,
    date,
    dateFormats,
    dateRegexs,
    baseDate,
    baseDateFromDateCandidates = true,
    baseDateFallback,
    dateFallback,
    modify = false,
    fromDigitized = true,
    fromFileName = true,
    fromDateCandidates = true,
    setDigitized = true,
    copyIfNotModified,
    moveToIfUnresolved,
    dryRun,
  },
  report
) {
  const fileName = getFileName(filePath);
  const fileFolder = dirName(filePath);
  const destFolder = toAbsolute(outputFolder || fileFolder);
  const parsedBaseDate = getParsedBaseDate({
    baseDate,
    dateFormats,
    dateCandidates,
    baseDateFromDateCandidates,
    baseDateFallback,
    dateRegexs,
  });

  const copyToOutput = CopyToOutput({
    fileName,
    filePath,
    destFolder,
    fileFolder,
    copyIfNotModified,
    report,
    dryRun,
  });
  const isDate = IsDate({ dateFormats, parsedBaseDate, dateRegexs });
  const findFirstValidDate = FindFirstValidDate(isDate);
  const formatForExif = FormatForExif({
    dateFormats,
    parsedBaseDate,
    dateRegexs,
  });
  const handleUnresolved = HandleUnresolved({
    fileName,
    copyToOutput,
    moveToIfUnresolved,
    filePath,
    destFolder,
    report,
    dryRun,
  });
  const setDates = SetDates({
    fileName,
    filePath,
    setDigitized,
    destFolder,
    report,
    dryRun,
    handleUnresolved,
  });
  const skipOrGetFileDates = SkipOrGetFileDates({
    handleUnresolved,
    filePath,
    copyToOutput,
    fileName,
    modify,
    report,
  });

  const fileDates = await skipOrGetFileDates();

  if (!fileDates) {
    return;
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
    return setDates(formatDateForExif(dateFallback, dateFormats), "dateFallback option");
  }

  tracer.debug(`${fileName}: No date was found to set`);
  await handleUnresolved();
}

module.exports = {
  setDateToFile,
};
