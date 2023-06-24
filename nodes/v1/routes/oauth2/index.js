const express = require('express');
const router = express.Router();
const fs = require('fs');
const {clientId, clientSecret, port} = require('/home/api/config.json');

var RateLimit = require('express-rate-limit');
var limiter = RateLimit({
  windowMs: 1*60*1000, // 1 minute
  max: 5
});

// apply rate limiter to all requests
router.use(limiter);

router.get('/', async ({ query }, res) => {
    const dir = __filename.replace('/home/api/nodes', '').replace('/routes', '').replace('/index.js', '');
    console.log(`[BOApi] Received GET request for ${dir}`);

    const { code } = query;
    if (code) {
      try {
        //!Gets users OAUTH2 token
        const tokenResponseData = await request('https://discord.com/api/oauth2/token', {
          method: 'POST',
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: `https://api.favoslav.cz/oauth2`,
            //scope: 'identify, guilds',
          }).toString(),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
        const oauthData = await tokenResponseData.body.json();
        const oauthDataStringify = JSON.stringify(oauthData, null, 4)
        //!Fetches user data
  
        const userResult = await request('https://discord.com/api/users/@me', {
          headers: {
            authorization: `${oauthData.token_type} ${oauthData.access_token}`,
          },
        });
        const userResultData = await userResult.body.json();
        const userResultDataStringify = JSON.stringify(userResultData, null, 4)
        //!Fetches users guild data
  
        const gldResult = await request('https://discord.com/api/users/@me/guilds', {
          headers: {
            authorization: `${oauthData.token_type} ${oauthData.access_token}`,
          },
        });
        const gldResultData = await gldResult.body.json();
        const gldResultDataStringify = JSON.stringify(gldResultData, null, 4)
  
        if (userResultData === undefined) return console.log('userResultData is undefined.')
        fs.mkdirSync(`/home/api/data/user_data/${userResultData.id}`, { recursive: true })
        fs.writeFile(`/home/api/data/user_data/${userResultData.id}/oauthData.json`, oauthDataStringify, (err) => { if (err) throw err; })
        fs.writeFile(`/home/api/data/user_data/${userResultData.id}/guildData.json`, gldResultDataStringify, (err) => { if (err) throw err; })
        fs.writeFile(`/home/api/data/user_data/${userResultData.id}/userResultData.json`, userResultDataStringify, (err) => { if (err) throw err; })
  
      } catch (error) {
        console.error(error);
      }
    }
    res.sendFile('index.html', { root: '/home/api' });
    return;
  });

module.exports = router;