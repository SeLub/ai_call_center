const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3005; // Using a different port to avoid conflicts

// Serve static files from the ui directory
app.use(express.static(path.join(__dirname, 'ui')));

// Serve the main index.html file for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'ui', 'index.html'));
});

// Create proxy middleware for API requests
// When UI makes a request to /api/rules, Express strips /api and sends /rules to the proxy
// We need to forward it to the target server with the /api prefix
const apiProxy = createProxyMiddleware({
    target: 'http://validation-framework:3002', // Use Docker service name
    changeOrigin: true,
    pathRewrite: {
        // When Express strips /api and sends /rules, we rewrite it back to /api/rules
        '^/(.*)': '/api/$1'
    },
    logLevel: 'debug',
    onProxyReq: (proxyReq, req, res) => {
        console.log(`Proxying ${req.method} ${req.url} to http://validation-framework:3002${req.url}`);
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`Received response with status ${proxyRes.statusCode} from http://validation-framework:3002${req.url}`);
    }
});

// Apply the proxy middleware - only for /api routes
app.use('/api', apiProxy);

// Start the server
app.listen(PORT, () => {
    console.log(`Validation Rule Management UI server running on http://localhost:3005`);
    console.log('UI available at: http://localhost:3005');
    console.log('Note: Make sure the rule management API is running on port 3002');
});