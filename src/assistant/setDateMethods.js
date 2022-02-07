const { Tracer } = require("../support/tracer");
const { isValidDate, dateFromString } = require("../support/dates");
const {
  findFolderFiles,
  getFolderName,
  changeFileBasePath,
  isFile,
  isFolder,
  exists,
} = require("../support/files");
const { setDateToFile } = require("./setDateToFile");

const setDatesTracer = new Tracer("Set Dates");

function validateInputPath(pathToValidate, isOfType, expectedType) {
  if (!!pathToValidate) {
    if (!exists(pathToValidate)) {
      throw new Error(`input ${expectedType} does not exist`);
    }
    if (!isOfType(pathToValidate)) {
      throw new Error(`input ${expectedType} must be a ${expectedType}`);
    }
  }
}

function validatePaths({ inputFolder, inputFile }) {
  validateInputPath(inputFolder, isFolder, "folder");
  validateInputPath(inputFile, isFile, "file");
}

function validateDates({
  date,
  dateFormat,
  dateFallback,
  dateFallbackFormat,
  baseDate,
  baseDateFormat,
}) {
  let parsedBaseDate;
  if (!!baseDate) {
    if (!isValidDate(baseDate, baseDateFormat)) {
      throw new Error(
        "baseDate must be a valid date. Please check baseDate and baseDateFormat options"
      );
    }
    parsedBaseDate = dateFromString(baseDate, baseDateFormat);
  }
  if (!!dateFallback && !isValidDate(dateFallback, dateFallbackFormat, parsedBaseDate)) {
    throw new Error(
      "dateFallback must be a valid date. Please check dateFallback and dateFallbackFormat options"
    );
  }
  if (!!date && !isValidDate(date, dateFormat, parsedBaseDate)) {
    throw new Error("date must be a valid date. Please check date and dateFormat options");
  }
}

function validateOptions({
  inputFolder,
  inputFile,
  outputFolder,
  date,
  dateFormat,
  dateFallback,
  dateFallbackFormat,
  baseDate,
  baseDateFormat,
}) {
  validatePaths({ inputFolder, inputFile, outputFolder });
  validateDates({ date, dateFormat, dateFallback, dateFallbackFormat, baseDate, baseDateFormat });
}

function SetDateToFileUnderFolder(options, inputFolder) {
  return function (filePath) {
    const fileOptions = {
      ...options,
      dateCandidates: [getFolderName(filePath)],
      fromDateCandidates: options.fromFolderNames,
      baseDateFromDateCandidates: options.baseDatefromFolderNames,
      moveToIfUnresolved: options.moveUnresolvedTo,
      copyIfNotModified: options.copyAll,
      outputFolder: changeFileBasePath(filePath, inputFolder, options.outputFolder),
    };
    setDatesTracer.silly(`Calling to setDate for ${filePath} with options:`, fileOptions);
    return setDateToFile(filePath, fileOptions);
  };
}

function setDateToFiles(files, options, inputFolder) {
  const setDateToFileUnderFolder = SetDateToFileUnderFolder(options, inputFolder);
  return Promise.all(files.map(setDateToFileUnderFolder));
}

function setDates(inputFolder, options = {}) {
  validateOptions({ inputFolder, ...options });
  setDatesTracer.info(`Searching files in folder ${inputFolder}`);
  const files = findFolderFiles(inputFolder);
  setDatesTracer.info(`Files found:`, files.length);
  setDatesTracer.debug(`Files found list:`, files);
  return setDateToFiles(files, options, inputFolder);
}

function setDate(inputFile, options = {}) {
  validateOptions({ inputFile, ...options });
  return setDateToFile(inputFile, options);
}

module.exports = {
  setDates,
  setDate,
};
