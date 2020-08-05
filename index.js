require('dotenv').config();
const serverless = require('serverless-http');
const express = require('express');
const app = express();

app.get('/', function (_req, res) {
  res.send('Hello World!');
});

module.exports.handler = serverless(app);
