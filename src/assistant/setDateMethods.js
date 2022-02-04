const { Tracer } = require("../support/tracer");
const {
  findFolderFiles,
  getFolderName,
  fileOutputFolderChangingBasePath,
  toAbsolute,
} = require("../support/files");
const { setDate } = require("./setDate");

const setDatesTracer = new Tracer("Set Dates");

function SetDateToFileInSubfolder(options, inputFolder) {
  return function (filePath) {
    const newBasePath = options.outputFolder ? toAbsolute(options.outputFolder) : inputFolder;
    const fileOptions = {
      ...options,
      parentDateCandidates: [getFolderName(filePath)],
      fromParentDates: options.fromFolders,
      outputFolder: fileOutputFolderChangingBasePath(filePath, inputFolder, newBasePath),
    };
    setDatesTracer.silly(`Calling to setDate for ${filePath} with options:`, fileOptions);
    return setDate(filePath, fileOptions);
  };
}

function setDateToFiles(files, options, folderPath) {
  // TODO, validate options here
  const setDateToFileInSubfolder = SetDateToFileInSubfolder(options, folderPath);
  return Promise.all(files.map(setDateToFileInSubfolder));
}

function setDates(inputFolder, options = {}) {
  setDatesTracer.info(`Searching files in folder ${inputFolder}`);
  const files = findFolderFiles(inputFolder);
  setDatesTracer.info(`Files found:`, files.length);
  setDatesTracer.debug(`Files found list:`, files);
  return setDateToFiles(files, options, inputFolder);
}

module.exports = {
  setDates,
};
