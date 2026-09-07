'use client'

import {useParams} from "next/navigation";
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
    etc: '기타'
};

function formatRelativeTime(createdAt) {
    const now = new Date();
    const created = new Date(createdAt);

    const diff = now - created;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;

    return created.toLocaleDateString('ko-KR');
}

export default function PlaceDetailPage() {
    const params = useParams();
    const id = params.id;

    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    const [place, setPlace] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadPlace = async () => {
            try {
                const placeData = await apiFetch(`/api/places/${id}`);
                const nowData = await apiFetch(`/api/places/${id}/now`);

                setPlace(placeData.place);
                setItems(nowData.items);

                const token = localStorage.getItem('token');

                if (token) {
                    const followData = await  apiFetch('/api/places/followed/me');

                    const following = followData.followedPlaces.some(
                        followedPlace => followedPlace._id === id
                    );

                    setIsFollowing(following);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadPlace();
        }
    }, [id]);

    if (loading) {
        return <main>불러오는 중...</main>
    }

    if (error) {
        return <main>{error}</main>
    }

    if (!place) {
        return <main>장소를 찾을 수 없습니다.</main>
    }

    const latestPost = items.length > 0 ? items[0] : null;
    const historyItems = items.filter((post, index, array) => {
        if (index === 0) {
            return true;
        }

        return post.status !== array[index - 1].status;
    }).slice(0, 5);

    const recentVerifiedUsers = items
        .filter((post) => {
            if (!post.visitVerified || !post.author?._id) {
                return false;
            }

            const createdAt = new Date(post.createdAt).getTime();
            const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;

            return createdAt >= threeHoursAgo;
        })
        .filter((post, index, array) => {
            return (
                array.findIndex(
                    (item) => item.author?._id === post.author?._id
                ) === index
            );
        })
        .slice(0, 6);

    const latestNow =
        latestPost &&
        Date.now() - new Date(latestPost.createdAt).getTime()
        <= 6 * 60 * 60 * 1000
            ? latestPost
            : null;

    const handleFollow = async () => {
        if (followLoading) return;

        try {
            setFollowLoading(true);

            if (isFollowing) {
                await apiFetch(`/api/places/${id}/follow`, {
                    method: 'DELETE'
                });

                setIsFollowing(false);
            } else {
                await apiFetch(`/api/places/${id}/follow`, {
                    method: 'POST'
                });

                setIsFollowing(true);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setFollowLoading(false);
        }
    };

    return (
        <main className="place-detail-page">
            <section className="place-detail-shell">
                <header className="place-detail-header">
                    <div className="place-detail-top">
                        <Link href="/now" className="place-detail-back">
                            ←
                        </Link>

                        <div className="place-detail-title-area">
                            <h1>{place.name}</h1>
                            <span>{place.address}</span>
                        </div>

                        <div className="place-detail-actions">
                            <button
                                type="button"
                                className="place-detail-icon-button"
                                aria-label="알림"
                            >
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/>
                                    <path d="M10 21h4"/>
                                </svg>
                            </button>

                            <button
                                type="button"
                                className="place-detail-icon-button"
                                aria-label="공유"
                            >
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <circle cx="18" cy="5" r="2.5"/>
                                    <circle cx="6" cy="12" r="2.5"/>
                                    <circle cx="18" cy="19" r="2.5"/>
                                    <path d="m8.2 10.8 7.6-4.4"/>
                                    <path d="m8.2 13.2 7.6 4.4"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="place-detail-tags">
                        {latestNow && (
                            <span className={`now-status ${latestNow.status}`}>
                            {STATUS_LABEL[latestNow.status] || latestNow.status}
                        </span>
                        )}

                        <span className="place-detail-tag">
                            {CATEGORY_LABEL[place.category] || place.category}
                        </span>
                    </div>
                </header>

                <section className="place-detail-live">
                    <div className="place-detail-section-head">
                        <div>
                            <h2>최근 현장 인증 사용자</h2>
                            <p>최근 3시간 내 이 장소에서 인증한 사용자예요.</p>
                        </div>
                    </div>

                    {recentVerifiedUsers.length === 0 ? (
                        <div className="place-detail-live-empty">
                            최근 현장 인증 사용자가 없습니다.
                        </div>
                    ) : (
                        <div className="place-detail-people">
                            {recentVerifiedUsers.map((post) => (
                                <Link
                                    key={post.author._id}
                                    href={`/profile/${post.author._id}`}
                                    className="place-detail-person"
                                >
                                    <div className="place-detail-avatar">
                                        {post.author?.name?.[0] || '?'}
                                    </div>

                                    <span>
                                        {post.author?.name || '사용자'}
                                    </span>

                                    <small>
                                        {formatRelativeTime(post.createdAt)}
                                    </small>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                <section className="place-detail-history">
                    <div className="place-detail-section-head">
                        <div>
                            <h2>최근 현장 기록</h2>
                            <p>이 장소의 최근 상태 변화를 확인해보세요.</p>
                        </div>
                    </div>

                    {historyItems.length === 0 ? (
                        <div className="place-detail-history-empty">
                            아직 쌓인 현장 기록이 없습니다.
                        </div>
                    ) : (
                        <div className="place-detail-history-list">
                            {historyItems.map((post, index) => (
                                <div
                                    key={post._id}
                                    className="place-detail-history-item"
                                >
                                    <div className="place-detail-history-line">
                                        <span
                                            className={`place-detail-history-dot ${post.status}`}
                                        />

                                        {index < historyItems.length - 1 && (
                                            <span className="place-detail-history-rail" />
                                        )}
                                    </div>

                                    <div className="place-detail-history-content">
                                        <span className={`now-status ${post.status}`}>
                                            {STATUS_LABEL[post.status] || post.status}
                                        </span>

                                        <span className="place-detail-history-time">
                                            {formatRelativeTime(post.createdAt)}
                                        </span>

                                        {post.author?.name && (
                                            <span className="place-detail-history-author">
                                                {post.author.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="place-detail-feed">
                    {items.length === 0 && (
                        <div className="place-detail-empty">
                            아직 등록된 현장 정보가 없습니다.
                        </div>
                    )}

                    {items.map((post) => (
                        <article
                            key={post._id}
                            className="place-detail-post"
                        >
                            <header className="place-detail-post-head">
                                <div className="place-detail-author">
                                    <div className="place-detail-author-avatar">
                                        {post.author?.name?.[0] || '?'}
                                    </div>

                                    <div className="place-detail-author-info">
                                        <div className="place-detail-author-line">
                                            <strong>
                                                {post.author?.name || '알 수 없음'}
                                            </strong>

                                            <span>
                                                · {post.visitVerified ? '현장' : 'NOW'}
                                            </span>
                                        </div>

                                        <small>
                                            {formatRelativeTime(post.createdAt)}
                                        </small>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="place-detail-more"
                                    aria-label="더보기"
                                >
                                    ···
                                </button>
                            </header>

                            <p className="place-detail-post-content">
                                {post.content}
                            </p>

                            {post.imageUrl && (
                                <div className="place-detail-post-image">
                                    <img
                                        src={`${process.env.NEXT_PUBLIC_API_URL}${post.imageUrl}`}
                                        alt={`${place.name} 현장 사진`}
                                    />
                                </div>
                            )}

                            <footer className="place-detail-post-footer">
                                <div className="place-detail-post-actions">
                                    <span className="place-detail-action active">
                                        <svg viewBox="0 0 24 24" aria-hidden="true">
                                            <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/>
                                            <path d="M5 20a7 7 0 0 1 14 0"/>
                                        </svg>
                                        현장에 있어요
                                    </span>

                                    <Link
                                        href={`/posts/${post._id}`}
                                        className="place-detail-action"
                                    >
                                        <svg viewBox="0 0 24 24" aria-hidden="true">
                                            <path d="M21 11.5a8.5 8.5 0 0 1-9 8.5 9.6 9.6 0 0 1-3.8-.8L3 21l1.7-4.5A8.1 8.1 0 0 1 3 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5Z"/>
                                        </svg>

                                        댓글 {post.commentCount || 0}
                                    </Link>
                                </div>

                                <button
                                    type="button"
                                    className="place-detail-bookmark"
                                    aria-label="북마크"
                                >
                                    <svg viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M6 3h12v18l-6-4-6 4V3Z"/>
                                    </svg>
                                </button>
                            </footer>
                        </article>
                    ))}
                </section>
            </section>
        </main>
    );
}