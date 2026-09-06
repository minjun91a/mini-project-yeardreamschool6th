'use client'

import {useRouter} from "next/navigation";
import {useEffect, useState} from "react";
import {apiFetch} from "@/lib/api";

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

export default function NotificationsPage() {
    const router = useRouter();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadNotifications() {
            try {
                const data = await apiFetch('/api/notifications');

                setItems(data.items);
            } catch (err) {
                if (err.status === 401) {
                    router.push('/login');
                    return;
                }

                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadNotifications();
    }, [router]);

    async function handleNotificationClick(item) {
        try {
            if (!item.isRead) {
                await apiFetch(`/api/notifications/${item._id}/read`, {
                    method: 'PATCH',
                });
            }

            if (item.place?._id) {
                router.push(`/places/${item.place._id}`);
            }
        } catch (err) {
            setError(err.message);
        }
    }

    if (loading) {
        return (
            <main className="container">
                <p>알림을 불러오는 중...</p>
            </main>
        );
    }

    if (error) {
        return (
            <main className="container">
                <p>{error}</p>
            </main>
        );
    }

    return (
        <main className="notification-page">
            <div className="notification-header">
                <h1>알림</h1>
                <p>팔로우한 장소의 새로운 NOW를 확인해보세요.</p>
            </div>

            {items.length === 0 ? (
                <div className="notification-empty">
                    아직 알림이 없습니다.
                </div>
            ) : (
                <section className="notification-list">
                    {items.map((item) => (
                        <article
                            key={item._id}
                            className={`notification-card ${item.isRead ? 'read' : 'unread'}`}
                            onClick={() => handleNotificationClick(item)}
                        >
                            <div className="notification-card-top">
                                <div>
                                    <strong className="notification-place">
                                        {item.place?.name || '장소 정보 없음'}
                                    </strong>

                                    {!item.isRead && (
                                        <span className="notification-new">
                                        NEW
                                    </span>
                                    )}
                                </div>

                                <small className="notification-time">
                                    {formatRelativeTime(item.createdAt)}
                                </small>
                            </div>

                            <p className="notification-message">
                                팔로우한 장소에 새로운 NOW가 등록됐습니다.
                            </p>

                            {item.post?.content && (
                                <p className="notification-content">
                                    {item.post.content}
                                </p>
                            )}
                        </article>
                    ))}
                </section>
            )}
        </main>
    );
}