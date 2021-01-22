var fs = require("fs");
const csv = require("csv");
const addToDb = require("./addToDb");

/**
 * @desc Parses and replaces/inserts lines of CSV data downloaded from Rutgers
 * @param  {int} offset - which record to start at
 * @param  {string} rutgersTableName - value for Rutgers' 'table' param
 *
 * @throws {Error} is possible
 */
const updateFromTextFile = async ({
  offset = 1,
  textFile = "",
  collection = null,
  onRecord,
}) => {
  const parser = csv.parse({
    delimiter: "\t",
    skipEmptyLines: true,
    fromLine: 15,
    skipLinesWithError: true,
    trim: true,
    onRecord,
  });
  const cleanedDocuments = [];
  parser.on("data", (csvData) => {
    cleanedDocuments.push(csvData);
  });

  const rs = fs.createReadStream(textFile);

  await streamPipeline(rs, parser);

  const { nSuccess, nFail, nFailByCodeName } = await addToDb({
    documents: cleanedDocuments,
    collection,
  });

  return {
    offset,
    nDocuments: cleanedDocuments.length,
    nSuccess,
    nFail,
    nFailByCodeName,
  };
};

module.exports = { updateFromTextFile };
