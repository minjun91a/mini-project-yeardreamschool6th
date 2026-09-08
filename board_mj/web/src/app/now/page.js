'use client';

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {apiFetch} from '@/lib/api';

const STATUS_LABEL = {
    quiet: '여유',
    normal: '보통',
    busy: '혼잡',
    unknown: '정보 부족'
};

const TREND_LABEL = {
    rising: '혼잡 증가',
    falling: '혼잡 완화',
    stable: '유지 중',
    unknown: '변화 판단 전'
};

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
    {value: 'culture', label: '문화'},
];

function getCategoryParam(category) {
    return category === 'all' ? null : category;
}

function formatRelativeTime(createdAt) {
    const now = new Date();
    const created = new Date(createdAt);

    const diff = now - created;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
        return '방금 전';
    }

    if (minutes < 60) {
        return `${minutes}분 전`;
    }

    if (hours < 24) {
        return `${hours}시간 전`;
    }

    if (days < 7) {
        return `${days}일 전`;
    }

    return created.toLocaleDateString('ko-KR');
}

function formatScore(score) {
    const value = Number(score);

    if (!Number.isFinite(value)) {
        return 0;
    }

    return Math.round(value * 100);
}

function getStatusTime(place) {
    return place.currentStatus?.freshestEvidenceAt ||
        place.currentStatus?.lastSignalAt ||
        place.currentStatus?.calculatedAt ||
        place.stats?.lastSignalAt ||
        place.updatedAt;
}

function getFreshnessType(score) {
    const percent = formatScore(score);

    if (percent >= 70) {
        return 'fresh';
    }

    if (percent >= 35) {
        return 'recent';
    }

    return 'old';
}

function getEvidenceCount(place) {
    return (place.stats?.updateCount || 0) +
        (place.stats?.quickSignalCount || 0);
}

function toExternalDisplayPlace(place) {
    if (place.agoPlace) {
        return {
            ...place.agoPlace,
            distance: place.distance,
            externalPlaceId: place.externalPlaceId,
            provider: place.provider,
            isMatchedExternalResult: true
        };
    }

    return {
        _id: `kakao:${place.externalPlaceId}`,
        externalPlaceId: place.externalPlaceId,
        provider: place.provider,
        name: place.name,
        category: place.category,
        address: place.roadAddress || place.address,
        location: place.location,
        distance: place.distance,
        currentStatus: {
            status: 'unknown',
            confidenceScore: 0,
            freshnessScore: 0,
            trend: 'unknown'
        },
        stats: {
            updateCount: 0,
            quickSignalCount: 0
        },
        isExternalResult: true
    };
}

function mergeNearbyPlaces(localPlaces, externalPlaces) {
    const merged = [...localPlaces];
    const knownIds = new Set(localPlaces.map((place) => String(place._id)));

    externalPlaces
        .map(toExternalDisplayPlace)
        .forEach((place) => {
            if (knownIds.has(String(place._id))) {
                return;
            }

            knownIds.add(String(place._id));
            merged.push(place);
        });

    return merged;
}

function buildLiveStatusPath(category) {
    const params = new URLSearchParams();
    const categoryParam = getCategoryParam(category);

    if (categoryParam) {
        params.set('category', categoryParam);
    }

    const query = params.toString();

    return query
        ? `/api/places/live-statuses?${query}`
        : '/api/places/live-statuses';
}

function buildNearbyPath({longitude, latitude, category}) {
    const params = new URLSearchParams({
        longitude: String(longitude),
        latitude: String(latitude),
        maxDistance: '3000',
        includeExternal: 'true'
    });

    const categoryParam = getCategoryParam(category);

    if (categoryParam) {
        params.set('category', categoryParam);
    }

    return `/api/places/nearby?${params}`;
}

