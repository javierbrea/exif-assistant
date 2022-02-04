const fsExtra = require("fs-extra");

const { setDates } = require("../../../src/assistant/setDateMethods");

const {
  resetTempPath,
  TEMP_OUTPUT_FOLDER,
  UNRESOLVED_FOLDER,
  tempOutputPath,
  copyFixturesToTempPath,
  tempFixturesFolder,
} = require("../../support/assets");
const { readExifDates } = require("../../../src/exif/fileMethods");

const FIXTURE = "iso";

describe(`setDates executed in ${FIXTURE} fixtures`, () => {
  beforeAll(async () => {
    await resetTempPath();
  });

  describe("when modify option is true and setDigited is false", () => {
    beforeAll(async () => {
      await resetTempPath();
      await copyFixturesToTempPath(FIXTURE);
      await setDates(tempFixturesFolder(FIXTURE), {
        outputFolder: TEMP_OUTPUT_FOLDER,
        fromDigitized: false,
        modify: true,
      });
    });

    it("should have set date from file name to image with date in root folder", async () => {
      const { DateTimeOriginal } = await readExifDates(tempOutputPath("2021-09-25T122030.jpg"));
      expect(DateTimeOriginal).toEqual(`2021:09:25 12:20:30`);
    });

    it("should have set date from file name to image with date in subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("subfolder", "2021-09.jpeg")
      );
      expect(DateTimeOriginal).toEqual(`2021:09:01 00:00:00`);
    });

    it("should have set date from file name to image with date in sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("subfolder", "2013-10-23T124015", "2020-10-09T172815.jpeg")
      );
      expect(DateTimeOriginal).toEqual(`2020:10:09 17:28:15`);
    });

    it("should have set date from folder name to image with not date in sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("subfolder", "2013-10-23T124015", "gorilla.JPG")
      );
      expect(DateTimeOriginal).toEqual(`2013:10:23 12:40:15`);
    });

    it("should have set date from file name to image with date in sub sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("subfolder", "2013-10-23T124015", "1979-05", "2045-10-12.jpeg")
      );
      expect(DateTimeOriginal).toEqual(`2045:10:12 00:00:00`);
    });

    it("should have set date from folder name to image without date in sub sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("subfolder", "2013-10-23T124015", "1979-05", "gorilla.JPG")
      );
      expect(DateTimeOriginal).toEqual(`1979:05:01 00:00:00`);
    });
  });

  describe("when copyAll option is true and fromDigitized is false", () => {
    beforeAll(async () => {
      await resetTempPath();
      await copyFixturesToTempPath(FIXTURE);
      await setDates(tempFixturesFolder(FIXTURE), {
        outputFolder: TEMP_OUTPUT_FOLDER,
        fromDigitized: false,
        copyAll: true,
      });
    });

    it("should have copied image with date in root folder", async () => {
      expect(fsExtra.existsSync(tempOutputPath("2021-09-25T122030.jpg"))).toEqual(true);
    });

    it("should have copied unsupported image in root folder", async () => {
      expect(fsExtra.existsSync(tempOutputPath("wadi-rum.png"))).toEqual(true);
    });

    it("should have copied image with date in subfolder", async () => {
      expect(fsExtra.existsSync(tempOutputPath("subfolder", "2021-09.jpeg"))).toEqual(true);
    });

    it("should have copied image with no date in name in subfolder", async () => {
      expect(fsExtra.existsSync(tempOutputPath("subfolder", "no-date-in-name.jpg"))).toEqual(true);
    });

    it("should have copied images in sub subfolder", async () => {
      expect(
        fsExtra.existsSync(
          tempOutputPath("subfolder", "2013-10-23T124015", "2020-10-09T172815.jpeg")
        )
      ).toEqual(true);
      expect(
        fsExtra.existsSync(tempOutputPath("subfolder", "2013-10-23T124015", "gorilla.JPG"))
      ).toEqual(true);
      expect(
        fsExtra.existsSync(tempOutputPath("subfolder", "2013-10-23T124015", "wadi-rum.png"))
      ).toEqual(true);
    });

    it("should have copied images in sub sub subfolder", async () => {
      expect(
        fsExtra.existsSync(
          tempOutputPath("subfolder", "2013-10-23T124015", "1979-05", "2045-10-12.jpeg")
        )
      ).toEqual(true);
      expect(
        fsExtra.existsSync(
          tempOutputPath("subfolder", "2013-10-23T124015", "1979-05", "gorilla.JPG")
        )
      ).toEqual(true);
      expect(
        fsExtra.existsSync(
          tempOutputPath("subfolder", "2013-10-23T124015", "1979-05", "not-supported.png")
        )
      ).toEqual(true);
    });

    it("should have set date from folder name to image with not date in sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("subfolder", "2013-10-23T124015", "gorilla.JPG")
      );
      expect(DateTimeOriginal).toEqual(`2013:10:23 12:40:15`);
    });

    it("should have set date from folder name to image without date in sub sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("subfolder", "2013-10-23T124015", "1979-05", "gorilla.JPG")
      );
      expect(DateTimeOriginal).toEqual(`1979:05:01 00:00:00`);
    });
  });

  describe("when copyAll and moveUnresolved to options are true", () => {
    beforeAll(async () => {
      await resetTempPath();
      await copyFixturesToTempPath(FIXTURE);
      await setDates(tempFixturesFolder(FIXTURE), {
        outputFolder: TEMP_OUTPUT_FOLDER,
        copyAll: true,
        fromDigitized: false,
        moveUnresolvedTo: UNRESOLVED_FOLDER,
      });
    });

    it("should have copied image with date in root folder", async () => {
      expect(fsExtra.existsSync(tempOutputPath("2021-09-25T122030.jpg"))).toEqual(true);
    });

    it("should have moved unsupported image to root unresolved folder", async () => {
      expect(fsExtra.existsSync(tempOutputPath(UNRESOLVED_FOLDER, "wadi-rum.png"))).toEqual(true);
    });

    it("should have copied image with date in subfolder", async () => {
      expect(fsExtra.existsSync(tempOutputPath("subfolder", "2021-09.jpeg"))).toEqual(true);
    });

    it("should have copied image with no date in name in subfolder", async () => {
      expect(fsExtra.existsSync(tempOutputPath("subfolder", "no-date-in-name.jpg"))).toEqual(true);
    });

    it("should have copied images with date in sub subfolder", async () => {
      expect(
        fsExtra.existsSync(
          tempOutputPath("subfolder", "2013-10-23T124015", "2020-10-09T172815.jpeg")
        )
      ).toEqual(true);
      expect(
        fsExtra.existsSync(tempOutputPath("subfolder", "2013-10-23T124015", "gorilla.JPG"))
      ).toEqual(true);
    });

    it("should have moved not supported images with to unsupported in sub subfolder", async () => {
      expect(
        fsExtra.existsSync(
          tempOutputPath("subfolder", "2013-10-23T124015", UNRESOLVED_FOLDER, "wadi-rum.png")
        )
      ).toEqual(true);
    });

    it("should have copied images in sub sub subfolder", async () => {
      expect(
        fsExtra.existsSync(
          tempOutputPath("subfolder", "2013-10-23T124015", "1979-05", "2045-10-12.jpeg")
        )
      ).toEqual(true);
      expect(
        fsExtra.existsSync(
          tempOutputPath("subfolder", "2013-10-23T124015", "1979-05", "gorilla.JPG")
        )
      ).toEqual(true);
    });

    it("should have moved not supported images in sub sub subfolder", async () => {
      expect(
        fsExtra.existsSync(
          tempOutputPath(
            "subfolder",
            "2013-10-23T124015",
            "1979-05",
            UNRESOLVED_FOLDER,
            "not-supported.png"
          )
        )
      ).toEqual(true);
    });

    it("should have set date from folder name to image with not date in sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("subfolder", "2013-10-23T124015", "gorilla.JPG")
      );
      expect(DateTimeOriginal).toEqual(`2013:10:23 12:40:15`);
    });

    it("should have set date from folder name to image without date in sub sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("subfolder", "2013-10-23T124015", "1979-05", "gorilla.JPG")
      );
      expect(DateTimeOriginal).toEqual(`1979:05:01 00:00:00`);
    });
  });
});
