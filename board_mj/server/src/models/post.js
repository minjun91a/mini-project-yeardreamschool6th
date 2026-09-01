const mongoose = require('mongoose');

const schema = new mongoose.Schema(
    {
        kind: {
            type: String,
            enum: ['board', 'now'],
            default: 'board',
            index: true
        },

        title: {
            type: String,
            trim: true,
            maxLength: [100, '제목은 100자 이하입니다.']
        },

        content: {
            type: String,
            required: [true, '내용은 필수입니다.'],
            trim: true,
            maxLength: [1000, '내용은 1000자 이하입니다.']
        },

        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        place: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Place',
            default: null,
            index: true
        },

        status: {
            type: String,
            enum: ['quiet', 'normal', 'busy'],
            default: null
        },

        visitVerified: {
            type: Boolean,
            default: false
        },

        viewCount: {
            type: Number,
            default: 0
        }
    },
    {
        collection: 'posts',
        timestamps: true,
        id: false
    }
);

schema.index({createdAt: -1});

schema.index({
    kind: 1,
    createdAt: -1
});

schema.index({
    place: 1,
    createdAt: -1
})

module.exports = mongoose.model('Post', schema);