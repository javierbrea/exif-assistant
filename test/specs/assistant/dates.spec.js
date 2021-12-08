const sinon = require("sinon");

const { addOriginalDate } = require("../../../src/assistant/dates");
const { readExifDates } = require("../../../src/exif/fileMethods");
const { setLevel, _logger } = require("../../../src/support/tracer");

const { assetPath, tempPath, resetTempPath, TEMP_PATH } = require("../../support/assets");

setLevel("info");

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
    describe("when file is not supported", () => {
      it("should trace warning and return false", async () => {
        // TODO, add an unsupported image
        const notSupportedFileName = "metadata.json";
        const spy = spyTracer("warn");
        const filePath = assetPath(notSupportedFileName);
        const result = await addOriginalDate(filePath);
        expectLog(`${notSupportedFileName} is not supported`, spy);
        expect(result).toBe(false);
      });
    });

    describe("when file has already date", () => {
      it("should trace verbose and return false", async () => {
        const fileName = "sphinx.jpg";
        const spy = spyTracer("verbose");
        const filePath = assetPath(fileName);
        const result = await addOriginalDate(filePath);
        expectLog(`File ${fileName} already has DateTimeOriginal`, spy);
        expect(result).toBe(false);
      });
    });

    describe("when file has not date", () => {
      describe("when date is provided", () => {
        it("should add DateTimeOriginal, DateTimeDigitized and return true", async () => {
          const fileName = "gorilla.JPG";
          const date = "2022:06:16 12:00:00";
          const spy = spyTracer("info");
          const filePath = assetPath(fileName);
          const result = await addOriginalDate(filePath, {
            date,
            outputFolder: TEMP_PATH,
          });
          expectLog(`Setting ${fileName} DateTimeOriginal to ${date}, from date option`, spy);
          const { DateTimeOriginal, DateTimeDigitized } = await readExifDates(tempPath(fileName));
          expect(DateTimeOriginal).toEqual(date);
          expect(DateTimeDigitized).toEqual(date);
          expect(result).toBe(true);
        });
      });
    });
  });
});
