"use strict";
const inquirer = require("inquirer");
const passwordPrompt = require("./auth.js");
const { updateFromTextFile } = require("./upload");
const { scrapePageToTextFile } = require("./download.js");
const { cleanRecord } = require("./transform.js");
const range = require("lodash/range");

const RECORDS_PER_PAGE = 1000;
const SOURCE_PAGES = {
  spuf: 14,
  postpr: 104,
};
const OFFSETS = {
  spuf: range(0 * 1000 + 1, SOURCE_PAGES.spuf * RECORDS_PER_PAGE + 1, 1000),
  postpr: range(0 * 1000 + 1, SOURCE_PAGES.postpr * RECORDS_PER_PAGE + 1, 1000),
};

process.on("exit", () => console.log("👑  Bye!"));
const onQuit = () => process.exit(0);
process.on("SIGINT", onQuit);

// TODO: Refactor (never)
const onHydrate = ({
  rutgersTableName = "spuf",
  collectionName = "spuffordCurrency",
  verbose = false,
  nPagesToSkip = 0,
  dstDir,
}) => async ({ db }) => {
  try {
    const collection = await db.collection(collectionName);
    const onRecord = cleanRecord[collectionName];
    const hydrateResults = await Promise.all(
      OFFSETS[rutgersTableName].slice(nPagesToSkip).map(async (offset) => {
        try {
          const { textFile } = await scrapePageToTextFile({
            offset,
            rutgersTableName,
            dstDir,
          })();
          const parseResult = await updateFromTextFile({
            offset,
            textFile,
            collection,
            onRecord,
          });
          console.log(verbose ? parseResult : ".");
          return parseResult;
        } catch (scrapeAndReplacePageError) {
          const error =
            scrapeAndReplacePageError.codeName ||
            scrapeAndReplacePageError.message;
          console.log(verbose ? error : ".");
          return {
            nSuccess: 0,
            nFail: 0,
            nDocuments: 0,
            offset,
            error,
          };
        }
      })
    );
    const result = hydrateResults.reduce(
      (acc, curr) => ({
        nSuccess: acc.nSuccess + curr.nSuccess,
        nFail: acc.nFail + curr.nFail,
        [`page${curr.offset}`]: JSON.stringify(
          { errors: curr.nFailByCodeName || curr.error },
          2,
          null
        ),
        nDocuments: acc.nDocuments + curr.nDocuments,
      }),
      { nSuccess: 0, nFail: 0, nDocuments: 0 }
    );
    return {
      result,
      nPages: OFFSETS[rutgersTableName].length,
    };
  } catch (scrapeAndReplaceAllError) {
    return { error: scrapeAndReplaceAllError };
  }
};

const retrieveValidator = ({ collectionName = "spuffordCurrency" }) => async ({
  db,
}) => {
  try {
    const collectionInfos = await db
      .listCollections({ name: collectionName })
      .toArray();
    return JSON.stringify(collectionInfos[0].options.validator, null, 2);
  } catch (seeValidatorError) {
    return { error: seeValidatorError };
  }
};

// todo: refactor to get distinct whatever
const getDistinctPlacesSpuf = async ({ db }) => {
  try {
    const collection = await db.collection("spuffordCurrency");
    const results = await collection.distinct("Place");
    return results;
  } catch (seeMetaDataErr) {
    return { error: seeMetaDataErr };
  }
};

const getDistinctCurrenciesSpuf = async ({ db }) => {
  try {
    const collection = await db.collection("spuffordCurrency");
    const currFrom = await collection.distinct("Currency (From)");
    const currTo = await collection.distinct("Currency (To)");
    return Array.from(new Set([...currFrom, ...currTo]));
  } catch (seeMetaDataErr) {
    return { error: seeMetaDataErr };
  }
};

const handleLog = ({ cb }) => async ({ db }) => {
  const result = await cb({ db });
  console.log("------------- Done! -------------");
  console.log(result);
  console.log("---------------------------------");
  return true;
};

const continueCli = async ({ db, dstDir }) => {
  return await inquirer
    .prompt({
      type: "list",
      name: "actions",
      message: "Choose action:",
      loop: false,
      choices: [
        {
          name: "Hydrate spuffordCurrency collection from Rutgers",
          disabled: "spuffordCurrency is current as of 2020-01-18",
        },
        {
          name: "Hydrate posthumusPrices collection from Rutgers",
          disabled: "posthumusPrices is current as of 2020-01-21",
        },
        "Get Currency (Spufford) validation schema",
        "Get Prices (Posthumus) validation schema",
        "Scrape 1 page from Posthumus Price",
        "Get distinct Spufford Currency currency names",
        "Get distinct Spufford Currency place names",
        "Quit",
      ],
    })
    .then((answer) => {
      let handler = null;
      switch (answer.actions) {
        case "Hydrate spuffordCurrency collection from Rutgers":
          handler = handleLog({
            cb: onHydrate({
              rutgersTableName: "spuf",
              collectionName: "spuffordCurrency",
              pagesToSkip: 0,
            }),
          });
          break;
        case "Hydrate posthumusPrices collection from Rutgers":
          handler = handleLog({
            cb: onHydrate({
              rutgersTableName: "postpr",
              collectionName: "posthumusPrices",
              pagesToSkip: 0,
              dstDir,
            }),
          });
          break;
        case "Scrape 1 page from Posthumus Price":
          handler = handleLog({
            cb: scrapePageToTextFile({
              offset: 1,
              rutgersTableName: "postpr",
              dstDir,
            }),
          });
          break;
        case "Get Currency (Spufford) validation schema":
          handler = handleLog({
            cb: retrieveValidator({ collectionName: "spuffordCurrency" }),
          });
          break;
        case "Get Prices (Posthumus) validation schema":
          handler = handleLog({
            cb: retrieveValidator({ collectionName: "posthumusPrices" }),
          });
          break;
        case "Get distinct Spufford Currency place names":
          handler = handleLog({ cb: getDistinctPlacesSpuf });
          break;
        case "Get distinct Spufford Currency currency names":
          handler = handleLog({ cb: getDistinctCurrenciesSpuf });
          break;
        case "Quit":
          handler = onQuit;
          break;
        default:
          handler = onQuit;
          break;
      }
      return handler({ db }).then(() => continueCli({ db, dstDir }));
    });
};

module.exports = ({ db = null, dstDir }) => {
  return inquirer
    .prompt(passwordPrompt)
    .then(() => continueCli({ db, dstDir }));
};
