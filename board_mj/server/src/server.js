require('dotenv').config();

const app = require('./app');
const connectDB = require('./db');

const PORT = process.env.PORT || 80;

console.log('[DEBUG] env:', {
    PORT: process.env.PORT,
    MONGO_URL: process.env.MONGO_URL,
    JWT_SECRET_LEN: process.env.JWT_SECRET?.length
});

(async () => {
    await connectDB();
    console.log('[DEBUG] DB 연결 끝, 서버 시작');

    app.listen(PORT, () => console.log('http://localhost'));
})();