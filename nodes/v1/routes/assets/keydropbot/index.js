const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { clientId, clientSecret, port } = require('/home/api/config.json');

router.use('/monkey', (req, res, next) => {
    const requestedPath = `/v1/assets/keydropbot/monkey${req.path}`;
    console.log(`[BOApi] Received GET request for ${requestedPath}`);
    next();
}, express.static("/home/api/nodes/v1/routes/assets/keydropbot/non-js-content/monkey"));

router.use('/app', (req, res, next) => {
    const requestedPath = `/v1/assets/keydropbot/app${req.path}`;
    console.log(`[BOApi] Received GET request for ${requestedPath}`);
    next();
}, express.static("/home/api/nodes/v1/routes/assets/keydropbot/non-js-content/app"));

router.use('/banner', (req, res, next) => {
  const requestedPath = `/v1/assets/keydropbot/app${req.path}`;
  console.log(`[BOApi] Received GET request for ${requestedPath}`);
  next();
}, express.static("/home/api/nodes/v1/routes/assets/keydropbot/non-js-content/banner"));

router.get('/', (req, res) => {
    const dir = __filename.replace('/home/api/nodes', '').replace('/routes', '').replace('index.js', '');
    console.log(`[BOApi] Received GET request for ${dir}`);
    const responseHtml = `<style>pre { display: block; font-family: monospace; white-space: pre; margin: 1em 0px; }</style><pre>API ${dir} directory operational.</pre>`;
    res.status(200).send(responseHtml);
  });

module.exports = router;
