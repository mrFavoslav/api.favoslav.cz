const express = require('express');
const router = express.Router();
const fs = require('fs');
const {clientId, clientSecret, port} = require('/home/api/config.json');

var RateLimit = require('express-rate-limit');
var limiter = RateLimit({
  windowMs: 1*60*1000, // 1 minute
  max: 1000
});

// apply rate limiter to all requests
router.use(limiter);

router.get('/', async ({ query }, res) => {
    const dir = __filename.replace('/home/api/nodes', '').replace('/routes', '').replace('index.js', '');
    console.log(`[BOApi] Received GET request for ${dir}`);
    res.sendFile("icon.webp", { root: "/home/api/nodes/data/routes/icon/current/non-js-content" });
  });

module.exports = router;