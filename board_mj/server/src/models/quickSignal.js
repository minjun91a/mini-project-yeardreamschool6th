const mongoose = require('mongoose');

const QUICK_SIGNAL_STATUSES = [
    'quiet',
    'normal',
    'busy'
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
            index: true
        },

        status: {
            type: String,
            required: true,
            enum: QUICK_SIGNAL_STATUSES
        },

        visitVerified: {
            type: Boolean,
            default: false
        },

        distanceFromPlace: {
            type: Number,
            default: null,
            min: 0
        },

        observedAt: {
            type: Date,
            required: true,
            default: Date.now,
            index: true
        }
    },
    {
        collection: 'quick_signals',
        timestamps: true,
        id: false
    }
);

schema.index({
    place: 1,
    observedAt: -1
});

schema.index({
    author: 1,
    observedAt: -1
});

module.exports = mongoose.model('QuickSignal', schema);
