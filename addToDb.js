const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
const { logging } = require("./util");
dayjs.extend(customParseFormat);

("use strict");

const insertOrUpdateAll = async ({
  db,
  collName,
  list,
  update = (name) => ({ name }),
}) => {
  const collection = await db.collection(collName);
  return await Promise.all(
    list.map(async (name) => {
      const result = await collection.findOneAndUpdate(
        { name },
        { $set: update(name) },
        { upsert: true }
      );
      return result;
    })
  )
    .then(() => {
      logging.print(`Update ${collName} success`, true);
      return { [collName]: "Successfully updated." };
    })
    .catch((e) => {
      logging.print(`Update ${collName} success`, false, { divider: false });
      logging.print(`Error`, e.message);
      return { [collName]: "⚠️ Not updated.", error: e.message };
    });
};

/**
 * Store metadata from updated spuffordCurrency collection
 * in other collections
 *
 **/

const onFinished = async ({ db = null }) => {
  const sourceCollection = await db.collection("spuffordCurrency");
  const distinctPlaces = await sourceCollection.distinct("Place");
  await insertOrUpdateAll({
    db,
    collName: "spuffordPlaces",
    list: distinctPlaces,
  });
  const distinctCurrenciesTo = await sourceCollection.distinct("Currency (To)");
  await insertOrUpdateAll({
    db,
    collName: "spuffordCurrencyNames",
    list: distinctCurrenciesTo,
    update: (_) => ({ to: true }),
  });
  const distinctCurrenciesFrom = await sourceCollection.distinct(
    "Currency (From)"
  );
  await insertOrUpdateAll({
    db,
    collName: "spuffordCurrencyNames",
    list: distinctCurrenciesFrom,
    update: (_) => ({ from: true }),
  });
  const distinctExchangeTypes = await sourceCollection.distinct(
    "Type of Exchange"
  );
  await insertOrUpdateAll({
    db,
    collName: "spuffordExchangeTypes",
    list: distinctExchangeTypes,
  });
  return { message: "Filters updated" };
};

const findAndReplace = ({ documents = [], collection = null }) => {
  let nSuccess = 0;
  let nFail = 0;

  const nFailByCodeName = {};
  const add = (codeName) => {
    if (!nFailByCodeName[codeName]) {
      nFailByCodeName[codeName] = 1;
    } else {
      nFailByCodeName[codeName] += 1;
    }
  };
  return Promise.all(
    Object.keys(documents)
      .map((v) => v + 1)
      .map(async (num, i) => {
        await collection
          .findOneAndReplace({ Num: +num }, documents[i], {
            upsert: true,
          })
          .then(() => (nSuccess += 1))
          .catch((e) => {
            nFail += 1;
            add(e.codeName);
          });
      })
  ).then(() => {
    return { nSuccess, nFail, nFailByCodeName };
  });
};

module.exports = { findAndReplace, onFinished };
