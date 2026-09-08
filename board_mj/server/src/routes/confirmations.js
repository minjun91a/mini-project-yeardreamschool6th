const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const auth = require('../middlewares/auth');
const Confirmation = require('../models/confirmation');
const Place = require('../models/place');
const PlaceUpdate = require('../models/placeUpdate');
const QuickSignal = require('../models/quickSignal');
const {getDistanceMeters} = require('../services/geo');
const {
    calculatePlaceStatusSafely
} = require('../services/placeStatusEngine');

const ALLOWED_TYPES = [
    'still_valid',
    'changed'
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

function toClientConfirmation(confirmation) {
    return {
        ...confirmation,
        kind: 'confirmation'
    };
}

async function ensureTargetMatchesPlace({placeId, placeUpdateId, quickSignalId}) {
    if (placeUpdateId) {
        if (!mongoose.isValidObjectId(placeUpdateId)) {
            return {
                status: 400,
                code: 'INVALID_PLACE_UPDATE_ID',
                message: '올바르지 않은 현장 기록 ID입니다.'
            };
        }

        const placeUpdate = await PlaceUpdate.findById(placeUpdateId)
            .select('_id place');

        if (!placeUpdate) {
            return {
                status: 404,
                code: 'PLACE_UPDATE_NOT_FOUND',
                message: '현장 기록을 찾을 수 없습니다.'
            };
        }

        if (placeUpdate.place.toString() !== placeId) {
            return {
                status: 400,
                code: 'TARGET_PLACE_MISMATCH',
                message: '확인 대상과 장소가 일치하지 않습니다.'
            };
        }
    }

    if (quickSignalId) {
        if (!mongoose.isValidObjectId(quickSignalId)) {
            return {
                status: 400,
                code: 'INVALID_QUICK_SIGNAL_ID',
                message: '올바르지 않은 빠른 신호 ID입니다.'
            };
        }

        const quickSignal = await QuickSignal.findById(quickSignalId)
            .select('_id place');

        if (!quickSignal) {
            return {
                status: 404,
                code: 'QUICK_SIGNAL_NOT_FOUND',
                message: '빠른 신호를 찾을 수 없습니다.'
            };
        }

        if (quickSignal.place.toString() !== placeId) {
            return {
                status: 400,
                code: 'TARGET_PLACE_MISMATCH',
                message: '확인 대상과 장소가 일치하지 않습니다.'
            };
        }
    }

    return null;
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

    const [items, total] = await Promise.all([
        Confirmation.find(filter)
            .sort({observedAt: -1, createdAt: -1})
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('author', '_id id name')
            .populate('place', 'name category address roadAddress location currentStatus')
            .lean(),
        Confirmation.countDocuments(filter)
    ]);

    return res.status(200).json({
        success: true,
        data: {
            items: items.map(toClientConfirmation),
            page,
            limit,
            total
        }
    });
});

router.post('/', auth, async (req, res) => {
    const {
        placeId,
        placeUpdateId,
        quickSignalId,
        placeStatusId,
        type,
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

    if (!ALLOWED_TYPES.includes(type)) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_CONFIRMATION_TYPE',
                message: '확인 유형이 올바르지 않습니다.'
            }
        });
    }

    if (placeStatusId && !mongoose.isValidObjectId(placeStatusId)) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_PLACE_STATUS_ID',
                message: '올바르지 않은 장소 상태 ID입니다.'
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

    const targetError = await ensureTargetMatchesPlace({
        placeId,
        placeUpdateId,
        quickSignalId
    });

    if (targetError) {
        return res.status(targetError.status).json({
            success: false,
            error: {
                code: targetError.code,
                message: targetError.message
            }
        });
    }

    const verification = calculateVisitVerification({
        place,
        longitude,
        latitude
    });

    const confirmation = await Confirmation.create({
        place: placeId,
        author: req.user.sub,
        placeUpdate: placeUpdateId || null,
        quickSignal: quickSignalId || null,
        placeStatus: placeStatusId || null,
        type,
        visitVerified: verification.visitVerified,
        distanceFromPlace: verification.distanceFromPlace,
        observedAt: parsedObservedAt
    });

    await Place.updateOne(
        {_id: placeId},
        {
            $inc: {
                'stats.confirmationCount': 1
            },
            $set: {
                'stats.lastSignalAt': parsedObservedAt
            }
        }
    );

    const placeStatus = await calculatePlaceStatusSafely(placeId);

    await confirmation.populate([
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
            confirmation: toClientConfirmation(confirmation.toObject()),
            placeStatus
        }
    });
});

module.exports = router;
