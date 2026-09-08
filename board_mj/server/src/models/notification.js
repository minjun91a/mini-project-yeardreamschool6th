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
        enum: ['place_now', 'place_status_changed'],
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
        default: null
    },

    placeStatus: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PlaceStatus',
        default: null
    },

    statusFrom: {
        type: String,
        enum: ['quiet', 'normal', 'busy', 'unknown', null],
        default: null
    },

    statusTo: {
        type: String,
        enum: ['quiet', 'normal', 'busy', 'unknown', null],
        default: null
    },

    message: {
        type: String,
        default: null,
        trim: true,
        maxLength: 200
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
