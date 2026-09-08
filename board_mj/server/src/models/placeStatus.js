const mongoose = require('mongoose');

const PLACE_STATUSES = [
    'quiet',
    'normal',
    'busy',
    'unknown'
];

const STATUS_TRENDS = [
    'rising',
    'falling',
    'stable',
    'unknown'
];

const EVIDENCE_TYPES = [
    'PlaceUpdate',
    'QuickSignal',
    'Confirmation',
    'PresenceSignal',
    'OfficialUpdate'
];

const CHANGE_REASONS = [
    'new_evidence',
    'evidence_shift',
    'confirmation',
    'changed_signal',
    'expired',
    'official_update'
];

const signalScoresSchema = new mongoose.Schema(
    {
        quiet: {
            type: Number,
            default: 0,
            min: 0
        },

        normal: {
            type: Number,
            default: 0,
            min: 0
        },

        busy: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    {_id: false}
);

const evidenceRefSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            enum: EVIDENCE_TYPES
        },

        id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },

        weight: {
            type: Number,
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

        status: {
            type: String,
            required: true,
            enum: PLACE_STATUSES,
            default: 'unknown'
        },

        candidateStatus: {
            type: String,
            enum: PLACE_STATUSES,
            default: 'unknown'
        },

        confidenceScore: {
            type: Number,
            min: 0,
            max: 1,
            default: 0
        },

        freshnessScore: {
            type: Number,
            min: 0,
            max: 1,
            default: 0
        },

        evidenceCount: {
            type: Number,
            default: 0,
            min: 0
        },

        verifiedEvidenceCount: {
            type: Number,
            default: 0,
            min: 0
        },

        signalScores: {
            type: signalScoresSchema,
            default: () => ({})
        },

        trend: {
            type: String,
            enum: STATUS_TRENDS,
            default: 'unknown'
        },

        freshestEvidenceAt: {
            type: Date,
            default: null
        },

        calculatedAt: {
            type: Date,
            required: true,
            default: Date.now,
            index: true
        },

        validUntil: {
            type: Date,
            default: null
        },

        evidenceRefs: {
            type: [evidenceRefSchema],
            default: []
        },

        changeReason: {
            type: String,
            enum: CHANGE_REASONS,
            default: 'new_evidence'
        }
    },
    {
        collection: 'place_statuses',
        timestamps: true,
        id: false
    }
);

schema.index({
    place: 1,
    calculatedAt: -1
});

schema.index({
    status: 1,
    calculatedAt: -1
});

module.exports = mongoose.model('PlaceStatus', schema);
