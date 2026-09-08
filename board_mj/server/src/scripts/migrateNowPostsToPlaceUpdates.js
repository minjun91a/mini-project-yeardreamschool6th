require('dotenv').config();

const connectDB = require('../db');
const mongoose = require('mongoose');
const Post = require('../models/post');
const Place = require('../models/place');
const PlaceUpdate = require('../models/placeUpdate');

async function migrateNowPostsToPlaceUpdates() {
    await connectDB();

    const cursor = Post.find({
        kind: 'now',
        place: {$ne: null}
    }).cursor();

    let scanned = 0;
    let created = 0;
    let skipped = 0;

    for await (const post of cursor) {
        scanned += 1;

        const exists = await PlaceUpdate.exists({
            legacyPost: post._id
        });

        if (exists) {
            skipped += 1;
            continue;
        }

        await PlaceUpdate.create({
            place: post.place,
            author: post.author,
            status: post.status || 'unknown',
            originalText: post.content,
            content: post.content,
            images: post.imageUrl ? [{url: post.imageUrl}] : [],
            signals: [],
            visitVerified: post.visitVerified,
            distanceFromPlace: null,
            source: 'community',
            legacyPost: post._id,
            observedAt: post.createdAt
        });

        await Place.updateOne(
            {_id: post.place},
            {
                $inc: {
                    'stats.updateCount': 1
                },
                $max: {
                    'stats.lastSignalAt': post.createdAt
                }
            }
        );

        created += 1;
    }

    console.log(JSON.stringify({
        scanned,
        created,
        skipped
    }, null, 2));
}

migrateNowPostsToPlaceUpdates()
    .catch((err) => {
        console.error(err);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
