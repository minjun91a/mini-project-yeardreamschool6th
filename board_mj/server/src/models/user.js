const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const schema = new mongoose.Schema({
    id: {
        type: String,
        required: [true, '아이디는 필수입니다.'],
        unique: true,
        trim: true,
        minLength: [4, '아이디는 4자 이상입니다.'],
        maxLength: [25, '아이디는 25자 이하입니다.']
    },

    pw: {
        type: String,
        required: [true, '비밀번호는 필수입니다.'],
        trim: true,
        minLength: [8, '비밀번호는 8자 이상입니다.'],
        select: false
    },

    name: {
        type: String,
        required: [true, '이름은 필수입니다.'],
        trim: true,
        maxLength: 20
    },

    grade: {
        type: String,
        default: 'user',
        enum: ['user', 'admin']
    },
}, {collection: 'users', timestamps: true, id: false});

schema.pre('save', async function() {
    console.log('[DEBUG] pw 변경 여부:', this.isModified('pw'));

    if (!this.isModified('pw')) return;
    this.pw = await bcrypt.hash(this.pw, 10);

    console.log('[DEBUG] 해싱 결과 prefix:', this.pw.substring(0, 7));
});

schema.methods.checkPw = function(plain) {
    console.log('[DEBUG] checkPw:', {hasPlain: !!plain, hasHash: !!this.pw});
    return bcrypt.compare(plain, this.pw);
};

module.exports = mongoose.model('User', schema);