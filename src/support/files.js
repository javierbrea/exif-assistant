const path = require("path");
const fsExtra = require("fs-extra");
const fs = require("fs");
const globule = require("globule");

function dirName(filePath) {
  return path.dirname(filePath);
}

function baseName(filePath) {
  return path.basename(filePath);
}

function resolve(basePath, relativePath) {
  return path.resolve(basePath, relativePath);
}

async function moveFileToFolder(filePath, destFolder) {
  const fileName = baseName(filePath);
  return fsExtra.move(filePath, resolve(destFolder, fileName), { overwrite: true });
}

async function copyFileToFolder(filePath, destFolder) {
  const fileName = baseName(filePath);
  return fsExtra.copy(filePath, resolve(destFolder, fileName));
}

async function moveOrCopyFileToSubfolder(filePath, outputFolder, subfolder) {
  const fileFolder = dirName(filePath);
  if (fileFolder === outputFolder) {
    return moveFileToFolder(filePath, resolve(outputFolder, subfolder));
  }
  return copyFileToFolder(filePath, resolve(outputFolder, subfolder));
}

function removeExtension(fileName) {
  return fileName.split(".")[0];
}

function toAbsolute(filePath) {
  return resolve(process.cwd(), filePath);
}

function exists(filePath) {
  return fsExtra.existsSync(filePath);
}

function isFolder(folderPath) {
  return fs.lstatSync(folderPath).isDirectory();
}

function isFile(filePath) {
  return fs.lstatSync(filePath).isFile();
}

function findFolderFiles(folderPath) {
  return globule
    .find("**/*", {
      srcBase: folderPath,
      prefixBase: true,
    })
    .map(path.normalize)
    .filter(isFile);
}

function getFolderName(filePath) {
  return baseName(dirName(filePath));
}

function getFileName(filePath) {
  return baseName(filePath);
}

function fileOutputFolderChangingBasePath(filePath, basePath, newBasePath) {
  const relativePath = path.relative(basePath, filePath);
  return dirName(resolve(newBasePath, relativePath));
}

function readFile(filePath) {
  return fsExtra.readFile(filePath);
}

function writeFile(filePath, fileContent) {
  return fsExtra.writeFile(filePath, fileContent);
}

function ensureDir(dirPath) {
  return fsExtra.ensureDir(dirPath);
}

module.exports = {
  exists,
  isFolder,
  isFile,
  moveFileToFolder,
  copyFileToFolder,
  moveOrCopyFileToSubfolder,
  removeExtension,
  toAbsolute,
  findFolderFiles,
  getFolderName,
  getFileName,
  fileOutputFolderChangingBasePath,
  dirName,
  readFile,
  writeFile,
  ensureDir,
  resolve,
};
