const { Command, Option } = require("commander");
const inquirer = require("inquirer");

const { setDates } = require("./assistant/setDateMethods");
const { toAbsolute } = require("./support/files");
const { setLevel, Tracer } = require("./support/tracer");

const { version } = require("../package.json");

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

async function confirmOverwrite(inputFolder, outputFolder) {
  if (!outputFolder || inputFolder === outputFolder) {
    const confirmation = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmed",
        default: false,
        message: !outputFolder
          ? "No outputFolder provided. Files will be modified. Are you sure?"
          : "Input and output folders are equal. Files will be modified. Are you sure?",
      },
    ]);
    return confirmation.confirmed;
  }
  return true;
}

program.name("exif-assistant").description("Set exif data to image files").version(version);

program
  .command("set-dates")
  .description("Set exif date to all files in a folder recursively")
  .argument("[folder]", "Folder containing images to set date", ".")
  .addOption(logOption)
  .option("--dryRun", "Print report only. Do not modify any file", false)
  .option("-m, --modify", "Modify existing dates", false)
  .option("--no-modifyTime", "Do not modify time information when present")
  .option("--no-setDigitized", "Do not set DateTimeDigitized exif property")
  .option("-o, --outputFolder <outputFolder>", "Output folder")
  .option("-c, --copyAll", "Copy also unsupported and not modified files to outputFolder", false)
  .option(
    "-u, --moveUnresolvedTo <moveUnresolvedTo>",
    "If no date is found for a file or it is not supported, create a subfolder with this name and move the file into it"
  )
  .option("-d, --date <date>", "When provided, this date is set to all files")
  .option("-f, --dateFallback <dateFallback>", "Set this date when it is not found anywhere else")
  .option("-b, --baseDate <baseDate>", "Date used to complete dates when they are partial")
  .option(
    "--baseDateFallback <baseDateFallback>",
    "Use this date as baseDate when it is not found anywhere else"
  )
  .option(
    "-f, --dateFormat <dateFormats...>",
    "Date format in files, folder names or date options. Supports multiple values"
  )
  .option(
    "-r, --dateRegex <dateRegexs...>",
    "Regex used to get date from file or folder names. Supports multiple values"
  )
  .option(
    "--no-fromDigitized",
    "Do not use DateTimeDigitized from file exif to set DateTimeOriginal"
  )
  .option("--no-fromFileName", "Do not use file names to set dates")
  .option("--no-fromFolderNames", "Do not use folder names to set dates")
  .option("--no-baseDatefromFolderNames", "Do not use folder names to set base dates")
  .showHelpAfterError()
  .action(async (folderPath, options) => {
    const tracer = new Tracer("set-dates");
    setLogLevel(options.log);
    tracer.debug("options", options);
    const inputFolder = toAbsolute(folderPath);
    const outputFolder = options.outputFolder ? toAbsolute(options.outputFolder) : null;

    if (!options.dryRun) {
      if (!(await confirmOverwrite(inputFolder, outputFolder))) {
        return;
      }
    }

    return setDates(toAbsolute(folderPath), {
      ...options,
      dateFormats: options.dateFormat, // convert singular option from command line into plural
      dateRegexs: options.dateRegex, // convert singular option from command line into plural
    });
  });

module.exports = {
  program,
};
