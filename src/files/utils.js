const path = require("path");
const fsExtra = require("fs-extra");
const globule = require("globule");

async function moveFileToFolder(filePath, destFolder) {
  const fileName = path.basename(filePath);
  return fsExtra.move(filePath, path.resolve(destFolder, fileName), { overwrite: true });
}

async function copyFileToFolder(filePath, destFolder) {
  const fileName = path.basename(filePath);
  return fsExtra.copy(filePath, path.resolve(destFolder, fileName));
}

async function moveOrCopyFileToSubfolder(filePath, outputFolder, subfolder) {
  const fileFolder = path.dirname(filePath);
  if (fileFolder === outputFolder) {
    return moveFileToFolder(filePath, path.resolve(outputFolder, subfolder));
  }
  return copyFileToFolder(filePath, path.resolve(outputFolder, subfolder));
}

function removeExtension(fileName) {
  return fileName.split(".")[0];
}

function toAbsolute(filePath) {
  return path.resolve(process.cwd(), filePath);
}

function findFolderFiles(folderPath) {
  return globule.find("**/*", {
    srcBase: folderPath,
    prefixBase: true,
  });
}

function getFolderName(filePath) {
  return path.basename(path.dirname(filePath));
}

function fileOutputFolderChangingBasePath(filePath, basePath, newBasePath) {
  const relativePath = path.relative(basePath, filePath);
  return path.dirname(path.resolve(newBasePath, relativePath));
}

module.exports = {
  moveFileToFolder,
  copyFileToFolder,
  moveOrCopyFileToSubfolder,
  removeExtension,
  toAbsolute,
  findFolderFiles,
  getFolderName,
  fileOutputFolderChangingBasePath,
};
