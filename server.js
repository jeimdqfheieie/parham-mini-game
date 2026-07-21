const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

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
    const path = `/${uuid.slice(0, 8)}`;
    
    const vlessLink = `vless://${uuid}@${domain}:443?encryption=none&security=tls&sni=${domain}&fp=chrome&type=ws&host=${domain}&path=${path}#${name || 'MyConfig'}`;
    
    const newConfig = {
        id: configId,
        name: name || 'MyConfig',
        link: vlessLink,
        path: path,
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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Configs stored: ${configs.length}`);
});
