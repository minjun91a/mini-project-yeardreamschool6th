const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Post = require('../models/post');
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

router.get('/now/latest', async (req, res) => {
    const limit = Math.min(
        50,
        Math.max(1, parseInt(req.query.limit) || 10)
    );

    const freshnessLimit = new Date(
        Date.now() - 6 * 60 * 60 * 1000
    );

    const latestNowPosts = await Post.aggregate([
        {
            $match: {
                kind: 'now',
                place: {$ne: null},
                createdAt: {$gte: freshnessLimit}
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $group: {
                _id: '$place',
                post: {$first: '$$ROOT'}
            }
        },
        {
            $replaceRoot: {
                newRoot: '$post'
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $limit: limit
        }
    ]);

    await Post.populate(latestNowPosts, [
        {
            path: 'author',
            select: '_id name'
        },
        {
            path: 'place',
            select: 'name category address'
        }
    ]);

    return res.json({
        success: true,
        data: {
            items: latestNowPosts
        }
    });
});

router.get('/nearby', async (req, res) => {
    const longitude = Number(req.query.longitude);
    const latitude = Number(req.query.latitude);

    const maxDistance = Math.min(
        Math.max(Number(req.query.maxDistance) || 3000, 100),
        10000
    );

    const limit = Math.min(
        Math.max(Number(req.query.limit) || 20, 1),
        50
    );

    if (
        !Number.isFinite(longitude) ||
        !Number.isFinite(latitude)
    ) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_COORDINATES',
                message: '경도와 위도가 필요합니다.'
            }
        });
    }

    if (
        longitude < -180 ||
        longitude > 180 ||
        latitude < -90 ||
        latitude > 90
    ) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_COORDINATES',
                message: '좌표 범위가 올바르지 않습니다.'
            }
        });
    }

    const places = await Place.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                },
                distanceField: 'distance',
                maxDistance,
                spherical: true
            }
        },
        {
            $limit: limit
        },
        {
            $project: {
                name: 1,
                category: 1,
                address: 1,
                location: 1,
                distance: 1
            }
        }
    ]);

    return res.status(200).json({
        success: true,
        data: {places}
    });
});

router.get('/:id/now', async (req, res) => {
    const {id} = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_ID',
                message: '올바르지 않은 장소 ID입니다.'
            }
        });
    }

    const place = await Place.findById(id);

    if (!place) {
        return res.status(404).json({
            success: false,
            error: {
                code: 'PLACE_NOT_FOUND',
                message: '장소를 찾을 수 없습니다.'
            }
        });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);

    const filter = {
        kind: 'now',
        place: id
    };

    const items = await Post.find(filter)
        .sort({createdAt: -1})
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('author', '_id name')
        .populate('place', 'name category address')
        .lean();

    const total = await Post.countDocuments(filter);

    return res.json({
        success: true,
        data: {items, page, limit, total}
    });
});

router.get('/:id', async (req, res) => {
    const {id} = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_ID',
                message: '올바르지 않은 장소 ID입니다.'
            }
        });
    }

    const place = await Place.findById(id);

    if (!place) {
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
        data: {place}
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