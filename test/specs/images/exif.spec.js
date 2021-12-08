const deepMerge = require("deepmerge");

const { readExifData, updateExifData } = require("../../../src/images/exif");
const { setLevel } = require("../../../src/support/tracer");

const {
  assetData,
  resetTempPath,
  tempPath,
  fileSize,
  getImageDataAndInfo,
} = require("../../support/assets");
const { readExifFromFile } = require("../../support/exif");
const { isApproximatelyEqual } = require("../../support/math");

setLevel("silent");

describe("Exif", () => {
  beforeAll(async () => {
    await resetTempPath();
  });

  describe("readExifData method", () => {
    function testAsset(asset) {
      it(`should return date of asset "${asset}"`, async () => {
        const { metadata, path } = assetData(asset);
        const { date } = await readExifData(path);
        expect(date).toEqual(metadata.date);
      });
    }

    testAsset("sphinx.jpg");
  });

  describe("updateExifData method", () => {
    function testAsset(asset) {
      const newPath = tempPath(asset);
      const { path: oldPath } = assetData(asset);
      const date = "2022:05:15 01:02:34";

      it(`should update date of asset "${asset}"`, async () => {
        await updateExifData(oldPath, newPath, { date });
        const { date: dateFromImage } = await readExifData(newPath);
        expect(dateFromImage).toEqual(date);
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

      it("should keep image data equal", () => {
        expect(getImageDataAndInfo(oldPath)).toEqual(getImageDataAndInfo(newPath));
      });
    }

    testAsset("sphinx.jpg");
    testAsset("caryatids.jpeg");
  });
});
