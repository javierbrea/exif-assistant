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

  describe("when modify option is true, fromDigited is false and dateRegex is provided", () => {
    beforeAll(async () => {
      await resetTempPath();
      await copyFixturesToTempPath(FIXTURE);
      await setDates(tempFixturesFolder(FIXTURE), {
        copyAll: true,
        outputFolder: TEMP_OUTPUT_FOLDER,
        fromDigitized: false,
        modify: true,
        dateRegex: /^date\-(\S*)/,
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
  });
});
