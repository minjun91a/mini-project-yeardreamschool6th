const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Post = require('../models/post');
const PlaceUpdate = require('../models/placeUpdate');
const QuickSignal = require('../models/quickSignal');
const Place = require('../models/place');
const auth = require('../middlewares/auth');
const User = require('../models/user');
const kakaoLocal = require('../services/kakaoLocal');

const escapeRegex = (text) => {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

function sendExternalPlaceError(res, err) {
    console.error('[external-place]', err.code || err.name, err.message);

    return res.status(err.status || 500).json({
        success: false,
        error: {
            code: err.code || 'EXTERNAL_PLACE_ERROR',
            message: err.message || '외부 장소 처리 중 오류가 발생했습니다.'
        }
    });
}

function toFiniteCoordinate(value) {
    const number = Number(value);

    return Number.isFinite(number) ? number : null;
}

function toExternalSourceMatch(place) {
    return place.externalSources?.find(
        (source) => source.provider === 'kakao'
    );
}

function buildAgoPlaceInputFromKakao(kakaoPlace = {}) {
    const externalPlaceId = kakaoPlace.externalPlaceId ||
        kakaoPlace.id;

    const name = kakaoPlace.name || kakaoPlace.place_name;
    const rawCategory = kakaoPlace.rawCategory ||
        kakaoPlace.category_name ||
        null;

    const longitude = toFiniteCoordinate(
        kakaoPlace.location?.coordinates?.[0] ?? kakaoPlace.x
    );

    const latitude = toFiniteCoordinate(
        kakaoPlace.location?.coordinates?.[1] ?? kakaoPlace.y
    );

    const address = kakaoPlace.address ||
        kakaoPlace.address_name ||
        '';

    const roadAddress = kakaoPlace.roadAddress ||
        kakaoPlace.road_address_name ||
        null;

    if (!externalPlaceId || !name || !address) {
        return null;
    }

    if (
        longitude == null ||
        latitude == null ||
        longitude < -180 ||
        longitude > 180 ||
        latitude < -90 ||
        latitude > 90
    ) {
        return null;
    }

    const normalizedKakaoPlace =
        kakaoPlace.provider === 'kakao' && kakaoPlace.externalPlaceId
            ? kakaoPlace
            : kakaoLocal.normalizeKakaoPlace({
                id: externalPlaceId,
                place_name: name,
                category_name: rawCategory,
                category_group_code: kakaoPlace.categoryGroupCode ||
                    kakaoPlace.category_group_code ||
                    '',
                category_group_name: kakaoPlace.categoryGroupName ||
                    kakaoPlace.category_group_name ||
                    '',
                address_name: address,
                road_address_name: roadAddress || '',
                phone: kakaoPlace.phone || '',
                place_url: kakaoPlace.placeUrl ||
                    kakaoPlace.place_url ||
                    '',
                x: String(longitude),
                y: String(latitude),
                distance: kakaoPlace.distance || ''
            });

    return {
        name: normalizedKakaoPlace.name,
        normalizedName: normalizedKakaoPlace.normalizedName ||
            kakaoLocal.normalizeText(normalizedKakaoPlace.name),
        category: normalizedKakaoPlace.category,
        address: normalizedKakaoPlace.address,
        roadAddress: normalizedKakaoPlace.roadAddress,
        location: normalizedKakaoPlace.location,
        externalSource: {
            provider: 'kakao',
            externalPlaceId: normalizedKakaoPlace.externalPlaceId,
            url: normalizedKakaoPlace.placeUrl,
            rawCategory: normalizedKakaoPlace.rawCategory,
            lastSyncedAt: new Date()
        }
    };
}

function serializeExternalSearchItem(place, agoPlace) {
    return {
        provider: 'kakao',
        externalPlaceId: place.externalPlaceId,
        name: place.name,
        category: place.category,
        address: place.address,
        roadAddress: place.roadAddress,
        location: place.location,
        phone: place.phone,
        placeUrl: place.placeUrl,
        rawCategory: place.rawCategory,
        normalizedName: place.normalizedName,
        categoryGroupCode: place.categoryGroupCode,
        categoryGroupName: place.categoryGroupName,
        distance: place.distance,
        withinServiceArea: place.withinServiceArea,
        agoPlace: agoPlace
            ? {
                _id: agoPlace._id,
                name: agoPlace.name,
                category: agoPlace.category,
                address: agoPlace.address,
                roadAddress: agoPlace.roadAddress,
                location: agoPlace.location,
                currentStatus: agoPlace.currentStatus
            }
            : null
    };
}

function serializePlaceUpdate(update) {
    const firstImage = update.images?.[0] || null;

    return {
        ...update,
        kind: 'place_update',
        evidenceType: 'PlaceUpdate',
        imageUrl: firstImage?.url || null,
        commentCount: 0
    };
}

function serializeQuickSignal(signal) {
    return {
        ...signal,
        kind: 'quick_signal',
        evidenceType: 'QuickSignal',
        content: null,
        imageUrl: null,
        commentCount: 0
    };
}

function serializeLegacyNowPost(post) {
    return {
        ...post,
        evidenceType: 'Post',
        observedAt: post.createdAt
    };
}

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

    const evidenceLimit = limit * 2;

    const [latestPlaceUpdates, latestQuickSignals] = await Promise.all([
        PlaceUpdate.aggregate([
        {
            $match: {
                place: {$ne: null},
                observedAt: {$gte: freshnessLimit}
            }
        },
        {
            $sort: {
                observedAt: -1,
                createdAt: -1
            }
        },
        {
            $group: {
                _id: '$place',
                update: {$first: '$$ROOT'}
            }
        },
        {
            $replaceRoot: {
                newRoot: '$update'
            }
        },
        {
            $sort: {
                observedAt: -1,
                createdAt: -1
            }
        },
        {
            $limit: evidenceLimit
        }
    ]),
        QuickSignal.aggregate([
        {
            $match: {
                place: {$ne: null},
                observedAt: {$gte: freshnessLimit}
            }
        },
        {
            $sort: {
                observedAt: -1,
                createdAt: -1
            }
        },
        {
            $group: {
                _id: '$place',
                signal: {$first: '$$ROOT'}
            }
        },
        {
            $replaceRoot: {
                newRoot: '$signal'
            }
        },
        {
            $sort: {
                observedAt: -1,
                createdAt: -1
            }
        },
        {
            $limit: evidenceLimit
        }
    ])
    ]);

    await PlaceUpdate.populate(latestPlaceUpdates, [
        {
            path: 'author',
            select: '_id id name'
        },
        {
            path: 'place',
            select: 'name category address roadAddress location currentStatus'
        }
    ]);

    await QuickSignal.populate(latestQuickSignals, [
        {
            path: 'author',
            select: '_id id name'
        },
        {
            path: 'place',
            select: 'name category address roadAddress location currentStatus'
        }
    ]);

    const latestPrimaryEvidence = [
        ...latestPlaceUpdates.map(serializePlaceUpdate),
        ...latestQuickSignals.map(serializeQuickSignal)
    ].sort((a, b) => {
        return new Date(b.observedAt || b.createdAt) -
            new Date(a.observedAt || a.createdAt);
    }).filter((item, index, array) => {
        const placeId = item.place?._id || item.place;

        if (!placeId) {
            return false;
        }

        return array.findIndex((candidate) => {
            const candidatePlaceId = candidate.place?._id || candidate.place;

            return String(candidatePlaceId) === String(placeId);
        }) === index;
    }).slice(0, limit);

    const placeIdsWithPrimaryEvidence = latestPrimaryEvidence.map((item) => {
        return item.place?._id || item.place;
    }).filter(Boolean);

    const legacyLimit = Math.max(limit - latestPrimaryEvidence.length, 0);

    const legacyMatch = {
        kind: 'now',
        place: {$ne: null, $nin: placeIdsWithPrimaryEvidence},
        createdAt: {$gte: freshnessLimit}
    };

    const latestNowPosts = legacyLimit > 0
        ? await Post.aggregate([
        {
            $match: legacyMatch
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
            $limit: legacyLimit
        }
    ])
        : [];

    await Post.populate(latestNowPosts, [
        {
            path: 'author',
            select: '_id name'
        },
        {
            path: 'place',
            select: 'name category address roadAddress location currentStatus'
        }
    ]);

    const items = [
        ...latestPrimaryEvidence,
        ...latestNowPosts.map(serializeLegacyNowPost)
    ].sort((a, b) => {
        return new Date(b.observedAt || b.createdAt) -
            new Date(a.observedAt || a.createdAt);
    }).slice(0, limit);

    return res.json({
        success: true,
        data: {
            items
        }
    });
});

