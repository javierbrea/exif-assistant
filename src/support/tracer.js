const winston = require("winston");

const { isArray, isNumber, isString, isUndefined } = require("./utils");

const NEW_LINE = "\n";

const levels = {
  SILLY: "silly",
  DEBUG: "debug",
  VERBOSE: "verbose",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
  SILENT: "silent",
};

const levelsOrder = [
  levels.SILLY,
  levels.DEBUG,
  levels.VERBOSE,
  levels.INFO,
  levels.WARN,
  levels.ERROR,
  levels.SILENT,
];

const format = winston.format.printf((info) => {
  return `${info.timestamp} [exif-assistant][${info.level}]${info.message}`;
});

const transports = {
  console: new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({
        format: "HH:mm:ss:SS",
      }),
      format
    ),
  }),
};

const logger = winston.createLogger({
  transports: [transports.console],
});

function bindLoggerLevels() {
  Object.keys(levels).forEach((levelKey) => {
    const level = levels[levelKey];
    if (level !== levels.SILENT) {
      logger[level] = logger[level].bind(logger);
    }
  });
}

function setLevel(level) {
  if (level === levels.SILENT) {
    transports.console.silent = true;
  } else {
    transports.console.silent = false;
    transports.console.level = level;
  }
}

function getLevel() {
  return transports.console.silent ? levels.SILENT : transports.console.level;
}

function currentLevelPrints(level) {
  const currentLevel = getLevel();
  return levelsOrder.indexOf(currentLevel) <= levelsOrder.indexOf(level);
}

function addNamespace(namespace, message) {
  return `[${namespace}] ${message}`;
}

function noNamespace(message) {
  return ` ${message}`;
}

function printInNewLine(str) {
  return `${NEW_LINE}${str}`;
}

function printInNewLineWithDash(str) {
  return printInNewLine(`- ${str}`);
}

function concatInNewLineWithDash(str, str2) {
  return `${str}${printInNewLineWithDash(str2)}`;
}

function traceObject(obj) {
  return JSON.stringify(obj, null, 2);
}

function traceObjectInNewLine(obj) {
  return printInNewLine(traceObject(obj));
}

function traceArray(listElements) {
  return listElements.reduce((str, listElement) => {
    return concatInNewLineWithDash(str, listElement);
  }, "");
}

function addDataToMessage(message, data) {
  if (isUndefined(data)) {
    return message;
  }
  if (isString(data) || isNumber(data)) {
    return concatInNewLineWithDash(message, data);
  }
  if (isArray(data)) {
    return `${message}${traceArray(data)}`;
  }
  return `${message}${traceObjectInNewLine(data)}`;
}

class Tracer {
  constructor(namespace) {
    this._namespace = namespace;
  }

  _addNamespace(message) {
    if (!this._namespace) {
      return noNamespace(message);
    }
    return addNamespace(this._namespace, message);
  }

  _log(level, message, data) {
    logger[level](this._addNamespace(addDataToMessage(message, data)));
  }

  silly(message, data) {
    this._log(levels.SILLY, message, data);
  }

  debug(message, data) {
    this._log(levels.DEBUG, message, data);
  }

  verbose(message, data) {
    this._log(levels.VERBOSE, message, data);
  }

  info(message, data) {
    this._log(levels.INFO, message, data);
  }

  warn(message, data) {
    this._log(levels.WARN, message, data);
  }

  error(message, data) {
    this._log(levels.ERROR, message, data);
  }
}

bindLoggerLevels();

const tracer = new Tracer();

module.exports = {
  _transports: transports, // exported only for testing purposes
  _logger: logger, // exported only for testing purposes
  Tracer,
  tracer,
  levels,
  setLevel,
  currentLevelPrints,
};
