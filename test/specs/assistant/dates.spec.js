const sinon = require("sinon");

const { addOriginalDate } = require("../../../src/assistant/dates");
const { setLevel, _logger } = require("../../../src/support/tracer");

const { assetPath, resetTempPath } = require("../../support/assets");

setLevel("info");

describe("Exif", () => {
  let sandbox;
  beforeAll(async () => {
    sandbox = sinon.createSandbox();
    await resetTempPath();
  });

  afterAll(() => {
    sandbox.restore();
  });

  describe("addOriginalDate method", () => {
    describe("when file is not supported", () => {
      describe("and option moveUnknown is false", () => {
        it("should trace warning and return false", async () => {
          // TODO, add an unsupported image
          const notSupportedFileName = "metadata.json";
          const spy = sandbox.spy(_logger, "warn");
          const filePath = assetPath(notSupportedFileName);
          const result = await addOriginalDate(filePath);
          expect(spy.getCall(0).args[0]).toEqual(
            expect.stringContaining(`${notSupportedFileName} is not supported`)
          );
          expect(result).toBe(false);
        });
      });
    });
  });
});