router.get('/live-statuses', async (req, res) => {
    const limit = Math.min(
        50,
        Math.max(1, parseInt(req.query.limit, 10) || 20)
    );

    const category = req.query.category?.trim();
    const filter = {
        'currentStatus.status': {$in: ['quiet', 'normal', 'busy']},
        'currentStatus.freshnessScore': {$gte: 0.2},
        'currentStatus.confidenceScore': {$gte: 0.25}
    };

    if (category) {
        filter.category = category;
    }

    const places = await Place.find(filter)
        .sort({
            'currentStatus.freshestEvidenceAt': -1,
            'currentStatus.calculatedAt': -1
        })
        .limit(limit)
        .select('name category address roadAddress location currentStatus stats')
        .lean();

    return res.status(200).json({
        success: true,
        data: {
            places
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
                roadAddress: 1,
                location: 1,
                currentStatus: 1,
                stats: 1,
                distance: 1
            }
        }
    ]);

    return res.status(200).json({
        success: true,
        data: {places}
    });
});

router.get('/external/search', async (req, res) => {
    try {
        const result = await kakaoLocal.searchKeyword({
            query: req.query.q || req.query.query,
            longitude: req.query.longitude,
            latitude: req.query.latitude,
            radius: req.query.radius,
            rect: req.query.rect,
            page: req.query.page,
            size: req.query.size,
            sort: req.query.sort,
            includeUnsupported: req.query.includeUnsupported === 'true'
        });

        const externalIds = result.places.map(
            (place) => place.externalPlaceId
        );

        const matchedPlaces = externalIds.length > 0
            ? await Place.find({
                externalSources: {
                    $elemMatch: {
                        provider: 'kakao',
                        externalPlaceId: {$in: externalIds}
                    }
                }
            }).lean()
            : [];

        const matchedByExternalId = new Map(
            matchedPlaces.map((place) => {
                const externalSource = toExternalSourceMatch(place);
                return [
                    externalSource.externalPlaceId,
                    place
                ];
            })
        );

        return res.status(200).json({
            success: true,
            data: {
                provider: 'kakao',
                meta: result.meta,
                items: result.places.map((place) => {
                    return serializeExternalSearchItem(
                        place,
                        matchedByExternalId.get(place.externalPlaceId)
                    );
                })
            }
        });
    } catch (err) {
        return sendExternalPlaceError(res, err);
    }
});

