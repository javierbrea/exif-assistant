const path = require("path");

const fsExtra = require("fs-extra");

const data = require("../assets/metadata.json");

const ASSETS_PATH = path.resolve(__dirname, "..", "assets");
const TEMP_PATH = path.resolve(ASSETS_PATH, ".tmp");

function assetPath(fileName) {
  return path.resolve(ASSETS_PATH, fileName);
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

function tempPath(fileName) {
  return path.resolve(TEMP_PATH, fileName);
}

module.exports = {
  assetData,
  tempPath,
  resetTempPath,
};