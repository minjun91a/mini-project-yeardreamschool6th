const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const auth = require('../middlewares/auth');
const Place = require('../models/place');
const QuickSignal = require('../models/quickSignal');
const {getDistanceMeters} = require('../services/geo');
const {
    calculatePlaceStatusSafely
} = require('../services/placeStatusEngine');

const ALLOWED_STATUSES = [
    'quiet',
    'normal',
    'busy'
];

function parseOptionalDate(value) {
    if (!value) {
        return new Date();
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
}

function calculateVisitVerification({place, longitude, latitude}) {
    const longitudeNumber = Number(longitude);
    const latitudeNumber = Number(latitude);

    if (
        !Number.isFinite(longitudeNumber) ||
        !Number.isFinite(latitudeNumber) ||
        place?.location?.coordinates?.length !== 2
    ) {
        return {
            visitVerified: false,
            distanceFromPlace: null
        };
    }

    const [placeLongitude, placeLatitude] = place.location.coordinates;

    const distanceFromPlace = getDistanceMeters(
        latitudeNumber,
        longitudeNumber,
        placeLatitude,
        placeLongitude
    );

    return {
        visitVerified: distanceFromPlace <= 300,
        distanceFromPlace
    };
}

function toClientQuickSignal(signal) {
    return {
        ...signal,
        kind: 'quick_signal',
        evidenceType: 'QuickSignal',
        content: null,
        imageUrl: null,
        commentCount: 0
    };
}

router.get('/', async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

    const filter = {};

    if (req.query.place) {
        if (!mongoose.isValidObjectId(req.query.place)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PLACE_ID',
                    message: '올바르지 않은 장소 ID입니다.'
                }
            });
        }

        filter.place = req.query.place;
    }

    if (req.query.author) {
        if (!mongoose.isValidObjectId(req.query.author)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_AUTHOR_ID',
                    message: '올바르지 않은 사용자 ID입니다.'
                }
            });
        }

        filter.author = req.query.author;
    }

    const [items, total] = await Promise.all([
        QuickSignal.find(filter)
            .sort({observedAt: -1, createdAt: -1})
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('author', '_id id name')
            .populate('place', 'name category address roadAddress location currentStatus')
            .lean(),
        QuickSignal.countDocuments(filter)
    ]);

    return res.status(200).json({
        success: true,
        data: {
            items: items.map(toClientQuickSignal),
            page,
            limit,
            total
        }
    });
});

router.post('/', auth, async (req, res) => {
    const {
        placeId,
        status,
        observedAt,
        longitude,
        latitude
    } = req.body;

    if (!placeId) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'PLACE_ID_REQUIRED',
                message: '장소를 선택해주세요.'
            }
        });
    }

    if (!mongoose.isValidObjectId(placeId)) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_PLACE_ID',
                message: '올바르지 않은 장소 ID입니다.'
            }
        });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_STATUS',
                message: '현재 상태 값이 올바르지 않습니다.'
            }
        });
    }

    const parsedObservedAt = parseOptionalDate(observedAt);

    if (!parsedObservedAt) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_OBSERVED_AT',
                message: '관찰 시간이 올바르지 않습니다.'
            }
        });
    }

    const place = await Place.findById(placeId);

    if (!place) {
        return res.status(404).json({
            success: false,
            error: {
                code: 'PLACE_NOT_FOUND',
                message: '장소를 찾을 수 없습니다.'
            }
        });
    }

    const verification = calculateVisitVerification({
        place,
        longitude,
        latitude
    });

    const quickSignal = await QuickSignal.create({
        place: placeId,
        author: req.user.sub,
        status,
        visitVerified: verification.visitVerified,
        distanceFromPlace: verification.distanceFromPlace,
        observedAt: parsedObservedAt
    });

    await Place.updateOne(
        {_id: placeId},
        {
            $inc: {
                'stats.quickSignalCount': 1
            },
            $set: {
                'stats.lastSignalAt': parsedObservedAt
            }
        }
    );

    const placeStatus = await calculatePlaceStatusSafely(
        placeId,
        {actorId: req.user.sub}
    );

    await quickSignal.populate([
        {
            path: 'author',
            select: '_id id name'
        },
        {
            path: 'place',
            select: 'name category address roadAddress location currentStatus'
        }
    ]);

    return res.status(201).json({
        success: true,
        data: {
            quickSignal: toClientQuickSignal(quickSignal.toObject()),
            placeStatus
        }
    });
});

module.exports = router;