router.post('/external/kakao/link', auth, async (req, res) => {
    const kakaoPlace = req.body.kakaoPlace ||
        req.body.externalPlace ||
        req.body;

    const agoPlaceInput = buildAgoPlaceInputFromKakao(kakaoPlace);

    if (!agoPlaceInput) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_KAKAO_PLACE',
                message: 'Kakao 장소 정보가 올바르지 않습니다.'
            }
        });
    }

    const externalSourceFilter = {
        externalSources: {
            $elemMatch: {
                provider: 'kakao',
                externalPlaceId: agoPlaceInput.externalSource.externalPlaceId
            }
        }
    };

    const existingPlace = await Place.findOne(externalSourceFilter);

    if (existingPlace) {
        const externalSource = existingPlace.externalSources.find(
            (source) => {
                return source.provider === 'kakao' &&
                    source.externalPlaceId ===
                    agoPlaceInput.externalSource.externalPlaceId;
            }
        );

        if (externalSource) {
            externalSource.url = agoPlaceInput.externalSource.url;
            externalSource.rawCategory =
                agoPlaceInput.externalSource.rawCategory;
            externalSource.lastSyncedAt = new Date();
        }

        if (!existingPlace.roadAddress && agoPlaceInput.roadAddress) {
            existingPlace.roadAddress = agoPlaceInput.roadAddress;
        }

        if (!existingPlace.normalizedName) {
            existingPlace.normalizedName = agoPlaceInput.normalizedName;
        }

        await existingPlace.save();

        return res.status(200).json({
            success: true,
            data: {
                place: existingPlace,
                created: false
            }
        });
    }

    const place = await Place.create({
        name: agoPlaceInput.name,
        normalizedName: agoPlaceInput.normalizedName,
        category: agoPlaceInput.category,
        address: agoPlaceInput.address,
        roadAddress: agoPlaceInput.roadAddress,
        location: agoPlaceInput.location,
        externalSources: [
            agoPlaceInput.externalSource
        ]
    });

    return res.status(201).json({
        success: true,
        data: {
            place,
            created: true
        }
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

    const [placeUpdates, quickSignals, legacyPosts] = await Promise.all([
        PlaceUpdate.find({place: id})
            .sort({observedAt: -1, createdAt: -1})
            .populate('author', '_id id name')
            .populate('place', 'name category address roadAddress location currentStatus')
            .lean(),
        QuickSignal.find({place: id})
            .sort({observedAt: -1, createdAt: -1})
            .populate('author', '_id id name')
            .populate('place', 'name category address roadAddress location currentStatus')
            .lean(),
        Post.find({
            kind: 'now',
            place: id
        })
            .sort({createdAt: -1})
            .populate('author', '_id name')
            .populate('place', 'name category address roadAddress location currentStatus')
            .lean()
    ]);

    const allItems = [
        ...placeUpdates.map(serializePlaceUpdate),
        ...quickSignals.map(serializeQuickSignal),
        ...legacyPosts.map(serializeLegacyNowPost)
    ].sort((a, b) => {
        return new Date(b.observedAt || b.createdAt) -
            new Date(a.observedAt || a.createdAt);
    });

    const items = allItems
        .slice((page - 1) * limit, page * limit);

    const total = allItems.length;

    return res.json({
        success: true,
        data: {items, page, limit, total}
    });
});

