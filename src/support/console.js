const { Tracer } = require("./tracer");

const tracer = new Tracer("console");

let originalWarn;

function disableWarn() {
  if (!originalWarn) {
    originalWarn = console.warn;
  }
  console.warn = (message) => tracer.silly(message);
}

function restoreWarn() {
  if (!originalWarn) {
    return;
  }
  console.warn = originalWarn;
  originalWarn = null;
}

module.exports = {
  disableWarn,
  restoreWarn,
};
