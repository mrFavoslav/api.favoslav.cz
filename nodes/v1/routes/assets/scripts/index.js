const express = require('express');
const router = express.Router();
const fs = require('fs');
const {clientId, clientSecret, port} = require('/home/api/config.json');

router.get('/', async ({ query }, res) => {
    const dir = __filename.replace('/home/api/nodes', '').replace('/routes', '').replace('index.js', '');
    console.log(`[BOApi] Received GET request for ${dir}`);
    res.sendFile("script.js", { root: "/home/api/nodes/v1/routes/assets/scripts/non-js-content" });
  });

module.exports = router;