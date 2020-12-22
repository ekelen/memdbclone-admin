var fs = require("fs");
var path = require("path");
const { URL } = require("url");
const FormData = require("form-data");
const fetch = require("node-fetch");
const csv = require("csv");
const { promisify } = require("util");
const { pipeline } = require("stream");
const { transformRecord } = require("./transform");
const { findAndReplace } = require("./addToDb");

const onHydrate = async ({ offset = 1, db = null }) => {
  const url = new URL(
    "http://www2.scc.rutgers.edu/memdb/download_file_spuf.php"
  );
  url.searchParams.append("start", offset);
  const form = new FormData();
  form.append("table", "spuf");
  const today = new Date();
  const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}_${today.getTime()}`;
  const fetchResults = await fetch(url, {
    body: form,
    method: "POST",
  });
  //  TODO: backup collection to file instead of piping new results to file before upload
  const newFileName = path.join(
    __dirname,
    "data",
    "scraped",
    `raw_spuf_${offset.toString().padStart(5, "0")}_${dateString}`
  );
  const streamPipeline = promisify(pipeline);

  try {
    await streamPipeline(fetchResults.body, fs.createWriteStream(newFileName));
  } catch (downloadFileError) {
    console.log(`downloadFileError:`, downloadFileError);
    throw downloadFileError;
  }

  const collection = await db.collection("spuffordCurrency");
  let updatedAdded = 0;
  let updatedSkipped = 0;

  const parser = csv.parse({
    delimiter: "\t",
    skipEmptyLines: true,
    fromLine: 15,
    skipLinesWithError: true,
    trim: true,
    onRecord: transformRecord,
  });
  const documents = [];
  parser.on("data", (csvData) => {
    updatedAdded += 1;
    documents.push(csvData);
  });
  parser.on("skip", () => {
    updatedSkipped += 1;
  });

  const rs = fs.createReadStream(newFileName);

  await streamPipeline(rs, parser);
  const { nSuccess, nFail, nFailByCodeName } = await findAndReplace({
    documents,
    collection,
  });

  return {
    offset,
    nDocuments: documents.length,
    nSuccess,
    nFail,
    nFailByCodeName,
  };
};

module.exports = { onHydrate };
