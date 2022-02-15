const path = require("path");
const piexif = require("piexifjs");
const fsExtra = require("fs-extra");
const sinon = require("sinon");

const { setDate } = require("../../../src/assistant/setDateMethods");
const { readExifDates } = require("../../../src/exif/fileMethods");
const { setLevel, _logger } = require("../../../src/support/tracer");
const { formatForLogsFromExif } = require("../../../src/support/dates");

const {
  assetPath,
  assetData,
  tempPath,
  resetTempPath,
  copyAssetToTempPath,
  TEMP_PATH,
} = require("../../support/assets");

setLevel("silent");

describe("setDate", () => {
  let sandbox;

  function expectLog(log, spy) {
    expect(spy.calledWithMatch(log)).toEqual(true);
  }

  function spyTracer(level) {
    return sandbox.spy(_logger, level);
  }

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    await resetTempPath();
  });

  afterEach(() => {
    sandbox.restore();
  });

  async function expectModifiedDate({
    inputPath,
    fileName,
    setDateOptions = {},
    newDateExpected,
    dateTimeDigitedExpected,
    expectedLog,
    noOutputFolder,
  }) {
    const spy = spyTracer("debug");
    const filePath = inputPath ? path.resolve(inputPath, fileName) : assetPath(fileName);
    const defaultOutputFolder = !noOutputFolder ? TEMP_PATH : null;
    const options = {
      outputFolder: setDateOptions.outputFolder || defaultOutputFolder,
      ...setDateOptions,
    };
    const result = await setDate(filePath, options);
    const digitedHasToChange = options.setDigitized !== false;
    const dateTimeDigitizedMessage = digitedHasToChange ? ` and DateTimeDigitized` : "";
    expectLog(
      `${fileName}: Setting DateTimeOriginal${dateTimeDigitizedMessage} to ${formatForLogsFromExif(
        newDateExpected
      )},`,
      spy
    );
    if (expectedLog) {
      expectLog(expectedLog, spy);
    }
    const newFilePath = options.outputFolder
      ? path.resolve(options.outputFolder, fileName)
      : tempPath(fileName);
    const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(newFilePath);
    expect(DateTimeOriginal).toEqual(newDateExpected);
    if (digitedHasToChange) {
      expect(DateTimeDigitized).toEqual(newDateExpected);
    } else {
      expect(DateTimeDigitized).toEqual(dateTimeDigitedExpected);
    }
    return result;
  }

  describe("validations", () => {
    let imagePath;
    beforeEach(async () => {
      const image = "gorilla.JPG";
      await copyAssetToTempPath(image);
      imagePath = tempPath(image);
    });

    describe("input file", () => {
      it("should throw an error if input file does not exist", async () => {
        const fileName = "foo.JPG";
        const filePath = assetPath(fileName);
        await expect(() =>
          setDate(filePath, {
            baseDate: "2022:06:16 12:00:00",
          })
        ).rejects.toThrow("input file does not exist");
      });

      it("should throw an error if input file is a folder", async () => {
        await expect(() =>
          setDate(TEMP_PATH, {
            baseDate: "2022:06:16 12:00:00",
          })
        ).rejects.toThrow("input file must be a file");
      });
    });

    describe("when baseDate is provided", () => {
      it("should throw an error if baseDate is invalid and no format is provided", async () => {
        await expect(() =>
          setDate(imagePath, {
            baseDate: "2022:06:16 12:00:00",
          })
        ).rejects.toThrow(
          "baseDate must be a valid date. Please check baseDate and dateFormats options"
        );
      });

      it("should throw an error if baseDate and dateFormats don't match", async () => {
        await expect(async () => {
          await setDate(imagePath, {
            baseDate: "2022_06_16 12:00:00",
            baseDateFormat: "yyyy:MM:dd hh:mm:ss",
          });
        }).rejects.toThrow(
          "baseDate must be a valid date. Please check baseDate and dateFormats options"
        );
      });
    });

    describe("when date is provided", () => {
      it("should throw an error if date is not valid and no format is provided", async () => {
        await expect(() =>
          setDate(imagePath, {
            date: "2022:06:16 12:00:00",
          })
        ).rejects.toThrow("date must be a valid date. Please check date and dateFormats options");
      });

      it("should throw an error if date and dateFormats don't match", async () => {
        await expect(() =>
          setDate(imagePath, {
            date: "2022_06_16 12:00:00",
            dateFormats: ["yyyy:MM:dd hh:mm:ss"],
          })
        ).rejects.toThrow("date must be a valid date. Please check date and dateFormats options");
      });

      it("should not throw an error if date and dateFormats don't match but date is ISO", async () => {
        const spy = spyTracer("debug");
        await setDate(imagePath, {
          date: "2022-06-16 12:00:00",
          dateFormats: ["yyyy:MM:dd hh:mm:ss"],
        });
        expectLog(`Setting DateTimeOriginal`, spy);
      });
    });

    describe("when dateFallback is provided", () => {
      it("should throw an error if dateFallback is not valid and no format is provided", async () => {
        await expect(() =>
          setDate(imagePath, {
            dateFallback: "2022:06:16 12:00:00",
          })
        ).rejects.toThrow(
          "dateFallback must be a valid date. Please check dateFallback and dateFormats options"
        );
      });

      it("should throw an error if dateFallback and dateFormats don't match", async () => {
        await expect(() =>
          setDate(imagePath, {
            dateFallback: "2022--06_16 12:00:00",
            dateFormats: ["yyyy:MM:dd hh:mm:ss"],
          })
        ).rejects.toThrow(
          "dateFallback must be a valid date. Please check dateFallback and dateFormats options"
        );
      });
    });
  });

  describe("when file is not supported", () => {
    it("should trace warning and return correspondent report", async () => {
      const fileName = "wadi-rum.png";
      const spy = spyTracer("debug");
      const filePath = assetPath(fileName);
      const result = await setDate(filePath);
      expectLog(`${fileName}: File type is not supported`, spy);
      expect(result.totals.before.files).toEqual(1);
      expect(result.totals.before.supported).toEqual(0);
      expect(result.totals.before.unsupported).toEqual(1);
      expect(result.totals.after.files).toEqual(1);
      expect(result.totals.after.supported).toEqual(0);
      expect(result.totals.after.unsupported).toEqual(1);
      expect(result.totals.after.modified).toEqual(0);
    });
  });

  describe("when file has already date", () => {
    describe("when no modify option is provided", () => {
      it("should trace verbose and return correspondent report", async () => {
        const fileName = "sphinx.jpg";
        const spy = spyTracer("verbose");
        const filePath = assetPath(fileName);
        const result = await setDate(filePath);
        expectLog(`${fileName}: Already has DateTimeOriginal`, spy);
        expect(result.totals.before.supported).toEqual(1);
        expect(result.totals.before.withDate).toEqual(1);
        expect(result.totals.after.supported).toEqual(1);
        expect(result.totals.after.withDate).toEqual(1);
        expect(result.totals.after.modified).toEqual(0);
      });
    });

    describe("when modify option is true", () => {
      describe("when date is provided", () => {
        it("should set DateTimeOriginal, DateTimeDigitized and return report", async () => {
          const dateOption = "2022-07-12 13:00:00";
          const date = "2022:07:12 13:00:00";
          const result = await expectModifiedDate({
            fileName: "sphinx.jpg",
            setDateOptions: {
              date: dateOption,
              modify: true,
            },
            newDateExpected: date,
            expectedLog: "from date option",
          });
          expect(result.totals.before.withDate).toEqual(1);
          expect(result.totals.after.withDate).toEqual(1);
          expect(result.totals.after.modified).toEqual(1);
        });
      });

      describe("when date is provided and setDigitized option is false", () => {
        it("should set DateTimeOriginal, but not DateTimeDigitized", async () => {
          const fileName = "sphinx.jpg";
          const { metadata } = assetData(fileName);
          const dateOption = "2009-09-09 09:00:00";
          const date = "2009:09:09 09:00:00";
          const result = await expectModifiedDate({
            fileName,
            setDateOptions: {
              date: dateOption,
              setDigitized: false,
              modify: true,
            },
            newDateExpected: date,
            dateTimeDigitedExpected: metadata.DateTimeDigitized,
            expectedLog: "from date option",
          });
          expect(result.totals.before.withDate).toEqual(1);
          expect(result.totals.after.withDate).toEqual(1);
          expect(result.totals.after.modified).toEqual(1);
        });
      });

      describe("when dateFallback is provided and fromDigitized is false", () => {
        it("should add DateTimeOriginal and modify DateTimeDigitized", async () => {
          const fileName = "sphinx.jpg";
          const dateFallback = "2009-09-09 09:30:00";
          const date = "2009:09:09 09:30:00";
          const result = await expectModifiedDate({
            fileName,
            setDateOptions: {
              dateFallback,
              fromDigitized: false,
              modify: true,
            },
            newDateExpected: date,
            expectedLog: "from dateFallback option",
          });
          expect(result.totals.before.withDate).toEqual(1);
          expect(result.totals.after.withDate).toEqual(1);
          expect(result.totals.after.modified).toEqual(1);
        });

        it("should add DateTimeOriginal and not modify DateTimeDigitized if setDigitized is false", async () => {
          const fileName = "sphinx.jpg";
          const { metadata } = assetData(fileName);
          const dateFallback = "2009-09-09 09:30:00";
          const date = "2009:09:09 09:30:00";
          const result = await expectModifiedDate({
            fileName,
            setDateOptions: {
              dateFallback,
              fromDigitized: false,
              setDigitized: false,
              modify: true,
            },
            newDateExpected: date,
            dateTimeDigitedExpected: metadata.DateTimeDigitized,
            expectedLog: "from dateFallback option",
          });
          expect(result.totals.before.withDate).toEqual(1);
          expect(result.totals.after.withDate).toEqual(1);
          expect(result.totals.after.modified).toEqual(1);
        });
      });
    });
  });

  describe("when file has not date", () => {
    describe("when date is provided", () => {
      it("should add DateTimeOriginal, DateTimeDigitized and return true", async () => {
        const inputDate = "2022-06-16 12:00:00";
        const date = "2022:06:16 12:00:00";
        const result = await expectModifiedDate({
          fileName: "gorilla.JPG",
          setDateOptions: {
            date: inputDate,
          },
          newDateExpected: date,
          expectedLog: "from date option",
        });
        expect(result.totals.before.withDate).toEqual(0);
        expect(result.totals.after.withDate).toEqual(1);
        expect(result.totals.after.modified).toEqual(1);
      });
    });

    describe("when date is provided and setDigitized option is false", () => {
      it("should add DateTimeOriginal, but not DateTimeDigitized", async () => {
        const inputDate = "2022-06-16 12:00:00";
        const date = "2022:06:16 12:00:00";
        await expectModifiedDate({
          fileName: "gorilla.JPG",
          setDateOptions: {
            date: inputDate,
            setDigitized: false,
          },
          newDateExpected: date,
          dateTimeDigitedExpected: undefined,
          expectedLog: "from date option",
        });
      });
    });
  });

  describe("when file has only DateTimeDigitized", () => {
    describe("when no fromDigitized option is provided", () => {
      it("should not add DateTimeOriginal from DateTimeDigitized if date is found in file", async () => {
        const fileName = "sphinx-no-date-original.jpg";
        const newFileName = "2022-02-15.jpg";
        await copyAssetToTempPath(fileName, newFileName);
        const result = await expectModifiedDate({
          inputPath: TEMP_PATH,
          fileName: newFileName,
          setDateOptions: {},
          newDateExpected: "2022:02:15 00:00:00",
          expectedLog: "from file name",
        });
        expect(result.totals.before.withDate).toEqual(0);
        expect(result.totals.after.withDate).toEqual(1);
        expect(result.totals.after.modified).toEqual(1);
      });

      it("should add DateTimeOriginal from DateTimeDigitized and return report", async () => {
        const fileName = "sphinx-no-date-original.jpg";
        const { metadata } = assetData(fileName);
        const result = await expectModifiedDate({
          fileName,
          setDateOptions: {},
          newDateExpected: metadata.DateTimeDigitized,
          expectedLog: "from DateTimeDigitized",
        });
        expect(result.totals.before.withDate).toEqual(0);
        expect(result.totals.after.withDate).toEqual(1);
        expect(result.totals.after.modified).toEqual(1);
      });
    });

    describe("when fromDigitized option is false", () => {
      it("should not add DateTimeOriginal, trace and return report", async () => {
        const fileName = "sphinx-no-date-original.jpg";
        const spy = spyTracer("debug");
        const filePath = assetPath(fileName);
        const result = await setDate(filePath, {
          fromDigitized: false,
        });
        expectLog(`${fileName}: No date was found to set`, spy);
        expect(result.totals.before.withDate).toEqual(0);
        expect(result.totals.after.withDate).toEqual(0);
        expect(result.totals.after.modified).toEqual(0);
      });

      it("should add DateTimeOriginal and modify DateTimeDigitized if dateFallback is provided", async () => {
        const fileName = "sphinx-no-date-original.jpg";
        const dateFallback = "2009-09-09 09:30:00";
        const date = "2009:09:09 09:30:00";
        const result = await expectModifiedDate({
          fileName,
          setDateOptions: {
            dateFallback,
            fromDigitized: false,
          },
          newDateExpected: date,
          expectedLog: "from dateFallback option",
        });
        expect(result.totals.before.withDate).toEqual(0);
        expect(result.totals.after.withDate).toEqual(1);
        expect(result.totals.after.modified).toEqual(1);
      });

      it("should add DateTimeOriginal and not modify DateTimeDigitized if dateFallback is provided but setDigitized is false", async () => {
        const fileName = "sphinx-no-date-original.jpg";
        const { metadata } = assetData(fileName);
        const dateFallback = "2009-09-09 09:30:00";
        const date = "2009:09:09 09:30:00";
        const result = await expectModifiedDate({
          fileName,
          setDateOptions: {
            dateFallback,
            fromDigitized: false,
            setDigitized: false,
          },
          newDateExpected: date,
          dateTimeDigitedExpected: metadata.DateTimeDigitized,
          expectedLog: "from dateFallback option",
        });
        expect(result.totals.before.withDate).toEqual(0);
        expect(result.totals.after.withDate).toEqual(1);
        expect(result.totals.after.modified).toEqual(1);
      });
    });
  });

  describe("when file has both DateTimeDigitized and DateTimeOriginal", () => {
    it("should not add DateTimeOriginal from DateTimeDigitized", async () => {
      const spy = spyTracer("debug");
      const fileName = "caryatids.jpeg";
      await copyAssetToTempPath(fileName);
      const fileOrigin = tempPath(fileName);
      const result = await setDate(fileOrigin, {
        modify: true,
      });
      expectLog(`No date was found to set`, spy);
      expect(result.totals.before.withDate).toEqual(1);
      expect(result.totals.after.withDate).toEqual(1);
      expect(result.totals.after.modified).toEqual(0);
    });
  });

  describe("when date is not found", () => {
    describe("when moveToIfUnresolved option is provided", () => {
      it("should copy the file to a subfolder if outputFolder is not the same in which the file is", async () => {
        const spy = spyTracer("debug");
        const fileName = "gorilla.JPG";
        const fileOrigin = tempPath(fileName);
        const outputFolder = path.resolve(TEMP_PATH, "new-dates");
        const unknownDatesSubDir = "unknown";

        await copyAssetToTempPath(fileName);
        const result = await setDate(fileOrigin, {
          outputFolder,
          moveToIfUnresolved: unknownDatesSubDir,
        });
        expectLog(`${fileName}: Moving to unknown subfolder`, spy);
        expect(fsExtra.existsSync(fileOrigin)).toBe(true);
        expect(fsExtra.existsSync(path.resolve(outputFolder, unknownDatesSubDir, fileName))).toBe(
          true
        );
        expect(result.totals.before.withDate).toEqual(0);
        expect(result.totals.after.withDate).toEqual(0);
        expect(result.totals.after.modified).toEqual(0);
        expect(result.totals.after.moved).toEqual(1);
      });

      it("should move the file to a subfolder if outputFolder is the same in which the file is", async () => {
        const spy = spyTracer("debug");
        const fileName = "gorilla.JPG";
        const fileOrigin = tempPath(fileName);
        const outputFolder = TEMP_PATH;
        const unknownDatesSubDir = "unknown";

        await copyAssetToTempPath(fileName);
        const result = await setDate(fileOrigin, {
          outputFolder,
          moveToIfUnresolved: unknownDatesSubDir,
        });
        expectLog(`${fileName}: Moving to unknown subfolder`, spy);
        expect(fsExtra.existsSync(fileOrigin)).toBe(false);
        expect(fsExtra.existsSync(path.resolve(outputFolder, unknownDatesSubDir, fileName))).toBe(
          true
        );
        expect(result.totals.before.withDate).toEqual(0);
        expect(result.totals.after.withDate).toEqual(0);
        expect(result.totals.after.modified).toEqual(0);
        expect(result.totals.after.moved).toEqual(1);
      });

      it("should copy the file to outputFolder if copyIfNotModified is true and outputFolder is not the same in which the file is", async () => {
        const spy = spyTracer("debug");
        const fileName = "gorilla.JPG";
        const fileOrigin = tempPath(fileName);
        const outputFolder = path.resolve(TEMP_PATH, "new-dates");

        await copyAssetToTempPath(fileName);
        const result = await setDate(fileOrigin, {
          outputFolder,
          copyIfNotModified: true,
        });
        expectLog(`${fileName}: Copying to output folder`, spy);
        expect(fsExtra.existsSync(fileOrigin)).toBe(true);
        expect(fsExtra.existsSync(path.resolve(outputFolder, fileName))).toBe(true);
        expect(result.totals.before.withDate).toEqual(0);
        expect(result.totals.after.withDate).toEqual(0);
        expect(result.totals.before.withoutDate).toEqual(1);
        expect(result.totals.after.withoutDate).toEqual(1);
        expect(result.totals.after.modified).toEqual(0);
        expect(result.totals.after.copied).toEqual(1);
      });

      it("should not copy the file if copyIfNotModified is true but outputFolder is the same in which the file is", async () => {
        const spy = spyTracer("debug");
        const fileName = "gorilla.JPG";
        const fileOrigin = tempPath(fileName);
        const outputFolder = TEMP_PATH;

        await copyAssetToTempPath(fileName);
        const result = await setDate(fileOrigin, {
          outputFolder,
          copyIfNotModified: true,
        });
        expectLog(`${fileName}: No date was found to set`, spy);
        expect(fsExtra.existsSync(fileOrigin)).toBe(true);
        expect(result.totals.before.withDate).toEqual(0);
        expect(result.totals.after.withDate).toEqual(0);
        expect(result.totals.before.withoutDate).toEqual(1);
        expect(result.totals.after.withoutDate).toEqual(1);
        expect(result.totals.after.modified).toEqual(0);
        expect(result.totals.after.copied).toEqual(0);
      });
    });
  });

  describe("when there is an error writing exif info", () => {
    describe("when copyIfNotModified option is true", () => {
      it("should copy the file if outputFolder is not the same in which the file is", async () => {
        sandbox.stub(piexif, "insert").throws(new Error("Piexifjs error"));
        const spy = spyTracer("error");
        const fileName = "gorilla.JPG";
        const fileOrigin = tempPath(fileName);
        const outputFolder = path.resolve(TEMP_PATH, "unsupported");

        await copyAssetToTempPath(fileName);
        const result = await setDate(fileOrigin, {
          date: "2022-02-14",
          outputFolder,
          copyIfNotModified: true,
        });
        expectLog(`Error writing Exif`, spy);
        expectLog(`Piexifjs error`, spy);
        expect(fsExtra.existsSync(fileOrigin)).toBe(true);
        expect(fsExtra.existsSync(path.resolve(outputFolder, fileName))).toBe(true);
        expect(result.totals.before.supported).toEqual(1);
        expect(result.totals.before.unsupported).toEqual(0);
        expect(result.totals.before.withDate).toEqual(0);
        expect(result.totals.before.withoutDate).toEqual(1);
        expect(result.totals.after.supported).toEqual(1);
        expect(result.totals.after.unsupported).toEqual(0);
        expect(result.totals.after.withDate).toEqual(0);
        expect(result.totals.after.withoutDate).toEqual(1);
        expect(result.totals.after.copied).toEqual(1);
      });
    });
  });

  describe("when it is not supported", () => {
    describe("when copyIfNotModified option is true", () => {
      it("should copy the file if outputFolder is not the same in which the file is", async () => {
        const spy = spyTracer("debug");
        const fileName = "wadi-rum.png";
        const fileOrigin = tempPath(fileName);
        const outputFolder = path.resolve(TEMP_PATH, "unsupported");

        await copyAssetToTempPath(fileName);
        const result = await setDate(fileOrigin, {
          outputFolder,
          copyIfNotModified: true,
        });
        expectLog(`${fileName}: Copying to output folder`, spy);
        expect(fsExtra.existsSync(fileOrigin)).toBe(true);
        expect(fsExtra.existsSync(path.resolve(outputFolder, fileName))).toBe(true);
        expect(result.totals.before.supported).toEqual(0);
        expect(result.totals.before.unsupported).toEqual(1);
        expect(result.totals.before.withDate).toEqual(0);
        expect(result.totals.before.withoutDate).toEqual(0);
        expect(result.totals.after.supported).toEqual(0);
        expect(result.totals.after.unsupported).toEqual(1);
        expect(result.totals.after.withDate).toEqual(0);
        expect(result.totals.after.withoutDate).toEqual(0);
        expect(result.totals.after.copied).toEqual(1);
      });
    });

    describe("when moveToIfUnresolved option is true", () => {
      it("should copy the file if outputFolder is not the same in which the file is", async () => {
        const spy = spyTracer("debug");
        const fileName = "wadi-rum.png";
        const fileOrigin = tempPath(fileName);
        const outputFolder = path.resolve(TEMP_PATH, "unsupported");
        const unresolvedDir = "unresolved";

        await copyAssetToTempPath(fileName);
        const result = await setDate(fileOrigin, {
          outputFolder,
          copyIfNotModified: true,
          moveToIfUnresolved: unresolvedDir,
        });
        expectLog(`${fileName}: Moving to unresolved subfolder`, spy);
        expect(fsExtra.existsSync(fileOrigin)).toBe(true);
        expect(fsExtra.existsSync(path.resolve(outputFolder, unresolvedDir, fileName))).toBe(true);
        expect(result.totals.before.unsupported).toEqual(1);
        expect(result.totals.after.unsupported).toEqual(1);
        expect(result.totals.after.copied).toEqual(0);
        expect(result.totals.after.moved).toEqual(1);
      });
    });
  });

  describe("when fileName is a valid date", () => {
    function testFileName(newFileName, dateFormats, date, passFormat) {
      describe(`when fileName is ${newFileName} and dateFormats are ${
        passFormat ? dateFormats : "not defined"
      }`, () => {
        it("should add date to exif and save the file to output folder, without modifying the original file", async () => {
          const fileName = "gorilla.JPG";
          const outputFolder = path.resolve(TEMP_PATH, "modified");
          await copyAssetToTempPath(fileName, newFileName);
          const fileOrigin = tempPath(newFileName);

          const result = await expectModifiedDate({
            inputPath: TEMP_PATH,
            fileName: newFileName,
            setDateOptions: {
              outputFolder,
              dateFormats: passFormat && dateFormats,
            },
            newDateExpected: date,
            dateTimeDigitedExpected: date,
            expectedLog: "from file name",
          });

          // Check also original file
          expect(fsExtra.existsSync(fileOrigin)).toBe(true);
          const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(fileOrigin);
          expect(DateTimeOriginal).toBe(undefined);
          expect(DateTimeDigitized).toBe(undefined);
          expect(result.totals.before.withDate).toEqual(0);
          expect(result.totals.after.withDate).toEqual(1);
          expect(result.totals.after.modified).toEqual(1);
        });
      });
    }

    testFileName("2013-10-23-10_32-55.jpg", ["yyyy-MM-dd-hh_mm-ss"], "2013:10:23 10:32:55", true);
    testFileName("23_10_2013-10_32_55.jpg", ["dd_MM_yyyy-hh_mm_ss"], "2013:10:23 10:32:55", true);
    testFileName("2013-10-23 10-32-55.jpg", ["yyyy-MM-dd HH-mm-ss"], "2013:10:23 10:32:55", true);
    testFileName("2013-10-23 10_32.jpg", ["yyyy-MM-dd HH_mm"], "2013:10:23 10:32:00", true);
    testFileName("2013-10-23 10.jpg", ["yyyy-MM-dd HH"], "2013:10:23 10:00:00");
    testFileName("2013-10-23 5.jpg", ["yyyy-MM-dd h"], "2013:10:23 05:00:00", true);
    testFileName("2013-10-23.jpg", ["yyyy-MM-dd"], "2013:10:23 00:00:00");
    testFileName("2013-10.jpg", ["yyyy-MM"], "2013:10:01 00:00:00");
    testFileName("2013.jpg", ["yyyy"], "2013:01:01 00:00:00");

    describe("when outputFolder is the same to file folder", () => {
      it("should add date to exif in original file", async () => {
        const fileName = "gorilla.JPG";
        const newFileName = "2013-10-23.jpg";
        const date = "2013:10:23 00:00:00";
        await copyAssetToTempPath(fileName, newFileName);

        const result = await expectModifiedDate({
          inputPath: TEMP_PATH,
          fileName: newFileName,
          newDateExpected: date,
          dateTimeDigitedExpected: date,
          expectedLog: "from file name",
        });
        expect(result.totals.before.withDate).toEqual(0);
        expect(result.totals.after.withDate).toEqual(1);
        expect(result.totals.after.modified).toEqual(1);
        expect(result.totals.before.path).toEqual(result.totals.after.path);
      });
    });

    describe("when no outputFolder is provided", () => {
      it("should add date to exif in original file", async () => {
        const fileName = "gorilla.JPG";
        const newFileName = "2013-10-23.jpg";
        const date = "2013:10:23 00:00:00";
        await copyAssetToTempPath(fileName, newFileName);

        const result = await expectModifiedDate({
          noOutputFolder: true,
          inputPath: TEMP_PATH,
          fileName: newFileName,
          newDateExpected: date,
          dateTimeDigitedExpected: date,
          expectedLog: "from file name",
        });
        expect(result.totals.before.withDate).toEqual(0);
        expect(result.totals.after.withDate).toEqual(1);
        expect(result.totals.after.modified).toEqual(1);
        expect(result.totals.before.path).toEqual(result.totals.after.path);
      });
    });

    describe("when modifyTime option is not provided", () => {
      it("should add date to exif, setting time to first day second if file name has not time info", async () => {
        const fileName = "caryatids.jpeg";
        const newFileName = "2012-02-15.jpg";
        const date = "2012:02:15 00:00:00";
        await copyAssetToTempPath(fileName, newFileName);

        const result = await expectModifiedDate({
          inputPath: TEMP_PATH,
          fileName: newFileName,
          newDateExpected: date,
          dateTimeDigitedExpected: date,
          setDateOptions: {
            modify: true,
          },
          expectedLog: "from file name",
        });
        expect(result.totals.before.withDate).toEqual(1);
        expect(result.totals.after.withDate).toEqual(1);
        expect(result.totals.after.modified).toEqual(1);
      });

      it("should add date to exif, setting time from file name info", async () => {
        const fileName = "caryatids.jpeg";
        const newFileName = "2012-02-15T15:23:54.jpg";
        const date = "2012:02:15 15:23:54";
        await copyAssetToTempPath(fileName, newFileName);

        const result = await expectModifiedDate({
          inputPath: TEMP_PATH,
          fileName: newFileName,
          newDateExpected: date,
          dateTimeDigitedExpected: date,
          setDateOptions: {
            modify: true,
          },
          expectedLog: "from file name",
        });
        expect(result.totals.before.withDate).toEqual(1);
        expect(result.totals.after.withDate).toEqual(1);
        expect(result.totals.after.modified).toEqual(1);
      });
    });

    describe("when modifyTime option is false", () => {
      it("should add date to exif, but keeping old time", async () => {
        const fileName = "caryatids.jpeg";
        const newFileName = "2012-02-15.jpg";
        const date = "2012:02:15 10:24:14";
        await copyAssetToTempPath(fileName, newFileName);

        const result = await expectModifiedDate({
          inputPath: TEMP_PATH,
          fileName: newFileName,
          newDateExpected: date,
          dateTimeDigitedExpected: date,
          setDateOptions: {
            modify: true,
            modifyTime: false,
          },
          expectedLog: "from file name",
        });
        expect(result.totals.before.withDate).toEqual(1);
        expect(result.totals.after.withDate).toEqual(1);
        expect(result.totals.after.modified).toEqual(1);
      });
    });

    describe("When dryRun option is provided", () => {
      it("should only report modifications withour modifying original file", async () => {
        const spy = spyTracer("debug");
        const fileName = "gorilla.JPG";
        const newFileName = "2013-10-23.jpg";
        await copyAssetToTempPath(fileName, newFileName);
        const fileOrigin = tempPath(newFileName);

        const result = await setDate(fileOrigin, {
          dryRun: true,
        });

        expectLog(
          `2013-10-23.jpg: Setting DateTimeOriginal and DateTimeDigitized to 2013-10-23 00:00:00, from file name`,
          spy
        );
        expect(result.totals.before.withDate).toEqual(0);
        expect(result.totals.after.withDate).toEqual(1);
        expect(result.totals.after.copied).toEqual(0);
        expect(result.totals.after.moved).toEqual(0);
        expect(result.totals.after.modified).toEqual(1);
        expect(result.totals.before.path).toEqual(result.totals.after.path);
      });
    });
  });

  describe("when fileName is a valid partial date and baseDate is provided", () => {
    function testFileName(newFileName, dateFormats, baseDate, date) {
      describe(`when fileName is ${newFileName}, baseDate is ${baseDate} and dateFormats are ${dateFormats}`, () => {
        it("should add date to exif and save the file to output folder", async () => {
          const fileName = "gorilla.JPG";
          const outputFolder = path.resolve(TEMP_PATH, "modified");
          await copyAssetToTempPath(fileName, newFileName);
          const fileOrigin = tempPath(newFileName);

          const result = await expectModifiedDate({
            inputPath: TEMP_PATH,
            fileName: newFileName,
            setDateOptions: {
              outputFolder,
              dateFormats,
              baseDate,
            },
            newDateExpected: date,
            dateTimeDigitedExpected: date,
            expectedLog: "from file name",
          });

          // Check also original file
          expect(fsExtra.existsSync(fileOrigin)).toBe(true);
          const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(fileOrigin);
          expect(DateTimeOriginal).toBe(undefined);
          expect(DateTimeDigitized).toBe(undefined);
          expect(result.totals.before.withDate).toEqual(0);
          expect(result.totals.after.withDate).toEqual(1);
          expect(result.totals.after.modified).toEqual(1);
        });
      });
    }

    testFileName("10-23.jpg", ["MM-dd", "yyyy"], "2015", "2015:10:23 00:00:00");
    testFileName("18.jpg", ["dd", "yyyy-MM"], "2015-10", "2015:10:18 00:00:00");
    testFileName("18_13_24.jpg", ["HH_mm_ss", "yyyy-MM-dd"], "2015-10-23", "2015:10:23 18:13:24");
    testFileName("17_30.jpg", ["HH_mm", "yyyy-MM-dd"], "2015-10-23", "2015:10:23 17:30:00");
  });

  describe("when fileName is a valid partial date and dateCandidates are provided", () => {
    function testFileName(newFileName, dateFormats, dateCandidates, baseDateFallback, date) {
      describe(`when fileName is ${newFileName}, dateFormats are ${dateFormats}, date candidates are ${dateCandidates}, and baseDateFallback is ${baseDateFallback}`, () => {
        it("should add date to exif using baseDate from dateCandidates and save the file to output folder", async () => {
          const fileName = "gorilla.JPG";
          const outputFolder = path.resolve(TEMP_PATH, "modified");
          await copyAssetToTempPath(fileName, newFileName);
          const fileOrigin = tempPath(newFileName);

          const result = await expectModifiedDate({
            inputPath: TEMP_PATH,
            fileName: newFileName,
            setDateOptions: {
              outputFolder,
              dateFormats,
              baseDateFallback,
              dateCandidates,
            },
            newDateExpected: date,
            dateTimeDigitedExpected: date,
            expectedLog: "from file name",
          });

          // Check also original file
          expect(fsExtra.existsSync(fileOrigin)).toBe(true);
          const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(fileOrigin);
          expect(DateTimeOriginal).toBe(undefined);
          expect(DateTimeDigitized).toBe(undefined);
          expect(result.totals.before.withDate).toEqual(0);
          expect(result.totals.after.withDate).toEqual(1);
          expect(result.totals.after.modified).toEqual(1);
        });
      });
    }

    testFileName(
      "10-23.jpg",
      ["MM-dd", "yyyy"],
      ["foo", "2015", "1979"],
      null,
      "2015:10:23 00:00:00"
    );
    testFileName(
      "10-23.jpg",
      ["MM-dd", "yyyy"],
      ["foo", "var", "x"],
      "2015",
      "2015:10:23 00:00:00"
    );
    testFileName(
      "18.jpg",
      ["dd", "yyyy-MM"],
      ["invalid", "2015-10", "2015"],
      null,
      "2015:10:18 00:00:00"
    );
    testFileName(
      "18.jpg",
      ["dd", "yyyy-MM"],
      ["invalid", "foo2", "foo"],
      "2015-10",
      "2015:10:18 00:00:00"
    );
    testFileName(
      "18.jpg",
      ["dd", "MM_dd"],
      ["invalid", "10_01", "foo"],
      "2015",
      "2015:10:18 00:00:00"
    );
    testFileName("19.jpg", ["MM", "dd"], ["invalid", "11", "foo"], "2016", "2016:11:19 00:00:00");
    testFileName(
      "18_13_24.jpg",
      ["yyyy-MM-dd", "HH_mm_ss"],
      ["2015-10-23"],
      null,
      "2015:10:23 18:13:24"
    );
    testFileName(
      "17_30.jpg",
      ["yyyy-MM-dd", "HH_mm"],
      ["no-date", "foo", "invalid", "2015-10-23", "2015-10-24"],
      null,
      "2015:10:23 17:30:00"
    );
  });

  describe("when fileName is a valid partial date, dateCandidates are provided but baseDateFromDateCandidates is false", () => {
    function testFileName(newFileName, dateFormats, dateCandidates, baseDateFallback, date) {
      describe(`when fileName is ${newFileName}, formats are ${dateFormats}, and baseDateFallback is ${baseDateFallback}`, () => {
        it("should add date to exif using baseDate from baseDateFallback and save the file to output folder", async () => {
          const fileName = "gorilla.JPG";
          const outputFolder = path.resolve(TEMP_PATH, "modified");
          await copyAssetToTempPath(fileName, newFileName);
          const fileOrigin = tempPath(newFileName);

          const result = await expectModifiedDate({
            inputPath: TEMP_PATH,
            fileName: newFileName,
            setDateOptions: {
              outputFolder,
              dateFormats,
              dateCandidates,
              baseDateFromDateCandidates: false,
              baseDateFallback,
            },
            newDateExpected: date,
            dateTimeDigitedExpected: date,
            expectedLog: "from file name",
          });

          // Check also original file
          expect(fsExtra.existsSync(fileOrigin)).toBe(true);
          const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(fileOrigin);
          expect(DateTimeOriginal).toBe(undefined);
          expect(DateTimeDigitized).toBe(undefined);
          expect(result.totals.before.withDate).toEqual(0);
          expect(result.totals.after.withDate).toEqual(1);
          expect(result.totals.after.modified).toEqual(1);
        });
      });
    }

    testFileName(
      "10-23.jpg",
      ["MM-dd", "yyyy"],
      ["foo", "2015", "1979"],
      "2016",
      "2016:10:23 00:00:00"
    );
    testFileName(
      "18.jpg",
      ["dd", "yyyy-MM"],
      ["invalid", "2015", "2015-10"],
      "2016-10",
      "2016:10:18 00:00:00"
    );
    testFileName(
      "18_13_24.jpg",
      ["HH_mm_ss", "yyyy-MM-dd"],
      ["2015-10-23"],
      "2017-11-24",
      "2017:11:24 18:13:24"
    );
    testFileName(
      "17_30.jpg",
      ["HH_mm", "yyyy-MM-dd"],
      ["no-date", "foo", "invalid", "2015-10-23", "2015-10-24"],
      "2018-12-15",
      "2018:12:15 17:30:00"
    );
  });

  describe("when fileName contains a valid date and dateRegexs are provided", () => {
    function testFileName(newFileName, dateFormats, dateRegexs, date) {
      describe(`when fileName has name ${newFileName}, and dateRegexs are ${dateRegexs}`, () => {
        it("should add date to exif and save the file to output folder", async () => {
          const fileName = "gorilla.JPG";
          const outputFolder = path.resolve(TEMP_PATH, "modified");
          await copyAssetToTempPath(fileName, newFileName);
          const fileOrigin = tempPath(newFileName);

          const result = await expectModifiedDate({
            inputPath: TEMP_PATH,
            fileName: newFileName,
            setDateOptions: {
              outputFolder,
              dateFormats,
              dateRegexs,
            },
            newDateExpected: date,
            dateTimeDigitedExpected: date,
            expectedLog: "from file name",
          });

          // Check also original file
          expect(fsExtra.existsSync(fileOrigin)).toBe(true);
          const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(fileOrigin);
          expect(DateTimeOriginal).toBe(undefined);
          expect(DateTimeDigitized).toBe(undefined);
          expect(result.totals.before.withDate).toEqual(0);
          expect(result.totals.after.withDate).toEqual(1);
          expect(result.totals.after.modified).toEqual(1);
        });
      });
    }

    testFileName(
      "DAC-2013-10-23-foo.jpg",
      ["yyyy-MM-dd"],
      ["DAC-(\\S*)-foo", "foo-(\\S*)-foo"],
      "2013:10:23 00:00:00"
    );
    testFileName(
      "DAC-2013-10-23-foo.jpg",
      ["yyyy-MM-dd"],
      ["foo-(\\S*)-foo", "DAC-(\\S*)-foo"],
      "2013:10:23 00:00:00"
    );
  });

  describe("when fileName contains a valid partial date and dateRegexs and baseDate are provided", () => {
    function testFileName(newFileName, dateFormats, dateRegexs, baseDate, date) {
      describe(`when fileName has name ${newFileName}, dateRegexs are ${dateRegexs}, baseDate is ${baseDate} and dateFormats are ${dateFormats}`, () => {
        it("should add date to exif and save the file to output folder", async () => {
          const fileName = "gorilla.JPG";
          const outputFolder = path.resolve(TEMP_PATH, "modified");
          await copyAssetToTempPath(fileName, newFileName);
          const fileOrigin = tempPath(newFileName);

          const result = await expectModifiedDate({
            inputPath: TEMP_PATH,
            fileName: newFileName,
            setDateOptions: {
              outputFolder,
              dateFormats,
              dateRegexs,
              baseDate,
            },
            newDateExpected: date,
            dateTimeDigitedExpected: date,
            expectedLog: "from file name",
          });

          // Check also original file
          expect(fsExtra.existsSync(fileOrigin)).toBe(true);
          const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(fileOrigin);
          expect(DateTimeOriginal).toBe(undefined);
          expect(DateTimeDigitized).toBe(undefined);
          expect(result.totals.before.withDate).toEqual(0);
          expect(result.totals.after.withDate).toEqual(1);
          expect(result.totals.after.modified).toEqual(1);
        });
      });
    }

    testFileName(
      "day_23.jpg",
      ["dd", "MM-yyyy"],
      ["day_(\\S*)"],
      "10-2013",
      "2013:10:23 00:00:00"
    );
    testFileName(
      "DAY_26.jpg",
      ["MM-yyyy", "dd"],
      ["DAY_(\\S*)"],
      "11-2015",
      "2015:11:26 00:00:00"
    );
    testFileName(
      "DAY_HOUR-21-13.jpg",
      ["dd-HH", "MM-yyyy"],
      ["DAY_HOUR-(\\S*)"],
      "07-2020",
      "2020:07:21 13:00:00"
    );
  });

  describe("when dateRegexs does not capture anything from fileName but dateFallback is provided", () => {
    it("should add dateFallback to file", async () => {
      const fileName = "gorilla.JPG";
      const newFileName = "DAY_HOUR-21-13.jpg";
      const outputFolder = path.resolve(TEMP_PATH, "modified");
      await copyAssetToTempPath(fileName, newFileName);
      const fileOrigin = tempPath(newFileName);

      const result = await expectModifiedDate({
        inputPath: TEMP_PATH,
        fileName: newFileName,
        setDateOptions: {
          outputFolder,
          dateFormats: ["dd-HH", "MM-yyyy"],
          dateRegexs: ["DAY_HOUR_(\\S*)"],
          dateFallback: "07-2020",
        },
        newDateExpected: "2020:07:01 00:00:00",
        dateTimeDigitedExpected: "2020:07:01 00:00:00",
        expectedLog: "from dateFallback",
      });

      // Check also original file
      expect(fsExtra.existsSync(fileOrigin)).toBe(true);
      const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(fileOrigin);
      expect(DateTimeOriginal).toBe(undefined);
      expect(DateTimeDigitized).toBe(undefined);
      expect(result.totals.before.withDate).toEqual(0);
      expect(result.totals.after.withDate).toEqual(1);
      expect(result.totals.after.modified).toEqual(1);
    });
  });

  describe("when dateRegexs does not capture anything from fileName", () => {
    it("should trace warn and return report", async () => {
      const fileName = "gorilla.JPG";
      const newFileName = "DAC-2013-10-23-foo.jpg";
      const fileOrigin = tempPath(newFileName);
      const spy = spyTracer("debug");
      await copyAssetToTempPath(fileName, newFileName);

      const result = await setDate(fileOrigin, {
        dateRegexs: ["prefix(x)suffix"],
      });
      expectLog(`${newFileName}: No date was found to set`, spy);
      expect(result.totals.before.withDate).toEqual(0);
      expect(result.totals.after.withDate).toEqual(0);
      expect(result.totals.after.copied).toEqual(0);
      expect(result.totals.after.moved).toEqual(0);
      expect(result.totals.after.modified).toEqual(0);
    });
  });

  describe("when first date candidate is a valid date", () => {
    function testDateCandidates(dateCandidates, dateFormats, date) {
      describe(`when dateCandidates are ${dateCandidates} and dateFormats are ${dateFormats}`, () => {
        it("should add date to exif and save the file to output folder, without modifying the original file", async () => {
          const fileName = "gorilla.JPG";
          const outputFolder = path.resolve(TEMP_PATH, "modified");
          await copyAssetToTempPath(fileName, fileName);
          const fileOrigin = tempPath(fileName);

          const result = await expectModifiedDate({
            inputPath: TEMP_PATH,
            fileName,
            setDateOptions: {
              outputFolder,
              dateCandidates,
            },
            newDateExpected: date,
            dateTimeDigitedExpected: date,
            expectedLog: "from date candidate",
          });

          // Check also original file
          expect(fsExtra.existsSync(fileOrigin)).toBe(true);
          const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(fileOrigin);
          expect(DateTimeOriginal).toBe(undefined);
          expect(DateTimeDigitized).toBe(undefined);
          expect(result.totals.before.withDate).toEqual(0);
          expect(result.totals.after.withDate).toEqual(1);
          expect(result.totals.after.copied).toEqual(0);
          expect(result.totals.after.moved).toEqual(0);
          expect(result.totals.after.modified).toEqual(1);
        });
      });
    }

    testDateCandidates(["2013-10-23 10:32:55"], ["YYYY-MM-dd hh:mm:ss"], "2013:10:23 10:32:55");
    testDateCandidates(["2013-10-23 10:32"], ["YYYY-MM-dd hh:mm"], "2013:10:23 10:32:00");
    testDateCandidates(["2013-10-23 10"], ["YYYY-MM-dd hh"], "2013:10:23 10:00:00");
    testDateCandidates(["2013-10-23"], ["YYYY-MM-dd"], "2013:10:23 00:00:00");
    testDateCandidates(["2013-10"], ["YYYY-MM"], "2013:10:01 00:00:00");
    testDateCandidates(["2013"], ["YYYY"], "2013:01:01 00:00:00");

    describe("when outputFolder is the same to file folder", () => {
      it("should add date to exif in original file", async () => {
        const fileName = "gorilla.JPG";
        const folderName = "2013-10-23 10:32:55";
        const date = "2013:10:23 10:32:55";
        await copyAssetToTempPath(fileName, fileName);

        const result = await expectModifiedDate({
          inputPath: TEMP_PATH,
          fileName,
          setDateOptions: {
            dateCandidates: [folderName],
          },
          newDateExpected: date,
          dateTimeDigitedExpected: date,
          expectedLog: "from date candidate",
        });
        expect(result.totals.before.withDate).toEqual(0);
        expect(result.totals.after.withDate).toEqual(1);
        expect(result.totals.after.copied).toEqual(0);
        expect(result.totals.after.moved).toEqual(0);
        expect(result.totals.after.modified).toEqual(1);
        expect(result.totals.after.path).toEqual(result.totals.before.path);
      });
    });
  });
});
