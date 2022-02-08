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

  function expectLog(log, spy, callIndex = 0) {
    const firstSpyCall = spy.getCall(callIndex);
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
        expect(() =>
          setDate(imagePath, {
            baseDate: "2022:06:16 12:00:00",
          })
        ).toThrow("baseDate must be a valid date. Please check baseDate and dateFormats options");
      });

      it("should throw an error if baseDate and dateFormats don't match", async () => {
        expect(() =>
          setDate(imagePath, {
            baseDate: "2022_06_16 12:00:00",
            baseDateFormat: "yyyy:MM:dd hh:mm:ss",
          })
        ).toThrow("baseDate must be a valid date. Please check baseDate and dateFormats options");
      });
    });

    describe("when date is provided", () => {
      it("should throw an error if date is not valid and no format is provided", async () => {
        expect(() =>
          setDate(imagePath, {
            date: "2022:06:16 12:00:00",
          })
        ).toThrow("date must be a valid date. Please check date and dateFormats options");
      });

      it("should throw an error if date and dateFormats don't match", async () => {
        expect(() =>
          setDate(imagePath, {
            date: "2022_06_16 12:00:00",
            dateFormats: ["yyyy:MM:dd hh:mm:ss"],
          })
        ).toThrow("date must be a valid date. Please check date and dateFormats options");
      });

      it("should not throw an error if date and dateFormats don't match but date is ISO", async () => {
        const spy = spyTracer("info");
        await setDate(imagePath, {
          date: "2022-06-16 12:00:00",
          dateFormats: ["yyyy:MM:dd hh:mm:ss"],
        });
        expectLog(`Setting DateTimeOriginal`, spy);
      });
    });

    describe("when dateFallback is provided", () => {
      it("should throw an error if dateFallback is not valid and no format is provided", async () => {
        expect(() =>
          setDate(imagePath, {
            dateFallback: "2022:06:16 12:00:00",
          })
        ).toThrow(
          "dateFallback must be a valid date. Please check dateFallback and dateFormats options"
        );
      });

      it("should throw an error if dateFallback and dateFormats don't match", async () => {
        expect(() =>
          setDate(imagePath, {
            dateFallback: "2022--06_16 12:00:00",
            dateFormats: ["yyyy:MM:dd hh:mm:ss"],
          })
        ).toThrow(
          "dateFallback must be a valid date. Please check dateFallback and dateFormats options"
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

      describe("when dateFallback is provided and fromDigitized is false", () => {
        it("should add DateTimeOriginal and modify DateTimeDigitized", async () => {
          const fileName = "sphinx.jpg";
          const dateFallback = "2009-09-09 09:30:00";
          const date = "2009:09:09 09:30:00";
          await expectModifiedDate({
            fileName,
            setDateOptions: {
              dateFallback,
              fromDigitized: false,
              modify: true,
            },
            newDateExpected: date,
            expectedLog: "from dateFallback option",
          });
        });

        it("should add DateTimeOriginal and not modify DateTimeDigitized if setDigitized is false", async () => {
          const fileName = "sphinx.jpg";
          const { metadata } = assetData(fileName);
          const dateFallback = "2009-09-09 09:30:00";
          const date = "2009:09:09 09:30:00";
          await expectModifiedDate({
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
        const spy = spyTracer("info");
        const filePath = assetPath(fileName);
        const result = await setDate(filePath, {
          fromDigitized: false,
        });
        expectLog(`${fileName}: No date was found to set`, spy);
        expect(result).toBe(false);
      });

      it("should add DateTimeOriginal and modify DateTimeDigitized if dateFallback is provided", async () => {
        const fileName = "sphinx-no-date-original.jpg";
        const dateFallback = "2009-09-09 09:30:00";
        const date = "2009:09:09 09:30:00";
        await expectModifiedDate({
          fileName,
          setDateOptions: {
            dateFallback,
            fromDigitized: false,
          },
          newDateExpected: date,
          expectedLog: "from dateFallback option",
        });
      });

      it("should add DateTimeOriginal and not modify DateTimeDigitized if dateFallback is provided but setDigitized is false", async () => {
        const fileName = "sphinx-no-date-original.jpg";
        const { metadata } = assetData(fileName);
        const dateFallback = "2009-09-09 09:30:00";
        const date = "2009:09:09 09:30:00";
        await expectModifiedDate({
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
        expectLog(`${fileName}: Moving to unknown subfolder`, spy, 1);
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
        expectLog(`${fileName}: Moving to unknown subfolder`, spy, 1);
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
        expectLog(`${fileName}: Copying to output folder`, spy, 1);
        expect(fsExtra.existsSync(fileOrigin)).toBe(true);
        expect(fsExtra.existsSync(path.resolve(outputFolder, fileName))).toBe(true);
      });

      it("should not copy the file if copyIfNotModified is true but outputFolder is the same in which the file is", async () => {
        const spy = spyTracer("info");
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
    function testFileName(newFileName, dateFormats, date, passFormat) {
      describe(`when fileName is ${newFileName} and dateFormats are ${
        passFormat ? dateFormats : "not defined"
      }`, () => {
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
    function testFileName(newFileName, dateFormats, baseDate, date) {
      describe(`when fileName is ${newFileName}, baseDate is ${baseDate} and dateFormats are ${dateFormats}`, () => {
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

          await expectModifiedDate({
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

          await expectModifiedDate({
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

          await expectModifiedDate({
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

          await expectModifiedDate({
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

      await expectModifiedDate({
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
    });
  });

  describe("when dateRegexs does not capture anything from fileName", () => {
    it("should trace warn and return false", async () => {
      const fileName = "gorilla.JPG";
      const newFileName = "DAC-2013-10-23-foo.jpg";
      const fileOrigin = tempPath(newFileName);
      const spy = spyTracer("info");
      await copyAssetToTempPath(fileName, newFileName);

      const result = await setDate(fileOrigin, {
        dateRegexs: ["prefix(x)suffix"],
      });
      expectLog(`${newFileName}: No date was found to set`, spy);
      expect(result).toBe(false);
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

          await expectModifiedDate({
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
