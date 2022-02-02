const { Tracer } = require("../support/tracer");
const {
  findFolderFiles,
  getFolderName,
  fileOutputFolderChangingBasePath,
  toAbsolute,
} = require("../support/files");
const { setDate } = require("./dates");

const setDatesTracer = new Tracer("Set Dates");

function SetDateToFile(options, inputFolder) {
  return function (filePath) {
    const newBasePath = options.outputFolder ? toAbsolute(options.outputFolder) : inputFolder;
    const fileOptions = {
      ...options,
      folderName: getFolderName(filePath),
      outputFolder: fileOutputFolderChangingBasePath(filePath, inputFolder, newBasePath),
    };
    setDatesTracer.silly(`Calling to setDate for ${filePath} with options:`, fileOptions);
    return setDate(filePath, fileOptions);
  };
}

function setDateToFiles(files, options, folderPath) {
  const setDateToFile = SetDateToFile(options, folderPath);
  return Promise.all(files.map(setDateToFile));
}

function setDatesInFolder(inputFolder, options = {}) {
  setDatesTracer.info(`Searching files in folder ${inputFolder}`);
  const files = findFolderFiles(inputFolder);
  setDatesTracer.info(`Files found:`, files.length);
  setDatesTracer.debug(`Files found list:`, files);
  return setDateToFiles(files, options, inputFolder);
}

module.exports = {
  setDatesInFolder,
};
