const { readExifData, updateExifData } = require("../../../src/images/exif");
const { assetData, resetTempPath, tempPath } = require("../../support/assets");
const { setLevel } = require("../../../src/support/tracer");

setLevel("silly");

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
      it(`should update date of asset "${asset}"`, async () => {
        const { path } = assetData(asset);
        const date = "2022:05:15 01:02:34";
        const newPath = tempPath(asset);
        await updateExifData(path, newPath, { date });
        const { date: dateFromImage } = await readExifData(newPath);
        expect(dateFromImage).toEqual(date);
      });

      // TODO, check that the exif data is equal except the data modified
      // TODO, check that image has not lost quality, compare it with the original
    }

    testAsset("sphinx.jpg");
  });
});
