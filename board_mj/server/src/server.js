require('dotenv').config();

const app = require('./app');
const connectDB = require('./db');

const PORT = process.env.PORT || 80;

(async () => {
    await connectDB();

    app.listen(PORT, () => console.log('http://localhost'));
})();