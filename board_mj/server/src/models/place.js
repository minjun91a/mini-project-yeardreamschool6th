const mongoose = require('mongoose');

const schema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, '장소명은 필수입니다.'],
            trim: true,
            maxLength: [100, '장소명은 100자 이하입니다.']
        },

        category: {
            type: String,
            required: [true, '카테고리는 필수입니다.'],
            enum: [
                'cafe',
                'restaurant',
                'bar',
                'popup',
                'shopping',
                'park',
                'culture',
                'etc'
            ]
        },

        address: {
            type: String,
            required: [true, '주소는 필수입니다.'],
            trim: true,
            maxLength: [200, '주소는 200자 이하입니다.']
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

module.exports = mongoose.model('Place', schema);