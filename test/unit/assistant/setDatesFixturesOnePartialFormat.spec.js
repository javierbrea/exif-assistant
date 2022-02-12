const path = require("path");

const { setDates } = require("../../../src/assistant/setDateMethods");

const {
  resetTempPath,
  TEMP_OUTPUT_FOLDER,
  tempOutputPath,
  copyFixturesToTempPath,
  tempFixturesFolder,
} = require("../../support/assets");
const { readExifDates } = require("../../../src/exif/fileMethods");

const FIXTURE = "one-partial-format";

describe(`setDates executed in ${FIXTURE} fixtures`, () => {
  beforeAll(async () => {
    await resetTempPath();
  });

  describe("when modify option is true, fromDigited is false and partial format and baseDate are provided", () => {
    let result;

    beforeAll(async () => {
      await resetTempPath();
      await copyFixturesToTempPath(FIXTURE);
      result = await setDates(tempFixturesFolder(FIXTURE), {
        copyAll: true,
        outputFolder: TEMP_OUTPUT_FOLDER,
        fromDigitized: false,
        modify: true,
        dateFormats: ["dd_MM", "yyyy"],
        baseDate: "2022",
      });
    });

    it("should have set date from file name to image with date in root folder", async () => {
      const { DateTimeOriginal } = await readExifDates(tempOutputPath("25_09.jpg"));
      expect(DateTimeOriginal).toEqual(`2022:09:25 00:00:00`);
    });

    it("should have set date from file name to image with date in subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(tempOutputPath("subfolder", "01_09.jpeg"));
      expect(DateTimeOriginal).toEqual(`2022:09:01 00:00:00`);
    });

    it("should have set date from file name to image with date in sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("subfolder", "23_10", "09_10.jpeg")
      );
      expect(DateTimeOriginal).toEqual(`2022:10:09 00:00:00`);
    });

    it("should have set date from folder name to image with not date in sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("subfolder", "23_10", "gorilla.JPG")
      );
      expect(DateTimeOriginal).toEqual(`2022:10:23 00:00:00`);
    });

    it("should have set date from file name to image with date in sub sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("subfolder", "23_10", "01_05", "12_10.jpeg")
      );
      expect(DateTimeOriginal).toEqual(`2022:10:12 00:00:00`);
    });

    it("should have set date from folder name to image without date in sub sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("subfolder", "23_10", "01_05", "gorilla.JPG")
      );
      expect(DateTimeOriginal).toEqual(`2022:05:01 00:00:00`);
    });

    it("should return report data", async () => {
      expect(result.totals).toEqual({
        after: {
          copied: 4,
          files: 10,
          modified: 6,
          moved: 0,
          path: path.normalize("test/assets/.tmp/output"),
          supported: 7,
          unsupported: 3,
          withDate: 7,
          withoutDate: 0,
        },
        before: {
          copied: null,
          files: 10,
          modified: null,
          moved: null,
          path: path.normalize("test/assets/.tmp/one-partial-format"),
          supported: 7,
          unsupported: 3,
          withDate: 5,
          withoutDate: 2,
        },
      });
    });
  });
});
