const { Table } = require("console-table-printer");

const { currentLevelPrints, levels } = require("../support/tracer");
const {
  normal,
  accent,
  neutral,
  strongAccent,
  strongNeutral,
  strongConditional,
  formatAll,
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
    dataDest.with_date++;
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
      with_date: 0,
      modified: 0,
      unsupported: 0,
      moved: 0,
      copied: 0,
    };
    const before = {
      ...defaultData,
      path: this._input,
      modified: null,
      moved: null,
      copied: null,
    };
    const after = {
      ...defaultData,
      path: this._output,
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

    before.without_date = before.supported - before.with_date;
    after.without_date = after.supported - after.with_date;
    return {
      before,
      after,
    };
  }

  getSummaryAndPrint() {
    const table = new Table({
      columns: [
        { name: "concept", title: " " },
        { name: "path", alignment: "left", title: "Path" },
        { name: "files", title: "Files" },
        { name: "unsupported", title: normal("Unsupported") },
        { name: "supported", title: "Supported" },
        { name: "with_date", title: "With Date" },
        { name: "without_date", title: "Without Date" },
        { name: "modified", title: "Modified" },
        { name: "moved", title: normal("Moved to subfolder") },
        { name: "copied", title: normal("Copied") },
      ],
    });
    const summary = this.summary;

    table.addRow(
      formatAll({
        ...summary.before,
        concept: strongAccent("Before"),
        supported: accent(summary.before.supported),
        with_date: neutral(summary.before.with_date),
        without_date: neutral(summary.before.without_date),
      })
    );

    table.addRow(
      formatAll({
        ...summary.after,
        concept: strongAccent("After"),
        supported: accent(summary.after.supported),
        with_date: strongConditional(summary.after.with_date),
        without_date: strongConditional(summary.after.without_date, true),
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
