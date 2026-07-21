const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
        if (err) {
            res.send(`
                <h1>🚀 VLESS Config Generator</h1>
                <p>Server is running!</p>
                <p>Use POST /api/create-config to generate a config</p>
                <p>GET /api/configs to see all configs</p>
            `);
        }
    });
});

let configs = [];

app.post('/api/create-config', (req, res) => {
    const { name, traffic } = req.body;
    const uuid = uuidv4();
    const configId = uuidv4().slice(0, 8);
    const domain = process.env.RAILWAY_URL || 'parham-mini-game-production.up.railway.app';
    const wsPath = `/${uuid.slice(0, 8)}`;
    
    const vlessLink = `vless://${uuid}@${domain}:443?encryption=none&security=tls&sni=${domain}&fp=chrome&type=ws&host=${domain}&path=${wsPath}#${name || 'MyConfig'}`;
    
    const newConfig = {
        id: configId,
        name: name || 'MyConfig',
        link: vlessLink,
        path: wsPath,
        uuid: uuid,
        createdAt: new Date().toISOString()
    };
    
    configs.push(newConfig);
    
    res.json({
        success: true,
        config: newConfig
    });
});

app.get('/api/configs', (req, res) => {
    res.json({
        success: true,
        count: configs.length,
        configs: configs
    });
});

// ===================== WebSocket Server =====================
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Configs stored: ${configs.length}`);
});

const wss = new WebSocket.Server({ 
    server,
    path: '/' // مسیر اصلی رو برای WebSocket باز می‌کنه
});

wss.on('connection', (ws, req) => {
    const clientId = uuidv4().slice(0, 8);
    console.log(`✅ WebSocket client connected: ${clientId}`);
    
    // پیدا کردن مسیر درخواستی
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;
    
    // بررسی اینکه آیا مسیر با یکی از کانفیگ‌ها مطابقت داره
    const matchedConfig = configs.find(c => c.path === path);
    if (matchedConfig) {
        console.log(`✅ Client connected to config: ${matchedConfig.name}`);
        ws.send(JSON.stringify({ 
            type: 'welcome', 
            message: `Connected to ${matchedConfig.name}`,
            config: matchedConfig.id
        }));
    } else {
        console.log(`⚠️ Client connected to unknown path: ${path}`);
        ws.send(JSON.stringify({ 
            type: 'welcome', 
            message: 'Connected to server (no specific config)'
        }));
    }
    
    ws.on('message', (message) => {
        try {
            console.log(`📩 Received from ${clientId}:`, message.toString().slice(0, 100));
            // اکو پاسخ برای تست
            ws.send(`Echo: ${message}`);
        } catch (e) {
            console.error('❌ Error processing WebSocket message:', e.message);
        }
    });
    
    ws.on('close', () => {
        console.log(`❌ WebSocket client disconnected: ${clientId}`);
    });
    
    ws.on('error', (error) => {
        console.error(`⚠️ WebSocket error:`, error.message);
    });
});

// نمایش آمار هر ۳۰ ثانیه
setInterval(() => {
    console.log(`📊 Active WebSocket clients: ${wss.clients.size}`);
    console.log(`📊 Total configs: ${configs.length}`);
}, 30000);
