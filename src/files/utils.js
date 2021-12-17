const path = require("path");
const fsExtra = require("fs-extra");

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

module.exports = {
  moveFileToFolder,
  copyFileToFolder,
  moveOrCopyFileToSubfolder,
  removeExtension,
};
