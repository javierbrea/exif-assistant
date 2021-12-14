const path = require("path");
const fsExtra = require("fs-extra");
const sinon = require("sinon");

const { setDate } = require("../../../src/assistant/dates");
const { readExifDates } = require("../../../src/exif/fileMethods");
const { setLevel, _logger } = require("../../../src/support/tracer");

const {
  assetPath,
  assetData,
  tempPath,
  resetTempPath,
  copyAssetToTempPath,
  TEMP_PATH,
} = require("../../support/assets");

setLevel("verbose");

describe("Exif", () => {
  let sandbox;

  function expectLog(log, spy) {
    expect(spy.getCall(0).args[0]).toEqual(expect.stringContaining(log));
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

  describe("addOriginalDate method", () => {
    async function expectModifiedDate({
      fileName,
      setDateOptions,
      newDateExpected,
      dateTimeDigitedExpected,
      expectedLog,
    }) {
      const spy = spyTracer("info");
      const filePath = assetPath(fileName);
      const options = {
        outputFolder: TEMP_PATH,
        ...setDateOptions,
      };
      const result = await setDate(filePath, options);
      const digitedHasToChange = options.setDigitized !== false;
      const dateTimeDigitizedMessage = digitedHasToChange ? ` and DateTimeDigitized` : "";
      expectLog(
        `${fileName}: Setting DateTimeOriginal${dateTimeDigitizedMessage} to ${newDateExpected},`,
        spy
      );
      if (expectedLog) {
        expectLog(expectedLog, spy);
      }
      const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(tempPath(fileName));
      expect(DateTimeOriginal).toEqual(newDateExpected);
      if (digitedHasToChange) {
        expect(DateTimeDigitized).toEqual(newDateExpected);
      } else {
        expect(DateTimeDigitized).toEqual(dateTimeDigitedExpected);
      }
      expect(result).toBe(true);
    }

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

      describe("when invalid date is provided", () => {
        it("should trace warn and return false", async () => {
          const fileName = "gorilla.JPG";
          const spy = spyTracer("warn");
          const filePath = assetPath(fileName);
          const result = await setDate(filePath, {
            date: "2022:06:16 12:00:00",
          });
          expectLog(`date option is not a valid date. Skipping`, spy);
          expect(result).toBe(false);
        });
      });

      describe("when fallbackDate date is invalid", () => {
        it("should trace warn and return false", async () => {
          const fileName = "gorilla.JPG";
          const spy = spyTracer("warn");
          const filePath = assetPath(fileName);
          const result = await setDate(filePath, {
            fallbackDate: "2022:06:16 12:00:00",
          });
          expectLog(`fallbackDate option is not a valid date. Skipping`, spy);
          expect(result).toBe(false);
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
          expectLog(`${fileName}: No date was found to set. Skipping`, spy);
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
      describe("when moveUnknownToSubfolder option is provided", () => {
        it("should copy the file to a subfolder if outputFolder is not the same in which the file is", async () => {
          const spy = spyTracer("info");
          const fileName = "gorilla.JPG";
          const fileOrigin = tempPath(fileName);
          const outputFolder = path.resolve(TEMP_PATH, "new-dates");
          const unknownDatesSubDir = "unknown";

          await copyAssetToTempPath(fileName);
          await setDate(fileOrigin, {
            outputFolder,
            moveUnknownToSubfolder: unknownDatesSubDir,
          });
          expectLog(`${fileName}: Moving to unknown subfolder`, spy);
          expect(fsExtra.existsSync(fileOrigin)).toBe(true);
          expect(
            fsExtra.existsSync(path.resolve(outputFolder, unknownDatesSubDir, fileName))
          ).toBe(true);
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
            moveUnknownToSubfolder: unknownDatesSubDir,
          });
          expectLog(`${fileName}: Moving to unknown subfolder`, spy);
          expect(fsExtra.existsSync(fileOrigin)).toBe(false);
          expect(
            fsExtra.existsSync(path.resolve(outputFolder, unknownDatesSubDir, fileName))
          ).toBe(true);
        });
      });
    });
  });
});
