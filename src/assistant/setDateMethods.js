const { SetDatesReport } = require("../reports");

const { Tracer } = require("../support/tracer");
const { isValidDate, dateFromString } = require("../support/dates");
const {
  findFolderFiles,
  getFolderNamesFromBase,
  changeFileBasePath,
  isFile,
  isFolder,
  exists,
  resolve,
  toAbsolute,
  getFileName,
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

function validateDates({ date, dateFormats, dateFallback, baseDate }) {
  let parsedBaseDate;
  if (!!baseDate) {
    if (!isValidDate(baseDate, dateFormats)) {
      throw new Error(
        "baseDate must be a valid date. Please check baseDate and dateFormats options"
      );
    }
    parsedBaseDate = dateFromString(baseDate, dateFormats);
  }
  if (!!dateFallback && !isValidDate(dateFallback, dateFormats, parsedBaseDate)) {
    throw new Error(
      "dateFallback must be a valid date. Please check dateFallback and dateFormats options"
    );
  }
  if (!!date && !isValidDate(date, dateFormats, parsedBaseDate)) {
    throw new Error("date must be a valid date. Please check date and dateFormats options");
  }
}

function validateOptions({
  inputFolder,
  inputFile,
  outputFolder,
  date,
  dateFormats,
  dateFallback,
  dateFallbackFormat,
  baseDate,
  baseDateFormat,
}) {
  validatePaths({ inputFolder, inputFile, outputFolder });
  validateDates({ date, dateFormats, dateFallback, dateFallbackFormat, baseDate, baseDateFormat });
}

function SetDateToFileUnderFolder(options, inputFolder, setDatesReport) {
  return function (filePath) {
    const fileOptions = {
      ...options,
      dateCandidates: getFolderNamesFromBase(filePath, inputFolder).reverse(),
      fromDateCandidates: options.fromFolderNames,
      baseDateFromDateCandidates: options.baseDatefromFolderNames,
      moveToIfUnresolved: options.moveUnresolvedTo,
      copyIfNotModified: options.copyAll,
      outputFolder: changeFileBasePath(filePath, inputFolder, options.outputFolder),
    };
    setDatesTracer.silly(`Calling to setDate for ${filePath} with options:`, fileOptions);
    return setDateToFile(filePath, fileOptions, setDatesReport.newFile(filePath));
  };
}

function setDateToFiles(files, options, inputFolder, setDatesReport) {
  const setDateToFileUnderFolder = SetDateToFileUnderFolder(options, inputFolder, setDatesReport);
  return Promise.all(files.map(setDateToFileUnderFolder));
}

async function setDates(inputFolder, options = {}) {
  const setDatesReport = new SetDatesReport({
    input: inputFolder,
    output: options.outputFolder || inputFolder,
  });
  validateOptions({ inputFolder, ...options });
  setDatesTracer.debug(`Searching files in folder ${inputFolder}`);
  const files = findFolderFiles(inputFolder);
  setDatesTracer.debug(`Files found:`, files.length);
  setDatesTracer.silly(`Files found list:`, files);
  await setDateToFiles(files, options, inputFolder, setDatesReport);
  setDatesReport.getDataAndPrint();
  return setDatesReport.getSummaryAndPrint();
}

async function setDate(inputFile, options = {}) {
  validateOptions({ inputFile, ...options });
  const setDatesReport = new SetDatesReport({
    input: inputFile,
    output: options.outputFolder
      ? resolve(toAbsolute(options.outputFolder), getFileName(inputFile))
      : inputFile,
  });
  await setDateToFile(inputFile, options, setDatesReport.newFile(inputFile));
  setDatesReport.getDataAndPrint();
  return setDatesReport.getSummaryAndPrint();
}

module.exports = {
  setDates,
  setDate,
};
