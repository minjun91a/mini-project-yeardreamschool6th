require('dotenv').config();

const express = require('express');
const cors = require('cors');
const errorHandler = require('./middlewares/error');

const app = express();

app.use(cors({origin: process.env.CORS_ORIGIN, credentials: true}));
app.use(express.json());
app.use((req, res, next) => {
    console.log(`[DEBUG] ${req.method} ${req.originalUrl}`);
    next();
});

app.get('/health', (req, res) => {
    return res.json({
        success: true, data: {status: 'ok', uptime: process.uptime()}
    });
});

app.get('/boom', (req, res) => {
    throw new Error('의도적인 에러');
});

app.use('/api/posts', require('./routes/posts'));
app.use('/*path', (req, res) => {
    console.log('[DEBUG] 매칭된 라우터 없음:', req.originalUrl);
    return res.status(404).json({
        success: false,
        error: {code: 'NOT_FOUND', message: '없는 경로입니다.'}
    });
});

app.use(errorHandler);

module.exports = app;