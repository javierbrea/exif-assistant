const { Table } = require("console-table-printer");

const { currentLevelPrints, levels } = require("../support/tracer");
const { toRelative } = require("../support/files");

const {
  normal,
  accent,
  neutral,
  strongNeutral,
  strongAccent,
  strongConditional,
  formatAll,
  shortPath,
  ROW_SEPARATOR,
} = require("./tableFormats");

function addSupportedAmount(reportOrigin, dataDest) {
  if (!reportOrigin.supported) {
    dataDest.unsupported++;
  } else {
    dataDest.supported++;
  }
}

function addWithDateAmount(reportOrigin, dataDest) {
  if (reportOrigin.exif.DateTimeOriginal) {
    dataDest.withDate++;
  }
}

function addModifiedAmount(reportOrigin, dataDest) {
  if (reportOrigin.actions.modified) {
    dataDest.modified++;
  }
}

function addMovedAmount(reportOrigin, dataDest) {
  if (reportOrigin.actions.moved) {
    dataDest.moved++;
  }
}

function addCopiedAmount(reportOrigin, dataDest) {
  if (reportOrigin.actions.copied) {
    dataDest.copied++;
  }
}

class FileInfo {
  constructor(filePath) {
    this._filePath = filePath;
    this._exif = {};
  }

  set filePath(filePath) {
    this._filePath = filePath;
  }

  set supported(supported) {
    this._supported = supported;
  }

  get supported() {
    return this._supported;
  }

  set exif(data) {
    this._exif = data;
  }

  get exif() {
    return this._exif;
  }

  get data() {
    return {
      filePath: this._filePath,
      supported: this._supported,
      exif: this._exif,
    };
  }
}

class SetDateReport {
  constructor(filePath) {
    this._before = new FileInfo(filePath);
    this._after = new FileInfo();
    this._actions = {};
  }

  _copyPropertiesWhenMovingOrCopying(newFilePath) {
    this._after.supported = this._before.supported;
    this._after.exif = this._before.exif;
    this._after.filePath = newFilePath;
  }

  modified(newFilePath, dates, datesFrom) {
    this._after.filePath = newFilePath;
    this._after.supported = true;
    this._after.exif = dates;
    this._actions.newDateOrigin = datesFrom;
    this._actions.modified = true;
  }

  copied(newFilePath) {
    this._copyPropertiesWhenMovingOrCopying(newFilePath);
    this._actions.copied = true;
  }

  moved(newFilePath) {
    this._copyPropertiesWhenMovingOrCopying(newFilePath);
    this._actions.moved = true;
  }

  notSupported() {
    this._before.supported = false;
    this._after.supported = false;
  }

  supported(dates) {
    this._after.supported = true;
    this._before.supported = true;
    this._before.exif = dates;
  }

  get data() {
    return {
      before: this._before.data,
      after: this._after.data,
      actions: this._actions,
    };
  }
}

class SetDatesReport {
  constructor({ input, output }) {
    this._input = input;
    this._output = output;
    this._setDateReports = new Set();
  }

  newFile(filePath) {
    const setDateReport = new SetDateReport(filePath);
    this._setDateReports.add(setDateReport);
    return setDateReport;
  }

  get details() {
    return [...this._setDateReports].map((setDateReport) => {
      return setDateReport.data;
    });
  }

  get totals() {
    const details = this.details;
    const defaultData = {
      files: 0,
      supported: 0,
      withDate: 0,
      modified: 0,
      unsupported: 0,
      moved: 0,
      copied: 0,
    };
    const before = {
      ...defaultData,
      path: toRelative(this._input),
      modified: null,
      moved: null,
      copied: null,
    };
    const after = {
      ...defaultData,
      path: toRelative(this._output),
    };
    details.forEach((fileReport) => {
      before.files++;
      addSupportedAmount(fileReport.before, before);
      addWithDateAmount(fileReport.before, before);
      if (fileReport.after.filePath) {
        after.files++;
        addSupportedAmount(fileReport.after, after);
        addWithDateAmount(fileReport.after, after);
      } else if (this._input === this._output) {
        after.files++;
        addSupportedAmount(fileReport.before, after);
        addWithDateAmount(fileReport.before, after);
      }
      addModifiedAmount(fileReport, after);
      addMovedAmount(fileReport, after);
      addCopiedAmount(fileReport, after);
    });

    before.withoutDate = before.supported - before.withDate;
    after.withoutDate = after.supported - after.withDate;
    return {
      before,
      after,
    };
  }

  getAndPrint() {
    const details = this.details;
    const totals = this.totals;
    // When input and output folders are equal, the amount of new filePaths doesn't matter
    const totalNewFilesFormatter = this._input === this._output ? strongAccent : strongConditional;
    let filesKeptAtSamePath = 0;

    const table = new Table({
      columns: [
        { name: "beforeFile", alignment: "left", title: "File path" },
        { name: "supported", alignment: "center", title: "Supported" },
        { name: "afterFile", alignment: "left", title: "New file path" },
        { name: "beforeDate", alignment: "left", title: "Date before" },
        { name: "afterDate", alignment: "left", title: "Date after" },
        { name: "modified", alignment: "center", title: "Modified" },
        { name: "moved", alignment: "center", title: normal("Moved to subfolder") },
        { name: "copied", alignment: "center", title: normal("Copied") },
      ],
    });

    details.forEach((fileReport) => {
      const fileIsAtSamePath = fileReport.before.filePath === fileReport.after.filePath;
      if (fileIsAtSamePath) {
        filesKeptAtSamePath++;
      }
      table.addRow(
        formatAll({
          beforeFile: shortPath(toRelative(fileReport.before.filePath)),
          afterFile:
            !fileReport.after.filePath || fileIsAtSamePath
              ? null
              : shortPath(toRelative(fileReport.after.filePath)),
          supported: accent(fileReport.before.supported),
          beforeDate: neutral(fileReport.before.exif.DateTimeOriginal),
          afterDate: strongConditional(fileReport.after.exif.DateTimeOriginal),
          modified: strongNeutral(fileReport.actions.modified),
          moved: fileReport.actions.moved,
          copied: fileReport.actions.copied,
        })
      );
    });

    table.addRow(
      formatAll({
        beforeFile: ROW_SEPARATOR,
        afterFile: ROW_SEPARATOR,
        supported: ROW_SEPARATOR,
        beforeDate: ROW_SEPARATOR,
        afterDate: ROW_SEPARATOR,
        modified: ROW_SEPARATOR,
        moved: ROW_SEPARATOR,
        copied: ROW_SEPARATOR,
      })
    );

    table.addRow(
      formatAll({
        beforeFile: strongAccent(totals.before.files),
        supported: strongConditional(totals.before.supported, totals.before.files),
        afterFile: totalNewFilesFormatter(
          totals.after.files - filesKeptAtSamePath,
          totals.before.files
        ),
        beforeDate: strongConditional(totals.before.withDate, totals.before.supported),
        afterDate: strongConditional(totals.after.withDate, totals.after.supported),
        modified: strongNeutral(totals.after.modified),
        moved: strongAccent(totals.after.moved),
        copied: strongAccent(totals.after.copied),
      })
    );

    if (currentLevelPrints(levels.INFO)) {
      table.printTable();
    }

    return {
      details,
      totals,
    };
  }
}

module.exports = {
  SetDatesReport,
};
