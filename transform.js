const first = require("lodash.first");
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

const sampleBrokenRecord = [
  "774",
  "Florence",
  "1405.09.01",
  "",
  "Manual",
  "Florence, florin of",
  "1 Florence, soldo of",
  "77.15",
  "8",
  "31",
];

const sampleTransformedRecord = {
  _rawEntry:
    "[\n" +
    '  "774",\n' +
    '  "Florence",\n' +
    '  "1405.09.01",\n' +
    '  "",\n' +
    '  "Manual",\n' +
    '  "Florence, florin of",\n' +
    '  "1 Florence, soldo of",\n' +
    '  "77.15",\n' +
    '  "8",\n' +
    '  "31"\n' +
    "]",
  Num: 774,
  Place: "Florence",
  "Date (Start)": "1405-09-01T05:17:32.000Z",
  "Date (End)": "",
  "Type of Exchange": "Manual",
  "Currency (From)": "Florence, florin of",
  "Amount (From)": 1,
  "Currency (To)": "Florence, soldo of",
  "Amount (To)": 77.15,
  Notes: "8",
  Source: "31",
  Modified: "2020-12-20T16:01:08.920Z",
  "Invalid Fields": ["Date (End)"],
};

/**
 * Corrects missing accented chars in MEMDB web results
 * @param {string} rawString
 *
 * @return {string} - correctedString
 */
const fixAccentedString = (rawString) => {
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
 * parse a DB date string to JS Date object
 */
const parseDate = (dateStr) => {
  return !dayjs(dateStr, ["YYYY", "YYYY.MM.DD", "YYYY.MM"], true).isValid()
    ? dateStr
    : dayjs(dateStr, ["YYYY", "YYYY.MM.DD", "YYYY.MM"], true).toDate();
};

/**
 * Store "invalid-but-acceptable" status for certain fields in DB
 * (because I can't find how to validate schema at field level in MongoDB)
 */

const getInvalidFields = (transformedRecord = {}) =>
  [
    ["Date (Start)", dayjs(transformedRecord["Date (Start)"]).isValid()],
    ["Date (End)", dayjs(transformedRecord["Date (End)"]).isValid()],
    ["Amount (From)", transformedRecord["Amount (From)"] >= 0],
    ["Amount (To)", transformedRecord["Amount (To)"] >= 0],
  ]
    .filter(([_, v]) => !v)
    .map(([k, _]) => k);

/**
 *  Corrects MEMDB raw entry (missing seperators in data and header)
 * @param {Object} brokenRecord - original record
 * @param {string - actual contents: 'Num'} brokenRecord['Num Place']
 * @param {string - actual contents: 'Place'} brokenRecord['Date (Start)']
 * @param {string - actual contents: 'Date (Start)'} brokenRecord['Date (End)']
 * @param {string - actual contents: 'Date (End)'} brokenRecord['Type of Exchange']
 * @param {string - actual contents: 'Type of Exchange'} brokenRecord['Currency (From)']
 * @param {string - actual contents: 'Currency (From)'} brokenRecord['Amount (From)']
 * @param {string - actual contents: 'Amount (From) + space + Currency (To)'} brokenRecord['Currency (To)']
 * @param {string - actual contents: 'Amount (To)'} brokenRecord['Amount (To)']
 * @param {string - actual contents: 'Source'} brokenRecord['Source']
 * @param {string - actual contents: 'Notes'} brokenRecord['Notes']
 *
 * @return {Object} - fixed record plus some new fields
 */
const transformRecord = (brokenRecord = {}) => {
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
    ] = Object.values(brokenRecord).map((v) => v.trim());
    let transformedRecord = {};
    transformedRecord["_rawEntry"] = JSON.stringify(brokenRecord, null, 2);
    transformedRecord["Num"] = parseInt(num, 10);
    transformedRecord["Place"] = fixAccentedString(place);
    transformedRecord["Date (Start)"] = parseDate(startDate);
    transformedRecord["Date (End)"] = parseDate(endDate);
    transformedRecord["Type of Exchange"] = exchangeType || "";
    transformedRecord["Currency (From)"] = fixAccentedString(currFrom);
    const amtFrom = first(amtFromAndCurrTo.match(/^[0-9]+/)) || "";
    transformedRecord["Amount (From)"] = !amtFrom
      ? -1
      : !Number.isNaN(+amtFrom)
      ? +amtFrom
      : -1;
    const currTo = amtFromAndCurrTo.slice(amtFrom.length);
    transformedRecord["Currency (To)"] = fixAccentedString(currTo).trim();
    transformedRecord["Amount (To)"] = !Number.isNaN(+amtTo) ? +amtTo : -1;
    transformedRecord["Notes"] = notes || "";
    transformedRecord["Source"] = source || "";
    transformedRecord["Modified"] = new Date();

    transformedRecord["Invalid Fields"] = getInvalidFields(transformedRecord);

    return transformedRecord;
  } catch (e) {
    console.warn("Error transforming brokenRecord: ", e.message);
  }
  return null;
};

module.exports = { transformRecord, fixAccentedString };
