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

    return (
        <main>
            <h1>{place.name}</h1>

            <p>{place.category}</p>
            <p>{place.address}</p>
            <Link href={`/now/write?placeId=${place._id}`}>
                이 장소 NOW 작성
            </Link>

            <hr />

            <h2>최근 NOW</h2>

            {items.length === 0 && (
                <p>아직 등록된 NOW 정보가 없습니다.</p>
            )}

            {items.map((post) => (
                <article key={post._id}>
                    <strong>
                        {STATUS_LABEL[post.status] || post.status}
                    </strong>

                    <p>{post.content}</p>

                    <small>
                        {post.author?.name || '알 수 없음'}
                    </small>
                </article>
            ))}
        </main>
    );
}