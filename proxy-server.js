/**
 * Local proxy server for Ahrefs API
 * Keeps API key server-side, not exposed to browser
 * 
 * Usage: node proxy-server.js
 * Then open index.html in browser
 */

const http = require('http');
const https = require('https');
const url = require('url');

// Load from environment variable (set in your shell via mcp-env.sh)
const AHREFS_API_KEY = process.env.AHREFS_API_KEY;

if (!AHREFS_API_KEY) {
    console.error('Error: AHREFS_API_KEY environment variable not set');
    console.error('Make sure to source ~/.config/aidevops/mcp-env.sh first');
    process.exit(1);
}

const PORT = 3001;

const server = http.createServer((req, res) => {
    // CORS headers for local development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);

    if (parsedUrl.pathname === '/api/domain-metrics') {
        const domain = parsedUrl.query.domain;

        if (!domain) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing domain parameter' }));
            return;
        }

        // Ahrefs API endpoint for domain rating
        const ahrefsUrl = `https://api.ahrefs.com/v3/site-explorer/domain-rating?target=${encodeURIComponent(domain)}&date=2024-01-01`;

        const options = {
            headers: {
                'Authorization': `Bearer ${AHREFS_API_KEY}`,
                'Accept': 'application/json'
            }
        };

        https.get(ahrefsUrl, options, (apiRes) => {
            let data = '';

            apiRes.on('data', chunk => data += chunk);
            apiRes.on('end', () => {
                res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
                res.end(data);
            });
        }).on('error', (err) => {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        });

    } else if (parsedUrl.pathname === '/api/metrics-overview') {
        const domain = parsedUrl.query.domain;

        if (!domain) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing domain parameter' }));
            return;
        }

        // Ahrefs metrics overview endpoint
        const ahrefsUrl = `https://api.ahrefs.com/v3/site-explorer/metrics?target=${encodeURIComponent(domain)}&mode=subdomains`;

        const options = {
            headers: {
                'Authorization': `Bearer ${AHREFS_API_KEY}`,
                'Accept': 'application/json'
            }
        };

        https.get(ahrefsUrl, options, (apiRes) => {
            let data = '';

            apiRes.on('data', chunk => data += chunk);
            apiRes.on('end', () => {
                res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
                res.end(data);
            });
        }).on('error', (err) => {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        });

    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

server.listen(PORT, () => {
    console.log(`Ahrefs proxy server running at http://localhost:${PORT}`);
    console.log('Endpoints:');
    console.log(`  GET /api/domain-metrics?domain=example.com`);
    console.log(`  GET /api/metrics-overview?domain=example.com`);
});
