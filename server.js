const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ذخیره کانفیگ‌های ساخته شده
const configs = new Map();

// میدل‌ورها
app.use(express.json());
app.use(express.static('public'));

// صفحه اصلی
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API برای ساخت کانفیگ جدید
app.post('/api/create-config', (req, res) => {
    const { name, traffic } = req.body;
    
    const uuid = uuidv4();
    const configId = uuidv4().slice(0, 8);
    const domain = process.env.RAILWAY_URL || 'your-app.up.railway.app';
    const path = `/${uuid.slice(0, 8)}`;
    
    // ساخت لینک VLESS
    const vlessLink = `vless://${uuid}@${domain}:443?encryption=none&security=tls&sni=${domain}&fp=chrome&type=ws&host=${domain}&path=${path}#${name || 'MyConfig'}`;
    
    // ذخیره اطلاعات
    configs.set(configId, {
        id: configId,
        name: name || 'MyConfig',
        uuid: uuid,
        link: vlessLink,
        traffic: traffic || 0,
        createdAt: new Date().toISOString(),
        path: path
    });
    
    res.json({
        success: true,
        config: {
            id: configId,
            name: name || 'MyConfig',
            link: vlessLink,
            path: path,
            uuid: uuid
        }
    });
});

// API برای دریافت لیست کانفیگ‌ها
app.get('/api/configs', (req, res) => {
    const allConfigs = Array.from(configs.values());
    res.json({
        success: true,
        count: allConfigs.length,
        configs: allConfigs
    });
});

// API برای حذف کانفیگ
app.delete('/api/config/:id', (req, res) => {
    const { id } = req.params;
    if (configs.has(id)) {
        configs.delete(id);
        res.json({ success: true, message: 'Config deleted' });
    } else {
        res.status(404).json({ success: false, message: 'Config not found' });
    }
});

// شروع سرور
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Configs stored: ${configs.size}`);
});
