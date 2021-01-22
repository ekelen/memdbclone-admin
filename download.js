var fs = require("fs");
var path = require("path");
const { URL } = require("url");
const FormData = require("form-data");
const fetch = require("node-fetch");
const { promisify } = require("util");
const { pipeline } = require("stream");

const streamPipeline = promisify(pipeline);

const URL_INPUT = "http://www2.scc.rutgers.edu/memdb/download_file_spuf.php";

/**
 * @desc Scrapes Rutgers' search result PHP files and stores the lines of data locally
 * @param  {int} offset - which record to start at
 * @param  {string} rutgersTableName - value for Rutgers' 'table' param
 *
 * @throws {Error} is possible
 */
module.exports.scrapePageToTextFile = ({
  offset = 1,
  rutgersTableName = "spuf",
  dstDir = __dirname,
}) => async () => {
  const url = new URL(URL_INPUT);
  url.searchParams.append("start", offset);
  const form = new FormData();
  form.append("table", rutgersTableName);

  const fetchResults = await fetch(url, {
    body: form,
    method: "POST",
  });

  //  TODO: backup collection to file instead of piping new results to file before upload

  const today = new Date();
  const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}_${today.getTime()}`;
  const textFile = path.join(
    dstDir,
    `raw_${rutgersTableName}_${offset
      .toString()
      .padStart(5, "0")}_${dateString}`
  );

  await streamPipeline(fetchResults.body, fs.createWriteStream(textFile));
  return { textFile };
};
