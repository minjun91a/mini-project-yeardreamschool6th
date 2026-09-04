'use client'

import {useEffect, useState} from "react";
import {apiFetch} from "@/lib/api";
import Link from "next/link";

const STATUS_LABEL = {
    quiet: '🟢 여유',
    normal: '🟡 보통',
    busy: '🔴 혼잡'
};

const CATEGORY_LABEL = {
    cafe: '카페',
    restaurant: '음식점',
    bar: '술집',
    popup: '팝업',
    shopping: '쇼핑',
    park: '공원',
    culture: '문화',
    etc: '기타',
};

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

function getFreshness(createdAt) {
    const now = new Date();
    const created = new Date(createdAt);

    const diff = now - created;
    const hours = diff / (1000 * 60 * 60);

    if (hours < 1) {
        return {
            type: 'fresh',
            label: '실시간'
        };
    }

    if (hours < 3) {
        return {
            type: 'recent',
            label: '최근 정보'
        };
    }

    if (hours < 24) {
        return {
            type: 'old',
            label: '시간이 지난 정보'
        };
    }

    return {
        type: 'expired',
        label: '오래된 정보'
    };
}

export default function NowPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [placeQuery, setPlaceQuery] = useState('');
    const [placeResults, setPlaceResults] = useState([]);
    const [searchingPlaces, setSearchingPlaces] = useState(false);

    const [userLocation, setUserLocation] = useState(null);
    const [nearbyPlaces, setNearbyPlaces] = useState([]);
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState('');

    const [nearbyMode, setNearbyMode] = useState(false);

    useEffect(() => {
        const loadNowFeed = async () => {
            try {
                const data = await apiFetch('/api/places/now/latest');

                setItems(data.items);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadNowFeed();
    }, []);

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

    function loadCurrentLocation() {
        if (!navigator.geolocation) {
            setLocationError('현재 브라우저에서는 위치 정보를 사용할 수 없습니다.');
            return;
        }

        setLocationLoading(true);
        setLocationError('');

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
                        `/api/places/nearby?longitude=${longitude}&latitude=${latitude}&maxDistance=3000`
                    );

                    setNearbyPlaces(data.places || []);
                    setNearbyMode(true);
                } catch (err) {
                    setLocationError(err.message);
                } finally {
                    setLocationLoading(false);
                }
            },

            (error) => {
                if (error.code === 1) {
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
        if (distance == null) {
            return null;
        }

        if (distance < 1000) {
            return `${Math.round(distance)}m`;
        }

        return `${(distance / 1000).toFixed(1)}km`
    }

    const visibleItems = nearbyMode
        ? items.filter((post) =>
            nearbyPlaces.some(
                (place) => place._id === post.place?._id
            )
        )
        : items;

    if (loading) {
        return <main>불러오는 중...</main>;
    }

    if (error) {
        return <main>{error}</main>;
    }

    return (
        <main className="now-page">
            <header className="now-header">
                <div>
                    <p className="now-eyebrow">ago.</p>

                    <h1 className="now-title">
                        가고 싶은 곳의 <span>지금.</span>
                    </h1>

                    <p className="now-subtitle">
                        방금 다녀온 사람들이 알려주는 가장 최신의 현장 정보
                    </p>
                </div>

                <Link href="/now/write" className="now-write-button">
                    지금 알려주기
                </Link>
            </header>

            <section className="now-place-search">
                <label
                    htmlFor="now-place-search-input"
                    className="now-place-search-label"
                >
                    어디로 가시나요?
                </label>

                <div className="now-place-search-input-wrap">
                    <button
                        type="button"
                        onClick={() => {
                            if (nearbyMode) {
                                setNearbyMode(false);
                                return;
                            }

                            loadCurrentLocation();
                        }}
                        disabled={locationLoading}
                    >
                        {locationLoading
                            ? '위치 확인 중...'
                            : userLocation
                                ? '📍 내 위치 사용 중'
                                : '내 주변 보기'}
                    </button>

                    {locationError && (
                        <p>{locationError}</p>
                    )}

                    <input
                        id="now-place-search-input"
                        className="now-place-search-input"
                        type="text"
                        value={placeQuery}
                        onChange={(e) => setPlaceQuery(e.target.value)}
                        placeholder="장소 이름이나 주소를 검색하세요"
                    />

                    {placeQuery && (
                        <button
                            type="button"
                            className="now-place-search-clear"
                            onClick={() => setPlaceQuery('')}
                            aria-label="검색어 지우기"
                        >
                            ×
                        </button>
                    )}
                </div>
            </section>

            {placeQuery.trim() ? (
                <section className="now-search-mode">
                    <h2 className="now-section-title">검색 결과</h2>

                    {searchingPlaces && (
                        <p className="now-place-search-message">
                            검색 중...
                        </p>
                    )}

                    {!searchingPlaces && placeResults.length === 0 && (
                        <div className="now-empty">
                            <strong>검색 결과가 없어요.</strong>
                            <p>다른 장소 이름이나 주소로 검색해보세요.</p>
                        </div>
                    )}

                    {!searchingPlaces && placeResults.length > 0 && (
                        <div className="now-place-search-results">
                            {placeResults.map((place) => (
                                <Link
                                    key={place._id}
                                    href={`/places/${place._id}`}
                                    className="now-place-search-result"
                                >
                                    <div>
                                        <strong>{place.name}</strong>

                                        <span>
                                {CATEGORY_LABEL[place.category] || place.category}
                                            {' · '}
                                            {place.address}
                            </span>
                                    </div>

                                    <span className="now-place-search-arrow">
                            →
                        </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            ) : (
                <>
                    {visibleItems.length === 0 && (
                        <div className="now-empty">
                            <strong>
                                {nearbyMode
                                    ? '주변에 최신 현장 정보가 없어요.'
                                    : '아직 현장 정보가 없어요.'}
                            </strong>
                            <p>
                                {nearbyMode
                                    ? '3km 이내에 등록된 현장 정보가 없습니다.'
                                    : '가장 먼저 지금 상황을 알려주세요.'}
                            </p>
                        </div>
                    )}

                    <section className="now-feed">
                        {visibleItems.map((post) => {
                            const freshness = getFreshness(post.createdAt);

                            const distance = post.place?._id
                                ? getPlaceDistance(post.place._id)
                                : null;

                            const distanceText = formatDistance(distance);

                            return (
                                <article key={post._id} className="now-card">
                                    <div className="now-place-area">
                                        {post.place ? (
                                            <Link
                                                href={`/places/${post.place._id}`}
                                                className="now-place-link"
                                            >
                                                <h2 className="now-place-name">
                                                    {post.place.name}
                                                </h2>
                                            </Link>
                                        ) : (
                                            <h2 className="now-place-name">
                                                장소 정보 없음
                                            </h2>
                                        )}

                                        {post.place?.category && (
                                            <span className="now-category">
                                    {CATEGORY_LABEL[post.place.category] ||
                                        post.place.category}
                                </span>
                                        )}

                                        {post.place?.address && (
                                            <p className="now-address">
                                                {distanceText && (
                                                    <>
                                                        <strong className="now-distance">
                                                            {distanceText}
                                                        </strong>
                                                        <span> · </span>
                                                    </>
                                                )}

                                                {post.place.address}
                                            </p>
                                        )}
                                    </div>

                                    <div className="now-status-row">
                                        <strong
                                            className={`now-status ${post.status}`}
                                        >
                                            {STATUS_LABEL[post.status] || post.status}
                                        </strong>

                                        <span
                                            className={`now-freshness ${freshness.type}`}
                                        >
                                {formatRelativeTime(post.createdAt)}
                            </span>
                                    </div>

                                    <p className="now-content">
                                        {post.content}
                                    </p>

                                    <footer className="now-footer">
                            <span>
                                {post.author?.name || '알 수 없음'}
                            </span>

                                        <span>현장 제보</span>
                                    </footer>
                                </article>
                            );
                        })}
                    </section>
                </>
            )}
        </main>
    );
}