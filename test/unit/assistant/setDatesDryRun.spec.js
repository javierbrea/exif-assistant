const { existsSync } = require("fs-extra");
const { setDates } = require("../../../src/assistant/setDateMethods");

const {
  resetTempPath,
  TEMP_OUTPUT_FOLDER,
  copyFixturesToTempPath,
  tempFixturesFolder,
} = require("../../support/assets");

const FIXTURE = "formats-regexs";

describe(`setDates executed in ${FIXTURE} fixtures with dryRun option`, () => {
  beforeAll(async () => {
    await resetTempPath();
  });

  describe("when modify option is true, fromDigited is false, and formats and regexs are provided", () => {
    beforeAll(async () => {
      await resetTempPath();
      await copyFixturesToTempPath(FIXTURE);
      await setDates(tempFixturesFolder(FIXTURE), {
        copyAll: true,
        outputFolder: TEMP_OUTPUT_FOLDER,
        fromDigitized: false,
        modify: true,
        dateFormats: ["dd_MM_yyyy", "dd_MM", "dd", "yyyy"],
        dateRegexs: [/^date[_\-](\S*)/, /^(\S*)\-date$/, /^day\s(\S*)/, /^year\s(\S*)/],
        dryRun: true,
      });
    });

    it("should have not created outputFolder", async () => {
      expect(existsSync(TEMP_OUTPUT_FOLDER)).toEqual(false);
    });
  });

  describe("when modify option is true, fromDigited is false, formats and regexs are provided and moveUnresolvedTo is true", () => {
    beforeAll(async () => {
      await resetTempPath();
      await copyFixturesToTempPath(FIXTURE);
      await setDates(tempFixturesFolder(FIXTURE), {
        copyAll: true,
        moveUnresolvedTo: "unresolved",
        fromDigitized: false,
        modify: true,
        dateFormats: ["dd_MM_yyyy", "dd_MM", "dd", "yyyy"],
        dateRegexs: [/^date[_\-](\S*)/, /^(\S*)\-date$/, /^day\s(\S*)/, /^year\s(\S*)/],
        dryRun: true,
      });
    });

    it("should have not created outputFolder", async () => {
      expect(existsSync(TEMP_OUTPUT_FOLDER)).toEqual(false);
    });
  });
  // TODO, add tests checking reports
});
