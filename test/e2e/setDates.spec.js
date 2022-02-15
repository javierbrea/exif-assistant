const CliRunner = require("../support/CliRunner");
const {
  resetTempPath,
  tempOutputPath,
  tempFixturesFolder,
  copyFixturesToTempPath,
  tempPath,
  TEMP_OUTPUT_FOLDER,
} = require("../support/assets");
const { readExifDates } = require("../../src/exif/fileMethods");

describe("set-dates command", () => {
  describe("when modify option is true, setDigited is false and dateRegex is provided", () => {
    const FIXTURE = "iso-regex";
    beforeAll(async () => {
      await resetTempPath();
      await copyFixturesToTempPath(FIXTURE);
    });

    it("should exit with code 0", async () => {
      const cli = new CliRunner("bin/exif-assistant", [
        "set-dates",
        tempFixturesFolder(FIXTURE),
        "--copyAll",
        "--modify",
        "--no-fromDigitized",
        "--outputFolder",
        TEMP_OUTPUT_FOLDER,
        "--dateRegex",
        "^date\\-(\\S*)",
      ]);
      await cli.hasFinished();
      console.log(cli.logs);
      expect(cli.exitCode).toEqual(0);
    });

    it("should have set date from file name to image with date in root folder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("date-2021-09-25T122030.jpg")
      );
      expect(DateTimeOriginal).toEqual(`2021:09:25 12:20:30`);
    });

    it("should have set date from file name to image with date in subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("subfolder", "date-2021-09.jpeg")
      );
      expect(DateTimeOriginal).toEqual(`2021:09:01 00:00:00`);
    });

    it("should have set date from file name to image with date in sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("subfolder", "date-2013-10-23T124015", "date-2020-10-09T172815.jpeg")
      );
      expect(DateTimeOriginal).toEqual(`2020:10:09 17:28:15`);
    });

    it("should have set date from folder name to image with not date in sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("subfolder", "date-2013-10-23T124015", "gorilla.JPG")
      );
      expect(DateTimeOriginal).toEqual(`2013:10:23 12:40:15`);
    });

    it("should have set date from file name to image with date in sub sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath(
          "subfolder",
          "date-2013-10-23T124015",
          "date-1979-05",
          "date-2045-10-12.jpeg"
        )
      );
      expect(DateTimeOriginal).toEqual(`2045:10:12 00:00:00`);
    });

    it("should have set date from folder name to image without date in sub sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("subfolder", "date-2013-10-23T124015", "date-1979-05", "gorilla.JPG")
      );
      expect(DateTimeOriginal).toEqual(`1979:05:01 00:00:00`);
    });
  });

  describe("when no output folder is provided", () => {
    const FIXTURE = "iso-regex";
    let cli;

    beforeAll(async () => {
      await resetTempPath();
      await copyFixturesToTempPath(FIXTURE);
      cli = new CliRunner("bin/exif-assistant", [
        "set-dates",
        tempFixturesFolder(FIXTURE),
        "--copyAll",
        "--modify",
        "--no-fromDigitized",
        "--dateRegex",
        "^date\\-(\\S*)",
      ]);
    });

    afterAll(async () => {
      if (!cli.isClosed) {
        await cli.kill();
      }
    });

    it("should prompt for confirmation", async () => {
      await cli.hasPrinted("Files will be modified. Are you sure?");
      cli.write("y");
      cli.pressEnter();
      await cli.hasFinished();
      console.log(cli.logs);
      expect(cli.exitCode).toEqual(0);
    });

    it("should have set date from file name to image with date in root folder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempPath(FIXTURE, "date-2021-09-25T122030.jpg")
      );
      expect(DateTimeOriginal).toEqual(`2021:09:25 12:20:30`);
    });

    it("should have set date from file name to image with date in subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempPath(FIXTURE, "subfolder", "date-2021-09.jpeg")
      );
      expect(DateTimeOriginal).toEqual(`2021:09:01 00:00:00`);
    });
  });

  describe("when no output folder is provided and operation is not confirmed", () => {
    const FIXTURE = "iso-regex";
    let cli;

    beforeAll(async () => {
      await resetTempPath();
      await copyFixturesToTempPath(FIXTURE);
      cli = new CliRunner("bin/exif-assistant", [
        "set-dates",
        tempFixturesFolder(FIXTURE),
        "--copyAll",
        "--modify",
        "--no-fromDigitized",
        "--dateRegex",
        "^date\\-(\\S*)",
      ]);
    });

    afterAll(async () => {
      if (!cli.isClosed) {
        await cli.kill();
      }
    });

    it("should prompt for confirmation", async () => {
      await cli.hasPrinted("Files will be modified. Are you sure?");
      cli.pressEnter();
      await cli.hasFinished();
      console.log(cli.logs);
      expect(cli.exitCode).toEqual(0);
    });

    it("should have not set date from file name to image with date in root folder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempPath(FIXTURE, "date-2021-09-25T122030.jpg")
      );
      expect(DateTimeOriginal).toEqual(`2021:10:14 10:58:31`);
    });

    it("should have not set date from file name to image with date in subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempPath(FIXTURE, "subfolder", "date-2021-09.jpeg")
      );
      expect(DateTimeOriginal).toEqual(`2021:09:21 10:24:14`);
    });
  });

  describe("when no output folder is provided and dryRun option is enabled", () => {
    const FIXTURE = "iso-regex";
    let cli;

    beforeAll(async () => {
      await resetTempPath();
      await copyFixturesToTempPath(FIXTURE);
      cli = new CliRunner("bin/exif-assistant", [
        "set-dates",
        tempFixturesFolder(FIXTURE),
        "--copyAll",
        "--modify",
        "--no-fromDigitized",
        "--dryRun",
        "--dateRegex",
        "^date\\-(\\S*)",
      ]);
      await cli.hasFinished();
      console.log(cli.logs);
    });

    afterAll(async () => {
      if (!cli.isClosed) {
        await cli.kill();
      }
    });

    it("should not prompt for confirmation", async () => {
      expect(cli.exitCode).toEqual(0);
      expect(cli.logs).toEqual(expect.not.stringContaining("Are you sure?"));
    });

    it("should have not set date from file name to image with date in root folder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempPath(FIXTURE, "date-2021-09-25T122030.jpg")
      );
      expect(DateTimeOriginal).toEqual(`2021:10:14 10:58:31`);
    });

    it("should have not set date from file name to image with date in subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempPath(FIXTURE, "subfolder", "date-2021-09.jpeg")
      );
      expect(DateTimeOriginal).toEqual(`2021:09:21 10:24:14`);
    });

    it("should print a warning informing that no modifications were done", async () => {
      expect(cli.logs).toEqual(
        expect.stringContaining("dryRun option was enabled. No modifications were done")
      );
    });
  });

  describe("when modify option is true, fromDigited is false and formats and regexs are provided", () => {
    const FIXTURE = "formats-regexs";
    let cli;

    beforeAll(async () => {
      await resetTempPath();
      await copyFixturesToTempPath(FIXTURE);
    });

    afterAll(async () => {
      if (cli && !cli.isClosed) {
        await cli.kill();
      }
    });

    it("should exit with code 0", async () => {
      cli = new CliRunner("bin/exif-assistant", [
        "set-dates",
        tempFixturesFolder(FIXTURE),
        "--copyAll",
        "--modify",
        "--no-fromDigitized",
        "--dateRegex",
        "^date[_\\-](\\S*)",
        "^(\\S*)\\-date$",
        "^day\\s(\\S*)",
        "^year\\s(\\S*)",
        "--dateFormat",
        "dd_MM_yyyy",
        "dd_MM",
        "dd",
        "yyyy",
        "--outputFolder",
        TEMP_OUTPUT_FOLDER,
      ]);
      await cli.hasFinished();
      console.log(cli.logs);
      expect(cli.exitCode).toEqual(0);
    });

    it("should have set date from file name to image with date in root folder", async () => {
      const { DateTimeOriginal } = await readExifDates(tempOutputPath("date_25_09_2021.jpg"));
      expect(DateTimeOriginal).toEqual(`2021:09:25 00:00:00`);
    });

    it("should have set date from file name to image with date in subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(tempOutputPath("year 2021", "01_09.jpeg"));
      expect(DateTimeOriginal).toEqual(`2021:09:01 00:00:00`);
    });

    it("should have set date from file name to image with date in folders under subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("year 2021", "foo", "var", "date-01_10.jpeg")
      );
      expect(DateTimeOriginal).toEqual(`2021:10:01 00:00:00`);
    });

    it("should have set date from file name to image with not date in folders under subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("year 2021", "foo", "no-date-in-name.jpg")
      );
      expect(DateTimeOriginal).toEqual(`2021:01:01 00:00:00`);
    });

    it("should have set date from folder name to image with no date in subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("year 2021", "no-date-in-name.jpg")
      );
      expect(DateTimeOriginal).toEqual(`2021:01:01 00:00:00`);
    });

    it("should have set date from file name and folder name to image with date in sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("year 2021", "23_10_2020-date", "09_10-date.jpeg")
      );
      expect(DateTimeOriginal).toEqual(`2020:10:09 00:00:00`);
    });

    it("should have set date from folder name to image with not date in sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("year 2021", "23_10_2020-date", "gorilla.JPG")
      );
      expect(DateTimeOriginal).toEqual(`2020:10:23 00:00:00`);
    });

    it("should have set date from file name to image with date in sub sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("year 2021", "23_10_2020-date", "date_01_05", "day 12.jpeg")
      );
      expect(DateTimeOriginal).toEqual(`2020:05:12 00:00:00`);
    });

    it("should have set date from folder name to image without date in sub sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("year 2021", "23_10_2020-date", "date_01_05", "gorilla.JPG")
      );
      expect(DateTimeOriginal).toEqual(`2020:05:01 00:00:00`);
    });

    it("should have set date from folder name to image with day and month in sub sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("year 2021", "23_10_2020-date", "year 2022", "date_15_08.JPG")
      );
      expect(DateTimeOriginal).toEqual(`2022:08:15 00:00:00`);
    });

    it("should have set date from folder name to image with day in sub sub subfolder", async () => {
      const { DateTimeOriginal } = await readExifDates(
        tempOutputPath("year 2021", "23_10_2020-date", "year 2022", "day 17.JPG")
      );
      expect(DateTimeOriginal).toEqual(`2022:01:17 00:00:00`);
    });
  });
});
