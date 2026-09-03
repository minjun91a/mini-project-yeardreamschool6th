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

    const latestPlaceItems = items.filter((post, index, array) => {
        if (!post.place?._id) {
            return true;
        }

        return (
            array.findIndex(
                (item) => item.place?._id === post.place._id
            ) === index
        );
    });

    useEffect(() => {
        const loadNowFeed = async () => {
            try {
                const data = await apiFetch('/api/posts?kind=now');

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
                    {items.length === 0 && (
                        <div className="now-empty">
                            <strong>아직 현장 정보가 없어요.</strong>
                            <p>가장 먼저 지금 상황을 알려주세요.</p>
                        </div>
                    )}

                    <section className="now-feed">
                        {latestPlaceItems.map((post) => {
                            const freshness = getFreshness(post.createdAt);

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