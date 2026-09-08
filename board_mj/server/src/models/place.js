const mongoose = require('mongoose');

const PLACE_CATEGORIES = [
    'cafe',
    'restaurant',
    'bar',
    'popup',
    'shopping',
    'park',
    'culture',
    'street',
    'other',
    'etc'
];

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

const externalSourceSchema = new mongoose.Schema(
    {
        provider: {
            type: String,
            required: true,
            enum: [
                'kakao',
                'naver',
                'google',
                'public_data',
                'merchant'
            ]
        },

        externalPlaceId: {
            type: String,
            required: true,
            trim: true
        },

        url: {
            type: String,
            default: null,
            trim: true
        },

        rawCategory: {
            type: String,
            default: null,
            trim: true
        },

        lastSyncedAt: {
            type: Date,
            default: null
        }
    },
    {_id: false}
);

const currentStatusSchema = new mongoose.Schema(
    {
        status: {
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

        trend: {
            type: String,
            enum: STATUS_TRENDS,
            default: 'unknown'
        },

        lastSignalAt: {
            type: Date,
            default: null
        },

        freshestEvidenceAt: {
            type: Date,
            default: null
        },

        calculatedAt: {
            type: Date,
            default: null
        },

        placeStatusId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PlaceStatus',
            default: null
        }
    },
    {_id: false}
);

const statsSchema = new mongoose.Schema(
    {
        updateCount: {
            type: Number,
            default: 0,
            min: 0
        },

        confirmationCount: {
            type: Number,
            default: 0,
            min: 0
        },

        quickSignalCount: {
            type: Number,
            default: 0,
            min: 0
        },

        followerCount: {
            type: Number,
            default: 0,
            min: 0
        },

        lastSignalAt: {
            type: Date,
            default: null
        }
    },
    {_id: false}
);

const schema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, '장소명은 필수입니다.'],
            trim: true,
            maxLength: [100, '장소명은 100자 이하입니다.']
        },

        normalizedName: {
            type: String,
            default: null,
            trim: true,
            index: true
        },

        category: {
            type: String,
            required: [true, '카테고리는 필수입니다.'],
            enum: PLACE_CATEGORIES
        },

        address: {
            type: String,
            required: [true, '주소는 필수입니다.'],
            trim: true,
            maxLength: [200, '주소는 200자 이하입니다.']
        },

        roadAddress: {
            type: String,
            default: null,
            trim: true,
            maxLength: [200, '도로명 주소는 200자 이하입니다.']
        },

        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },

            coordinates: {
                type: [Number],
                required: true
            }
        },

        neighborhood: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Neighborhood',
            default: null,
            index: true
        },

        externalSources: {
            type: [externalSourceSchema],
            default: []
        },

        currentStatus: {
            type: currentStatusSchema,
            default: () => ({})
        },

        stats: {
            type: statsSchema,
            default: () => ({})
        }
    },
    {
        collection: 'places',
        timestamps: true,
        id: false
    }
);

schema.index({
    location: '2dsphere'
});

schema.index({
    name: 1
});

schema.index({
    'externalSources.provider': 1,
    'externalSources.externalPlaceId': 1
}, {
    unique: true,
    sparse: true
});

module.exports = mongoose.model('Place', schema);
