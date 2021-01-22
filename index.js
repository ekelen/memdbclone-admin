const { connectToDatabase } = require("./mongodb");
const { logging } = require("./util");
const cli = require("./cli.js");

("use strict");

const run = async () => {
  try {
    const { db } = await connectToDatabase();
    logging.print(`DB Connection OK:`, !!db);
    await cli({ db });
  } catch (e) {
    console.log(`⚠️ Error launching:`, e);
    process.exit(1);
  }
};

run();
