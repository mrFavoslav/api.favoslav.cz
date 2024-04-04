const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const cookieParser = require('cookie-parser');
const mysql = require('mysql');
const { clientId, clientSecret, port } = require('/home/api/config.json');
const secretKey = process.env.SECRETKEY;
const fs = require('fs');
const path = require('path');

const dotenv = require('dotenv');
const envFilePath = path.resolve('/home/api');
dotenv.config({ path: envFilePath });

function createConnection() {
  return mysql.createConnection({
    host: 'localhost',
    user: 'phpmyadmin',
    password: process.env.MYSQL_PASS,
    database: 'yiff_db',
    supportBigNumbers: true,
    bigNumberStrings: true
  });
}

function closeDatabaseConnection(connection) {
  connection.end((err) => {
    if (err) {
      console.error('[BOApi] Error closing MySQL database connection:', err);
    } else {
      console.log('[BOApi] Connection to MySQL database closed');
    }
  });
}

router.use(cookieParser());
function jwtMiddleware(req, res, next) {
  console.log('[BOApi] JWT Middleware - Request received:', req.method, req.url);

  // Check if the jwtToken cookie is present in the request
  const jwtCookie = req.cookies.jwtToken;

  if (!jwtCookie) {
    console.log('[BOApi] Unauthorized - Missing jwtToken cookie, skipping..');
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing jwtToken cookie.',
    });
    // return next();
  }

  jwt.verify(jwtCookie, secretKey, (err, decoded) => {
    if (err) {

      console.log('[BOApi] Unauthorized - Invalid jwtToken cookie');
      // return res.status(401).json({
      //   error: 'Unauthorized',
      //   message: 'Invalid jwtToken cookie.',
      // });
      const acceptHeader = req.headers.accept || '';
      console.log(req.headers.accept)
      const prefersJson = acceptHeader.includes('application/json');
    
      if (prefersJson) {
        // If the client prefers JSON, send a JSON response
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid jwtToken cookie.',
        });
      } else {
        const htmlCon = path.join('/home/api/err.html');
        // If the client prefers HTML, send HTML content
        return res.status(401).send(htmlCon);
      }
      // return next();
    } else {
      req.user = decoded;
      console.log('[BOApi] Valid jwtToken cookie received', JSON.stringify(decoded));
      res.status(200);
      return next();
    }
    console.log('[BOApi] Middleware execution completed');
    // Uncomment the next() line if you want to pass control to the next middleware or route
    next();
  });
}

