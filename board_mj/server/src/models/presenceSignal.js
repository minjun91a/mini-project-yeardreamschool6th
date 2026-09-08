const mongoose = require('mongoose');

const PRESENCE_SOURCES = [
    'gps'
];

const MATCH_METHODS = [
    'nearby_place',
    'manual_place'
];

const schema = new mongoose.Schema(
    {
        place: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Place',
            required: true,
            index: true
        },

        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true
        },

        source: {
            type: String,
            enum: PRESENCE_SOURCES,
            default: 'gps'
        },

        matchMethod: {
            type: String,
            enum: MATCH_METHODS,
            default: 'nearby_place'
        },

        visitVerified: {
            type: Boolean,
            default: true
        },

        distanceFromPlace: {
            type: Number,
            required: true,
            min: 0
        },

        locationAccuracy: {
            type: Number,
            default: null,
            min: 0
        },

        observedAt: {
            type: Date,
            required: true,
            default: Date.now,
            index: true
        },

        expiresAt: {
            type: Date,
            required: true
        }
    },
    {
        collection: 'presence_signals',
        timestamps: true,
        id: false
    }
);

schema.index({
    place: 1,
    observedAt: -1
});

schema.index({
    expiresAt: 1
}, {
    expireAfterSeconds: 0
});

module.exports = mongoose.model('PresenceSignal', schema);
