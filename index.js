const { onFinished } = require("./addToDb");
const { onHydrate } = require("./onHydrate");
const { connectToDatabase } = require("./mongodb");
const { logging } = require("./util");

const readline = require("readline");

("use strict");

/**
 * Get all records from Rutgers
 */
const SOURCE_RECORDS_PER_PAGE = 1000;
const SOURCE_PAGES = 14;
const OFFSETS = Array(SOURCE_PAGES)
  .fill()
  .map((_, i) => i * SOURCE_RECORDS_PER_PAGE + 1);

const run = async () => {
  try {
    const { db } = await connectToDatabase();
    logging.print(`DB Connection OK:`, !!db);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    rl.question("API key ? ", function (key) {
      const keyOK = key === process.env.MEMDB_CLONE_KEY;
      logging.print("Key OK", keyOK);
      if (key !== process.env.MEMDB_CLONE_KEY) {
        console.log("Bad key; closing.");
        rl.close();
      }
      rl.question("Delete all core data ? ", async function (del) {
        if (del === "Y" || del === "yes" || del === "y") {
          await db.collection("spuffordCurrency").deleteMany({});
        } else {
          console.log("okay, not deleting.");
        }
        rl.question("Re-scrape core data?", async function (toScrape) {
          if (toScrape === "Y" || toScrape === "yes" || toScrape === "y") {
            try {
              const coreDataStatus = await Promise.all(
                OFFSETS.map(async (offset) => {
                  const parseResult = await onHydrate({ offset, db });
                  console.log(`parseResult:`, parseResult);
                  return parseResult;
                })
              );
              console.log(`coreDataStatus:`, coreDataStatus);
            } catch (scrapeAndReplaceError) {
              console.log(`scrapeAndReplaceError:`, scrapeAndReplaceError);
            }
          }
          rl.question("Update meta filters?", async function (toUpdate) {
            if (toUpdate === "Y" || toUpdate === "yes" || toUpdate === "y") {
              try {
                const dataMetaStatus = await onFinished({ db });
                console.log(`dataMetaStatus:`, dataMetaStatus);
              } catch (dataMetaStatusError) {
                console.log(`dataMetaStatusError:`, dataMetaStatusError);
              }
            }
            rl.close();
          });
        });
      });
    });

    rl.on("close", function () {
      console.log("\nBye!");
      process.exit(0);
    });
  } catch (e) {
    console.log(`e:`, e);
  }
};

run();
