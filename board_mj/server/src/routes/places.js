const express = require('express');
const router = express.Router();
const Place = require('../models/place');
const auth = require('../middlewares/auth');

router.post('/', auth, async (req, res) => {
    const {
        name,
        category,
        address,
        longitude,
        latitude
    } = req.body;

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

    return res.status(201).json({
        success: true,
        data: {place}
    });
});

module.exports = router;