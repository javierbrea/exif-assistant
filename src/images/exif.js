const fs = require("fs");
const deepMerge = require("deepmerge");
const piexif = require("piexifjs");

const { Tracer } = require("../support/tracer");

const tracer = new Tracer("Exif");

const EXIF_PROPERTY = "Exif";
const DATE_PROPERTY = piexif.ExifIFD.DateTimeOriginal;

function getBase64DataFromJpegFile(filePath) {
  return fs.readFileSync(filePath).toString("binary");
}

function transformExif(exif) {
  const newExif = {};
  for (const ifd in exif) {
    if (ifd == "thumbnail") {
      newExif[ifd] = exif[ifd];
    } else {
      for (const tag in exif[ifd]) {
        newExif[ifd] = newExif[ifd] || {};
        newExif[ifd][piexif.TAGS[ifd][tag]["name"]] = exif[ifd][tag];
      }
    }
  }
  return newExif;
}

async function readExifFromFile(filePath) {
  return piexif.load(getBase64DataFromJpegFile(filePath));
}

function writeExifToNewFile(filePath, newFilePath, exif) {
  const exifBinary = piexif.dump(exif);
  const newImageData = piexif.insert(exifBinary, getBase64DataFromJpegFile(filePath));
  const fileBuffer = Buffer.from(newImageData, "binary");
  fs.writeFileSync(newFilePath, fileBuffer);
}

function getDate(exif) {
  return exif[EXIF_PROPERTY][DATE_PROPERTY];
}

function dateToExif(date) {
  return {
    [EXIF_PROPERTY]: {
      [DATE_PROPERTY]: date,
    },
  };
}

function updateExif(exif, { date }) {
  return deepMerge(exif, dateToExif(date));
}

async function readExifData(filePath) {
  tracer.debug(`Reading exif data file ${filePath}`);
  const exif = await readExifFromFile(filePath);
  tracer.silly(`Exif data`, transformExif(exif));
  return {
    date: getDate(exif),
  };
}

async function updateExifData(filePath, newFilePath, { date }) {
  tracer.debug(`Updating exif data of file ${filePath} into ${newFilePath}`);
  const exif = await readExifFromFile(filePath);
  tracer.silly(`Exif data from original file`, transformExif(exif));
  const newExif = updateExif(exif, { date });
  tracer.silly(`New exif data`, transformExif(newExif));
  writeExifToNewFile(filePath, newFilePath, newExif);
}

module.exports = {
  readExifData,
  updateExifData,
};
