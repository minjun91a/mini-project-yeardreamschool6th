const mongoose = require('mongoose');

async function connectDB(){
   mongoose.set('debug', process.env.NODE_ENV !== 'production');

   try {
       await mongoose.connect(process.env.MONGO_URL);
       console.log('DB 접속 완료');
   } catch (e) {
       console.error('DB 접속 실패:', e.message);
       process.exit(1);
   }
}

module.exports = connectDB;