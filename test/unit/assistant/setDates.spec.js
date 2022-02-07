const { existsSync } = require("fs-extra");
const { setDates } = require("../../../src/assistant/setDateMethods");

const {
  resetTempPath,
  copyAssetToTempPath,
  copyAssetsToTempPath,
  TEMP_PATH,
  UNRESOLVED_FOLDER,
  TEMP_OUTPUT_FOLDER,
  tempPath,
  addJPGExtension,
  tempUnresolvedPath,
  tempOutputPath,
} = require("../../support/assets");
const { readExifDates } = require("../../../src/exif/fileMethods");

const IMAGE_NO_DATE_ORIGINAL = "sphinx-no-date-original.jpg";
const IMAGE_NO_DATE = "gorilla.JPG";
const IMAGE_WITH_DATE = "sphinx.jpg";
const IMAGE_NOT_SUPPORTED = "wadi-rum.png";

describe("setDates", () => {
  beforeAll(async () => {
    await resetTempPath();
  });

  describe("validations", () => {
    describe("input folder", () => {
      it("should throw an error if input folder does not exist", async () => {
        expect(() => setDates(tempPath("foo"))).toThrow("input folder does not exist");
      });

      it("should throw an error if input folder is a file", async () => {
        await copyAssetsToTempPath([IMAGE_NO_DATE_ORIGINAL]);
        expect(() => setDates(tempPath(IMAGE_NO_DATE_ORIGINAL))).toThrow(
          "input folder must be a folder"
        );
      });
    });

    describe("when baseDate is provided", () => {
      it("should throw an error if baseDate is invalid and no format is provided", async () => {
        expect(() =>
          setDates(TEMP_PATH, {
            baseDate: "2022:06:16 12:00:00",
          })
        ).toThrow("baseDate must be a valid date. Please check baseDate and dateFormats options");
      });

      it("should throw an error if baseDate and dateFormats don't match", async () => {
        expect(() =>
          setDates(TEMP_PATH, {
            baseDate: "2022_06_16 12:00:00",
            dateFormats: ["yyyy:MM:dd hh:mm:ss"],
          })
        ).toThrow("baseDate must be a valid date. Please check baseDate and dateFormats options");
      });
    });

    describe("when date is provided", () => {
      it("should throw an error if date is not valid and no format is provided", async () => {
        expect(() =>
          setDates(TEMP_PATH, {
            date: "2022:06:16 12:00:00",
          })
        ).toThrow("date must be a valid date. Please check date and dateFormats options");
      });

      it("should throw an error if date and dateFormats don't match", async () => {
        expect(() =>
          setDates(TEMP_PATH, {
            date: "2022_06_16 12:00:00",
            dateFormats: ["yyyy:MM:dd hh:mm:ss"],
          })
        ).toThrow("date must be a valid date. Please check date and dateFormats options");
      });
    });

    describe("when dateFallback is provided", () => {
      it("should throw an error if dateFallback is not valid and no format is provided", async () => {
        expect(() =>
          setDates(TEMP_PATH, {
            dateFallback: "2022:06:16 12:00:00",
          })
        ).toThrow(
          "dateFallback must be a valid date. Please check dateFallback and dateFormats options"
        );
      });

      it("should throw an error if dateFallback and dateFormats don't match", async () => {
        expect(() =>
          setDates(TEMP_PATH, {
            dateFallback: "2022_06_16 12:00:00",
            dateFormats: ["yyyy:MM:dd hh:mm:ss"],
          })
        ).toThrow(
          "dateFallback must be a valid date. Please check dateFallback and dateFormats options"
        );
      });
    });
  });

  describe("when no files nor folders have valid date name", () => {
    describe("when no options are provided", () => {
      beforeAll(async () => {
        await resetTempPath();
        await copyAssetsToTempPath([IMAGE_NO_DATE_ORIGINAL, IMAGE_NO_DATE, IMAGE_WITH_DATE]);
        await setDates(TEMP_PATH);
      });

      it("should have not set date to image with no date", async () => {
        const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(
          tempPath(IMAGE_NO_DATE)
        );
        expect(DateTimeOriginal).toEqual(undefined);
        expect(DateTimeDigitized).toEqual(undefined);
      });

      it("should have set DateTimeOriginal to image with DateTimeDigited", async () => {
        const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(
          tempPath(IMAGE_NO_DATE_ORIGINAL)
        );
        expect(DateTimeOriginal).toEqual(DateTimeDigitized);
        expect(DateTimeDigitized).toEqual("2021:10:14 10:58:31");
      });
    });

    describe("when moveUnresolvedTo option is provided", () => {
      beforeAll(async () => {
        await resetTempPath();
        await copyAssetsToTempPath([
          IMAGE_NO_DATE_ORIGINAL,
          IMAGE_NO_DATE,
          IMAGE_WITH_DATE,
          IMAGE_NOT_SUPPORTED,
        ]);
        await setDates(TEMP_PATH, { moveUnresolvedTo: UNRESOLVED_FOLDER });
      });

      it("should have moved images with no date to unresolved folder", () => {
        expect(existsSync(tempUnresolvedPath(IMAGE_NO_DATE))).toEqual(true);
        expect(existsSync(tempUnresolvedPath(IMAGE_NOT_SUPPORTED))).toEqual(true);
        expect(existsSync(tempPath(IMAGE_NO_DATE))).toEqual(false);
        expect(existsSync(tempPath(IMAGE_NOT_SUPPORTED))).toEqual(false);
      });

      it("should have not moved images with date to unresolved folder", () => {
        expect(existsSync(tempPath(IMAGE_WITH_DATE))).toEqual(true);
        expect(existsSync(tempUnresolvedPath(IMAGE_WITH_DATE))).toEqual(false);
      });

      it("should have not moved images with dateTimeDigited to unresolved folder", () => {
        expect(existsSync(tempPath(IMAGE_NO_DATE_ORIGINAL))).toEqual(true);
        expect(existsSync(tempUnresolvedPath(IMAGE_NO_DATE_ORIGINAL))).toEqual(false);
      });

      it("should have set DateTimeOriginal to image with DateTimeDigited", async () => {
        const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(
          tempPath(IMAGE_NO_DATE_ORIGINAL)
        );
        expect(DateTimeOriginal).toEqual(DateTimeDigitized);
        expect(DateTimeDigitized).toEqual("2021:10:14 10:58:31");
      });
    });

    describe("when ISO date is provided", () => {
      beforeAll(async () => {
        await resetTempPath();
        await copyAssetsToTempPath([
          IMAGE_NO_DATE_ORIGINAL,
          IMAGE_NO_DATE,
          IMAGE_WITH_DATE,
          IMAGE_NOT_SUPPORTED,
        ]);
        await setDates(TEMP_PATH, {
          date: "2009-12-22 12:30:00",
        });
      });

      it("should have set date to image with no DateTimeDigited", async () => {
        const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(
          tempPath(IMAGE_NO_DATE_ORIGINAL)
        );
        expect(DateTimeOriginal).toEqual(DateTimeDigitized);
        expect(DateTimeDigitized).toEqual("2009:12:22 12:30:00");
      });

      it("should have set date to image with no date", async () => {
        const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(
          tempPath(IMAGE_NO_DATE)
        );
        expect(DateTimeOriginal).toEqual(DateTimeDigitized);
        expect(DateTimeDigitized).toEqual("2009:12:22 12:30:00");
      });

      it("should have not modified date of image with date", async () => {
        const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(
          tempPath(IMAGE_WITH_DATE)
        );
        expect(DateTimeOriginal).toEqual(DateTimeDigitized);
        expect(DateTimeDigitized).toEqual("2021:10:14 10:58:31");
      });
    });

    describe("when ISO date and modify options are provided", () => {
      beforeAll(async () => {
        await resetTempPath();
        await copyAssetsToTempPath([
          IMAGE_NO_DATE_ORIGINAL,
          IMAGE_NO_DATE,
          IMAGE_WITH_DATE,
          IMAGE_NOT_SUPPORTED,
        ]);
        await setDates(TEMP_PATH, {
          date: "2009-12-22 12:30:00",
          modify: true,
        });
      });

      it("should have set date to image with DateTimeDigited", async () => {
        const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(
          tempPath(IMAGE_NO_DATE_ORIGINAL)
        );
        expect(DateTimeOriginal).toEqual(DateTimeDigitized);
        expect(DateTimeDigitized).toEqual("2009:12:22 12:30:00");
      });

      it("should have set date to image with no date", async () => {
        const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(
          tempPath(IMAGE_NO_DATE)
        );
        expect(DateTimeOriginal).toEqual(DateTimeDigitized);
        expect(DateTimeDigitized).toEqual("2009:12:22 12:30:00");
      });

      it("should have modified date of image with date", async () => {
        const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(
          tempPath(IMAGE_WITH_DATE)
        );
        expect(DateTimeOriginal).toEqual(DateTimeDigitized);
        expect(DateTimeDigitized).toEqual("2009:12:22 12:30:00");
      });
    });

    describe("when outputFolder is provided", () => {
      beforeAll(async () => {
        await resetTempPath();
        await copyAssetsToTempPath([IMAGE_NO_DATE_ORIGINAL, IMAGE_NO_DATE, IMAGE_WITH_DATE]);
        await setDates(TEMP_PATH, { outputFolder: TEMP_OUTPUT_FOLDER });
      });

      it("should have not copied image with no date", () => {
        expect(existsSync(tempOutputPath(IMAGE_NO_DATE))).toEqual(false);
      });

      it("should have not copied image with date", () => {
        expect(existsSync(tempOutputPath(IMAGE_WITH_DATE))).toEqual(false);
      });

      it("should have set DateTimeOriginal to image with DateTimeDigited", async () => {
        const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(
          tempOutputPath(IMAGE_NO_DATE_ORIGINAL)
        );
        expect(DateTimeOriginal).toEqual(DateTimeDigitized);
        expect(DateTimeDigitized).toEqual("2021:10:14 10:58:31");
      });
    });

    describe("when outputFolder and copyAll options are provided", () => {
      beforeAll(async () => {
        await resetTempPath();
        await copyAssetsToTempPath([
          IMAGE_NO_DATE_ORIGINAL,
          IMAGE_NO_DATE,
          IMAGE_WITH_DATE,
          IMAGE_NOT_SUPPORTED,
        ]);
        await setDates(TEMP_PATH, { outputFolder: TEMP_OUTPUT_FOLDER, copyAll: true });
      });

      it("should have copied all images", () => {
        expect(existsSync(tempOutputPath(IMAGE_NO_DATE_ORIGINAL))).toEqual(true);
        expect(existsSync(tempOutputPath(IMAGE_NO_DATE))).toEqual(true);
        expect(existsSync(tempOutputPath(IMAGE_WITH_DATE))).toEqual(true);
        expect(existsSync(tempOutputPath(IMAGE_NOT_SUPPORTED))).toEqual(true);
      });

      it("should have set DateTimeOriginal to image with DateTimeDigited", async () => {
        const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(
          tempOutputPath(IMAGE_NO_DATE_ORIGINAL)
        );
        expect(DateTimeOriginal).toEqual(DateTimeDigitized);
        expect(DateTimeDigitized).toEqual("2021:10:14 10:58:31");
      });
    });

    describe("when outputFolder and moveUnresolvedTo options are provided", () => {
      beforeAll(async () => {
        await resetTempPath();
        await copyAssetsToTempPath([
          IMAGE_NO_DATE_ORIGINAL,
          IMAGE_NO_DATE,
          IMAGE_WITH_DATE,
          IMAGE_NOT_SUPPORTED,
        ]);
        await setDates(TEMP_PATH, {
          outputFolder: TEMP_OUTPUT_FOLDER,
          moveUnresolvedTo: UNRESOLVED_FOLDER,
        });
      });

      it("should have copied unresolved images to unresolved folder", () => {
        expect(existsSync(tempOutputPath(UNRESOLVED_FOLDER, IMAGE_NO_DATE))).toEqual(true);
        expect(existsSync(tempOutputPath(UNRESOLVED_FOLDER, IMAGE_NOT_SUPPORTED))).toEqual(true);
      });

      it("should not have copied images with date to unresolved folder", () => {
        expect(existsSync(tempOutputPath(UNRESOLVED_FOLDER, IMAGE_WITH_DATE))).toEqual(false);
      });

      it("should not have copied images with date to output folder", () => {
        expect(existsSync(tempOutputPath(IMAGE_WITH_DATE))).toEqual(false);
      });

      it("should have set DateTimeOriginal to image with DateTimeDigited", async () => {
        const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(
          tempOutputPath(IMAGE_NO_DATE_ORIGINAL)
        );
        expect(DateTimeOriginal).toEqual(DateTimeDigitized);
        expect(DateTimeDigitized).toEqual("2021:10:14 10:58:31");
      });
    });
  });

  describe("when files have valid ISO dates in file names and no options are provided", () => {
    const NEW_IMAGE_NO_DATE_ORIGINAL = addJPGExtension("2022-02-01T183945");
    const NEW_IMAGE_NO_DATE = addJPGExtension("2022-02-02");
    const NEW_IMAGE_WITH_DATE = addJPGExtension("2021-05");

    beforeAll(async () => {
      await resetTempPath();
      await copyAssetsToTempPath([
        [IMAGE_NO_DATE_ORIGINAL, NEW_IMAGE_NO_DATE_ORIGINAL],
        [IMAGE_NO_DATE, NEW_IMAGE_NO_DATE],
        [IMAGE_WITH_DATE, NEW_IMAGE_WITH_DATE],
      ]);
      await setDates(TEMP_PATH);
    });

    it("should have set date to image with no date", async () => {
      const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(
        tempPath(NEW_IMAGE_NO_DATE)
      );
      expect(DateTimeOriginal).toEqual(`2022:02:02 00:00:00`);
      expect(DateTimeDigitized).toEqual(`2022:02:02 00:00:00`);
    });

    it("should have not modified date of image with DateTimeDigited", async () => {
      const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(
        tempPath(NEW_IMAGE_NO_DATE_ORIGINAL)
      );
      expect(DateTimeOriginal).toEqual("2021:10:14 10:58:31");
      expect(DateTimeDigitized).toEqual("2021:10:14 10:58:31");
    });

    it("should have not modified date of image with date", async () => {
      const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(
        tempPath(NEW_IMAGE_WITH_DATE)
      );
      expect(DateTimeOriginal).toEqual("2021:10:14 10:58:31");
      expect(DateTimeDigitized).toEqual("2021:10:14 10:58:31");
    });
  });

  describe("when files have valid ISO dates in file names and fromDigitized is false", () => {
    const NEW_IMAGE_NO_DATE_ORIGINAL = addJPGExtension("2022-02-01T183945");
    const NEW_IMAGE_NO_DATE = addJPGExtension("2022-02-02");
    const NEW_IMAGE_WITH_DATE = addJPGExtension("2021-05");

    beforeAll(async () => {
      await resetTempPath();
      await copyAssetsToTempPath([
        [IMAGE_NO_DATE_ORIGINAL, NEW_IMAGE_NO_DATE_ORIGINAL],
        [IMAGE_NO_DATE, NEW_IMAGE_NO_DATE],
        [IMAGE_WITH_DATE, NEW_IMAGE_WITH_DATE],
      ]);
      await setDates(TEMP_PATH, { fromDigitized: false });
    });

    it("should have set date to image with no date", async () => {
      const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(
        tempPath(NEW_IMAGE_NO_DATE)
      );
      expect(DateTimeOriginal).toEqual(`2022:02:02 00:00:00`);
      expect(DateTimeDigitized).toEqual(`2022:02:02 00:00:00`);
    });

    it("should have modified date of image with DateTimeDigited", async () => {
      const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(
        tempPath(NEW_IMAGE_NO_DATE_ORIGINAL)
      );
      expect(DateTimeOriginal).toEqual("2022:02:01 18:39:45");
      expect(DateTimeDigitized).toEqual("2022:02:01 18:39:45");
    });

    it("should have not modified date of image with date", async () => {
      const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(
        tempPath(NEW_IMAGE_WITH_DATE)
      );
      expect(DateTimeOriginal).toEqual("2021:10:14 10:58:31");
      expect(DateTimeDigitized).toEqual("2021:10:14 10:58:31");
    });
  });

  describe("when files have valid ISO dates in file names and fromDigitized is false and modify is true", () => {
    const NEW_IMAGE_NO_DATE_ORIGINAL = addJPGExtension("2022-02-01T183945");
    const NEW_IMAGE_NO_DATE = addJPGExtension("2022-02-02");
    const NEW_IMAGE_WITH_DATE = addJPGExtension("2021-05");

    beforeAll(async () => {
      await resetTempPath();
      await copyAssetsToTempPath([
        [IMAGE_NO_DATE_ORIGINAL, NEW_IMAGE_NO_DATE_ORIGINAL],
        [IMAGE_NO_DATE, NEW_IMAGE_NO_DATE],
        [IMAGE_WITH_DATE, NEW_IMAGE_WITH_DATE],
      ]);
      await setDates(TEMP_PATH, { fromDigitized: false, modify: true });
    });

    it("should have set date to image with no date", async () => {
      const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(
        tempPath(NEW_IMAGE_NO_DATE)
      );
      expect(DateTimeOriginal).toEqual(`2022:02:02 00:00:00`);
      expect(DateTimeDigitized).toEqual(`2022:02:02 00:00:00`);
    });

    it("should have modified date of image with DateTimeDigited", async () => {
      const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(
        tempPath(NEW_IMAGE_NO_DATE_ORIGINAL)
      );
      expect(DateTimeOriginal).toEqual("2022:02:01 18:39:45");
      expect(DateTimeDigitized).toEqual("2022:02:01 18:39:45");
    });

    it("should have modified date of image with date", async () => {
      const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(
        tempPath(NEW_IMAGE_WITH_DATE)
      );
      expect(DateTimeOriginal).toEqual("2021:05:01 00:00:00");
      expect(DateTimeDigitized).toEqual("2021:05:01 00:00:00");
    });
  });
});
