const express = require("express");
const vhost = require("vhost");
const fs = require("fs");
const path = require("path");
const RateLimit = require('express-rate-limit');
const port = require("./config.json");

const nodesDirectory = path.join(__dirname, "nodes");
const nodes = fs.readdirSync(nodesDirectory);

const app = express();

// Trust proxy settings for accurate IP detection behind reverse proxy
app.set("trust proxy", 'loopback');

// CORS middleware with specific origin
const corsMiddleware = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://www.favoslav.cz');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
};

app.use(corsMiddleware);

// Vars for RateLimiter 
const limiter = {
  windowMs: 1 * 60 * 1000,
  max: 500
}

// Helper function to get the real client IP
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
      // Extract the first IP from the x-forwarded-for header
      return forwarded.split(',')[0].trim();
  }
  // Fallback to req.ip if x-forwarded-for is not present
  return req.ip;
};

// Enhanced rate limiter with proper IP extraction
const ipLimiter = RateLimit({
  windowMs: limiter.windowMs, // 1 minute
  max: limiter.max, // max requests per IP
  message: {
      status: 429,
      message: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
      // Use the helper function to get the real client IP
      return getClientIp(req);
  },
  handler: (req, res) => {
      const clientIp = getClientIp(req);
      console.log(`[BOApi] Rate limit exceeded for IP: ${clientIp}`);
      res.status(429).json({
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil(req.rateLimit.resetTime - Date.now()) / 1000
      });
  }
});

app.use(ipLimiter);

// Enhanced logging middleware
app.use("/", (req, res, next) => {
    const clientIp = req.headers["x-forwarded-for"] || req.ip;
    const userAgent = req.get("User-Agent") || 'Unknown';
    const method = req.method;
    const url = req.originalUrl;
    const timestamp = new Date().toISOString();

    console.log(`[BOApi] [${timestamp}] ${method} ${url}`);
    console.log(`[BOApi] IP: ${clientIp}`);
    console.log(`[BOApi] User-Agent: ${userAgent}`);
    
    // Add response logging
    const oldSend = res.send;
    res.send = function(data) {
        console.log(`[BOApi] Response status: ${res.statusCode}`);
        oldSend.apply(res, arguments);
    };

    next();
});

// Root endpoint
app.get("/", (req, res) => {
    console.log("[BOApi] Received GET request for /");
    const responseHtml = `
      <style>
          pre { 
              display: block; 
              font-family: monospace; 
              white-space: pre; 
              margin: 1em 0px; 
          }
      </style>
      <pre>API / directory operational.</pre>
    `;
    res.status(200).send(responseHtml);
});

// Dynamic route loading
nodes.forEach(node => {
    try {
        const nodeRoutes = require(`./nodes/${node}/${node}_router.js`);
        const nodeRouter = express.Router().use(`/${node}`, nodeRoutes);
        console.log(`[BOApi] Successfully loaded endpoint /${node}`);
        app.use(vhost("api.favoslav.cz", nodeRouter));
    } catch (error) {
        console.error(`[BOApi] Error loading endpoint /${node}:`, error);
    }
});

// 404 handler
app.use((req, res, next) => {
    console.error(`[BOApi] 404 - Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        status: 404,
        message: 'Route not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(`[BOApi] Error:`, err);
    res.status(500).json({
        status: 500,
        message: 'Internal server error'
    });
});

// Start server
app.listen(port, () => {
    console.log(`[BOApi] Loaded endpoint /`);
    console.log(`[BOApi] App listening at https://api.favoslav.cz/`);
    console.log(`[BOApi] Rate limit: ${limiter.max} requests per ${limiter.windowMs/1000} seconds per IP`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('[BOApi] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[BOApi] Unhandled Rejection at:', promise, 'reason:', reason);
});