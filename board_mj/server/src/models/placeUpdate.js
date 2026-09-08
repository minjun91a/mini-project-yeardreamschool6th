const mongoose = require('mongoose');

const PLACE_UPDATE_STATUSES = [
    'quiet',
    'normal',
    'busy',
    'unknown'
];

const SIGNAL_TYPES = [
    'crowd',
    'waitingTeams',
    'waitingMinutes',
    'seatAvailability',
    'parkingAvailability',
    'noiseLevel',
    'stockAvailability',
    'entryLine',
    'traffic'
];

const SIGNAL_SOURCES = [
    'user_input',
    'ai_extracted',
    'presence',
    'official',
    'external',
    'system'
];

const imageSchema = new mongoose.Schema(
    {
        url: {
            type: String,
            required: true,
            trim: true
        },

        width: {
            type: Number,
            default: null
        },

        height: {
            type: Number,
            default: null
        },

        blurHash: {
            type: String,
            default: null,
            trim: true
        }
    },
    {_id: false}
);

const structuredSignalSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            enum: SIGNAL_TYPES
        },

        value: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },

        source: {
            type: String,
            required: true,
            enum: SIGNAL_SOURCES,
            default: 'user_input'
        },

        confidence: {
            type: Number,
            min: 0,
            max: 1,
            default: null
        },

        observedAt: {
            type: Date,
            required: true
        }
    },
    {_id: false}
);

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
            enum: PLACE_UPDATE_STATUSES
        },

        originalText: {
            type: String,
            default: null,
            trim: true,
            maxLength: [1000, '원문은 1000자 이하입니다.']
        },

        content: {
            type: String,
            default: null,
            trim: true,
            maxLength: [1000, '내용은 1000자 이하입니다.']
        },

        images: {
            type: [imageSchema],
            default: []
        },

        signals: {
            type: [structuredSignalSchema],
            default: []
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

        source: {
            type: String,
            enum: ['community'],
            default: 'community'
        },

        legacyPost: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',
            default: null
        },

        observedAt: {
            type: Date,
            required: true,
            default: Date.now,
            index: true
        }
    },
    {
        collection: 'place_updates',
        timestamps: true,
        id: false
    }
);

schema.index({
    place: 1,
    observedAt: -1
});

schema.index({
    place: 1,
    createdAt: -1
});

schema.index({
    author: 1,
    createdAt: -1
});

schema.index({
    legacyPost: 1
}, {
    unique: true,
    sparse: true
});

module.exports = mongoose.model('PlaceUpdate', schema);
