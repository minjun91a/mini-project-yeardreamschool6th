const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema(
    {
        lat: {
            type: Number,
            required: true,
            min: -90,
            max: 90
        },

        lng: {
            type: Number,
            required: true,
            min: -180,
            max: 180
        }
    },
    {_id: false}
);

const schema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, '동네명은 필수입니다.'],
            trim: true,
            maxLength: [80, '동네명은 80자 이하입니다.']
        },

        displayName: {
            type: String,
            required: [true, '표시 동네명은 필수입니다.'],
            trim: true,
            maxLength: [80, '표시 동네명은 80자 이하입니다.']
        },

        city: {
            type: String,
            required: [true, '시/도는 필수입니다.'],
            trim: true,
            maxLength: [80, '시/도는 80자 이하입니다.']
        },

        district: {
            type: String,
            required: [true, '시/군/구는 필수입니다.'],
            trim: true,
            maxLength: [80, '시/군/구는 80자 이하입니다.']
        },

        regionCode: {
            type: String,
            default: null,
            trim: true,
            index: true
        },

        center: {
            type: pointSchema,
            required: true
        },

        boundary: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        }
    },
    {
        collection: 'neighborhoods',
        timestamps: true,
        id: false
    }
);

schema.index({
    city: 1,
    district: 1,
    name: 1
}, {unique: true});

module.exports = mongoose.model('Neighborhood', schema);
