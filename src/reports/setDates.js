const { Table } = require("console-table-printer");

const { currentLevelPrints, levels } = require("../support/tracer");
const { toRelative } = require("../support/files");

const {
  normal,
  accent,
  neutral,
  strongAccent,
  strongNeutral,
  strongConditional,
  formatAll,
  shortPath,
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

  get data() {
    return [...this._setDateReports].map((setDateReport) => {
      return setDateReport.data;
    });
  }

  get summary() {
    const data = this.data;
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
    data.forEach((fileReport) => {
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

  getDataAndPrint() {
    const table = new Table({
      columns: [
        { name: "beforeFile", alignment: "left", title: "File path" },
        { name: "afterFile", alignment: "left", title: "New file path" },
        { name: "supported", alignment: "center", title: "Supported" },
        { name: "beforeDate", alignment: "left", title: "Date before" },
        { name: "afterDate", alignment: "left", title: "Date after" },
        { name: "modified", alignment: "center", title: "Modified" },
        { name: "moved", alignment: "center", title: normal("Moved to subfolder") },
        { name: "copied", alignment: "center", title: normal("Copied") },
      ],
    });
    const data = this.data;

    data.forEach((fileReport) => {
      table.addRow(
        formatAll({
          beforeFile: shortPath(toRelative(fileReport.before.filePath)),
          afterFile:
            !fileReport.after.filePath || fileReport.before.filePath === fileReport.after.filePath
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

    if (currentLevelPrints(levels.INFO)) {
      table.printTable();
    }

    return data;
  }

  getSummaryAndPrint() {
    const table = new Table({
      columns: [
        { name: "concept", title: " " },
        { name: "path", alignment: "left", title: "Path" },
        { name: "files", title: "Files" },
        { name: "unsupported", title: normal("Unsupported") },
        { name: "supported", title: "Supported" },
        { name: "withDate", title: "With Date" },
        { name: "withoutDate", title: "Without Date" },
        { name: "modified", title: "Modified" },
        { name: "moved", title: normal("Moved to subfolder") },
        { name: "copied", title: normal("Copied") },
      ],
    });
    const summary = this.summary;

    table.addRow(
      formatAll({
        ...summary.before,
        path: shortPath(summary.before.path),
        concept: strongAccent("Before"),
        supported: accent(summary.before.supported),
        withDate: neutral(summary.before.withDate),
        withoutDate: neutral(summary.before.withoutDate),
      })
    );

    table.addRow(
      formatAll({
        ...summary.after,
        path: shortPath(summary.after.path),
        concept: strongAccent("After"),
        supported: accent(summary.after.supported),
        withDate: strongConditional(summary.after.withDate),
        withoutDate: strongConditional(summary.after.withoutDate, true),
        modified: strongNeutral(summary.after.modified),
      })
    );

    if (currentLevelPrints(levels.INFO)) {
      table.printTable();
    }

    return summary;
  }
}

module.exports = {
  SetDatesReport,
};
