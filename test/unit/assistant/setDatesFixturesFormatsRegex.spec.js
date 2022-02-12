const { setDates } = require("../../../src/assistant/setDateMethods");

const {
  resetTempPath,
  TEMP_OUTPUT_FOLDER,
  tempOutputPath,
  copyFixturesToTempPath,
  tempFixturesFolder,
} = require("../../support/assets");
const { readExifDates } = require("../../../src/exif/fileMethods");

const FIXTURE = "formats-regex";

describe(`setDates executed in ${FIXTURE} fixtures`, () => {
  beforeAll(async () => {
    await resetTempPath();
  });

  describe("when modify option is true, fromDigited is false and one regex and formats are provided", () => {
    let result;

    beforeAll(async () => {
      await resetTempPath();
      await copyFixturesToTempPath(FIXTURE);
      result = await setDates(tempFixturesFolder(FIXTURE), {
        copyAll: true,
        outputFolder: TEMP_OUTPUT_FOLDER,
        fromDigitized: false,
        modify: true,
        dateFormats: ["dd_MM_yyyy", "dd_MM", "dd", "yyyy"],
        dateRegexs: [/^date_(\S*)/],
      });
    });

    it("should have set date from file name to image with date in root folder", async () => {
      const { DateTimeOriginal } = await readExifDates(tempOutputPath("date_25_09_2021.jpg"));
      expect(DateTimeOriginal).toEqual(`2021:09:25 00:00:00`);
    });

    it("should have set date from file name to image with date in subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(tempOutputPath("date_2021", "01_09.jpeg"));
      expect(DateTimeOriginal).toEqual(`2021:09:01 00:00:00`);
    });

    it("should have set date from file name to image with date in folders under subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("date_2021", "foo", "var", "date_01_10.jpeg")
      );
      expect(DateTimeOriginal).toEqual(`2021:10:01 00:00:00`);
    });

    it("should have set date from file name to image with not date in folders under subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("date_2021", "foo", "no-date-in-name.jpg")
      );
      expect(DateTimeOriginal).toEqual(`2021:01:01 00:00:00`);
    });

    it("should have set date from folder name to image with no date in subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("date_2021", "no-date-in-name.jpg")
      );
      expect(DateTimeOriginal).toEqual(`2021:01:01 00:00:00`);
    });

    it("should have set date from file name and folder name to image with date in sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("date_2021", "23_10_2020", "09_10.jpeg")
      );
      expect(DateTimeOriginal).toEqual(`2020:10:09 00:00:00`);
    });

    it("should have set date from folder name to image with not date in sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("date_2021", "23_10_2020", "gorilla.JPG")
      );
      expect(DateTimeOriginal).toEqual(`2020:10:23 00:00:00`);
    });

    it("should have set date from file name to image with date in sub sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("date_2021", "23_10_2020", "date_01_05", "date_12.jpeg")
      );
      expect(DateTimeOriginal).toEqual(`2020:05:12 00:00:00`);
    });

    it("should have set date from folder name to image without date in sub sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("date_2021", "23_10_2020", "date_01_05", "gorilla.JPG")
      );
      expect(DateTimeOriginal).toEqual(`2020:05:01 00:00:00`);
    });

    it("should have set date from folder name to image with day and month in sub sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("date_2021", "23_10_2020", "date_2022", "date_15_08.JPG")
      );
      expect(DateTimeOriginal).toEqual(`2022:08:15 00:00:00`);
    });

    it("should have set date from folder name to image with day in sub sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("date_2021", "23_10_2020", "date_2022", "17.JPG")
      );
      expect(DateTimeOriginal).toEqual(`2022:01:17 00:00:00`);
    });

    it("should return report data", async () => {
      expect(result.totals).toEqual({
        before: {
          copied: null,
          files: 14,
          modified: null,
          moved: null,
          path: `test/assets/.tmp/${FIXTURE}`,
          supported: 11,
          unsupported: 3,
          withDate: 7,
          withoutDate: 4,
        },
        after: {
          copied: 3,
          files: 14,
          modified: 11,
          moved: 0,
          path: "test/assets/.tmp/output",
          supported: 11,
          unsupported: 3,
          withDate: 11,
          withoutDate: 0,
        },
      });
    });
  });
});
