const path = require("path");
const fsExtra = require("fs-extra");
const fs = require("fs");
const globule = require("globule");

const { compactArray } = require("./utils");

function dirName(filePath) {
  return path.dirname(filePath);
}

function baseName(filePath) {
  return path.basename(filePath);
}

function resolve(basePath, relativePath) {
  return path.resolve(basePath, relativePath);
}

function filePathChangingFolder(filePath, destFolder) {
  const fileName = baseName(filePath);
  return resolve(destFolder, fileName);
}

async function copyFile(fileOrigin, fileDest) {
  await fsExtra.copy(fileOrigin, fileDest);
}

async function moveFile(fileOrigin, fileDest) {
  await fsExtra.move(fileOrigin, fileDest, { overwrite: true });
}

async function moveFileToFolder(filePath, destFolder, dryRun) {
  const destPath = filePathChangingFolder(filePath, destFolder);
  if (!dryRun) {
    await moveFile(filePath, destPath);
  }
  return destPath;
}

async function copyFileToFolder(filePath, destFolder, dryRun) {
  const destPath = filePathChangingFolder(filePath, destFolder);
  if (!dryRun) {
    await copyFile(filePath, destPath);
  }
  return destPath;
}

async function moveOrCopyFileToSubfolder(filePath, outputFolder, subfolder, dryRun) {
  const fileFolder = dirName(filePath);
  const newFolder = resolve(outputFolder, subfolder);
  if (fileFolder === outputFolder) {
    return moveFileToFolder(filePath, newFolder, dryRun);
  }
  return copyFileToFolder(filePath, newFolder, dryRun);
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

function getFileName(filePath) {
  return baseName(filePath);
}

function changeFileBasePath(filePath, basePath, newBasePath) {
  if (!newBasePath) {
    return dirName(filePath);
  }
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

function getFolderNamesFromBase(filePath, basePath) {
  const folderNames = compactArray(filePath.replace(basePath, "").split(path.sep));
  folderNames.splice(-1);
  folderNames.unshift(baseName(basePath));
  return folderNames;
}

function toRelative(filePath) {
  return path.relative(process.cwd(), filePath);
}

module.exports = {
  PATH_SEP: path.sep,
  exists,
  isFolder,
  isFile,
  moveFileToFolder,
  copyFileToFolder,
  moveOrCopyFileToSubfolder,
  removeExtension,
  toAbsolute,
  findFolderFiles,
  getFileName,
  changeFileBasePath,
  dirName,
  readFile,
  writeFile,
  ensureDir,
  resolve,
  getFolderNamesFromBase,
  toRelative,
};
