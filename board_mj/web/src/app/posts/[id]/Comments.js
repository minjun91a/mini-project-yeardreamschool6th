'use client'

import {useEffect, useState} from "react";
import {apiFetch} from "@/lib/api";
import {useRouter} from "next/navigation";

export default function Comments({postId}) {
    const [items, setItems] = useState([]);
    const [content, setContent] = useState('');
    const [me, setMe] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function load() {
        try {
            const data = await apiFetch(`/api/posts/${postId}/comments`);
            setItems(data.items);
        } catch (e) {
            setError(e.message);
        }
    }

    useEffect(() => {
        const raw = localStorage.getItem('user');
        if (raw) setMe(JSON.parse(raw));
        load();
    }, [postId]);

    async function handleSubmit() {
        if (!content.trim()) return;

        setLoading(true);
        setError('');
        try {
            await apiFetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                body: JSON.stringify({content}),
            });

            setContent('');
            await load();
            router.refresh();
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(commentId) {
        if (!confirm('댓글을 삭제할까요?')) return;

        try {
            await apiFetch(`/api/comments/${commentId}`, {method: 'DELETE'});

            setContent('');
            await load();
            router.refresh();
        } catch (e) {
            alert(e.message);
        }
    }

    return (
        <section style={{marginTop: 32}}>
            <h2>댓글 {items.length}</h2>

            {error && <p style={{color: 'red'}}>{error}</p>}

            {me ? (
                <div>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="댓글을 입력하세요"
                        rows={3}
                    />
                    <button onClick={handleSubmit} disabled={loading}>
                        {loading ? '등록 중...' : '등록'}
                    </button>
                </div>
            ) : (
                <p>댓글을 쓰려면 로그인하세요.</p>
            )}

            <ul>
                {items.map((c) => (
                    <li key={c._id}>
                        <strong>{c.author?.name ?? '알 수 없음'}</strong>{' '}
                        {c.content}{' '}
                        {me && me._id === c.author?._id && (
                            <button onClick={() => handleDelete(c._id)}>삭제</button>
                        )}
                    </li>
                ))}
            </ul>
        </section>
    );
}