const { exec } = require("child_process");
const path = require("path");

function run(args, cwd) {
  return new Promise((resolve) => {
    exec(
      `node ${path.resolve(__dirname, "..", "..", "src", "run")} ${args.join(" ")}`,
      { cwd: cwd || path.resolve(__dirname, "..", "assets", ".tmp") },
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
  run,
};
