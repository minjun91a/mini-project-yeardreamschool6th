'use client'

import {useEffect, useState} from "react";
import {apiFetch} from "@/lib/api";

const STATUS_LABEL = {
    quiet: '🟢 여유',
    normal: '🟡 보통',
    busy: '🔴 혼잡'
};

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
        <main>
            <h1>NOW</h1>

            {items.length === 0 && (
                <p>아직 등록된 NOW 정보가 없습니다.</p>
            )}

            {items.map((post) => (
                <article key={post._id}>
                    <h2>{post.place?.name || '장소 정보 없음'}</h2>

                    <p>
                        {STATUS_LABEL[post.status] || post.status}
                    </p>

                    <p>{post.content}</p>

                    <p>
                        작성자: {post.author?.name || '알 수 없음'}
                    </p>
                </article>
            ))}
        </main>
    );
}