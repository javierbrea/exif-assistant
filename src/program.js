const { Command, Option } = require("commander");

const { setDates } = require("./assistant/setDateMethods");
const { toAbsolute } = require("./support/files");
const { setLevel } = require("./support/tracer");

const program = new Command();

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
  .description("Set exif date to all files in a folder")
  .argument("[folder]", "Folder containing images to set date", ".")
  .addOption(logOption)
  .option("-o, --outputFolder <outputFolder>", "Output folder", ".")
  .option("-d, --date <date>", "Date to set")
  .option(
    "-f, --dateFormat <dateFormat>",
    "Format of dates from date option, file or folder names"
  )
  .option("-r, --dateRegex <dateRegex>", "Regex used to get date from file or folder names")
  .option(
    "--baseDateFallback <baseDateFallback>",
    "Use this date as baseDate when it is not found anywhere else"
  )
  .option("-b, --baseDate <baseDate>", "Date used to complete dates when they are partial")
  .option("--baseDateFormat <baseDateFormat>", "Format of baseDate")
  .option("-f, --dateFallback <dateFallback>", "Set this date when it is not found anywhere else")
  .option("--dateFallbackFormat <dateFallbackFormat>", "Format of dateFallback")
  .option("-m, --modify", "Modify existent dates", false)
  .option(
    "--no-fromDigitized",
    "Do not use DateTimeDigitized from file exif to set DateTimeOriginal"
  )
  .option("--no-fromFileName", "Do not use file name to set date")
  .option("--no-baseDatefromFolderNames", "Do not use folder names to set baseDate")
  .option("--no-fromFolderNames", "Do not use folder names to set date")
  .option("--no-setDigitized", "Do not set also DateTimeDigitized")
  .option(
    "-u, --moveUnresolvedTo <moveUnresolvedTo>",
    "If no date is found for a file or it is not supported, create a subfolder with this name and move the file into it"
  )
  .option("-c, --copyAll", "Copy also not modified files to outputFolder")
  .showHelpAfterError()
  .action((folderPath, options) => {
    setLogLevel(options.log);
    return setDates(toAbsolute(folderPath), options);
  });

module.exports = {
  program,
};
