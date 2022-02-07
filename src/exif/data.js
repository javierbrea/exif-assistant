const deepMerge = require("deepmerge");
const piexif = require("piexifjs");

const HUMAN_DATE_TIME_ORIGINAL_PROPERTY = "DateTimeOriginal";
const HUMAN_DATE_TIME_DIGITIZED_PROPERTY = "DateTimeDigitized";
const THUMBNAIL_PROPERTY = "thumbnail";
const EXIF_PROPERTY = "Exif";
const DATE_TIME_ORIGINAL_PROPERTY = piexif.ExifIFD[HUMAN_DATE_TIME_ORIGINAL_PROPERTY];
const DATE_TIME_DIGITIZED_PROPERTY = piexif.ExifIFD[HUMAN_DATE_TIME_DIGITIZED_PROPERTY];

function isThumbnailProperty(property) {
  return property === THUMBNAIL_PROPERTY;
}

function exifTagFromHumanTag(ifd, humanTag) {
  return Object.keys(piexif.TAGS[ifd]).find((exifTag) => {
    return piexif.TAGS[ifd][exifTag].name === humanTag;
  })
}

function humanTagFromExifTag(ifd, exifTag) {
  return piexif.TAGS[ifd][exifTag].name;
}

function changeFormat(exif, tagConverter) {
  const newExif = {};
  for (const ifd in exif) {
    if (isThumbnailProperty(ifd)) {
      newExif[ifd] = exif[ifd];
    } else {
      for (const tag in exif[ifd]) {
        newExif[ifd] = newExif[ifd] || {};
        newExif[ifd][tagConverter(ifd, tag)] = exif[ifd][tag];
      }
    }
  }
  return newExif;
}

function formatExifToHuman(exif) {
  return changeFormat(exif, humanTagFromExifTag);
}

function formatHumanToExif(exif) {
  return changeFormat(exif, exifTagFromHumanTag);
}

function getExifChildrenProperty(exif, property) {
  return exif[EXIF_PROPERTY][property];
}

function toExifChildrenProperty(properties) {
  return {
    [EXIF_PROPERTY]: properties,
  };
}

function getDateTimeOriginal(exif) {
  return getExifChildrenProperty(exif, DATE_TIME_ORIGINAL_PROPERTY);
}

function getDateTimeDigited(exif) {
  return getExifChildrenProperty(exif, DATE_TIME_DIGITIZED_PROPERTY);
}

function updateExif(exif, modifiedProperties) {
  return deepMerge(exif, modifiedProperties);
}

function getDates(exif) {
  return {
    [HUMAN_DATE_TIME_ORIGINAL_PROPERTY]: getDateTimeOriginal(exif),
    [HUMAN_DATE_TIME_DIGITIZED_PROPERTY]: getDateTimeDigited(exif),
  };
}

module.exports = {
  updateExif,
  getDateTimeOriginal,
  formatExifToHuman,
  formatHumanToExif,
  getDates,
  toExifChildrenProperty,
  HUMAN_DATE_TIME_ORIGINAL_PROPERTY,
  HUMAN_DATE_TIME_DIGITIZED_PROPERTY,
};
