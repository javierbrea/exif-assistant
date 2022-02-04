const { setDatesInFolder } = require("../../../src/assistant/runner");

const {
  resetTempPath,
  TEMP_OUTPUT_FOLDER,
  tempOutputPath,
  copyFixturesToTempPath,
  tempFixturesFolder,
} = require("../../support/assets");
const { readExifDates } = require("../../../src/exif/fileMethods");

const FIXTURE = "one-format-regex";

describe(`setDates executed in ${FIXTURE} fixtures`, () => {
  beforeAll(async () => {
    await resetTempPath();
  });

  describe("when modify option is true, setDigited is false and format is provided", () => {
    beforeAll(async () => {
      await resetTempPath();
      await copyFixturesToTempPath(FIXTURE);
      await setDatesInFolder(tempFixturesFolder(FIXTURE), {
        copyAll: true,
        outputFolder: TEMP_OUTPUT_FOLDER,
        fromDigitized: false,
        modify: true,
        dateFormat: "dd_MM_yyyy",
        dateRegex: /^date\-(\S*)/,
      });
    });

    it("should have set date from file name to image with date in root folder", async () => {
      const { DateTimeOriginal } = await readExifDates(tempOutputPath("date-25_09_2021.jpg"));
      expect(DateTimeOriginal).toEqual(`2021:09:25 00:00:00`);
    });

    it("should have set date from file name to image with date in subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("subfolder", "date-01_09_2021.jpeg")
      );
      expect(DateTimeOriginal).toEqual(`2021:09:01 00:00:00`);
    });

    it("should have set date from file name to image with date in sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("subfolder", "date-23_10_2013", "date-09_10_2020.jpeg")
      );
      expect(DateTimeOriginal).toEqual(`2020:10:09 00:00:00`);
    });

    it("should have set date from folder name to image with not date in sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("subfolder", "date-23_10_2013", "gorilla.JPG")
      );
      expect(DateTimeOriginal).toEqual(`2013:10:23 00:00:00`);
    });

    it("should have set date from file name to image with date in sub sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("subfolder", "date-23_10_2013", "date-01_05_1979", "date-12_10_2045.jpeg")
      );
      expect(DateTimeOriginal).toEqual(`2045:10:12 00:00:00`);
    });

    it("should have set date from folder name to image without date in sub sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("subfolder", "date-23_10_2013", "date-01_05_1979", "gorilla.JPG")
      );
      expect(DateTimeOriginal).toEqual(`1979:05:01 00:00:00`);
    });
  });

  // TODO, test subfolders with file names and folders with partial format and base date -one-partial-format
  // TODO, make TODO refactors before implementing new features. Add linters
  // TODO, test subfolders with file names and folders in many formats and regex -formats-regex TO IMPLEMENT
  // TODO, test subfolders with file names and folders in many formats and many regex -formats-regexs TO IMPLEMENT
  // TODO, test subfolders with file names and folders in many formats and many regex with base date -partial-formats-regexs TO IMPLEMENT
  // TODO, test subfolders with file names and parent folders in many formats and many regex with base date from parents -parents-partial-formats-regexs TO IMPLEMENT
});
