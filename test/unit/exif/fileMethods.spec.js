const deepMerge = require("deepmerge");

const {
  assetData,
  resetTempPath,
  tempPath,
  fileSize,
  getImageDataAndInfo,
} = require("../../support/assets");
const { readExifFromFile } = require("../../support/exif");
const { isApproximatelyEqual } = require("../../support/math");

const { readExifDates, moveAndUpdateExifDates } = require("../../../src/exif");

const { setLevel } = require("../../../src/support/tracer");

setLevel("silent");

describe("Exif", () => {
  beforeAll(async () => {
    await resetTempPath();
  });

  describe("readExifDates method", () => {
    function testAsset(asset) {
      it(`should return dates of asset "${asset}"`, async () => {
        const { metadata, path } = assetData(asset);
        const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(path);
        expect(DateTimeOriginal).toEqual(metadata.DateTimeOriginal);
        expect(DateTimeDigitized).toEqual(metadata.DateTimeDigitized);
      });
    }

    testAsset("sphinx.jpg");
  });

  describe("moveAndUpdateExifExifProperties method", () => {
    function testAsset(asset) {
      const newPath = tempPath(asset);
      const { path: oldPath } = assetData(asset);
      const newDateTimeOriginal = "2022:05:15 01:02:34";

      it(`should update date of asset "${asset}"`, async () => {
        await moveAndUpdateExifDates(oldPath, newPath, { DateTimeOriginal: newDateTimeOriginal });
        const { DateTimeOriginal } = await readExifDates(newPath);
        expect(DateTimeOriginal).toEqual(newDateTimeOriginal);
      });

      it("should keep all other exif properties", async () => {
        const modifiedProps = {
          exif: {
            36880: null, // Time zones are not copied
            36881: null, // Time zones are not copied
            36882: null, // Time zones are not copied
            DateTimeOriginal: null, // Set modified properties to null in both sides
          },
          image: {
            ExifOffset: null, // ExifOffset is modified
          },
        };
        expect(deepMerge(await readExifFromFile(oldPath), modifiedProps)).toEqual(
          deepMerge(await readExifFromFile(newPath), modifiedProps)
        );
      });

      it("should keep file size", () => {
        expect(isApproximatelyEqual(fileSize(oldPath), fileSize(newPath))).toBe(true);
      });

      it("should keep image data equal", async () => {
        expect(await getImageDataAndInfo(oldPath)).toEqual(await getImageDataAndInfo(newPath));
      });
    }

    testAsset("sphinx.jpg");
    testAsset("caryatids.jpeg");
  });
});
