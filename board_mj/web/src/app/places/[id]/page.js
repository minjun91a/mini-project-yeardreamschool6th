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

    const latestNow = items.length > 0 ? items[0] : null;

    return (
        <main className="place-page">
            <div className="place-header">
                <div>
                    <h1 className="place-title">{place.name}</h1>

                    <p className="place-category">{CATEGORY_LABEL[place.category] || place.category}</p>
                    <p className="place-address">{place.address}</p>
                </div>

                <Link href={`/now/write?placeId=${place._id}`} className="place-now-button">
                    이 장소 NOW 작성
                </Link>
            </div>

            <section className="place-current-section">
                <h2 className="place-section-title">현재 상태</h2>

                {latestNow ? (
                    <div className="place-current-card">
                        <div className="place-current-status">
                            <strong className={`now-status ${latestNow.status}`}>
                                {STATUS_LABEL[latestNow.status] || latestNow.status}
                            </strong>

                            <span className="place-current-time">
                                최근 업데이트 {formatRelativeTime(latestNow.createdAt)}
                            </span>
                        </div>

                        <p className="place-current-content">
                            {latestNow.content}
                        </p>
                    </div>
                ) : (
                    <p className="place-empty">아직 등록된 NOW 정보가 없습니다.</p>
                )}
            </section>

            <hr/>

            <section className="place-now-section">
                <h2 className="place-section-title">최근 NOW</h2>

                {items.length === 0 && (
                    <p>아직 등록된 NOW 정보가 없습니다.</p>
                )}

                {items.map((post) => (
                    <article key={post._id} className="place-now-card">
                        <div className="place-now-card-header">
                            <strong className={`now-status ${post.status}`}>
                                {STATUS_LABEL[post.status] || post.status}
                            </strong>

                            <span className="place-now-time">
                                {formatRelativeTime(post.createdAt)}
                            </span>
                        </div>

                        <p className="place-now-content">{post.content}</p>

                        <footer className="place-now-footer">
                            {post.author?.name || '알 수 없음'}
                        </footer>
                    </article>
                ))}
            </section>
        </main>
    );
}