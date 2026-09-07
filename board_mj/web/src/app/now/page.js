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
        <main className="home-now-page">
            <section className="home-now-shell">
                <header className="home-now-header">
                    <div className="home-now-logo">
                        ago<span className="ago-logo-dot">.</span>
                    </div>

                    <button
                        type="button"
                        className="home-now-location"
                        onClick={() => {
                            if (nearbyMode) {
                                setNearbyMode(false);
                                return;
                            }

                            loadCurrentLocation();
                        }}
                        disabled={locationLoading}
                    >
                        <span className="home-now-location-arrow">‹</span>

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
                                    ? '내 주변'
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
                    <button className="active">전체</button>
                    <button>카페</button>
                    <button>맛집</button>
                    <button>편의점</button>
                    <button>주차</button>
                    <button>문화</button>
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

                {placeQuery.trim() ? (
                    <section className="home-now-search-results">
                        {searchingPlaces && (
                            <p className="home-now-state">
                                검색 중...
                            </p>
                        )}

                        {!searchingPlaces && placeResults.length === 0 && (
                            <div className="home-now-empty">
                                검색 결과가 없어요.
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
                        {visibleItems.length === 0 && (
                            <div className="home-now-empty">
                                {nearbyMode
                                    ? '주변에 최신 현장 정보가 없어요.'
                                    : '아직 현장 정보가 없어요.'}
                            </div>
                        )}

                        {visibleItems.map((post) => {
                            const freshness = getFreshness(post.createdAt);

                            const distance = post.place?._id
                                ? getPlaceDistance(post.place._id)
                                : null;

                            const distanceText = formatDistance(distance);

                            return (
                                <article
                                    key={post._id}
                                    className="home-now-card"
                                >
                                    <div className="home-now-card-head">
                                        <div className="home-now-place">
                                            <span className="home-now-pin">●</span>

                                            <Link href={`/places/${post.place?._id}`}>
                                                <strong>
                                                    {post.place?.name || '장소 정보 없음'}
                                                </strong>
                                            </Link>

                                            {distanceText && (
                                                <small>{distanceText}</small>
                                            )}
                                        </div>

                                        <span className={`home-now-time ${freshness.type}`}>
                                            {formatRelativeTime(post.createdAt)}
                                        </span>
                                    </div>

                                    <div className="home-now-tags">
                                        <span className={`now-status ${post.status}`}>
                                            {STATUS_LABEL[post.status] || post.status}
                                        </span>

                                        {post.visitVerified && (
                                            <span className="home-now-tag">
                                                현장 인증
                                            </span>
                                        )}

                                        {post.place?.category && (
                                            <span className="home-now-tag">
                                                {CATEGORY_LABEL[post.place.category] || post.place.category}
                                            </span>
                                        )}
                                    </div>

                                    {post.imageUrl && (
                                        <div className="home-now-image">
                                            <img
                                                src={`${process.env.NEXT_PUBLIC_API_URL}${post.imageUrl}`}
                                                alt={`${post.place?.name || '장소'} 현장 사진`}
                                            />
                                        </div>
                                    )}

                                    <p className="home-now-content">
                                        {post.content}
                                    </p>

                                    {post.author?._id && (
                                        <Link
                                            href={`/profile/${post.author._id}`}
                                            className="home-now-author"
                                        >
                                            <span className="home-now-author-avatar">
                                                {(post.author.name || 'A').charAt(0).toUpperCase()}
                                            </span>

                                            <span className="home-now-author-name">
                                                {post.author.name || 'ago 사용자'}
                                            </span>
                                        </Link>
                                    )}

                                    <footer className="home-now-card-footer">
                                        <div className="home-now-card-actions">
                                            <span className="home-now-action">
                                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                                    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/>
                                                    <path d="M5 20a7 7 0 0 1 14 0"/>
                                                </svg>

                                                현장에 있어요
                                            </span>

                                            <span className="home-now-action">
                                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                                    <path
                                                        d="M21 11.5a8.5 8.5 0 0 1-9 8.5 9.6 9.6 0 0 1-3.8-.8L3 21l1.7-4.5A8.1 8.1 0 0 1 3 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5Z"/>
                                                </svg>

                                                댓글
                                            </span>
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