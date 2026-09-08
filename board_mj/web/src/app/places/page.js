'use client';

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {apiFetch} from '@/lib/api';
import dynamic from "next/dynamic";

const CATEGORY_LABEL = {
    cafe: '카페',
    restaurant: '맛집',
    bar: '술집',
    popup: '팝업',
    shopping: '쇼핑',
    park: '공원',
    culture: '문화',
    street: '거리',
    other: '기타',
    etc: '기타',
};

const CATEGORY_FILTERS = [
    {value: 'all', label: '전체'},
    {value: 'cafe', label: '카페'},
    {value: 'restaurant', label: '맛집'},
    {value: 'bar', label: '술집'},
    {value: 'popup', label: '팝업'},
    {value: 'shopping', label: '쇼핑'},
    {value: 'park', label: '공원'},
    {value: 'culture', label: '문화'},
    {value: 'other', label: '기타'},
];

const STATUS_LABEL = {
    quiet: '🟢 여유',
    normal: '🟡 보통',
    busy: '🔴 혼잡',
    unknown: '정보 없음'
};

const STATUS_FILTERS = [
    {value: 'all', label: '전체'},
    {value: 'quiet', label: '여유'},
    {value: 'normal', label: '보통'},
    {value: 'busy', label: '혼잡'},
    {value: 'unknown', label: '정보 없음'}
];

function getCategoryParam(category) {
    return category === 'all' ? null : category;
}

function formatScore(score) {
    const value = Number(score);

    if (!Number.isFinite(value)) {
        return 0;
    }

    return Math.round(value * 100);
}

function getPlaceStatus(place) {
    return place.currentStatus?.status || 'unknown';
}

const PlacesMap = dynamic(
    () => import('./PlacesMap'),
    {
        ssr: false,
    }
);

