const express = require('express');
const mongoose = require('mongoose');

const auth = require('../middlewares/auth');
const Place = require('../models/place');
const PresenceSignal = require('../models/presenceSignal');
const kakaoLocal = require('../services/kakaoLocal');
const {getDistanceMeters} = require('../services/geo');
const {
    calculatePlaceStatusSafely
} = require('../services/placeStatusEngine');

const router = express.Router();

const PRESENCE_RADIUS_METERS = 300;
const PRESENCE_TTL_MS = 15 * 60 * 1000;

function toFiniteCoordinate(value) {
    const number = Number(value);

    return Number.isFinite(number) ? number : null;
}

function parseLocationInput({longitude, latitude}) {
    const longitudeNumber = toFiniteCoordinate(longitude);
    const latitudeNumber = toFiniteCoordinate(latitude);

    if (
        longitudeNumber == null ||
        latitudeNumber == null ||
        longitudeNumber < -180 ||
        longitudeNumber > 180 ||
        latitudeNumber < -90 ||
        latitudeNumber > 90
    ) {
        return null;
    }

    return {
        longitude: longitudeNumber,
        latitude: latitudeNumber
    };
}

function getPlaceDistance({place, longitude, latitude}) {
    if (place?.location?.coordinates?.length !== 2) {
        return null;
    }

    const [placeLongitude, placeLatitude] = place.location.coordinates;

    return getDistanceMeters(
        latitude,
        longitude,
        placeLatitude,
        placeLongitude
    );
}

function serializeExternalPlace(place, agoPlace) {
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

async function findMatchedAgoPlaces(kakaoPlaces) {
    const externalIds = kakaoPlaces
        .map((place) => place.externalPlaceId)
        .filter(Boolean);

    if (externalIds.length === 0) {
        return new Map();
    }

    const places = await Place.find({
        externalSources: {
            $elemMatch: {
                provider: 'kakao',
                externalPlaceId: {$in: externalIds}
            }
        }
    }).lean();

    return new Map(
        places.map((place) => {
            const externalSource = place.externalSources?.find((source) => {
                return source.provider === 'kakao';
            });

            return [
                externalSource.externalPlaceId,
                place
            ];
        })
    );
}

router.get('/nearby', auth, async (req, res) => {
    const location = parseLocationInput(req.query);

    if (!location) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_COORDINATES',
                message: '올바른 현재 위치 좌표가 필요합니다.'
            }
        });
    }

    const radius = Math.min(
        Math.max(Number(req.query.radius) || 500, 100),
        1000
    );

    const limit = Math.min(
        Math.max(Number(req.query.limit) || 8, 1),
        20
    );

    const places = await Place.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [
                        location.longitude,
                        location.latitude
                    ]
                },
                distanceField: 'distance',
                maxDistance: radius,
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

    let kakaoPlaces = [];
    let externalError = null;

    try {
        kakaoPlaces = await kakaoLocal.searchNearbyCategories({
            longitude: location.longitude,
            latitude: location.latitude,
            radius,
            size: 15
        });
    } catch (err) {
        console.error('[presence-kakao-nearby]', err.code || err.name, err.message);
        externalError = {
            code: err.code || 'KAKAO_LOCAL_ERROR',
            message: err.message
        };
    }

    const matchedByExternalId = await findMatchedAgoPlaces(kakaoPlaces);

    return res.status(200).json({
        success: true,
        data: {
            places,
            kakaoPlaces: kakaoPlaces
                .slice(0, limit)
                .map((place) => {
                    return serializeExternalPlace(
                        place,
                        matchedByExternalId.get(place.externalPlaceId)
                    );
                }),
            externalError
        }
    });
});

router.post('/', auth, async (req, res) => {
    const {
        placeId,
        longitude,
        latitude,
        accuracy,
        observedAt
    } = req.body;

    if (!mongoose.isValidObjectId(placeId)) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_PLACE_ID',
                message: '올바르지 않은 장소 ID입니다.'
            }
        });
    }

    const location = parseLocationInput({
        longitude,
        latitude
    });

    if (!location) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_COORDINATES',
                message: 'Presence 신호에는 현재 위치 좌표가 필요합니다.'
            }
        });
    }

    const observedAtDate = observedAt ? new Date(observedAt) : new Date();

    if (Number.isNaN(observedAtDate.getTime())) {
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

    const distanceFromPlace = getPlaceDistance({
        place,
        longitude: location.longitude,
        latitude: location.latitude
    });

    if (
        distanceFromPlace == null ||
        distanceFromPlace > PRESENCE_RADIUS_METERS
    ) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'PLACE_TOO_FAR_FOR_PRESENCE',
                message: '현재 위치가 선택한 장소와 충분히 가깝지 않습니다.'
            }
        });
    }

    const expiresAt = new Date(observedAtDate.getTime() + PRESENCE_TTL_MS);
    const locationAccuracy = toFiniteCoordinate(accuracy);

    const presenceSignal = await PresenceSignal.findOneAndUpdate(
        {
            author: req.user.sub
        },
        {
            $set: {
                place: placeId,
                source: 'gps',
                matchMethod: distanceFromPlace <= PRESENCE_RADIUS_METERS
                    ? 'nearby_place'
                    : 'manual_place',
                visitVerified: true,
                distanceFromPlace,
                locationAccuracy,
                observedAt: observedAtDate,
                expiresAt
            },
            $setOnInsert: {
                author: req.user.sub
            }
        },
        {
            upsert: true,
            returnDocument: 'after'
        }
    );

    await Place.updateOne(
        {_id: placeId},
        {
            $set: {
                'stats.lastSignalAt': observedAtDate,
                'stats.lastPresenceAt': observedAtDate
            }
        }
    );

    const placeStatus = await calculatePlaceStatusSafely(
        placeId,
        {actorId: req.user.sub}
    );

    return res.status(201).json({
        success: true,
        data: {
            presenceSignal,
            placeStatus
        }
    });
});

module.exports = router;
