const { exec } = require("child_process");
const path = require("path");

function cli(args, cwd) {
  return new Promise((resolve) => {
    exec(
      `node ${path.resolve(__dirname, "..", "..", "src", "index")} ${args.join(" ")}`,
      { cwd: cwd || path.resolve(__dirname, "..", "assets") },
      (error, stdout, stderr) => {
        resolve({
          code: error && error.code ? error.code : 0,
          error,
          stdout,
          stderr,
        });
      }
    );
  });
}

module.exports = {
  cli,
};
