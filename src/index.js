const { tracer } = require("./support/tracer");

function start() {
  tracer.info("Hello world!");
}

module.exports = {
  start,
};
