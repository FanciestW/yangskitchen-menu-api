require('dotenv').config();
const { google } = require('googleapis');
const serverless = require('serverless-http');
const express = require('express');
const app = express();
const Memcached = require('memcached');
const memcached = new Memcached(process.env.MEMCACHED_URL);

app.get('/menu', function (_req, res) {
  memcached.get('menu', (err, data) => {
    if (data) {
      // Cache Hit
      return res.status(200).send(JSON.stringify({ data }));
    } else if (err || !data) {
      // Cache Miss
      const sheets = google.sheets({ version: 'v4', auth: process.env.GOOGLE_SHEETS_API_KEY });
      sheets.spreadsheets.values
        .get({
          spreadsheetId: process.env.GOOGLE_SHEET_ID,
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
          memcached.set('menu', formattedData, 60 * 60 * 24, (err) => {
            if (err) console.error(err);
          });
          return res.status(200).send(JSON.stringify({ data: formattedData }));
        })
        .catch((err) => {
          console.error(err);
          return res.status(500).send(JSON.stringify({ err }));
        });
    }
  });
});

app.get('/setmenu', function (_req, res) {
  const sheets = google.sheets({ version: 'v4', auth: process.env.GOOGLE_SHEETS_API_KEY });
  sheets.spreadsheets.values
    .get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
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
      memcached.set('menu', formattedData, 60 * 60 * 24, (err) => {
        if (err) console.error(err);
      });
      return res.status(200).send(JSON.stringify({ data: formattedData }));
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).send(JSON.stringify({ err }));
    });
});

app.get('/testget', function (_req, res) {
  memcached.get('menu', (err, data) => {
    if (err) {
      console.error(err);
      return res.sendStatus(500);
    } else if (!data) {
      return res.sendStatus(204);
    }
    return res.status(200).send(JSON.stringify({ data }));
  });
});

if (!process.env.SERVERLESS) {
  const port = process.env.PORT || 8080;
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports.handler = serverless(app);