export default function NowPage() {
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [selectedCategory, setSelectedCategory] = useState('all');
    const [placeQuery, setPlaceQuery] = useState('');
    const [placeResults, setPlaceResults] = useState([]);
    const [searchingPlaces, setSearchingPlaces] = useState(false);

    const [userLocation, setUserLocation] = useState(null);
    const [nearbyPlaces, setNearbyPlaces] = useState([]);
    const [nearbyExternalPlaces, setNearbyExternalPlaces] = useState([]);
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [nearbyExternalError, setNearbyExternalError] = useState('');

    const [nearbyMode, setNearbyMode] = useState(false);

    useEffect(() => {
        let ignore = false;

        async function loadNowFeed() {
            try {
                setLoading(true);
                setError('');

                const data = await apiFetch(
                    buildLiveStatusPath(selectedCategory)
                );

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

        loadNowFeed();

        return () => {
            ignore = true;
        };
    }, [selectedCategory]);

    useEffect(() => {
        if (!placeQuery.trim()) {
            setPlaceResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setSearchingPlaces(true);

                const data = await apiFetch(
                    `/api/places?q=${encodeURIComponent(placeQuery.trim())}`
                );

                setPlaceResults(data.places || []);
            } catch (err) {
                console.error(err);
                setPlaceResults([]);
            } finally {
                setSearchingPlaces(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [placeQuery]);

    useEffect(() => {
        if (!nearbyMode || !userLocation) {
            return;
        }

        let ignore = false;

        async function reloadNearbyPlaces() {
            try {
                setLocationLoading(true);
                setLocationError('');
                setNearbyExternalError('');

                const data = await apiFetch(
                    buildNearbyPath({
                        longitude: userLocation.longitude,
                        latitude: userLocation.latitude,
                        category: selectedCategory
                    })
                );

                if (!ignore) {
                    setNearbyPlaces(data.places || []);
                    setNearbyExternalPlaces(data.externalPlaces || []);
                    setNearbyExternalError(data.externalError?.message || '');
                }
            } catch (err) {
                if (!ignore) {
                    setLocationError(err.message);
                    setNearbyPlaces([]);
                    setNearbyExternalPlaces([]);
                }
            } finally {
                if (!ignore) {
                    setLocationLoading(false);
                }
            }
        }

        reloadNearbyPlaces();

        return () => {
            ignore = true;
        };
    }, [nearbyMode, selectedCategory, userLocation]);

    function loadCurrentLocation() {
        if (!navigator.geolocation) {
            setLocationError('현재 브라우저에서 위치 정보를 사용할 수 없습니다.');
            return;
        }

        setLocationLoading(true);
        setLocationError('');
        setNearbyExternalError('');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                setUserLocation({
                    latitude,
                    longitude
                });

                try {
                    const data = await apiFetch(
                        buildNearbyPath({
                            longitude,
                            latitude,
                            category: selectedCategory
                        })
                    );

                    setNearbyPlaces(data.places || []);
                    setNearbyExternalPlaces(data.externalPlaces || []);
                    setNearbyExternalError(data.externalError?.message || '');
                    setNearbyMode(true);
                } catch (err) {
                    setLocationError(err.message);
                    setNearbyExternalPlaces([]);
                    setNearbyExternalError('');
                } finally {
                    setLocationLoading(false);
                }
            },

            (geoError) => {
                if (geoError.code === 1) {
                    setLocationError('위치 권한이 필요합니다.');
                } else {
                    setLocationError('현재 위치를 가져오지 못했습니다.');
                }

                setLocationLoading(false);
            },

            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    }

    function getPlaceDistance(placeId) {
        const place = nearbyPlaces.find(
            (item) => item._id === placeId
        );

        return place?.distance ?? null;
    }

function formatDistance(distance) {
    const value = Number(distance);

    if (!Number.isFinite(value)) {
        return null;
    }

    if (value < 1000) {
        return `${Math.round(value)}m`;
    }

    return `${(value / 1000).toFixed(1)}km`;
}

    const visiblePlaces = nearbyMode
        ? mergeNearbyPlaces(nearbyPlaces, nearbyExternalPlaces)
        : places;

    if (loading) {
        return <main>불러오는 중...</main>;
    }

    if (error) {
        return <main>{error}</main>;
    }

    return (
        <main className="home-now-page">
            <section className="home-now-shell">
                <header className="home-now-header">
                    <div className="home-now-logo">
                        ago<span className="ago-logo-dot">.</span>
                    </div>

                    <button
                        type="button"
                        className={`home-now-location ${nearbyMode ? 'active' : ''}`}
                        aria-pressed={nearbyMode}
                        onClick={() => {
                            if (nearbyMode) {
                                setNearbyMode(false);
                                setNearbyExternalError('');
                                return;
                            }

                            loadCurrentLocation();
                        }}
                        disabled={locationLoading}
                    >
                        <span className="home-now-location-arrow">⌖</span>

                        <span className="home-now-location-label">
                            내 위치
                        </span>

                        <span className="home-now-location-divider">
                            ·
                        </span>

                        <strong className="home-now-location-area">
                            {locationLoading
                                ? '확인 중'
                                : nearbyMode
                                    ? '주변 ON'
                                    : '주변'}
                        </strong>

                        <span className="home-now-location-mini-pin">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11Z"/>
                                <circle cx="12" cy="10" r="2.2"/>
                            </svg>
                        </span>
                    </button>
                </header>

                <div className="home-now-categories">
                    {CATEGORY_FILTERS.map((category) => (
                        <button
                            key={category.value}
                            type="button"
                            className={
                                selectedCategory === category.value
                                    ? 'active'
                                    : ''
                            }
                            onClick={() => setSelectedCategory(category.value)}
                        >
                            {category.label}
                        </button>
                    ))}
                </div>

                <section className="home-now-search">
                    <input
                        value={placeQuery}
                        onChange={(e) => setPlaceQuery(e.target.value)}
                        placeholder="장소 이름이나 주소를 검색하세요"
                    />

                    {placeQuery && (
                        <button
                            type="button"
                            onClick={() => setPlaceQuery('')}
                            aria-label="검색어 지우기"
                        >
                            ×
                        </button>
                    )}
                </section>

                {locationError && (
                    <p className="home-now-error">
                        {locationError}
                    </p>
                )}

                {nearbyExternalError && nearbyMode && !locationError && (
                    <p className="home-now-error">
                        Kakao 주변 장소를 불러오지 못했습니다: {nearbyExternalError}
                    </p>
                )}

                {placeQuery.trim() ? (
                    <section className="home-now-search-results">
                        {searchingPlaces && (
                            <p className="home-now-state">
                                검색 중...
                            </p>
                        )}

                        {!searchingPlaces && placeResults.length === 0 && (
                            <div className="home-now-empty">
                                검색 결과가 없습니다.
                            </div>
                        )}

                        {!searchingPlaces && placeResults.length > 0 && (
                            <>
                                {placeResults.map((place) => (
                                    <Link
                                        key={place._id}
                                        href={`/places/${place._id}`}
                                        className="home-now-search-card"
                                    >
                                        <div>
                                            <strong>{place.name}</strong>

                                            <span>
                                                {CATEGORY_LABEL[place.category] || place.category}
                                                {' · '}
                                                {place.address}
                                            </span>
                                        </div>

                                        <span>›</span>
                                    </Link>
                                ))}
                            </>
                        )}
                    </section>
                ) : (
                    <section className="home-now-feed">
                        {visiblePlaces.length === 0 && (
                            <div className="home-now-empty">
                                {nearbyMode
                                    ? '주변에 계산된 최신 장소 상황이 없습니다.'
                                    : '아직 계산된 장소 상황이 없습니다.'}
                            </div>
                        )}

                        {visiblePlaces.map((place) => {
                            const isExternalResult = place.isExternalResult;
                            const currentStatus =
                                place.currentStatus || {};
                            const status = currentStatus.status || 'unknown';
                            const statusTime = getStatusTime(place);
                            const freshnessType = getFreshnessType(
                                currentStatus.freshnessScore
                            );

                            const distance = nearbyMode
                                ? place.distance
                                : getPlaceDistance(place._id);

                            const distanceText = formatDistance(distance);
                            const detailHref = isExternalResult
                                ? '/places'
                                : `/places/${place._id}`;

                            return (
                                <article
                                    key={place._id}
                                    className={`home-now-card ${isExternalResult ? 'external' : ''}`}
                                >
                                    <div className="home-now-card-head">
                                        <div className="home-now-place">
                                            <span className="home-now-pin">●</span>

                                            {isExternalResult ? (
                                                <strong>
                                                    {place.name}
                                                </strong>
                                            ) : (
                                                <Link href={detailHref}>
                                                    <strong>
                                                        {place.name}
                                                    </strong>
                                                </Link>
                                            )}

                                            {distanceText && (
                                                <small>{distanceText}</small>
                                            )}
                                        </div>

                                        {statusTime && (
                                            <span className={`home-now-time ${freshnessType}`}>
                                                {formatRelativeTime(statusTime)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="home-now-tags">
                                        <span className={`now-status ${status}`}>
                                            {STATUS_LABEL[status] || status}
                                        </span>

                                        {place.category && (
                                            <span className="home-now-tag">
                                                {CATEGORY_LABEL[place.category] || place.category}
                                            </span>
                                        )}

                                        {isExternalResult && (
                                            <span className="home-now-tag">
                                                Kakao
                                            </span>
                                        )}

                                        <span className="home-now-tag">
                                            {TREND_LABEL[currentStatus.trend || 'unknown']}
                                        </span>
                                    </div>

                                    <div className="home-now-status-metrics">
                                        <span>
                                            Freshness {formatScore(currentStatus.freshnessScore)}%
                                        </span>

                                        <span>
                                            Confidence {formatScore(currentStatus.confidenceScore)}%
                                        </span>
                                    </div>

                                    <footer className="home-now-card-footer">
                                        <div className="home-now-card-actions">
                                            <span className="home-now-action">
                                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                                    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/>
                                                    <path d="M5 20a7 7 0 0 1 14 0"/>
                                                </svg>

                                                Evidence {getEvidenceCount(place)}
                                            </span>

                                            <Link
                                                href={detailHref}
                                                className="home-now-action"
                                            >
                                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                                    <path d="M21 11.5a8.5 8.5 0 0 1-9 8.5 9.6 9.6 0 0 1-3.8-.8L3 21l1.7-4.5A8.1 8.1 0 0 1 3 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5Z"/>
                                                </svg>

                                                {isExternalResult
                                                    ? '장소에서 보기'
                                                    : '장소 상황 보기'}
                                            </Link>
                                        </div>

                                        <button
                                            type="button"
                                            className="home-now-more"
                                            aria-label="더보기"
                                        >
                                            ···
                                        </button>
                                    </footer>
                                </article>
                            );
                        })}
                    </section>
                )}
            </section>
        </main>
    );
}
