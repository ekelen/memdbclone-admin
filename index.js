const { connectToDatabase } = require("./mongodb");
const { logging } = require("./util");
const cli = require("./cli.js");

("use strict");

const run = async () => {
  try {
    const { db } = await connectToDatabase();
    const fs = require("fs");
    const path = require("path");
    const dstDir = path.join(__dirname, "data", "scraped");
    if (!fs.existsSync(dstDir)) {
      fs.mkdirSync(dstDir);
    }
    logging.print(`DB Connection OK:`, !!db);
    await cli({ db, dstDir });
  } catch (e) {
    console.log(`⚠️ Error launching:`, e);
    process.exit(1);
  }
};

run();
