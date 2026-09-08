require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../db');
const Confirmation = require('../models/confirmation');

(async () => {
    await connectDB();

    const result = await Confirmation.syncIndexes();

    console.log('confirmation indexes synced');
    console.log(JSON.stringify(result, null, 2));

    await mongoose.disconnect();
})().catch(async (err) => {
    console.error(err);

    try {
        await mongoose.disconnect();
    } catch (disconnectErr) {
        console.error(disconnectErr);
    }

    process.exit(1);
});
