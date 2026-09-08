'use client';

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {useParams} from 'next/navigation';
import {apiFetch} from '@/lib/api';

const STATUS_LABEL = {
    quiet: '여유',
    normal: '보통',
    busy: '혼잡',
    unknown: '정보 부족'
};

const STATUS_TITLE = {
    quiet: '여유로워 보여요',
    normal: '보통 수준이에요',
    busy: '혼잡해 보여요',
    unknown: '아직 판단할 정보가 부족해요'
};

const TREND_LABEL = {
    rising: '혼잡도가 올라가는 중',
    falling: '혼잡도가 내려가는 중',
    stable: '비슷하게 유지 중',
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

function getItemTime(item) {
    return item.observedAt || item.createdAt;
}

function getItemDetailHref(item, placeId) {
    if (item.evidenceType === 'Post') {
        return `/posts/${item._id}`;
    }

    return `/places/${placeId}`;
}

function formatScore(score) {
    const value = Number(score);

    if (!Number.isFinite(value)) {
        return 0;
    }

    return Math.round(value * 100);
}

function getFreshnessLabel(score) {
    const percent = formatScore(score);

    if (percent >= 70) {
        return '현재성이 높아요';
    }

    if (percent >= 35) {
        return '조금 더 확인하면 좋아요';
    }

    return '새 정보가 필요해요';
}

function getConfidenceLabel(score) {
    const percent = formatScore(score);

    if (percent >= 70) {
        return '신뢰도가 높아요';
    }

    if (percent >= 35) {
        return '판단 근거가 쌓이는 중';
    }

    return '근거가 부족해요';
}

function getEvidenceTypeLabel(type) {
    if (type === 'QuickSignal') {
        return '빠른 신호';
    }

    if (type === 'PlaceUpdate') {
        return '현장 기록';
    }

    return '기존 기록';
}

export default function PlaceDetailPage() {
    const params = useParams();
    const id = params.id;

    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    const [place, setPlace] = useState(null);
    const [items, setItems] = useState([]);
    const [placeStatus, setPlaceStatus] = useState(null);
    const [placeStatusHistory, setPlaceStatusHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [confirmationLoading, setConfirmationLoading] = useState('');
    const [confirmationMessage, setConfirmationMessage] = useState('');

    useEffect(() => {
        const loadPlace = async () => {
            try {
                const [
                    placeData,
                    nowData,
                    currentStatusData,
                    statusHistoryData
                ] = await Promise.all([
                    apiFetch(`/api/places/${id}`),
                    apiFetch(`/api/places/${id}/now`),
                    apiFetch(`/api/place-statuses/current?place=${id}`),
                    apiFetch(`/api/place-statuses?place=${id}&limit=8`)
                ]);

                setPlace(currentStatusData.place || placeData.place);
                setItems(nowData.items || []);
                setPlaceStatus(currentStatusData.placeStatus);
                setPlaceStatusHistory(statusHistoryData.items || []);

                const token = localStorage.getItem('token');

                if (token) {
                    const followData = await apiFetch('/api/places/followed/me');

                    const following = followData.followedPlaces.some(
                        (followedPlace) => followedPlace._id === id
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
        return <main>불러오는 중...</main>;
    }

    if (error) {
        return <main>{error}</main>;
    }

    if (!place) {
        return <main>장소를 찾을 수 없습니다.</main>;
    }

    const latestPost = items.length > 0 ? items[0] : null;
    const recentVerifiedUsers = items
        .filter((post) => {
            if (!post.visitVerified || !post.author?._id) {
                return false;
            }

            const createdAt = new Date(getItemTime(post)).getTime();
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
        Date.now() - new Date(getItemTime(latestPost)).getTime()
        <= 6 * 60 * 60 * 1000
            ? latestPost
            : null;

    const currentStatus = placeStatus || place.currentStatus || null;
    const currentStatusValue = currentStatus?.status || 'unknown';
    const hasKnownStatus = currentStatusValue !== 'unknown';
    const freshnessPercent = formatScore(currentStatus?.freshnessScore);
    const confidencePercent = formatScore(currentStatus?.confidenceScore);

    const handleConfirmation = async (type) => {
        if ((!latestNow && !placeStatus) || confirmationLoading) {
            return;
        }

        const body = {
            placeId: id,
            type
        };

        if (placeStatus?._id) {
            body.placeStatusId = placeStatus._id;
        } else if (latestNow?.evidenceType === 'PlaceUpdate') {
            body.placeUpdateId = latestNow._id;
        }

        if (!placeStatus?._id && latestNow?.evidenceType === 'QuickSignal') {
            body.quickSignalId = latestNow._id;
        }

        try {
            setConfirmationLoading(type);
            setConfirmationMessage('');

            const data = await apiFetch('/api/confirmations', {
                method: 'POST',
                body: JSON.stringify(body)
            });

            if (data.placeStatus) {
                setPlaceStatus(data.placeStatus);
                setPlaceStatusHistory((prev) => [
                    data.placeStatus,
                    ...prev
                ].slice(0, 8));
                setPlace((prev) => {
                    if (!prev) {
                        return prev;
                    }

                    return {
                        ...prev,
                        currentStatus: {
                            status: data.placeStatus.status,
                            confidenceScore: data.placeStatus.confidenceScore,
                            freshnessScore: data.placeStatus.freshnessScore,
                            trend: data.placeStatus.trend,
                            lastSignalAt: data.placeStatus.freshestEvidenceAt,
                            freshestEvidenceAt: data.placeStatus.freshestEvidenceAt,
                            calculatedAt: data.placeStatus.calculatedAt,
                            placeStatusId: data.placeStatus._id
                        }
                    };
                });
            }

            setConfirmationMessage(
                type === 'still_valid'
                    ? '현재 정보가 아직 맞는 것으로 확인했어요.'
                    : '정보가 달라졌다고 확인에 반영했어요.'
            );
        } catch (err) {
            setConfirmationMessage(err.message);
        } finally {
            setConfirmationLoading('');
        }
    };

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
                                aria-label={
                                    isFollowing
                                        ? '관심 장소 해제'
                                        : '관심 장소 등록'
                                }
                                onClick={handleFollow}
                                disabled={followLoading}
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

                <section className={`place-detail-current ${currentStatusValue}`}>
                    <div className="place-detail-current-main">
                        <span className={`now-status ${currentStatusValue}`}>
                            {STATUS_LABEL[currentStatusValue] || currentStatusValue}
                        </span>

                        <h2>
                            {STATUS_TITLE[currentStatusValue] ||
                                '현재 상태를 계산 중이에요'}
                        </h2>

                        <p>
                            {hasKnownStatus
                                ? `${getFreshnessLabel(currentStatus?.freshnessScore)} · ${getConfidenceLabel(currentStatus?.confidenceScore)}`
                                : '최근 현장 Evidence가 부족해 현재 상태를 추정하지 못했습니다.'}
                        </p>
                    </div>

                    <div className="place-detail-current-metrics">
                        <div>
                            <strong>{freshnessPercent}%</strong>
                            <span>Freshness</span>
                        </div>

                        <div>
                            <strong>{confidencePercent}%</strong>
                            <span>Confidence</span>
                        </div>

                        <div>
                            <strong>{currentStatus?.evidenceCount || 0}</strong>
                            <span>Evidence</span>
                        </div>
                    </div>

                    <div className="place-detail-current-meta">
                        <span>
                            {TREND_LABEL[currentStatus?.trend || 'unknown'] ||
                                currentStatus?.trend}
                        </span>

                        {currentStatus?.freshestEvidenceAt && (
                            <span>
                                최신 근거 {formatRelativeTime(currentStatus.freshestEvidenceAt)}
                            </span>
                        )}
                    </div>

                    {!hasKnownStatus && (
                        <Link
                            href={`/now/write?placeId=${id}`}
                            className="place-detail-current-cta"
                        >
                            지금 알리기
                        </Link>
                    )}
                </section>

                {(latestNow || placeStatus) && (
                    <section className="place-detail-confirmation">
                        <div className="place-detail-section-head">
                            <div>
                                <h2>이 정보가 아직 맞나요?</h2>
                                <p>
                                    {placeStatus?.calculatedAt
                                        ? `${formatRelativeTime(placeStatus.calculatedAt)} 계산된 상태를 확인해주세요.`
                                        : `${formatRelativeTime(getItemTime(latestNow))} 기준 현장 정보를 확인해주세요.`}
                                </p>
                            </div>
                        </div>

                        <div className="place-detail-confirmation-actions">
                            <button
                                type="button"
                                className="place-detail-confirmation-button primary"
                                disabled={Boolean(confirmationLoading)}
                                onClick={() => handleConfirmation('still_valid')}
                            >
                                {confirmationLoading === 'still_valid'
                                    ? '확인 중...'
                                    : '지금도 맞아요'}
                            </button>

                            <button
                                type="button"
                                className="place-detail-confirmation-button"
                                disabled={Boolean(confirmationLoading)}
                                onClick={() => handleConfirmation('changed')}
                            >
                                {confirmationLoading === 'changed'
                                    ? '확인 중...'
                                    : '달라졌어요'}
                            </button>
                        </div>

                        {confirmationMessage && (
                            <p className="place-detail-confirmation-message">
                                {confirmationMessage}
                            </p>
                        )}
                    </section>
                )}

                <section className="place-detail-live">
                    <div className="place-detail-section-head">
                        <div>
                            <h2>최근 현장 인증 사용자</h2>
                            <p>최근 3시간 안에 이 장소에서 인증한 사용자예요.</p>
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
                                        {formatRelativeTime(getItemTime(post))}
                                    </small>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                <section className="place-detail-history">
                    <div className="place-detail-section-head">
                        <div>
                            <h2>상태 변화</h2>
                            <p>Core Engine이 계산한 장소 상태 이력입니다.</p>
                        </div>
                    </div>

                    {placeStatusHistory.length === 0 ? (
                        <div className="place-detail-history-empty">
                            아직 계산된 상태 이력이 없습니다.
                        </div>
                    ) : (
                        <div className="place-detail-history-list">
                            {placeStatusHistory.map((statusItem, index) => (
                                <div
                                    key={statusItem._id}
                                    className="place-detail-history-item"
                                >
                                    <div className="place-detail-history-line">
                                        <span
                                            className={`place-detail-history-dot ${statusItem.status}`}
                                        />

                                        {index < placeStatusHistory.length - 1 && (
                                            <span className="place-detail-history-rail"/>
                                        )}
                                    </div>

                                    <div className="place-detail-history-content">
                                        <span className={`now-status ${statusItem.status}`}>
                                            {STATUS_LABEL[statusItem.status] ||
                                                statusItem.status}
                                        </span>

                                        <span className="place-detail-history-time">
                                            {formatRelativeTime(statusItem.calculatedAt)}
                                        </span>

                                        <span className="place-detail-history-author">
                                            신뢰 {formatScore(statusItem.confidenceScore)}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="place-detail-feed">
                    {items.length > 0 && (
                        <div className="place-detail-feed-head">
                            <h2>현장 Evidence</h2>
                        </div>
                    )}

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
                                                {post.author?.name || '이름 없음'}
                                            </strong>

                                            <span>
                                                · {post.visitVerified
                                                    ? '현장 인증'
                                                    : getEvidenceTypeLabel(post.evidenceType)}
                                            </span>
                                        </div>

                                        <small>
                                            {formatRelativeTime(getItemTime(post))}
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

                            {post.content && (
                                <p className="place-detail-post-content">
                                    {post.content}
                                </p>
                            )}

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
                                        현장에 있었어요
                                    </span>

                                    <Link
                                        href={getItemDetailHref(post, id)}
                                        className="place-detail-action"
                                    >
                                        <svg viewBox="0 0 24 24" aria-hidden="true">
                                            <path d="M21 11.5a8.5 8.5 0 0 1-9 8.5 9.6 9.6 0 0 1-3.8-.8L3 21l1.7-4.5A8.1 8.1 0 0 1 3 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5Z"/>
                                        </svg>

                                        {post.evidenceType === 'Post'
                                            ? `댓글 ${post.commentCount || 0}`
                                            : '현장 기록'}
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
