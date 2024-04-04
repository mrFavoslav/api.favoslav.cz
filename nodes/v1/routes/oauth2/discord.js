const express = require("express");
const router = express.Router();
const fs = require("fs");
const { request } = require("undici");
const { clientId, clientSecret, port } = require("/home/api/config.json");

var RateLimit = require('express-rate-limit');
var limiter = RateLimit({
  windowMs: 1*60*1000, // 1 minute
  max: 50
});

// apply rate limiter to all requests
router.use(limiter);

router.get("/", async ({ query }, res) => {
  const dir = __filename.replace("/home/api/nodes", "").replace("/routes", "").replace(".js", "");
  console.log(`[BOApi] Received GET request for ${dir}`);

  const { code } = query;
  if (code) {
    try {
      //!Gets users OAUTH2 token
      const tokenResponseData = await request(
        "https://discord.com/api/oauth2/token",
        {
          method: "POST",
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            grant_type: "authorization_code",
            redirect_uri: `https://api.favoslav.cz/v1/oauth2/discord`
            //scope: 'identify, guilds',
          }).toString(),
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          }
        }
      );

      const oauthData = await tokenResponseData.body.json();

      //!Fetches user data
      const userResult = await request("https://discord.com/api/users/@me", {
        headers: {
          authorization: `${oauthData.token_type} ${oauthData.access_token}`
        }
      });
      const userResultData = await userResult.body.json();

      if (userResultData.id == 553946762289610785) {
        res.redirect("https://favoslav.cz/yiff_db/");
        return;
      }
    } catch (error) {
      console.error(error);
    }
  }
  res.sendFile("login.html", { root: "/home/api" });
});

module.exports = router;
