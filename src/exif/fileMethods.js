const piexif = require("piexifjs");

const {
  formatExifToHuman,
  formatHumanToExif,
  updateExif,
  getDates,
  toExifChildrenProperty,
} = require("./data");
const { Tracer } = require("../support/tracer");
const { dirName, readFile, ensureDir, writeFile } = require("../support/files");

const BINARY_FORMAT = "binary";

const tracer = new Tracer("Exif");

async function getBase64DataFromFile(filePath) {
  const fileData = await readFile(filePath);
  return fileData.toString(BINARY_FORMAT);
}

async function readExifFromFile(filePath) {
  return piexif.load(await getBase64DataFromFile(filePath));
}

async function moveAndWriteExif(filePath, newFilePath, exif) {
  const exifBinary = piexif.dump(exif);
  const newImageData = piexif.insert(exifBinary, await getBase64DataFromFile(filePath));
  const fileBuffer = Buffer.from(newImageData, BINARY_FORMAT);
  await ensureDir(dirName(newFilePath));
  return writeFile(newFilePath, fileBuffer);
}

async function readExifDates(filePath) {
  tracer.debug(`Reading exif data file ${filePath}`);
  const exif = await readExifFromFile(filePath);
  tracer.silly(`Exif data`, formatExifToHuman(exif));
  return getDates(exif);
}

async function moveAndUpdateExifData(filePath, newFilePath, humanPropertiesToModify) {
  tracer.debug(
    `Moving file ${filePath} to ${newFilePath} and updating data`,
    humanPropertiesToModify
  );
  const exif = await readExifFromFile(filePath);
  tracer.silly(`Exif data from original file`, formatExifToHuman(exif));
  const newExif = updateExif(exif, formatHumanToExif(humanPropertiesToModify));
  tracer.silly(`New exif data`, formatExifToHuman(newExif));
  return moveAndWriteExif(filePath, newFilePath, newExif);
}

async function moveAndUpdateExifExifProperties(filePath, newFilePath, propertiesToModify) {
  return moveAndUpdateExifData(filePath, newFilePath, toExifChildrenProperty(propertiesToModify));
}

async function moveAndUpdateExifDates(filePath, newFilePath, datesToModify) {
  return moveAndUpdateExifExifProperties(filePath, newFilePath, datesToModify);
}

async function isSupportedFile(filePath) {
  try {
    await readExifFromFile(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  readExifDates,
  moveAndUpdateExifData,
  moveAndUpdateExifDates,
  isSupportedFile,
};
