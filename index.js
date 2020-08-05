require('dotenv').config();
const { google } = require('googleapis');
const serverless = require('serverless-http');
const express = require('express');
const app = express();

app.get('/menu', function (req, res) {
  console.time('test');
  const sheets = google.sheets({ version: 'v4', auth: process.env.GOOGLE_SHEETS_API_KEY });
  sheets.spreadsheets.values
    .get({
      spreadsheetId: '1wlyMhZjDg9HQJ0QjIOFNxVUpp1rjc419g7SvjKm3yyM',
      range: 'Sheet1!A1:D150',
    })
    .then((response) => {
      const keys = response.data.values.shift();
      let formattedData = [];
      response.data.values.forEach((row) => {
        let dataObject = {};
        row.forEach((val, i) => {
          dataObject[keys[i]] = val;
        });
        formattedData.push(dataObject);
      });
      console.timeEnd('test');
      return res.status(200).send(JSON.stringify({ data: formattedData }));
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).send(JSON.stringify({ err }));
    });
});

module.exports.handler = serverless(app);
