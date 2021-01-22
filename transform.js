const first = require("lodash.first");
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

/**
 * @desc Corrects missing accented chars in Rutgers' data
 * @param {string} rawString
 * @return {string} - correctedString
 */
const cleanAccentedString = (rawString) => {
  return rawString
    .replace("Besan?on", "Besançon")
    .replace("Br?nn", "Brünn")
    .replace("C?teaux", "Cîteaux")
    .replace("Cogl?s", "Coglès")
    .replace("H?xter", "Hüxter")
    .replace("L?beck", "Lübeck")
    .replace("l'?cu", "l'écu")
    .replace("Li?ge", "Liège")
    .replace("Lw?w", "Lwów")
    .replace("R?mi", "Rémi")
    .replace("Th?rouanne", "Thérouanne")
    .replace("Z?rich", "Zürich")
    .replace(/([^a-zA-Z])\?cu([^a-z])/, "$1écu$2")
    .replace(/(\s)\?(cus\s)/, "$1é$2") // " ?cus " -> " écus "
    .replace(/\s\?\s/, " à ");
};

/**
 * @param  {string} dateStr
 * @return {Date|string} - Date object, or string if date could not be parsed
 */
const cleanDate = (dateStr) => {
  return !dayjs(dateStr, ["YYYY", "YYYY.MM.DD", "YYYY.MM"], true).isValid()
    ? dateStr
    : dayjs(dateStr, ["YYYY", "YYYY.MM.DD", "YYYY.MM"], true).toDate();
};

/**
 * @desc Store "invalid-but-acceptable" status for certain fields in DB
 * @param {Object} record
 * @return {string[]} keys of a record's invalid fields
 */
const getInvalidSpufFields = (record = {}) =>
  [
    ["Date (Start)", dayjs(record["Date (Start)"]).isValid()],
    ["Date (End)", dayjs(record["Date (End)"]).isValid()],
    ["Amount (From)", record["Amount (From)"] >= 0],
    ["Amount (To)", record["Amount (To)"] >= 0],
  ]
    .filter(([_, v]) => !v)
    .map(([k, _]) => k);

/**
 * @desc Cleans a Spufford Currency Exchanges record
 * @param {Object|string[]} srcRecord - original record
 * @return {Object|null} - cleaned record plus some new fields
 */
function cleanSpuffordRecord(srcRecord = {}) {
  try {
    const [
      num,
      place,
      startDate,
      endDate,
      exchangeType,
      currFrom,
      amtFromAndCurrTo,
      amtTo,
      notes,
      source,
    ] = Object.values(srcRecord).map((v) => v.trim());

    let record = {};
    record["_rawEntry"] = JSON.stringify(srcRecord, null, 2);
    record["Num"] = parseInt(num, 10);
    record["Place"] = cleanAccentedString(place);
    record["Date (Start)"] = cleanDate(startDate);
    record["Date (End)"] = cleanDate(endDate);
    record["Type of Exchange"] = exchangeType || "";
    record["Currency (From)"] = cleanAccentedString(currFrom);
    const amtFrom = first(amtFromAndCurrTo.match(/^[0-9]+/)) || "";
    record["Amount (From)"] = !amtFrom
      ? -1
      : !Number.isNaN(+amtFrom)
      ? +amtFrom
      : -1;
    const currTo = amtFromAndCurrTo.slice(amtFrom.length);
    record["Currency (To)"] = cleanAccentedString(currTo).trim();
    record["Amount (To)"] = !Number.isNaN(+amtTo) ? +amtTo : -1;
    record["Notes"] = notes || "";
    record["Source"] = source || "";
    record["Modified"] = new Date();

    record["Invalid Fields"] = getInvalidSpufFields(record);

    return record;
  } catch (e) {
    console.warn("Error transforming srcRecord: ", e.message);
    return null;
  }
}

/**
 * @desc Cleans a Posthumus Prices record
 * @param {Object|string[]} srcRecord - original record
 * @return {Object|null} - cleaned record plus some new fields
 */
const cleanPosthumusRecord = (srcRecord = {}) => {
  try {
    const [
      num,
      year,
      month,
      productEnglish,
      productDutch,
      volume,
      currencyAndPrice,
      notes = -1,
    ] = Object.values(srcRecord).map((v) => v.trim());
    let record = {};
    record["_rawEntry"] = JSON.stringify(srcRecord, null, 2);
    record["Num"] = parseInt(num, 10);
    record["Year"] = parseInt(year, 10);
    record["Month"] = parseInt(month, 10);
    record["ProductEnglish"] = productEnglish;
    record["ProductDutch"] = productDutch;
    record["Volume"] = volume;
    record["Notes"] = parseInt(notes, 10);

    const [rawCurrency = "", rawPrice = -1] = currencyAndPrice.split(/\s/, 2);
    record["Currency"] = rawCurrency;
    record["Price"] = !Number.isNaN(+rawPrice) ? +rawPrice : -1;
    record["Modified"] = new Date();
    return record;
  } catch (e) {
    console.warn("Posthumus prices: Error transforming srcRecord: ", e.message);
    return null;
  }
};

const cleanRecord = {
  spuffordCurrency: cleanSpuffordRecord,
  posthumusPrices: cleanPosthumusRecord,
};

module.exports = {
  cleanRecord,
};
