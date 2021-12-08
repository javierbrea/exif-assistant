const sharp = require("sharp");
const exifReader = require("exif-reader");

function readMetadaDataFromFile(filePath) {
  return sharp(filePath).metadata();
}

async function readExifFromFile(filePath) {
  const metadata = await readMetadaDataFromFile(filePath);
  return exifReader(metadata.exif);
}

module.exports = {
  readExifFromFile,
};
