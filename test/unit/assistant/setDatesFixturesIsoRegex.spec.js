const { setDates } = require("../../../src/assistant/setDateMethods");

const {
  resetTempPath,
  TEMP_OUTPUT_FOLDER,
  tempOutputPath,
  copyFixturesToTempPath,
  tempFixturesFolder,
} = require("../../support/assets");
const { readExifDates } = require("../../../src/exif/fileMethods");

const FIXTURE = "iso-regex";

describe(`setDates executed in ${FIXTURE} fixtures`, () => {
  beforeAll(async () => {
    await resetTempPath();
  });

  describe("when modify option is true, fromDigited is false and dateRegexs are provided", () => {
    let result;

    beforeAll(async () => {
      await resetTempPath();
      await copyFixturesToTempPath(FIXTURE);
      result = await setDates(tempFixturesFolder(FIXTURE), {
        copyAll: true,
        outputFolder: TEMP_OUTPUT_FOLDER,
        fromDigitized: false,
        modify: true,
        dateRegexs: [/^date\-(\S*)/],
      });
    });

    it("should have set date from file name to image with date in root folder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("date-2021-09-25T122030.jpg")
      );
      expect(DateTimeOriginal).toEqual(`2021:09:25 12:20:30`);
    });

    it("should have set date from file name to image with date in subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("subfolder", "date-2021-09.jpeg")
      );
      expect(DateTimeOriginal).toEqual(`2021:09:01 00:00:00`);
    });

    it("should have set date from file name to image with date in sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("subfolder", "date-2013-10-23T124015", "date-2020-10-09T172815.jpeg")
      );
      expect(DateTimeOriginal).toEqual(`2020:10:09 17:28:15`);
    });

    it("should have set date from folder name to image with not date in sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("subfolder", "date-2013-10-23T124015", "gorilla.JPG")
      );
      expect(DateTimeOriginal).toEqual(`2013:10:23 12:40:15`);
    });

    it("should have set date from file name to image with date in sub sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath(
          "subfolder",
          "date-2013-10-23T124015",
          "date-1979-05",
          "date-2045-10-12.jpeg"
        )
      );
      expect(DateTimeOriginal).toEqual(`2045:10:12 00:00:00`);
    });

    it("should have set date from folder name to image without date in sub sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("subfolder", "date-2013-10-23T124015", "date-1979-05", "gorilla.JPG")
      );
      expect(DateTimeOriginal).toEqual(`1979:05:01 00:00:00`);
    });

    it("should return report data", async () => {
      expect(result).toEqual({
        after: {
          copied: 4,
          files: 10,
          modified: 6,
          moved: 0,
          path: "test/assets/.tmp/output",
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
          path: "test/assets/.tmp/iso-regex",
          supported: 7,
          unsupported: 3,
          withDate: 5,
          withoutDate: 2,
        },
      });
    });
  });
});
