require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./middlewares/error');

const app = express();

app.use(cors({origin: process.env.CORS_ORIGIN, credentials: true}));
app.use(express.json());

app.use(
    '/uploads',
    express.static(path.join(__dirname, '../uploads'))
);

app.get('/health', (req, res) => {
    return res.json({
        success: true, data: {status: 'ok', uptime: process.uptime()}
    });
});

app.use('/api/posts', require('./routes/posts'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/place-updates', require('./routes/placeUpdates'));
app.use('/api/quick-signals', require('./routes/quickSignals'));
app.use('/api/confirmations', require('./routes/confirmations'));
app.use('/api/place-statuses', require('./routes/placeStatuses'));
app.use('/api/places', require('./routes/places'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/users', require('./routes/users'));
app.use('/*path', (req, res) => {
    return res.status(404).json({
        success: false,
        error: {code: 'NOT_FOUND', message: '없는 경로입니다.'}
    });
});

app.use(errorHandler);

module.exports = app;