export default function PlacesPage() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [places, setPlaces] = useState([]);
    const [externalPlaces, setExternalPlaces] = useState([]);
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [linkingPlaceId, setLinkingPlaceId] = useState('');
    const [error, setError] = useState('');
    const [externalError, setExternalError] = useState('');
    const [userLocation, setUserLocation] = useState(null);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');

    async function loadNearbyPlacesForLocation(location) {
        const params = new URLSearchParams({
            longitude: String(location.longitude),
            latitude: String(location.latitude),
            maxDistance: '3000',
            includeExternal: 'true'
        });

        const category = getCategoryParam(selectedCategory);

        if (category) {
            params.set('category', category);
        }

        const data = await apiFetch(`/api/places/nearby?${params}`);

        setPlaces(data.places || []);
        setExternalPlaces(data.externalPlaces || []);
        setExternalError(data.externalError?.message || '');
    }

    useEffect(() => {
        if (!query.trim()) {
            setExternalPlaces([]);
            setExternalError('');
            return;
        }

        const timer = setTimeout(async () => {
            const trimmedQuery = query.trim();
            const externalSearchParams = new URLSearchParams({
                q: trimmedQuery
            });

            if (userLocation) {
                externalSearchParams.set(
                    'longitude',
                    String(userLocation.longitude)
                );
                externalSearchParams.set(
                    'latitude',
                    String(userLocation.latitude)
                );
                externalSearchParams.set('sort', 'distance');
            }

            try {
                setLoading(true);
                setError('');
                setExternalError('');
                setSelectedPlace(null);

                const [internalResult, externalResult] =
                    await Promise.allSettled([
                        apiFetch(
                            `/api/places?q=${encodeURIComponent(trimmedQuery)}`
                        ),
                        apiFetch(
                            `/api/places/external/search?${externalSearchParams}`
                        )
                    ]);

                if (internalResult.status === 'fulfilled') {
                    setPlaces(internalResult.value.places || []);
                } else {
                    setPlaces([]);
                    setError(internalResult.reason.message);
                }

                if (externalResult.status === 'fulfilled') {
                    setExternalPlaces(externalResult.value.items || []);
                } else {
                    setExternalPlaces([]);
                    setExternalError(externalResult.reason.message);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [query, userLocation]);

    useEffect(() => {
        if (query.trim() || userLocation) {
            return;
        }

        let ignore = false;

        async function loadPlacesByCategory() {
            try {
                setLoading(true);
                setError('');
                setExternalError('');
                setSelectedPlace(null);

                const params = new URLSearchParams({
                    limit: '100'
                });

                if (selectedCategory !== 'all') {
                    params.set('category', selectedCategory);
                }

                const data = await apiFetch(`/api/places?${params}`);

                if (!ignore) {
                    setPlaces(data.places || []);
                }
            } catch (err) {
                if (!ignore) {
                    setError(err.message);
                    setPlaces([]);
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        }

        loadPlacesByCategory();

        return () => {
            ignore = true;
        };
    }, [query, selectedCategory, userLocation]);

    useEffect(() => {
        if (!userLocation || query.trim()) {
            return;
        }

        let ignore = false;

        async function reloadNearbyPlacesByCategory() {
            try {
                setLocationLoading(true);
                setError('');
                setSelectedPlace(null);

                const params = new URLSearchParams({
                    longitude: String(userLocation.longitude),
                    latitude: String(userLocation.latitude),
                    maxDistance: '3000',
                    includeExternal: 'true'
                });

                const category = getCategoryParam(selectedCategory);

                if (category) {
                    params.set('category', category);
                }

                const data = await apiFetch(`/api/places/nearby?${params}`);

                if (!ignore) {
                    setPlaces(data.places || []);
                    setExternalPlaces(data.externalPlaces || []);
                    setExternalError(data.externalError?.message || '');
                }
            } catch (err) {
                if (!ignore) {
                    setError(err.message);
                    setPlaces([]);
                    setExternalPlaces([]);
                }
            } finally {
                if (!ignore) {
                    setLocationLoading(false);
                }
            }
        }

        reloadNearbyPlacesByCategory();

        return () => {
            ignore = true;
        };
    }, [selectedCategory, userLocation, query]);

    function loadNearbyPlaces() {
        if (!navigator.geolocation) {
            setError('현재 브라우저에서는 위치 정보를 사용할 수 없습니다.');
            return;
        }

        setLocationLoading(true);
        setError('');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const {latitude, longitude} = position.coords;

                    setUserLocation({
                        latitude,
                        longitude,
                    });

                    await loadNearbyPlacesForLocation({
                        latitude,
                        longitude
                    });
                } catch (err) {
                    setError(err.message);
                } finally {
                    setLocationLoading(false);
                }
            },
            () => {
                setError('현재 위치를 가져오지 못했습니다.');
                setLocationLoading(false);
            }
        );
    }

    const filteredPlaces = places.filter((place) => {
        const categoryMatched =
            selectedCategory === 'all' ||
            place.category === selectedCategory;
        const statusMatched =
            selectedStatus === 'all' ||
            getPlaceStatus(place) === selectedStatus;

        return categoryMatched && statusMatched;
    });

    const externalDisplayPlaces = externalPlaces
        .map((place) => {
            const agoPlace = place.agoPlace;

            if (agoPlace) {
                return {
                    ...agoPlace,
                    externalPlaceId: place.externalPlaceId,
                    provider: place.provider,
                    isExternalResult: false,
                    isMatchedExternalResult: true
                };
            }

            return {
                _id: `kakao:${place.externalPlaceId}`,
                externalPlaceId: place.externalPlaceId,
                provider: place.provider,
                name: place.name,
                category: place.category,
                address: place.address,
                roadAddress: place.roadAddress,
                location: place.location,
                placeUrl: place.placeUrl,
                rawCategory: place.rawCategory,
                isExternalResult: true,
                kakaoPlace: place
            };
        })
        .filter((place) => {
            const categoryMatched =
                selectedCategory === 'all' ||
                place.category === selectedCategory;
            const statusMatched =
                selectedStatus === 'all' ||
                getPlaceStatus(place) === selectedStatus;

            return categoryMatched && statusMatched;
        });

    const displayedPlaces = [
        ...filteredPlaces,
        ...externalDisplayPlaces.filter((externalPlace) => {
            return !filteredPlaces.some((place) => {
                return place._id === externalPlace._id;
            });
        })
    ];

    async function linkExternalPlace(place) {
        if (!place?.kakaoPlace || linkingPlaceId) {
            return;
        }

        try {
            setLinkingPlaceId(place.externalPlaceId);
            setError('');

            const data = await apiFetch('/api/places/external/kakao/link', {
                method: 'POST',
                body: JSON.stringify({
                    kakaoPlace: place.kakaoPlace
                })
            });

            router.push(`/places/${data.place._id}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setLinkingPlaceId('');
        }
    }

    return (
        <main className="places-page">

            <section className="places-map-shell">
                <div className="places-search-row">
                    <div className="places-search">
                        <span className="places-search-icon">⌕</span>

                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="장소, 지역 검색"
                        />

                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                aria-label="검색어 지우기"
                            >
                                ×
                            </button>
                        )}
                    </div>

                    <button
                        type="button"
                        className="places-filter-button"
                        aria-label="필터"
                    >
                        ☷
                    </button>
                </div>

                <div className="places-category-row">
                    {CATEGORY_FILTERS.map((category) => (
                        <button
                            key={category.value}
                            type="button"
                            className={
                                selectedCategory === category.value
                                    ? 'active'
                                    : ''
                            }
                            onClick={() => {
                                setSelectedCategory(category.value);
                                setSelectedPlace(null);
                            }}
                        >
                            {category.label}
                        </button>
                    ))}
                </div>

                <div className="places-status-row">
                    {STATUS_FILTERS.map((status) => (
                        <button
                            key={status.value}
                            type="button"
                            className={
                                selectedStatus === status.value
                                    ? 'active'
                                    : ''
                            }
                            onClick={() => {
                                setSelectedStatus(status.value);
                                setSelectedPlace(null);
                            }}
                        >
                            {status.label}
                        </button>
                    ))}
                </div>

                <div className="places-map">
                    <PlacesMap
                        places={displayedPlaces}
                        userLocation={userLocation}
                        selectedPlace={selectedPlace}
                        onSelectPlace={setSelectedPlace}
                    />

                    {selectedPlace && !selectedPlace.isExternalResult && (
                        <Link
                            href={`/places/${selectedPlace._id}`}
                            className="places-map-card"
                        >
                            <div className="places-map-card-main">
                                <div className="places-map-card-title-row">
                                    <strong>{selectedPlace.name}</strong>

                                    {selectedPlace.distance != null && (
                                        <span className="places-map-card-distance">
                                            {selectedPlace.distance < 1000
                                                ? `${Math.round(selectedPlace.distance)}m`
                                                : `${(selectedPlace.distance / 1000).toFixed(1)}km`}
                                        </span>
                                    )}
                                </div>

                                <div className="places-map-card-tags">
                                    <span className="places-map-card-category">
                                        {CATEGORY_LABEL[selectedPlace.category] ||
                                            selectedPlace.category}
                                    </span>

                                    <span className="places-map-card-status">
                                        {STATUS_LABEL[getPlaceStatus(selectedPlace)]}
                                    </span>
                                </div>

                                <p>{selectedPlace.address}</p>

                                <div className="places-map-card-metrics">
                                    <span>
                                        Freshness {formatScore(
                                            selectedPlace.currentStatus?.freshnessScore
                                        )}%
                                    </span>

                                    <span>
                                        Confidence {formatScore(
                                            selectedPlace.currentStatus?.confidenceScore
                                        )}%
                                    </span>
                                </div>

                                <span className="places-map-card-link">
                                    장소 상세 보기 →
                                </span>
                            </div>
                        </Link>
                    )}

                    {selectedPlace?.isExternalResult && (
                        <article className="places-map-card">
                            <div className="places-map-card-main">
                                <div className="places-map-card-title-row">
                                    <strong>{selectedPlace.name}</strong>

                                    <span className="places-map-card-distance">
                                        Kakao
                                    </span>
                                </div>

                                <div className="places-map-card-tags">
                                    <span className="places-map-card-category">
                                        {CATEGORY_LABEL[selectedPlace.category] ||
                                            selectedPlace.category}
                                    </span>

                                    <span className="places-map-card-status">
                                        {STATUS_LABEL[getPlaceStatus(selectedPlace)]}
                                    </span>
                                </div>

                                <p>
                                    {selectedPlace.roadAddress ||
                                        selectedPlace.address}
                                </p>

                                <button
                                    type="button"
                                    className="places-map-card-link"
                                    onClick={() => linkExternalPlace(selectedPlace)}
                                    disabled={
                                        linkingPlaceId ===
                                        selectedPlace.externalPlaceId
                                    }
                                >
                                    {linkingPlaceId === selectedPlace.externalPlaceId
                                        ? '연결 중...'
                                        : 'ago 장소로 연결'}
                                </button>
                            </div>
                        </article>
                    )}

                    <button
                        type="button"
                        className="places-location-button"
                        onClick={loadNearbyPlaces}
                        disabled={locationLoading}
                    >
                        {locationLoading ? (
                            <span>...</span>
                        ) : (
                            <svg
                                viewBox="0 0 24 24"
                                width="19"
                                height="19"
                                aria-hidden="true"
                            >
                                <circle cx="12" cy="12" r="4"/>
                                <path d="M12 2v3"/>
                                <path d="M12 19v3"/>
                                <path d="M2 12h3"/>
                                <path d="M19 12h3"/>
                            </svg>
                        )}
                    </button>
                </div>
            </section>

            {error && (
                <p className="places-error">
                    {error}
                </p>
            )}

            {externalError && !error && (
                <p className="places-error">
                    외부 장소 검색: {externalError}
                </p>
            )}

            {loading && (
                <p className="places-map-state">
                    장소 찾는 중...
                </p>
            )}
        </main>
    );
}
