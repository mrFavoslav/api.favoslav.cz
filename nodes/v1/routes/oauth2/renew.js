const express = require('express');
const router = express.Router();
const fs = require('fs');
const {request} = require('undici');
const {clientId, clientSecret, port} = require('/home/api/config.json');
const dir = __filename.replace('/home/api/nodes', '').replace('/routes', '').replace('.js', '');

var RateLimit = require('express-rate-limit');
var limiter = RateLimit({
  windowMs: 1*60*1000, // 1 minute
  max: 5
});

// apply rate limiter to all requests
router.use(limiter);

require("dotenv").config({ path: '/home/api/.env' });
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1] || req.headers.authorization || req.query.token;

  if (token === process.env.API_TOKEN) {
    next();
  } else {
    console.error(`[BOApi] Received unauthorized GET request for ${dir}. Connection dropped...`);
    res.sendStatus(401);
  }
};

router.get('/', authenticateToken, async ({ query }, res) => {
    console.log(`[BOApi] Received GET request for ${dir}`);

    if (fs.existsSync('/home/api/data/user_data/undefined')) {
        fs.rmSync('/home/api/data/user_data/undefined', { recursive: true });
      }
    
      const root_folder = fs.readdirSync('/home/api/data/user_data/');
      for (const reslt of root_folder) {
        try {
          console.log('---', reslt)
    
          let prev_cache14ih = require(`/home/api/data/user_data/${reslt}/oauthData.json`);
          delete require.cache[require.resolve(`/home/api/data/user_data/${reslt}/oauthData.json`)];
          const { access_token, token_type, refresh_token } = prev_cache14ih;
    
          console.log(refresh_token)
    
          //!Gets users OAUTH2 token
          const tokenResponseData = await request('https://discord.com/api/oauth2/token', {
            method: 'POST',
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              client_id: clientId,
              client_secret: clientSecret,
              refresh_token: refresh_token,
            }).toString(),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          });
    
          console.log(tokenResponseData.statusCode)
    
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
          console.log(userResultData)
          fs.mkdirSync(`/home/api/data/user_data/${userResultData.id}`, { recursive: true })
          fs.writeFile(`/home/api/data/user_data/${userResultData.id}/oauthData.json`, oauthDataStringify, (err) => { if (err) throw err; })
          fs.writeFile(`/home/api/data/user_data/${userResultData.id}/guildData.json`, gldResultDataStringify, (err) => { if (err) throw err; })
          fs.writeFile(`/home/api/data/user_data/${userResultData.id}/userResultData.json`, userResultDataStringify, (err) => { if (err) throw err; })
    
          let data = {};
          if (fs.existsSync('/home/api/cache/data.json')) {
            const existingData = fs.readFileSync('/home/api/cache/data.json', 'utf8');
            data = JSON.parse(existingData);
    
            data[userResultData.id] = {
              refresh_token: `${refresh_token}`,
              statusCode: `${tokenResponseData.statusCode}`
            };
    
            const newData = JSON.stringify(data, null, 2);
            fs.writeFileSync('/home/api/cache/data.json', newData, (err) => {
              if (err) throw err;
              console.log('Data written to file');
            });
            
          } else if (!fs.existsSync('/home/api/cache/data.json')) {
            data[userResultData.id] = {
              refresh_token: `${refresh_token}`,
              statusCode: `${tokenResponseData.statusCode}`
            };
    
            const jsonData = JSON.stringify(data, null, 2);
            fs.writeFileSync('/home/api/cache/data.json', jsonData, (err) => {
              if (err) throw err;
              console.log('Data written to file');
            });
          }
    
        } catch (error) {
          console.error(error);
        }
      }
    
      res.setHeader('Content-Type', 'application/json');
      if (fs.existsSync('/home/api/cache/data.json')) {
        const fileData = fs.readFileSync('/home/api/cache/data.json', 'utf8');
        const jsonData = JSON.parse(fileData);
        res.send(jsonData);
      } else {
        const jsonData = JSON.parse('{"None": {"refresh_token": "No User","statusCode": "200"}}');
        res.send(jsonData);
      }
  });

module.exports = router;