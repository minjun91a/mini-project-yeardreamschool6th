'use client'

import {useEffect, useState} from "react";
import {apiFetch} from "@/lib/api";
import Link from "next/link";

const STATUS_LABEL = {
    quiet: '🟢 여유',
    normal: '🟡 보통',
    busy: '🔴 혼잡'
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

    if (loading) {
        return <main>불러오는 중...</main>;
    }

    if (error) {
        return <main>{error}</main>;
    }

    return (
        <main className="now-page">
            <header>
                <h1 className="now-title">NOW</h1>
                <Link href="/now/write" className="now-write-button">
                    NOW 작성
                </Link>
            </header>

            {items.length === 0 && (
                <p>아직 등록된 NOW 정보가 없습니다.</p>
            )}
            <section className="now-feed">
                {items.map((post) => {
                    const freshness = getFreshness(post.createdAt);

                    return (
                        <article key={post._id} className="now-card">

                            <div className="now-place-area">
                                {post.place ? (
                                    <Link href={`/places/${post.place._id}`} className="now-place-link">
                                        <h2 className="now-place-name">{post.place.name}</h2>
                                    </Link>
                                ) : (
                                    <h2 className="now-place-name">장소 정보 없음</h2>
                                )}

                                {post.place?.category && (
                                    <span className="now-category">{post.place.category}</span>
                                )}

                                {post.place?.address && (
                                    <p className="now-address">{post.place.address}</p>
                                )}
                            </div>

                            <div>
                                <strong className={`now-status ${post.status}`}>
                                    {STATUS_LABEL[post.status] || post.status}
                                </strong>

                                <span className="now-freshness">
                                    {freshness.label}
                                </span>
                            </div>

                            <p className="now-content">
                                {post.content}
                            </p>

                            <footer className="now-footer">
                            <span>
                                {post.author?.name || '알 수 없음'}
                            </span>

                                <span>
                                {' · '}
                                    {formatRelativeTime(post.createdAt)}
                            </span>
                            </footer>

                        </article>
                    );
                })}
            </section>
        </main>
    );
}