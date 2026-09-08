const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const auth = require('../middlewares/auth');
const Place = require('../models/place');
const PlaceStatus = require('../models/placeStatus');
const {calculatePlaceStatus} = require('../services/placeStatusEngine');

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
        PlaceStatus.find(filter)
            .sort({calculatedAt: -1, createdAt: -1})
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('place', 'name category address roadAddress location currentStatus')
            .lean(),
        PlaceStatus.countDocuments(filter)
    ]);

    return res.status(200).json({
        success: true,
        data: {
            items,
            page,
            limit,
            total
        }
    });
});

router.get('/current', async (req, res) => {
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

    const [placeDocument, latestPlaceStatus] = await Promise.all([
        Place.findById(place)
            .select('name category address roadAddress location currentStatus')
            .lean(),
        PlaceStatus.findOne({place})
            .sort({calculatedAt: -1, createdAt: -1})
            .lean()
    ]);

    if (!placeDocument) {
        return res.status(404).json({
            success: false,
            error: {
                code: 'PLACE_NOT_FOUND',
                message: '장소를 찾을 수 없습니다.'
            }
        });
    }

    return res.status(200).json({
        success: true,
        data: {
            place: placeDocument,
            placeStatus: latestPlaceStatus
        }
    });
});

router.post('/recalculate', auth, async (req, res) => {
    const {placeId} = req.body;

    const placeStatus = await calculatePlaceStatus(placeId);

    return res.status(200).json({
        success: true,
        data: {
            placeStatus
        }
    });
});

router.get('/:id', async (req, res) => {
    const {id} = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_ID',
                message: '올바르지 않은 장소 상태 ID입니다.'
            }
        });
    }

    const placeStatus = await PlaceStatus.findById(id)
        .populate('place', 'name category address roadAddress location currentStatus')
        .lean();

    if (!placeStatus) {
        return res.status(404).json({
            success: false,
            error: {
                code: 'PLACE_STATUS_NOT_FOUND',
                message: '장소 상태를 찾을 수 없습니다.'
            }
        });
    }

    return res.status(200).json({
        success: true,
        data: {
            placeStatus
        }
    });
});

module.exports = router;
