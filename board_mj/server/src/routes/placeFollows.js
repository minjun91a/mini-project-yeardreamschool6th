const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const auth = require('../middlewares/auth');
const Place = require('../models/place');
const PlaceFollow = require('../models/placeFollow');

function normalizePreferences(value = {}) {
    return {
        statusChanges: value.statusChanges !== false,
        freshnessReminders: value.freshnessReminders === true,
        officialUpdates: value.officialUpdates !== false
    };
}

router.get('/me', auth, async (req, res) => {
    const placeFollows = await PlaceFollow.find({
        user: req.user.sub
    })
        .sort({createdAt: -1})
        .populate(
            'place',
            'name category address roadAddress location currentStatus stats'
        )
        .lean();

    return res.status(200).json({
        success: true,
        data: {
            placeFollows,
            places: placeFollows
                .map((follow) => follow.place)
                .filter(Boolean)
        }
    });
});

router.get('/count', async (req, res) => {
    const {place} = req.query;

    if (!mongoose.isValidObjectId(place)) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_PLACE_ID',
                message: '올바르지 않은 장소 ID입니다.'
            }
        });
    }

    const count = await PlaceFollow.countDocuments({place});

    return res.status(200).json({
        success: true,
        data: {
            count
        }
    });
});

router.post('/', auth, async (req, res) => {
    const {placeId, notificationPreferences} = req.body;

    if (!mongoose.isValidObjectId(placeId)) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_PLACE_ID',
                message: '올바르지 않은 장소 ID입니다.'
            }
        });
    }

    const place = await Place.findById(placeId).select('_id');

    if (!place) {
        return res.status(404).json({
            success: false,
            error: {
                code: 'PLACE_NOT_FOUND',
                message: '장소를 찾을 수 없습니다.'
            }
        });
    }

    const result = await PlaceFollow.updateOne(
        {
            user: req.user.sub,
            place: placeId
        },
        {
            $setOnInsert: {
                user: req.user.sub,
                place: placeId
            },
            $set: {
                notificationPreferences:
                    normalizePreferences(notificationPreferences)
            }
        },
        {
            upsert: true
        }
    );

    const created = result.upsertedCount > 0;

    if (created) {
        await Place.updateOne(
            {_id: placeId},
            {
                $inc: {
                    'stats.followerCount': 1
                }
            }
        );
    }

    const placeFollow = await PlaceFollow.findOne({
        user: req.user.sub,
        place: placeId
    })
        .populate(
            'place',
            'name category address roadAddress location currentStatus stats'
        )
        .lean();

    return res.status(created ? 201 : 200).json({
        success: true,
        data: {
            placeFollow,
            created
        }
    });
});

router.delete('/:placeId', auth, async (req, res) => {
    const {placeId} = req.params;

    if (!mongoose.isValidObjectId(placeId)) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_PLACE_ID',
                message: '올바르지 않은 장소 ID입니다.'
            }
        });
    }

    const result = await PlaceFollow.deleteOne({
        user: req.user.sub,
        place: placeId
    });

    if (result.deletedCount === 0) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'NOT_FOLLOWING',
                message: '관심 장소로 등록된 장소가 아닙니다.'
            }
        });
    }

    await Place.updateOne(
        {_id: placeId, 'stats.followerCount': {$gt: 0}},
        {
            $inc: {
                'stats.followerCount': -1
            }
        }
    );

    return res.status(200).json({
        success: true,
        data: {
            deletedPlaceId: placeId
        }
    });
});

module.exports = router;
