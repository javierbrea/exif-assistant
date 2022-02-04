var fs = require("fs");
const path = require("path");
const fsExtra = require("fs-extra");

const sharp = require("sharp");

const data = require("../assets/metadata.json");

const ASSETS_PATH = path.resolve(__dirname, "..", "assets");
const TEMP_PATH = path.resolve(ASSETS_PATH, ".tmp");

function addJPGExtension(fileName) {
  return `${fileName}.jpg`;
}

function assetPath() {
  return path.resolve.apply(null, [ASSETS_PATH, ...arguments]);
}

function assetMetaData(fileName) {
  return data[fileName];
}

function assetData(fileName) {
  return {
    path: assetPath(fileName),
    metadata: assetMetaData(fileName),
  };
}

async function resetTempPath() {
  await fsExtra.remove(TEMP_PATH);
  return fsExtra.ensureDir(TEMP_PATH);
}

function tempPath() {
  return path.resolve.apply(null, [TEMP_PATH, ...arguments]);
}

function fileSize(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size;
}

function getImageDataAndInfo(filePath) {
  return sharp(filePath).toBuffer({ resolveWithObject: true });
}

function copyAssetToTempPath(fileName, newName) {
  return fsExtra.copy(assetPath(fileName), tempPath(newName || fileName));
}

function copyAssetsToTempPath(fileNames) {
  return Promise.all(
    fileNames.map((fileName) => {
      if (Array.isArray(fileName)) {
        return copyAssetToTempPath(fileName[0], fileName[1]);
      }
      return copyAssetToTempPath(fileName);
    })
  );
}

function fixturesFolder(fixtureName) {
  return path.join("fixtures", fixtureName);
}

function copyFixturesToTempPath(fixtureName) {
  return copyAssetToTempPath(fixturesFolder(fixtureName), tempPath(fixtureName));
}

function tempFixturesFolder(fixtureName) {
  return tempPath(fixtureName);
}

const UNRESOLVED_FOLDER = "unresolved";
const TEMP_OUTPUT_FOLDER = tempPath("output");

function tempOutputPath() {
  return path.resolve.apply(null, [TEMP_PATH, TEMP_OUTPUT_FOLDER, ...arguments]);
}

function tempUnresolvedPath() {
  return path.resolve.apply(null, [TEMP_PATH, UNRESOLVED_FOLDER, ...arguments]);
}

module.exports = {
  TEMP_PATH,
  assetPath,
  assetData,
  tempPath,
  resetTempPath,
  fileSize,
  getImageDataAndInfo,
  copyAssetToTempPath,
  copyAssetsToTempPath,
  addJPGExtension,
  fixturesFolder,
  copyFixturesToTempPath,
  tempFixturesFolder,
  tempOutputPath,
  tempUnresolvedPath,
  UNRESOLVED_FOLDER,
  TEMP_OUTPUT_FOLDER,
};
