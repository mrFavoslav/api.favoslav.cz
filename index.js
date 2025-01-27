const express = require("express");
const vhost = require("vhost");
const fs = require("fs");
const path = require("path");
const port = require("./config.json");
//const helmet = require('helmet');

const nodesDirectory = path.join(__dirname, "nodes");
const nodes = fs.readdirSync(nodesDirectory);

const app = express();
app.set("trust proxy", 'loopback');
// app.use(helmet.contentSecurityPolicy({
//   directives: {
//     // Specify your CSP directives here
//     defaultSrc: ["'self'"],
//     scriptSrc: ["'self'"],
//     styleSrc: ["'self'"],
//     // Add other directives as needed
//   },
// }));

app.use((req, res, next) => {
  // const origin = req.headers.origin;
  // res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Origin', 'https://www.favoslav.cz');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

var RateLimit = require('express-rate-limit');
var limiter = RateLimit({
  windowMs: 1*60*1000, // 1 minute
  max: 100
});
app.use(limiter);

app.use("/", (req, res, next) => {
  const clientIp = req.headers["x-forwarded-for"] || req.ip;
  const userAgent = req.get("User-Agent");
  console.log(`[BOApi] Request received from IP: ${clientIp}.`);
  console.log(`[BOApi] User-Agent: ${userAgent}.`);
  console.log(`[BOApi] Redirecting...`);
  next();
});

app.get("/", (req, res) => {
  console.log("[BOApi] Received GET request for /");
  const responseHtml = "<style>pre { display: block; font-family: monospace; white-space: pre; margin: 1em 0px; }</style><pre>API / directory operational.</pre>";
  res.status(200).send(responseHtml);
});

nodes.forEach(node => {
  const nodeRoutes = require(`./nodes/${node}/${node}_router.js`);
  const nodeRouter = express.Router().use(`/${node}`, nodeRoutes);
  console.log(`[BOApi] Loaded endpoint /${node}`);
  app.use(vhost("api.favoslav.cz", nodeRouter));
});

app.use((req, res, next) => {
  console.error(`[BOApi] Received GET request for non-existing route ${req.originalUrl}`);
  next();
});

app.listen(port, () => {
  console.log(`[BOApi] Loaded endpoint /`);
  console.log(`[BOApi] App listening at https://api.favoslav.cz/`);
});