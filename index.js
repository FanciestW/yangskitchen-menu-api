require('dotenv').config();
const serverless = require('serverless-http');
const express = require('express');
const app = express();

app.get('/menu', function (req, res) {
  res.status(200).send(`You got to ${req.path}`);
});

app.get('/test', function (req, res) {
  res.status(200).send(`You got to ${req.path}`);
});

module.exports.handler = serverless(app);
