const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    title: {type: String, required: [true, '제목은 필수입니다.'], trim: true, maxLength: [100, '제목은 100자 이하입니다.']},
    content: {type: String, required: [true, '내용은 필수입니다.'], trim: true, maxLength: [5000, '내용은 5000자 이하입니다.']},
    author: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    viewCount: {type: Number, default: 0},
    commentCount: {type: Number, default: 0},
}, {collection: 'posts', timestamps: true, id: false});

schema.index({createdAt: -1});

module.exports = mongoose.model('Post', schema);