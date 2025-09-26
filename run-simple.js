const http = require('http');
const fs = require('fs');
const path = require('path');

// Simple HTTP server for the waste management system
const server = http.createServer((req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // API endpoints
    if (req.url.startsWith('/api/')) {
        handleApiRequest(req, res);
        return;
    }

    // Serve static files
    serveStaticFile(req, res);
});

function handleApiRequest(req, res) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    let response = {};

    switch (req.url) {
        case '/api/health':
            response = {
                status: "ok",
                timestamp: new Date().toISOString(),
                services: {
                    database: "connected",
                    redis: "connected",
                    s3: "connected"
                }
            };
            break;
        case '/api/cases':
            response = [
                {
                    id: "1",
                    caseNumber: "WM20240115001",
                    siteLat: 35.6762,
                    siteLng: 139.6503,
                    siteAddress: "東京都渋谷区恵比寿1-1-1",
                    wasteType: "一般廃棄物",
                    wasteCategory: "可燃ごみ",
                    scheduledDate: "2024-01-15T10:00:00Z",
                    status: "NEW",
                    priority: "NORMAL",
                    createdAt: "2024-01-15T09:00:00Z"
                }
            ];
            break;
        case '/api/carriers':
            response = [
                {
                    id: "1",
                    name: "サンプル収集業者",
                    licenseNumber: "A123456789",
                    permitTypes: ["一般廃棄物", "産業廃棄物"],
                    serviceAreas: ["東京都", "神奈川県"],
                    rating: 4.5,
                    isActive: true
                }
            ];
            break;
        case '/api/reports/dashboard':
            response = {
                totalCases: 156,
                activeCases: 23,
                completedCases: 133,
                totalCarriers: 45,
                activeCarriers: 42,
                monthlyStats: {
                    cases: 45,
                    revenue: 2500000,
                    avgProcessingTime: "3.2時間"
                }
            };
            break;
        default:
            response = { error: 'Endpoint not found', path: req.url };
    }

    res.writeHead(200);
    res.end(JSON.stringify(response, null, 2));
}

function serveStaticFile(req, res) {
    let filePath = path.join(__dirname, 'demo', 'frontend.html');
    
    if (req.url === '/') {
        filePath = path.join(__dirname, 'demo', 'index.html');
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(404);
            res.end('File not found');
        } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(content, 'utf-8');
        }
    });
}

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
    console.log('🚀 Waste Management System - Simple Server');
    console.log('==========================================');
    console.log(`📊 Frontend: http://localhost:${PORT}`);
    console.log(`🔌 API: http://localhost:${PORT}/api/`);
    console.log(`❤️ Health: http://localhost:${PORT}/api/health`);
    console.log('==========================================');
    console.log('Press Ctrl+C to stop the server');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Server stopped');
    process.exit(0);
});
