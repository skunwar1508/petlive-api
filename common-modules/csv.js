const {Parser} =  require('@json2csv/plainjs')
const fs = require("fs");
const config = require("../common-modules/config");

const jsonToCsv = async (doc) => {
  const parser = new Parser();
  const csv = parser.parse(doc);

  const csvFileName = config.randomizer();
  const dir = "./csv";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  const filePath = `${dir}/${csvFileName}.csv`;
  fs.writeFileSync(filePath, csv, (err) => {
    if (err) throw new Error("csv not generated");
  });

  return csvFileName;
};

module.exports = jsonToCsv;
