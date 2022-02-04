const { setDatesInFolder } = require("../../../../src/assistant/runner");

const {
  resetTempPath,
  TEMP_OUTPUT_FOLDER,
  tempOutputPath,
  copyFixturesToTempPath,
  tempFixturesFolder,
} = require("../../../support/assets");
const { readExifDates } = require("../../../../src/exif/fileMethods");

const FIXTURE = "one-partial-format";

describe(`setDates executed in ${FIXTURE} fixtures`, () => {
  beforeAll(async () => {
    await resetTempPath();
  });

  describe("when modify option is true, setDigited is false and partial format and baseDate are provided", () => {
    beforeAll(async () => {
      await resetTempPath();
      await copyFixturesToTempPath(FIXTURE);
      await setDatesInFolder(tempFixturesFolder(FIXTURE), {
        copyAll: true,
        outputFolder: TEMP_OUTPUT_FOLDER,
        fromDigitized: false,
        modify: true,
        dateFormat: "dd_MM",
        baseDate: "2022",
        baseDateFormat: "yyyy",
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
  });

  // TODO, make TODO refactors before implementing new features. Add linters
  // TODO, test subfolders with file names and folders in many formats and regex -formats-regex TO IMPLEMENT
  // TODO, test subfolders with file names and folders in many formats and many regex -formats-regexs TO IMPLEMENT
  // TODO, test subfolders with file names and folders in many formats and many regex with base date -partial-formats-regexs TO IMPLEMENT
  // TODO, test subfolders with file names and parent folders in many formats and many regex with base date from parents -parents-partial-formats-regexs TO IMPLEMENT
});
