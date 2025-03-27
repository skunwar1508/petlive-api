const fastCsv = require("fast-csv");
const mongoose = require("mongoose");
const moment = require("moment");

const exportToCsv = async (model, populateFields = [], fields = [], res, con, tableHeaders = []) => {
    try {
        let query = model.find(con).lean();

        if (populateFields.length > 0) {
            populateFields.forEach(field => {
                query = query.populate(field);
            });
        }

        const data = await query.exec();

        if (!data.length) {
            return res.status(204).json({ status: false, message: "No data found to export." });
        }

        res.setHeader("Content-Disposition", "attachment; filename=export_data.csv");
        res.setHeader("Content-Type", "text/csv");

        const csvStream = fastCsv.format({ headers: tableHeaders.length > 0 ? tableHeaders : true });
        csvStream.pipe(res);

        data.forEach(item => {
            const csvData = {};

            fields.forEach((field, index) => {
                let value = "N/A";

                if (field.includes(".")) {
                    const fieldPath = field.split(".");
                    let nestedValue = item;

                    fieldPath.forEach(f => {
                        nestedValue = nestedValue ? nestedValue[f] : "N/A";
                    });

                    value = nestedValue;
                } else {
                    value = item[field] || "N/A";
                }

                // **Format Date Fields**
                if (value instanceof Date) {
                    value = moment(value).format("DD-MM-YYYY");
                }

                // Assign value with correct column name from tableHeaders
                const columnName = tableHeaders.length > index ? tableHeaders[index] : field;
                csvData[columnName] = value;
            });

            csvStream.write(csvData);
        });

        csvStream.end();
    } catch (error) {
        console.error("Export Error:", error);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
};

module.exports = exportToCsv;