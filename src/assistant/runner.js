const { Tracer } = require("../support/tracer");
const {
  findFolderFiles,
  getFolderName,
  fileOutputFolderChangingBasePath,
  toAbsolute,
} = require("../files/utils");
const { setDate } = require("./dates");

const tracer = new Tracer("Runner");

function SetDateToFile(options, inputFolder) {
  return function (filePath) {
    const newBasePath = options.outputFolder ? toAbsolute(options.outputFolder) : inputFolder;
    const fileOptions = {
      ...options,
      folderName: getFolderName(filePath),
      outputFolder: fileOutputFolderChangingBasePath(filePath, inputFolder, newBasePath),
      isOverwrite: newBasePath !== inputFolder,
    };
    tracer.silly(`Calling to setDate for ${filePath} with options:`, fileOptions);
    return setDate(filePath, fileOptions);
  };
}

function setDateToFiles(files, options, folderPath) {
  const setDateToFile = SetDateToFile(options, folderPath);
  return Promise.all(files.map(setDateToFile));
}

function setDatesInFolder(inputFolder, options) {
  tracer.info(`Searching files in folder ${inputFolder}`);
  const files = findFolderFiles(inputFolder);
  tracer.debug(`Files found:`, files);
  return setDateToFiles(files, options, inputFolder);
}

module.exports = {
  setDatesInFolder,
};
