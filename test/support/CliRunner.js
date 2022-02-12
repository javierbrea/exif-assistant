const EventEmitter = require("events");
const crossSpawn = require("cross-spawn");
const treeKill = require("tree-kill");

const ENCODING_TYPE = "utf8";
const PRINT_EVENT_NAME = "printed";

module.exports = class CliRunner {
  constructor(command, params, options = {}) {
    this._eventEmitter = new EventEmitter();
    this._isClosed = false;
    this._logs = [];
    this.logData = this.logData.bind(this);
    this.write = this.write.bind(this);
    this.pressEnter = this.pressEnter.bind(this);
    this._exitPromise = new Promise((resolve) => {
      this._resolveExitPromise = resolve;
    });
    this.run(command, params, options);
  }

  async hasFinished() {
    return this._exitPromise;
  }

  async kill() {
    treeKill(this._process.pid);
    return this._exitPromise;
  }

  logData(data) {
    this._eventEmitter.emit(PRINT_EVENT_NAME, data);
    this._logs.push(data);
  }

  run(command, params, options) {
    this._process = crossSpawn(command, params, {
      cwd: options.cwd || process.cwd(),
    });

    this._process.stdin.setEncoding(ENCODING_TYPE);

    this._process.stdout.setEncoding(ENCODING_TYPE);
    this._process.stderr.setEncoding(ENCODING_TYPE);

    this._process.stdout.on("data", this.logData);
    this._process.stderr.on("data", this.logData);

    this._process.on("close", (code) => {
      this._isClosed = true;
      this._exitCode = code;
      this._resolveExitPromise(true);
    });
  }

  write(data) {
    this._process.stdin.write(String(data));
  }

  pressEnter() {
    this.write("\n");
  }

  async hasPrinted(data, timeOut = 2000) {
    let resolver;
    let rejecter;

    const timeout = setTimeout(() => {
      const errorMessage = `${data} was not printed after ${timeOut}ms`;
      console.log(errorMessage);
      console.log(this.logs);
      rejecter(new Error(errorMessage));
    }, timeOut);

    const listener = (logData) => {
      if (logData.includes(data)) {
        this._eventEmitter.removeListener(PRINT_EVENT_NAME, listener);
        clearTimeout(timeout);
        resolver();
      }
    };

    return new Promise((resolve, reject) => {
      resolver = resolve;
      rejecter = reject;
      this._eventEmitter.on(PRINT_EVENT_NAME, listener);
    });
  }

  get exitCode() {
    return this._exitCode;
  }

  get logs() {
    return this._logs.join("");
  }

  get isClosed() {
    return this._isClosed;
  }
};
