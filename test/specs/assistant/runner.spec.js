const path = require("path");
const { existsSync } = require("fs-extra");
const { setDatesInFolder } = require("../../../src/assistant/runner");

const {
  resetTempPath,
  copyAssetsToTempPath,
  TEMP_PATH,
  tempPath,
} = require("../../support/assets");
const { readExifDates } = require("../../../src/exif/fileMethods");

const IMAGE_NO_DATE_ORIGINAL = "sphinx-no-date-original.jpg";
const IMAGE_NO_DATE = "gorilla.JPG";
const IMAGE_WITH_DATE = "sphinx.jpg";
const IMAGE_NOT_SUPPORTED = "wadi-rum.png";
const UNRESOLVED_FOLDER = "unresolved";
const OUTPUT_FOLDER = tempPath("output");

function outputPath() {
  return path.resolve.apply(null, [TEMP_PATH, OUTPUT_FOLDER, ...arguments]);
}

function unresolvedPath() {
  return path.resolve.apply(null, [TEMP_PATH, UNRESOLVED_FOLDER, ...arguments]);
}

function addJPGExtension(fileName) {
  return `${fileName}.jpg`;
}

describe("setDatesInFolder", () => {
  beforeAll(async () => {
    await resetTempPath();
  });

  describe("when no files nor folders have valid date name", () => {
    describe("when no options are provided", () => {
      beforeAll(async () => {
        await resetTempPath();
        await copyAssetsToTempPath([IMAGE_NO_DATE_ORIGINAL, IMAGE_NO_DATE, IMAGE_WITH_DATE]);
        await setDatesInFolder(TEMP_PATH);
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
        await setDatesInFolder(TEMP_PATH, { moveUnresolvedTo: UNRESOLVED_FOLDER });
      });

      it("should have moved images with no date to unresolved folder", async () => {
        expect(existsSync(unresolvedPath(IMAGE_NO_DATE))).toEqual(true);
        expect(existsSync(tempPath(IMAGE_NO_DATE))).toEqual(false);
        expect(existsSync(unresolvedPath(IMAGE_NOT_SUPPORTED))).toEqual(true);
        expect(existsSync(tempPath(IMAGE_NOT_SUPPORTED))).toEqual(false);
      });

      it("should have not moved images with no date to unresolved folder", async () => {
        expect(existsSync(tempPath(IMAGE_WITH_DATE))).toEqual(true);
        expect(existsSync(unresolvedPath(IMAGE_WITH_DATE))).toEqual(false);
      });

      it("should have not moved images with dateTimeDigited to unresolved folder", async () => {
        expect(existsSync(tempPath(IMAGE_NO_DATE_ORIGINAL))).toEqual(true);
        expect(existsSync(unresolvedPath(IMAGE_NO_DATE_ORIGINAL))).toEqual(false);
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
        await setDatesInFolder(TEMP_PATH, {
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
        await setDatesInFolder(TEMP_PATH, {
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
        await setDatesInFolder(TEMP_PATH, { outputFolder: OUTPUT_FOLDER });
      });

      it("should have not copied image with no date", async () => {
        expect(existsSync(outputPath(IMAGE_NO_DATE))).toEqual(false);
      });

      it("should have not copied image with date", async () => {
        expect(existsSync(outputPath(IMAGE_WITH_DATE))).toEqual(false);
      });

      it("should have set DateTimeOriginal to image with DateTimeDigited", async () => {
        const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(
          outputPath(IMAGE_NO_DATE_ORIGINAL)
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
        await setDatesInFolder(TEMP_PATH, { outputFolder: OUTPUT_FOLDER, copyAll: true });
      });

      it("should have copied all images", async () => {
        expect(existsSync(outputPath(IMAGE_NO_DATE_ORIGINAL))).toEqual(true);
        expect(existsSync(outputPath(IMAGE_NO_DATE))).toEqual(true);
        expect(existsSync(outputPath(IMAGE_WITH_DATE))).toEqual(true);
        expect(existsSync(outputPath(IMAGE_NOT_SUPPORTED))).toEqual(true);
      });

      it("should have set DateTimeOriginal to image with DateTimeDigited", async () => {
        const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(
          outputPath(IMAGE_NO_DATE_ORIGINAL)
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
        await setDatesInFolder(TEMP_PATH, {
          outputFolder: OUTPUT_FOLDER,
          moveUnresolvedTo: UNRESOLVED_FOLDER,
        });
      });

      it("should have copied unresolved images to unresolved folder", async () => {
        expect(existsSync(outputPath(UNRESOLVED_FOLDER, IMAGE_NO_DATE))).toEqual(true);
        expect(existsSync(outputPath(UNRESOLVED_FOLDER, IMAGE_NOT_SUPPORTED))).toEqual(true);
      });

      it("should not have copied images with date to unresolved folder", async () => {
        expect(existsSync(outputPath(UNRESOLVED_FOLDER, IMAGE_WITH_DATE))).toEqual(false);
      });

      it("should not have copied images with date to output folder", async () => {
        expect(existsSync(outputPath(IMAGE_WITH_DATE))).toEqual(false);
      });

      it("should have set DateTimeOriginal to image with DateTimeDigited", async () => {
        const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(
          outputPath(IMAGE_NO_DATE_ORIGINAL)
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
      await setDatesInFolder(TEMP_PATH);
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
      await setDatesInFolder(TEMP_PATH, { fromDigitized: false });
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
      await setDatesInFolder(TEMP_PATH, { fromDigitized: false, modify: true });
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
