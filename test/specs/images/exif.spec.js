const { readExifData, updateExifData } = require("../../../src/images/exif");
const { assetData, resetTempPath, tempPath } = require("../../support/assets");

describe("Exif", () => {
  beforeAll(async () => {
    await resetTempPath();
  });

  describe("readExifData method", () => {
    function testAsset(asset) {
      it(`should return date of asset "${asset}"`, async () => {
        const { metadata, path } = assetData(asset);
        const { date } = await readExifData(path);
        expect(date).toEqual(new Date(metadata.date));
      });
    }

    testAsset("sphinx.jpg");
  });

  describe("updateExifData method", () => {
    function testAsset(asset) {
      it(`should update date of asset "${asset}"`, async () => {
        const { path } = assetData(asset);
        const date = new Date();
        const newPath = tempPath(asset);
        await updateExifData(path, newPath, { date });
        const { date: dateFromImage } = await readExifData(newPath);
        expect(dateFromImage).toEqual(date);
      });

      // TODO, check that image has not lost quality, compare it with the original
    }

    testAsset("sphinx.jpg");
  });
});
