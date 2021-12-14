const moment = require("moment");

function formatForExif(string) {
  return moment(string).format("YYYY:MM:DD HH:mm:ss");
}

module.exports = {
  formatForExif,
};
