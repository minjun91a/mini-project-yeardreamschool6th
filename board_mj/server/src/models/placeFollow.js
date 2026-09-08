const mongoose = require('mongoose');

const notificationPreferencesSchema = new mongoose.Schema(
    {
        statusChanges: {
            type: Boolean,
            default: true
        },

        freshnessReminders: {
            type: Boolean,
            default: false
        },

        officialUpdates: {
            type: Boolean,
            default: true
        }
    },
    {_id: false}
);

const schema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        place: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Place',
            required: true,
            index: true
        },

        notificationPreferences: {
            type: notificationPreferencesSchema,
            default: () => ({})
        }
    },
    {
        collection: 'place_follows',
        timestamps: true,
        id: false
    }
);

schema.index({
    user: 1,
    place: 1
}, {
    unique: true
});

schema.index({
    place: 1,
    createdAt: -1
});

module.exports = mongoose.model('PlaceFollow', schema);