router.use(express.json());
router.route('/')
  .post(async (req, res) => {
    const dir = __filename.replace('/home/api/nodes', '').replace('/routes', '').replace('/index.js', '');
    console.log(`[BOApi] Received POST request for ${dir}`);

    const pass = req.body.password;
    if (pass === undefined) {
      return res.status(511).json({
        error: 'Network Authentication Required',
        message: 'No password specified.'
      });
    }

    const connection = createConnection();
    connection.connect((err) => {
      if (err) {
        console.error('[BOApi] Error connecting to MySQL database:', err);
        return res.status(500).json({
          error: 'Internal Server Error',
          message: 'MySQL database error.'
        });
      }
      console.log('[BOApi] Connected to MySQL database');
    });

    const escapedPass = connection.escape(pass);
    const sql = `SELECT * FROM yiff_db_secstor WHERE pass = ${escapedPass}`;

    connection.query(sql, (error, results) => {
      if (error) {
        console.error(error);
        closeDatabaseConnection(connection);
        return res.status(500).json({
          error: 'Internal Server Error',
          message: 'MySQL database error.'
        });
      } else {
        console.log(`[BOApi] SQL command: ${sql} \n[BOApi] Results: ${JSON.stringify(results, null, 2)}`)
        if (results && results.length === 1) {
          closeDatabaseConnection(connection);
          const user = {
            id: results[0] ? results[0].id : null,
            ctid: results[0] ? results[0].ctid : null,
            usrnm: results[0] ? results[0].usrnm : null,
            dsc_id: results[0] ? results[0].dsc_id : null,
            // token_type: oauthData ? oauthData.token_type : null,
            // access_token: oauthData ? oauthData.access_token : null,
            // refresh_token: oauthData ? oauthData.refresh_token : null,
          };

          const jwtToken = jwt.sign(user, secretKey, { expiresIn: '1m' });
          res.cookie('jwtToken', jwtToken, { httpOnly: true, secure: true }).json({ success: true });

        } else {
          closeDatabaseConnection(connection);
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid password.'
          });
        }
      }
    });
  })
  .get(async ({ query }, res, next) => {
    const { code } = query;
    if (code) {
      try {
        const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
          method: "POST",
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            grant_type: "authorization_code",
            redirect_uri: `https://api.favoslav.cz/v1/yiffdb/`
          }).toString(),
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          }
        });

        const oauthData = await tokenResponse.json();
        console.log("oauthData", oauthData)

        const userResult = await fetch("https://discord.com/api/users/@me", {
          headers: {
            authorization: `${oauthData.token_type} ${oauthData.access_token}`
          }
        });

        const userResultData = await userResult.json();
        console.log("userResultData", userResultData)

        const connection = createConnection();
        connection.connect((err) => {
          if (err) {
            console.error('[BOApi] Error connecting to MySQL database:', err);
            return res.status(500).json({
              error: 'Internal Server Error',
              message: 'MySQL database error.'
            });
          }
          console.log('[BOApi] Connected to MySQL database');
        });
    
        const escapedId = connection.escape(userResultData.id);
        const sql = `SELECT * FROM yiff_db_secstor WHERE dsc_id = ${escapedId}`;
    
        connection.query(sql, (error, results) => {
          if (error) {
            console.error(error);
            closeDatabaseConnection(connection);
            return res.status(500).json({
              error: 'Internal Server Error',
              message: 'MySQL database error.'
            });
          } else {
            console.log(`[BOApi] SQL command: ${sql} \n[BOApi] Results: ${JSON.stringify(results, null, 2)}`)
            if (results && results.length === 1) {
              //closeDatabaseConnection(connection);
              const user = {
                id: results[0] ? results[0].id : null,
                ctid: results[0] ? results[0].ctid : null,
                usrnm: results[0] ? results[0].usrnm : null,
                dsc_id: results[0] ? results[0].dsc_id : null,
                token_type: oauthData ? oauthData.token_type : null,
                access_token: oauthData ? oauthData.access_token : null,
                refresh_token: oauthData ? oauthData.refresh_token : null,
              };
    
              // Check if escapedId is equal to dsc_id
              if (userResultData.id == user.dsc_id) {

                const insertSql = `UPDATE yiff_db_secstor SET token_type = ?, access_token = ?, refresh_token = ? WHERE dsc_id = ${escapedId}`
                const newData = [oauthData.token_type, oauthData.access_token, oauthData.refresh_token]

                connection.query(insertSql, newData, (insertError, insertResults) => {
                  if (insertError) {
                    console.error(insertError);
                    closeDatabaseConnection(connection);
                    return res.status(500).json({
                      error: 'Internal Server Error',
                      message: 'Failed to insert data into the database.'
                    });
                  }

                  console.log('[BOApi] Data inserted successfully:', insertResults);
                });

                const jwtToken = jwt.sign(user, secretKey, { expiresIn: '1m' });
                res.cookie('jwtToken', jwtToken, { httpOnly: true, secure: true });
                res.redirect('https://www.favoslav.cz/yiff_db_js/content')

              } else {
                return res.status(401).json({
                  error: 'Unauthorized',
                  message: 'Invalid authentication.'
                });
              }
            } else {
              closeDatabaseConnection(connection);
              return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid authentication.'
              });
            }
          }
        });

      } catch (error) {
        console.error(error);
      }
    } else {
      const dir = __dirname.replace("/home/api/nodes", "");
      console.log(`[BOApi] Received GET request for ${dir}`);
      const responseHtml = `<style>pre { display: block; font-family: monospace; white-space: pre; margin: 1em 0px; }</style><pre>API ${dir} directory operational.</pre>`;
      return res.status(200).send(responseHtml);
      //console.log("1")
      //next();
    }
  });

router.route('/login')
  .post(jwtMiddleware, async (req, res) => {
    const htmlCon = path.join('/home/api/test.html');
  
    // Option 1: Using res.sendFile()
    res.sendFile(htmlCon);
  });

module.exports = router;
