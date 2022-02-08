const { setDates } = require("../../../src/assistant/setDateMethods");

const {
  resetTempPath,
  TEMP_OUTPUT_FOLDER,
  tempOutputPath,
  copyFixturesToTempPath,
  tempFixturesFolder,
} = require("../../support/assets");
const { readExifDates } = require("../../../src/exif/fileMethods");

const FIXTURE = "formats-regexs";

describe(`setDates executed in ${FIXTURE} fixtures`, () => {
  beforeAll(async () => {
    await resetTempPath();
  });

  describe("when modify option is true, fromDigited is false and formats and regexs are provided", () => {
    beforeAll(async () => {
      await resetTempPath();
      await copyFixturesToTempPath(FIXTURE);
      await setDates(tempFixturesFolder(FIXTURE), {
        copyAll: true,
        outputFolder: TEMP_OUTPUT_FOLDER,
        fromDigitized: false,
        modify: true,
        dateFormats: ["dd_MM_yyyy", "dd_MM", "dd", "yyyy"],
        dateRegexs: [/^date[_\-](\S*)/, /^(\S*)\-date$/, /^day\s(\S*)/, /^year\s(\S*)/],
      });
    });

    it("should have set date from file name to image with date in root folder", async () => {
      const { DateTimeOriginal } = await readExifDates(tempOutputPath("date_25_09_2021.jpg"));
      expect(DateTimeOriginal).toEqual(`2021:09:25 00:00:00`);
    });

    it("should have set date from file name to image with date in subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(tempOutputPath("year 2021", "01_09.jpeg"));
      expect(DateTimeOriginal).toEqual(`2021:09:01 00:00:00`);
    });

    it("should have set date from file name to image with date in folders under subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("year 2021", "foo", "var", "date-01_10.jpeg")
      );
      expect(DateTimeOriginal).toEqual(`2021:10:01 00:00:00`);
    });

    it("should have set date from file name to image with not date in folders under subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("year 2021", "foo", "no-date-in-name.jpg")
      );
      expect(DateTimeOriginal).toEqual(`2021:01:01 00:00:00`);
    });

    it("should have set date from folder name to image with no date in subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("year 2021", "no-date-in-name.jpg")
      );
      expect(DateTimeOriginal).toEqual(`2021:01:01 00:00:00`);
    });

    it("should have set date from file name and folder name to image with date in sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("year 2021", "23_10_2020-date", "09_10-date.jpeg")
      );
      expect(DateTimeOriginal).toEqual(`2020:10:09 00:00:00`);
    });

    it("should have set date from folder name to image with not date in sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("year 2021", "23_10_2020-date", "gorilla.JPG")
      );
      expect(DateTimeOriginal).toEqual(`2020:10:23 00:00:00`);
    });

    it("should have set date from file name to image with date in sub sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("year 2021", "23_10_2020-date", "date_01_05", "day 12.jpeg")
      );
      expect(DateTimeOriginal).toEqual(`2020:05:12 00:00:00`);
    });

    it("should have set date from folder name to image without date in sub sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("year 2021", "23_10_2020-date", "date_01_05", "gorilla.JPG")
      );
      expect(DateTimeOriginal).toEqual(`2020:05:01 00:00:00`);
    });

    it("should have set date from folder name to image with day and month in sub sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("year 2021", "23_10_2020-date", "year 2022", "date_15_08.JPG")
      );
      expect(DateTimeOriginal).toEqual(`2022:08:15 00:00:00`);
    });

    it("should have set date from folder name to image with day in sub sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("year 2021", "23_10_2020-date", "year 2022", "day 17.JPG")
      );
      expect(DateTimeOriginal).toEqual(`2022:01:17 00:00:00`);
    });
  });
});