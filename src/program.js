const { Command, Option } = require("commander");
const program = new Command();

const { setDatesInFolder } = require("./assistant/runner");
const { toAbsolute } = require("./files/utils");
const { setLevel } = require("./support/tracer");

const logOption = new Option("-l, --log <logLevel>", "Log level").choices([
  "silly",
  "debug",
  "verbose",
  "info",
  "warn",
  "error",
  "silent",
]);

function setLogLevel(level) {
  if (level) {
    setLevel(level);
  }
}

program.name("exif-assistant").description("Set exif data to image files").version("0.0.1-beta.1");

program
  .command("set-dates")
  .description("Set exif date based on options, file name or parent folders names")
  .argument("[folder]", "Folder containing images to set date", ".")
  .addOption(logOption)
  .option("-o, --outputFolder <outputFolder>", "Output folder", ".")
  .option("-d, --date <date>", "Date to be set")
  .option(
    "-f, --dateFormat <dateFormat>",
    "Format of dates from date option, file or folder names"
  )
  .option("-r, --dateRegex <dateRegex>", "Regex used to get date from file or folder names")
  .option("-b, --baseDate <baseDate>", "Date used to complete dates when they are partial")
  .option("--baseDateFormat <baseDateFormat>", "Format of baseDate")
  .option("-f, --fallbackDate <fallbackDate>", "Set this date when it is not found anywhere else")
  .option("--fallbackDateFormat <fallbackDateFormat>", "Format of fallbackDate")
  .option("-m, --modify", "Modify already defined dates", false)
  .option(
    "--no-fromDigitized",
    "Do not use DateTimeDigitized from file exif to set DateTimeOriginal"
  )
  .option("--no-fromFile", "Do not use file name to set date")
  .option("--no-fromFolder", "Do not use folder name to set date")
  .option("--no-setDigitized", "Do not set also DateTimeDigitized")
  .option(
    "-u, --moveUnresolvedTo <moveUnresolvedTo>",
    "If no date is found for a file or it is not supported, create a subfolder with this name and move the file into it"
  )
  .option(
    "-c, --copyUnresolved",
    "Copy also files with no date and not supported files to output folder"
  )
  .showHelpAfterError()
  .action((folderPath, options) => {
    setLogLevel(options.log);
    return setDatesInFolder(toAbsolute(folderPath), options);
  });

module.exports = {
  program,
};
