const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    post: {type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true},
    author: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    content: {
        type: String,
        required: [true, '내용은 필수입니다.'],
        trim: true,
        maxLength: [500, '댓글은 500자 이하입니다.']
    },
}, {collection: 'comments', timestamps: true, id: false});

schema.index({post: 1, createdAt: 1});

module.exports = mongoose.model('Comment', schema);