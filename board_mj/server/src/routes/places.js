const express = require('express');
const router = express.Router();

const Place = require('../models/place');
const auth = require('../middlewares/auth');

const escapeRegex = (text) => {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

router.get('/', async (req, res) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(
        Math.max(Number(req.query.limit) || 20, 1),
        100
    );

    const q = req.query.q?.trim();
    const category = req.query.category?.trim();

    const filter = {};

    if (q) {
        const escapedQ = escapeRegex(q);

        filter.$or = [
            {
                name: {
                    $regex: escapedQ,
                    $options: 'i'
                }
            },
            {
                address: {
                    $regex: escapedQ,
                    $options: 'i'
                }
            }
        ];
    }

    if (category) {
        filter.category = category;
    }

    const [places, total] = await Promise.all([
        Place.find(filter)
            .sort({createdAt: -1})
            .skip((page - 1) * limit)
            .limit(limit),

        Place.countDocuments(filter)
    ]);

    return res.status(200).json({
        success: true,
        data: {
            places,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    });
});

router.post('/', auth, async (req, res) => {
    const {
        name,
        category,
        address,
        longitude,
        latitude
    } = req.body;

    if (
        typeof longitude !== 'number' ||
        typeof latitude !== 'number'
    ) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION',
                message: '올바른 좌표가 필요합니다.'
            }
        });
    }

    if (
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
    ) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION',
                message: '좌표 범위가 올바르지 않습니다.'
            }
        });
    }

    const place = await Place.create({
        name,
        category,
        address,
        location: {
            type: 'Point',
            coordinates: [
                longitude,
                latitude
            ]
        }
    });

    return res.status(201).json({
        success: true,
        data: {place}
    });
});

module.exports = router;