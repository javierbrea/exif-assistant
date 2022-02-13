const { program } = require("./program");

async function run() {
  await program.parseAsync();
}

run();
