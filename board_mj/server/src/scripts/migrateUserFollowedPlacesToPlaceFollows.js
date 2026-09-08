require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../db');
const Place = require('../models/place');
const PlaceFollow = require('../models/placeFollow');
const User = require('../models/user');

(async () => {
    await connectDB();

    const users = await User.collection
        .find({
            followedPlaces: {$exists: true, $ne: []}
        })
        .project({_id: 1, followedPlaces: 1})
        .toArray();

    let inserted = 0;

    for (const user of users) {
        const placeIds = Array.from(
            new Set(
                (user.followedPlaces || [])
                    .filter(Boolean)
                    .map((placeId) => String(placeId))
            )
        );

        for (const placeId of placeIds) {
            const result = await PlaceFollow.updateOne(
                {
                    user: user._id,
                    place: placeId
                },
                {
                    $setOnInsert: {
                        user: user._id,
                        place: placeId,
                        notificationPreferences: {
                            statusChanges: true,
                            freshnessReminders: false,
                            officialUpdates: true
                        }
                    }
                },
                {
                    upsert: true
                }
            );

            inserted += result.upsertedCount || 0;
        }

        await User.updateOne(
            {_id: user._id},
            {
                $set: {
                    legacyFollowedPlacesMigratedAt: new Date()
                }
            }
        );
    }

    const followerCounts = await PlaceFollow.aggregate([
        {
            $group: {
                _id: '$place',
                count: {$sum: 1}
            }
        }
    ]);

    for (const item of followerCounts) {
        await Place.updateOne(
            {_id: item._id},
            {
                $set: {
                    'stats.followerCount': item.count
                }
            }
        );
    }

    console.log(JSON.stringify({
        usersScanned: users.length,
        placeFollowsInserted: inserted,
        placesUpdated: followerCounts.length
    }, null, 2));

    await mongoose.disconnect();
})().catch(async (err) => {
    console.error(err);

    try {
        await mongoose.disconnect();
    } catch (disconnectErr) {
        console.error(disconnectErr);
    }

    process.exit(1);
});
