const sharp = require("sharp");
const exifReader = require("exif-reader");

const { Tracer } = require("../support/tracer");

const tracer = new Tracer("Exif");

const DATE_PROPERTY = "DateTimeOriginal";

function readMetadaData(filePath) {
  return sharp(filePath).metadata();
}

async function readExif(filePath) {
  const metadata = await readMetadaData(filePath);
  return exifReader(metadata.exif);
}

function getDate(exif) {
  return exif.exif[DATE_PROPERTY];
}

async function readExifData(filePath) {
  tracer.debug(`Reading exif data file ${filePath}`);
  const exif = await readExif(filePath);
  return {
    date: getDate(exif),
  };
}

async function updateExifData(filePath, newFilePath, { date }) {
  return sharp(filePath)
    .withMetadata({
      exif: {
        [DATE_PROPERTY]: date,
      },
    })
    .toFile(newFilePath);
}

module.exports = {
  readExifData,
  updateExifData,
};
