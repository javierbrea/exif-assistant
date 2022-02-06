const path = require("path");
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
    const firstSpyCall = spy.getCall(0);
    const args = firstSpyCall && firstSpyCall.args;
    const firstArg = (args && args[0]) || "";
    expect(firstArg).toEqual(expect.stringContaining(log));
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
    const spy = spyTracer("info");
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
    expect(result).toBe(true);
  }

  describe("validations", () => {
    describe("input file", () => {
      it("should throw an error if input file does not exist", async () => {
        const fileName = "foo.JPG";
        const filePath = assetPath(fileName);
        expect(() =>
          setDate(filePath, {
            baseDate: "2022:06:16 12:00:00",
          })
        ).toThrow("input file does not exist");
      });

      it("should throw an error if input file is a folder", async () => {
        expect(() =>
          setDate(TEMP_PATH, {
            baseDate: "2022:06:16 12:00:00",
          })
        ).toThrow("input file must be a file");
      });
    });

    describe("when baseDate is provided", () => {
      it("should throw an error if baseDate is invalid and no format is provided", async () => {
        const fileName = "gorilla.JPG";
        const filePath = assetPath(fileName);
        expect(() =>
          setDate(filePath, {
            baseDate: "2022:06:16 12:00:00",
          })
        ).toThrow(
          "baseDate must be a valid date. Please check baseDate and baseDateFormat options"
        );
      });

      it("should throw an error if baseDate and baseDateFormat don't match", async () => {
        const fileName = "gorilla.JPG";
        const filePath = assetPath(fileName);
        expect(() =>
          setDate(filePath, {
            baseDate: "2022-06-16 12:00:00",
            baseDateFormat: "yyyy:MM:dd hh:mm:ss",
          })
        ).toThrow(
          "baseDate must be a valid date. Please check baseDate and baseDateFormat options"
        );
      });
    });

    describe("when date is provided", () => {
      it("should throw an error if date is not valid and no format is provided", async () => {
        const fileName = "gorilla.JPG";
        const filePath = assetPath(fileName);
        expect(() =>
          setDate(filePath, {
            date: "2022:06:16 12:00:00",
          })
        ).toThrow("date must be a valid date. Please check date and dateFormat options");
      });

      it("should throw an error if date and dateFormat don't match", async () => {
        const fileName = "gorilla.JPG";
        const filePath = assetPath(fileName);
        expect(() =>
          setDate(filePath, {
            date: "2022-06-16 12:00:00",
            dateFormat: "yyyy:MM:dd hh:mm:ss",
          })
        ).toThrow("date must be a valid date. Please check date and dateFormat options");
      });
    });

    describe("when fallbackDate is provided", () => {
      it("should throw an error if fallbackDate is not valid and no format is provided", async () => {
        const fileName = "gorilla.JPG";
        const filePath = assetPath(fileName);
        expect(() =>
          setDate(filePath, {
            fallbackDate: "2022:06:16 12:00:00",
          })
        ).toThrow(
          "fallbackDate must be a valid date. Please check fallbackDate and fallbackDateFormat options"
        );
      });

      it("should throw an error if fallbackDate and fallbackDate don't match", async () => {
        const fileName = "gorilla.JPG";
        const filePath = assetPath(fileName);
        expect(() =>
          setDate(filePath, {
            fallbackDate: "2022-06-16 12:00:00",
            fallbackDateFormat: "yyyy:MM:dd hh:mm:ss",
          })
        ).toThrow(
          "fallbackDate must be a valid date. Please check fallbackDate and fallbackDateFormat options"
        );
      });
    });
  });

  describe("when file is not supported", () => {
    it("should trace warning and return false", async () => {
      const fileName = "wadi-rum.png";
      const spy = spyTracer("warn");
      const filePath = assetPath(fileName);
      const result = await setDate(filePath);
      expectLog(`${fileName}: File type is not supported`, spy);
      expect(result).toBe(false);
    });
  });

  describe("when file has already date", () => {
    describe("when no modify option is provided", () => {
      it("should trace verbose and return false", async () => {
        const fileName = "sphinx.jpg";
        const spy = spyTracer("verbose");
        const filePath = assetPath(fileName);
        const result = await setDate(filePath);
        expectLog(`${fileName}: Already has DateTimeOriginal`, spy);
        expect(result).toBe(false);
      });
    });

    describe("when modify option is true", () => {
      describe("when date is provided", () => {
        it("should set DateTimeOriginal, DateTimeDigitized and return true", async () => {
          const dateOption = "2022-07-12 13:00:00";
          const date = "2022:07:12 13:00:00";
          await expectModifiedDate({
            fileName: "sphinx.jpg",
            setDateOptions: {
              date: dateOption,
              modify: true,
            },
            newDateExpected: date,
            expectedLog: "from date option",
          });
        });
      });

      describe("when date is provided and setDigitized option is false", () => {
        it("should set DateTimeOriginal, but not DateTimeDigitized", async () => {
          const fileName = "sphinx.jpg";
          const { metadata } = assetData(fileName);
          const dateOption = "2009-09-09 09:00:00";
          const date = "2009:09:09 09:00:00";
          await expectModifiedDate({
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
        });
      });

      describe("when fallbackDate is provided and fromDigitized is false", () => {
        it("should add DateTimeOriginal and modify DateTimeDigitized", async () => {
          const fileName = "sphinx.jpg";
          const fallbackDate = "2009-09-09 09:30:00";
          const date = "2009:09:09 09:30:00";
          await expectModifiedDate({
            fileName,
            setDateOptions: {
              fallbackDate,
              fromDigitized: false,
              modify: true,
            },
            newDateExpected: date,
            expectedLog: "from fallbackDate option",
          });
        });

        it("should add DateTimeOriginal and not modify DateTimeDigitized if setDigitized is false", async () => {
          const fileName = "sphinx.jpg";
          const { metadata } = assetData(fileName);
          const fallbackDate = "2009-09-09 09:30:00";
          const date = "2009:09:09 09:30:00";
          await expectModifiedDate({
            fileName,
            setDateOptions: {
              fallbackDate,
              fromDigitized: false,
              setDigitized: false,
              modify: true,
            },
            newDateExpected: date,
            dateTimeDigitedExpected: metadata.DateTimeDigitized,
            expectedLog: "from fallbackDate option",
          });
        });
      });
    });
  });

  describe("when file has not date", () => {
    describe("when date is provided", () => {
      it("should add DateTimeOriginal, DateTimeDigitized and return true", async () => {
        const inputDate = "2022-06-16 12:00:00";
        const date = "2022:06:16 12:00:00";
        await expectModifiedDate({
          fileName: "gorilla.JPG",
          setDateOptions: {
            date: inputDate,
          },
          newDateExpected: date,
          expectedLog: "from date option",
        });
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
      it("should add DateTimeOriginal from DateTimeDigitized and return true", async () => {
        const fileName = "sphinx-no-date-original.jpg";
        const { metadata } = assetData(fileName);
        await expectModifiedDate({
          fileName,
          setDateOptions: {},
          newDateExpected: metadata.DateTimeDigitized,
          expectedLog: "from DateTimeDigitized",
        });
      });
    });

    describe("when fromDigitized option is false", () => {
      it("should not add DateTimeOriginal, trace and return false", async () => {
        const fileName = "sphinx-no-date-original.jpg";
        const spy = spyTracer("verbose");
        const filePath = assetPath(fileName);
        const result = await setDate(filePath, {
          fromDigitized: false,
        });
        expectLog(`${fileName}: No date was found to set`, spy);
        expect(result).toBe(false);
      });

      it("should add DateTimeOriginal and modify DateTimeDigitized if fallbackDate is provided", async () => {
        const fileName = "sphinx-no-date-original.jpg";
        const fallbackDate = "2009-09-09 09:30:00";
        const date = "2009:09:09 09:30:00";
        await expectModifiedDate({
          fileName,
          setDateOptions: {
            fallbackDate,
            fromDigitized: false,
          },
          newDateExpected: date,
          expectedLog: "from fallbackDate option",
        });
      });

      it("should add DateTimeOriginal and not modify DateTimeDigitized if fallbackDate is provided but setDigitized is false", async () => {
        const fileName = "sphinx-no-date-original.jpg";
        const { metadata } = assetData(fileName);
        const fallbackDate = "2009-09-09 09:30:00";
        const date = "2009:09:09 09:30:00";
        await expectModifiedDate({
          fileName,
          setDateOptions: {
            fallbackDate,
            fromDigitized: false,
            setDigitized: false,
          },
          newDateExpected: date,
          dateTimeDigitedExpected: metadata.DateTimeDigitized,
          expectedLog: "from fallbackDate option",
        });
      });
    });
  });

  describe("when date is not found", () => {
    describe("when moveToIfUnresolved option is provided", () => {
      it("should copy the file to a subfolder if outputFolder is not the same in which the file is", async () => {
        const spy = spyTracer("info");
        const fileName = "gorilla.JPG";
        const fileOrigin = tempPath(fileName);
        const outputFolder = path.resolve(TEMP_PATH, "new-dates");
        const unknownDatesSubDir = "unknown";

        await copyAssetToTempPath(fileName);
        await setDate(fileOrigin, {
          outputFolder,
          moveToIfUnresolved: unknownDatesSubDir,
        });
        expectLog(`${fileName}: Moving to unknown subfolder`, spy);
        expect(fsExtra.existsSync(fileOrigin)).toBe(true);
        expect(fsExtra.existsSync(path.resolve(outputFolder, unknownDatesSubDir, fileName))).toBe(
          true
        );
      });

      it("should move the file to a subfolder if outputFolder is the same in which the file is", async () => {
        const spy = spyTracer("info");
        const fileName = "gorilla.JPG";
        const fileOrigin = tempPath(fileName);
        const outputFolder = TEMP_PATH;
        const unknownDatesSubDir = "unknown";

        await copyAssetToTempPath(fileName);
        await setDate(fileOrigin, {
          outputFolder,
          moveToIfUnresolved: unknownDatesSubDir,
        });
        expectLog(`${fileName}: Moving to unknown subfolder`, spy);
        expect(fsExtra.existsSync(fileOrigin)).toBe(false);
        expect(fsExtra.existsSync(path.resolve(outputFolder, unknownDatesSubDir, fileName))).toBe(
          true
        );
      });

      it("should copy the file to outputFolder if copyIfNotModified is true and outputFolder is not the same in which the file is", async () => {
        const spy = spyTracer("info");
        const fileName = "gorilla.JPG";
        const fileOrigin = tempPath(fileName);
        const outputFolder = path.resolve(TEMP_PATH, "new-dates");

        await copyAssetToTempPath(fileName);
        await setDate(fileOrigin, {
          outputFolder,
          copyIfNotModified: true,
        });
        expectLog(`${fileName}: Copying to output folder`, spy);
        expect(fsExtra.existsSync(fileOrigin)).toBe(true);
        expect(fsExtra.existsSync(path.resolve(outputFolder, fileName))).toBe(true);
      });

      it("should not copy the file if copyIfNotModified is true but outputFolder is the same in which the file is", async () => {
        const spy = spyTracer("verbose");
        const fileName = "gorilla.JPG";
        const fileOrigin = tempPath(fileName);
        const outputFolder = TEMP_PATH;

        await copyAssetToTempPath(fileName);
        await setDate(fileOrigin, {
          outputFolder,
          copyIfNotModified: true,
        });
        expectLog(`${fileName}: No date was found to set`, spy);
        expect(fsExtra.existsSync(fileOrigin)).toBe(true);
      });
    });
  });

  describe("when is not supported", () => {
    describe("when copyIfNotModified option is true", () => {
      it("should copy the file if outputFolder is not the same in which the file is", async () => {
        const spy = spyTracer("info");
        const fileName = "wadi-rum.png";
        const fileOrigin = tempPath(fileName);
        const outputFolder = path.resolve(TEMP_PATH, "unsupported");

        await copyAssetToTempPath(fileName);
        await setDate(fileOrigin, {
          outputFolder,
          copyIfNotModified: true,
        });
        expectLog(`${fileName}: Copying to output folder`, spy);
        expect(fsExtra.existsSync(fileOrigin)).toBe(true);
        expect(fsExtra.existsSync(path.resolve(outputFolder, fileName))).toBe(true);
      });
    });

    describe("when moveToIfUnresolved option is true", () => {
      it("should copy the file if outputFolder is not the same in which the file is", async () => {
        const spy = spyTracer("info");
        const fileName = "wadi-rum.png";
        const fileOrigin = tempPath(fileName);
        const outputFolder = path.resolve(TEMP_PATH, "unsupported");
        const unresolvedDir = "unresolved";

        await copyAssetToTempPath(fileName);
        await setDate(fileOrigin, {
          outputFolder,
          copyIfNotModified: true,
          moveToIfUnresolved: unresolvedDir,
        });
        expectLog(`${fileName}: Moving to unresolved subfolder`, spy);
        expect(fsExtra.existsSync(fileOrigin)).toBe(true);
        expect(fsExtra.existsSync(path.resolve(outputFolder, unresolvedDir, fileName))).toBe(true);
      });
    });
  });

  describe("when fileName is a valid date", () => {
    function testFileName(newFileName, dateFormat, date, passFormat) {
      describe(`when fileName has format ${dateFormat}, dateFormat is ${
        passFormat ? "" : "not"
      } defined and outputFolder is different`, () => {
        it("should add date to exif and save the file to output folder, without modifying the original file", async () => {
          const fileName = "gorilla.JPG";
          const outputFolder = path.resolve(TEMP_PATH, "modified");
          await copyAssetToTempPath(fileName, newFileName);
          const fileOrigin = tempPath(newFileName);

          await expectModifiedDate({
            inputPath: TEMP_PATH,
            fileName: newFileName,
            setDateOptions: {
              outputFolder,
              dateFormat: passFormat && dateFormat,
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
        });
      });
    }

    testFileName("2013-10-23-10_32-55.jpg", "yyyy-MM-dd-hh_mm-ss", "2013:10:23 10:32:55", true);
    testFileName("23_10_2013-10_32_55.jpg", "dd_MM_yyyy-hh_mm_ss", "2013:10:23 10:32:55", true);
    testFileName("2013-10-23 10-32-55.jpg", "yyyy-MM-dd HH-mm-ss", "2013:10:23 10:32:55", true);
    testFileName("2013-10-23 10_32.jpg", "yyyy-MM-dd HH_mm", "2013:10:23 10:32:00", true);
    testFileName("2013-10-23 10.jpg", "yyyy-MM-dd HH", "2013:10:23 10:00:00");
    testFileName("2013-10-23 5.jpg", "yyyy-MM-dd h", "2013:10:23 05:00:00", true);
    testFileName("2013-10-23.jpg", "yyyy-MM-dd", "2013:10:23 00:00:00");
    testFileName("2013-10.jpg", "yyyy-MM", "2013:10:01 00:00:00");
    testFileName("2013.jpg", "yyyy", "2013:01:01 00:00:00");

    describe("when outputFolder is the same to file folder", () => {
      it("should add date to exif in original file", async () => {
        const fileName = "gorilla.JPG";
        const newFileName = "2013-10-23.jpg";
        const date = "2013:10:23 00:00:00";
        await copyAssetToTempPath(fileName, newFileName);

        await expectModifiedDate({
          inputPath: TEMP_PATH,
          fileName: newFileName,
          newDateExpected: date,
          dateTimeDigitedExpected: date,
          expectedLog: "from file name",
        });
      });
    });

    describe("when no outputFolder is provided", () => {
      it("should add date to exif in original file", async () => {
        const fileName = "gorilla.JPG";
        const newFileName = "2013-10-23.jpg";
        const date = "2013:10:23 00:00:00";
        await copyAssetToTempPath(fileName, newFileName);

        await expectModifiedDate({
          noOutputFolder: true,
          inputPath: TEMP_PATH,
          fileName: newFileName,
          newDateExpected: date,
          dateTimeDigitedExpected: date,
          expectedLog: "from file name",
        });
      });
    });
  });

  describe("when fileName is a valid partial date and baseDate is provided", () => {
    function testFileName(newFileName, dateFormat, baseDate, baseDateFormat, date) {
      describe(`when fileName has format ${dateFormat} and baseDate has format ${baseDateFormat} and outputFolder is different`, () => {
        it("should add date to exif and save the file to output folder", async () => {
          const fileName = "gorilla.JPG";
          const outputFolder = path.resolve(TEMP_PATH, "modified");
          await copyAssetToTempPath(fileName, newFileName);
          const fileOrigin = tempPath(newFileName);

          await expectModifiedDate({
            inputPath: TEMP_PATH,
            fileName: newFileName,
            setDateOptions: {
              outputFolder,
              dateFormat,
              baseDate,
              baseDateFormat,
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
        });
      });
    }

    testFileName("10-23.jpg", "MM-dd", "2015", "yyyy", "2015:10:23 00:00:00");
    testFileName("18.jpg", "dd", "2015-10", "yyyy-MM", "2015:10:18 00:00:00");
    testFileName("18_13_24.jpg", "HH_mm_ss", "2015-10-23", "yyyy-MM-dd", "2015:10:23 18:13:24");
    testFileName("17_30.jpg", "HH_mm", "2015-10-23", "yyyy-MM-dd", "2015:10:23 17:30:00");
  });

  describe("when fileName contains a valid date and dateRegex is provided", () => {
    function testFileName(newFileName, dateFormat, dateRegex, date) {
      describe(`when fileName has name ${newFileName}, and dateRegex is ${dateRegex}`, () => {
        it("should add date to exif and save the file to output folder", async () => {
          const fileName = "gorilla.JPG";
          const outputFolder = path.resolve(TEMP_PATH, "modified");
          await copyAssetToTempPath(fileName, newFileName);
          const fileOrigin = tempPath(newFileName);

          await expectModifiedDate({
            inputPath: TEMP_PATH,
            fileName: newFileName,
            setDateOptions: {
              outputFolder,
              dateFormat,
              dateRegex,
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
        });
      });
    }

    testFileName("DAC-2013-10-23-foo.jpg", "yyyy-MM-dd", "DAC-(\\S*)-foo", "2013:10:23 00:00:00");
  });

  describe("when fileName contains a valid partial date and dateRegex and baseDate are provided", () => {
    function testFileName(newFileName, dateFormat, dateRegex, baseDate, baseDateFormat, date) {
      describe(`when fileName has name ${newFileName}, dateRegex is ${dateRegex}, baseDate is ${baseDate} and baseDateFormat is ${baseDateFormat}`, () => {
        it("should add date to exif and save the file to output folder", async () => {
          const fileName = "gorilla.JPG";
          const outputFolder = path.resolve(TEMP_PATH, "modified");
          await copyAssetToTempPath(fileName, newFileName);
          const fileOrigin = tempPath(newFileName);

          await expectModifiedDate({
            inputPath: TEMP_PATH,
            fileName: newFileName,
            setDateOptions: {
              outputFolder,
              dateFormat,
              dateRegex,
              baseDate,
              baseDateFormat,
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
        });
      });
    }

    testFileName("day_23.jpg", "dd", "day_(\\S*)", "10-2013", "MM-yyyy", "2013:10:23 00:00:00");
    testFileName("DAY_26.jpg", "dd", "DAY_(\\S*)", "11-2015", "MM-yyyy", "2015:11:26 00:00:00");
    testFileName(
      "DAY_HOUR-21-13.jpg",
      "dd-HH",
      "DAY_HOUR-(\\S*)",
      "07-2020",
      "MM-yyyy",
      "2020:07:21 13:00:00"
    );
  });

  describe("when dateRegex does not capture anything from fileName but fallbackDate is provided", () => {
    it("should add fallbackDate to file", async () => {
      const fileName = "gorilla.JPG";
      const newFileName = "DAY_HOUR-21-13.jpg";
      const outputFolder = path.resolve(TEMP_PATH, "modified");
      await copyAssetToTempPath(fileName, newFileName);
      const fileOrigin = tempPath(newFileName);

      await expectModifiedDate({
        inputPath: TEMP_PATH,
        fileName: newFileName,
        setDateOptions: {
          outputFolder,
          dateFormat: "dd-HH",
          dateRegex: "DAY_HOUR_(\\S*)",
          fallbackDate: "07-2020",
          fallbackDateFormat: "MM-yyyy",
        },
        newDateExpected: "2020:07:01 00:00:00",
        dateTimeDigitedExpected: "2020:07:01 00:00:00",
        expectedLog: "from fallbackDate",
      });

      // Check also original file
      expect(fsExtra.existsSync(fileOrigin)).toBe(true);
      const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(fileOrigin);
      expect(DateTimeOriginal).toBe(undefined);
      expect(DateTimeDigitized).toBe(undefined);
    });
  });

  describe("when dateRegex does not capture anything from fileName", () => {
    it("should trace warn and return false", async () => {
      const fileName = "gorilla.JPG";
      const newFileName = "DAC-2013-10-23-foo.jpg";
      const fileOrigin = tempPath(newFileName);
      const spy = spyTracer("verbose");
      await copyAssetToTempPath(fileName, newFileName);

      const result = await setDate(fileOrigin, {
        dateRegex: "prefix(x)suffix",
      });
      expectLog(`${newFileName}: No date was found to set`, spy);
      expect(result).toBe(false);
    });
  });

  describe("when first date candidate is a valid date", () => {
    function testParentDateCandidate(dateCandidate, dateFormat, date) {
      describe(`when folderName has format ${dateFormat} and outputFolder is different`, () => {
        it("should add date to exif and save the file to output folder, without modifying the original file", async () => {
          const fileName = "gorilla.JPG";
          const outputFolder = path.resolve(TEMP_PATH, "modified");
          await copyAssetToTempPath(fileName, fileName);
          const fileOrigin = tempPath(fileName);

          await expectModifiedDate({
            inputPath: TEMP_PATH,
            fileName,
            setDateOptions: {
              outputFolder,
              dateCandidates: [dateCandidate],
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
        });
      });
    }

    testParentDateCandidate("2013-10-23 10:32:55", "YYYY-MM-dd hh:mm:ss", "2013:10:23 10:32:55");
    testParentDateCandidate("2013-10-23 10:32", "YYYY-MM-dd hh:mm", "2013:10:23 10:32:00");
    testParentDateCandidate("2013-10-23 10", "YYYY-MM-dd hh", "2013:10:23 10:00:00");
    testParentDateCandidate("2013-10-23", "YYYY-MM-dd", "2013:10:23 00:00:00");
    testParentDateCandidate("2013-10", "YYYY-MM", "2013:10:01 00:00:00");
    testParentDateCandidate("2013", "YYYY", "2013:01:01 00:00:00");

    describe("when outputFolder is the same to file folder", () => {
      it("should add date to exif in original file", async () => {
        const fileName = "gorilla.JPG";
        const folderName = "2013-10-23 10:32:55";
        const date = "2013:10:23 10:32:55";
        await copyAssetToTempPath(fileName, fileName);

        await expectModifiedDate({
          inputPath: TEMP_PATH,
          fileName,
          setDateOptions: {
            dateCandidates: [folderName],
          },
          newDateExpected: date,
          dateTimeDigitedExpected: date,
          expectedLog: "from date candidate",
        });
      });
    });
  });
});
