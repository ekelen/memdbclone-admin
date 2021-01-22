("use strict");

/**
 * @desc Adds array of JS objects to a MongoDB collection
 * @param {Array<Object>} $documents
 * @param {MongoClient.Db.collection} $collection
 * @return {Object} { nSuccess: Array<ing>, nFail: Array<int>, nFailByCodename: Array<MongoError.codeName> }
 */
module.exports = async ({ documents = [], collection = null }) => {
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
  ).then((_) => {
    return { nSuccess, nFail, nFailByCodeName };
  });
};
