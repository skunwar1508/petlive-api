const axios = require("axios");

if (!process.env.CLIENT_KEY) {
  throw new Error("CLIENT_KEY NOT FOUND");
}

require('dotenv').config();

const PdfLetterHead = async function (htmlData) {
  try {
    let headers = {
      "Content-Type": "application/json",
      "x-client-key": process.env.CLIENT_KEY,
    };
    let data = {
      html: htmlData,
    };
    let response = await axios.post(
        `${process.env.PDF_BASE_URL}/pdfLetterCreation`,
      data,
      {
        headers: headers,
      }
    );
    let result = response.data;
    return result;
  } catch (error) {
    return error;
  }
};

module.exports = { PdfLetterHead };
