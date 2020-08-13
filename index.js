require('dotenv').config();
const Axios = require('axios');
const { google } = require('googleapis');
const serverless = require('serverless-http');
const express = require('express');
const app = express();
const Memcached = require('memcached');
const memcached = new Memcached(process.env.MEMCACHED_URL, { timeout: 10, maxExpiration: 604800 });

app.use((req, _res, next) => {
  console.log(`URL: ${req.protocol + '://' + req.get('host') + req.originalUrl}`);
  next();
});

app.get('/menu', function (_req, res) {
  memcached.connect(process.env.MEMCACHED_URL, (err) => {
    if (err) console.error(err);
  });
  memcached.get('menu', (err, data) => {
    if (data) {
      // Cache Hit
      console.log('Cache Hit');
      return res.status(200).send({ data });
    } else {
      // Cache Miss
      console.log('Cache Miss');
      const sheets = google.sheets({ version: 'v4', auth: process.env.GOOGLE_SHEETS_API_KEY });
      sheets.spreadsheets.values
        .get({
          spreadsheetId: process.env.GOOGLE_SHEET_ID,
          range: 'Sheet1!A1:G200',
        })
        .then((response) => {
          console.log('Google Sheet Response');
          const keys = response.data.values.shift();
          let formattedData = [];
          response.data.values.forEach((row) => {
            let dataObject = {};
            row.forEach((val, i) => {
              if (val) dataObject[keys[i]] = val;
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
      range: 'Sheet1!A1:G200',
    })
    .then((response) => {
      const keys = response.data.values.shift();
      let formattedData = [];
      response.data.values.forEach((row) => {
        let dataObject = {};
        row.forEach((val, i) => {
          if (val) dataObject[keys[i]] = val;
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

app.get('/getmenu', function (_req, res) {
  memcached.get('menu', (err, data) => {
    if (err) {
      console.error(err);
      return res.sendStatus(500);
    } else if (!data) {
      return res.sendStatus(204);
    }
    return res.status(200).send(data);
  });
});

if (!process.env.SERVERLESS) {
  const port = process.env.PORT || 8080;
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports.handler = serverless(app);
