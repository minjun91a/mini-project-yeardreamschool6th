const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    type: {
        type: String,
        enum: ['place_now'],
        required: true
    },

    place: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Place',
        required: true
    },

    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },

    isRead: {
        type: Boolean,
        default: false,
        index: true
    }
}, {
    collection: 'notifications',
    timestamps: true
});

schema.index({
    user: 1,
    createdAt: -1
});

module.exports = mongoose.model('Notification', schema);