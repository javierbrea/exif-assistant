const { Tracer } = require("../support/tracer");
const { isValidDate, dateFromString } = require("../support/dates");
const {
  findFolderFiles,
  getFolderName,
  fileOutputFolderChangingBasePath,
  toAbsolute,
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
  fallbackDate,
  fallbackDateFormat,
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
  if (!!fallbackDate && !isValidDate(fallbackDate, fallbackDateFormat, parsedBaseDate)) {
    throw new Error(
      "fallbackDate must be a valid date. Please check fallbackDate and fallbackDateFormat options"
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
  fallbackDate,
  fallbackDateFormat,
  baseDate,
  baseDateFormat,
}) {
  validatePaths({ inputFolder, inputFile, outputFolder });
  validateDates({ date, dateFormat, fallbackDate, fallbackDateFormat, baseDate, baseDateFormat });
}

function SetDateToFileInSubfolder(options, inputFolder) {
  return function (filePath) {
    const newBasePath = options.outputFolder ? toAbsolute(options.outputFolder) : inputFolder;
    const fileOptions = {
      ...options,
      dateCandidates: [getFolderName(filePath)],
      fromDateCandidates: options.fromFolderNames,
      moveToIfUnresolved: options.moveUnresolvedTo,
      copyIfNotModified: options.copyAll,
      outputFolder: fileOutputFolderChangingBasePath(filePath, inputFolder, newBasePath),
    };
    setDatesTracer.silly(`Calling to setDate for ${filePath} with options:`, fileOptions);
    return setDateToFile(filePath, fileOptions);
  };
}

function setDateToFiles(files, options, folderPath) {
  const setDateToFileInSubfolder = SetDateToFileInSubfolder(options, folderPath);
  return Promise.all(files.map(setDateToFileInSubfolder));
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
  // TODO, set outputFolder to same file folder if option is not received. Delegate to SetFileDate method
  validateOptions({ inputFile, ...options });
  return setDateToFile(inputFile, options);
}

module.exports = {
  setDates,
  setDate,
};
