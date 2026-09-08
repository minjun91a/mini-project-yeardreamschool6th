const mongoose = require('mongoose');

const CONFIRMATION_TYPES = [
    'still_valid',
    'changed'
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

        placeUpdate: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PlaceUpdate',
            default: null,
            index: true
        },

        quickSignal: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'QuickSignal',
            default: null,
            index: true
        },

        placeStatus: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PlaceStatus',
            default: null,
            index: true
        },

        type: {
            type: String,
            required: true,
            enum: CONFIRMATION_TYPES
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
        collection: 'confirmations',
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
    place: 1,
    type: 1,
    observedAt: -1
});

schema.index({
    author: 1,
    placeUpdate: 1,
    type: 1
}, {
    unique: true,
    partialFilterExpression: {
        placeUpdate: {$type: 'objectId'}
    }
});

schema.index({
    author: 1,
    quickSignal: 1,
    type: 1
}, {
    unique: true,
    partialFilterExpression: {
        quickSignal: {$type: 'objectId'}
    }
});

schema.index({
    author: 1,
    placeStatus: 1,
    type: 1
}, {
    unique: true,
    partialFilterExpression: {
        placeStatus: {$type: 'objectId'}
    }
});

module.exports = mongoose.model('Confirmation', schema);
