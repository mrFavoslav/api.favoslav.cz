const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const routesDirectory = path.join(__dirname, "routes");

router.get("/", (req, res) => {
  const dir = __dirname.replace("/home/api/nodes", "");
  console.log(`[BOApi] Received GET request for ${dir}`);
  const responseHtml = `<style>pre { display: block; font-family: monospace; white-space: pre; margin: 1em 0px; }</style><pre>API ${dir} directory operational.</pre>`;
  res.status(200).send(responseHtml);
});

function mountRoutes(directory) {
  const files = fs.readdirSync(directory);

  files.forEach(file => {
    try {
      const filePath = path.join(directory, file);
      const stat = fs.statSync(filePath);

      if (file.includes('non-js-content') && stat.isDirectory()) {

        console.log("[BOApi] Skipping... Non JS content.")
        return;

      } else if (stat.isDirectory()) {
        mountRoutes(filePath);
      } else if (stat.isFile()) {
        if (file === 'index.js') {
          const endpoint = filePath.replace("/home/api/nodes/v1/routes", "").replace(`/${file}`, "");
          const trueendpoint = filePath.replace("/home/api/nodes", "").replace("/routes", "").replace(`/${file}`, "");
          const endpointconfig = require(`.${filePath.replace(__dirname, "")}`);
          console.log(`[BOApi] Loaded endpoint ${trueendpoint}`);
          router.use(endpoint, endpointconfig);
        } else {
          const endpoint = filePath.replace("/home/api/nodes/v1/routes", "").replace(".js", "");
          const trueendpoint = filePath.replace("/home/api/nodes", "").replace("/routes", "").replace(".js", "");
          const endpointconfig = require(`.${filePath.replace(__dirname, "")}`);
          console.log(`[BOApi] Loaded endpoint ${trueendpoint}`);
          router.use(endpoint, endpointconfig);
        }
      }
    } catch (err) {
      console.error(`Error processing file: ${file}`);
      console.error(err);
      return;
    }
  });
}
mountRoutes(routesDirectory);

module.exports = router;