router.get('/:id/place-updates', async (req, res) => {
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

    const items = await PlaceUpdate.find({place: id})
        .sort({observedAt: -1, createdAt: -1})
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('author', '_id id name')
        .populate('place', 'name category address roadAddress location currentStatus')
        .lean();

    const total = await PlaceUpdate.countDocuments({place: id});

    return res.json({
        success: true,
        data: {
            items: items.map(serializePlaceUpdate),
            page,
            limit,
            total
        }
    });
});

router.post('/:id/follow', auth, async (req, res) => {
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

    const user = await User.findByIdAndUpdate(
        req.user.sub,
        {
            $addToSet: {
                followedPlaces: id
            }
        },
        {
            new: true
        }
    ).populate('followedPlaces', 'name category address');

    return res.status(200).json({
        success: true,
        data : {
            followedPlaces: user.followedPlaces
        }
    });
});

router.delete('/:id/follow', auth, async (req, res) => {
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

    const user = await User.findById(req.user.sub);

    if (!user) {
        return res.status(404).json({
            success: false,
            error: {
                code: 'USER_NOT_FOUND',
                message: '사용자를 찾을 수 없습니다.'
            }
        });
    }

    const isFollowing = user.followedPlaces.some(
        placeId => placeId.toString() === id
    );

    if (!isFollowing) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'NOT_FOLLOWING',
                message: '팔로우 중인 장소가 아닙니다.'
            }
        });
    }

    user.followedPlaces.pull(id);
    await user.save();

    await user.populate(
        'followedPlaces',
        'name category address'
    );

    return res.status(200).json({
        success: true,
        data: {
            followedPlaces: user.followedPlaces
        }
    });
});

router.get('/followed/me', auth, async (req, res) => {
    const user = await User.findById(req.user.sub)
        .populate(
            'followedPlaces',
            'name category address location'
        );

    if (!user) {
        return res.status(404).json({
            success: false,
            error: {
                code: 'USER_NOT_FOUND',
                message: '사용자를 찾을 수 없습니다.'
            }
        });
    }

    return res.status(200).json({
        success: true,
        data: {
            followedPlaces: user.followedPlaces
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
