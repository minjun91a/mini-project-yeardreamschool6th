'use client'

import {useParams, useRouter} from "next/navigation";
import {useEffect, useState} from "react";
import {apiFetch} from "@/lib/api";

export default function EditPost() {
    const {id} = useParams();
    const router = useRouter();

    const [error, setError] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        apiFetch(`/api/posts/${id}`)
            .then((data) => {
                setTitle(data.post.title);
                setContent(data.post.content);
                setReady(true);
            })
            .catch((e) => setError(e.message));
    }, [id]);

    async function handleSubmit() {
        setError('');
        setLoading(true);

        try {
            await apiFetch(`/api/posts/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({title, content}),
            });

            router.push(`/posts/${id}`);
            router.refresh();
        } catch (e) {
            setError(e.message);
            setLoading(false);
        }
    }

    if (!ready) return <main style={{padding: 24}}>불러오는 중...</main>;

    return (
        <main style={{padding: 24, maxWidth: 800, margin: '0 auto'}}>
            <h1>글 수정</h1>

            <div>
                <input value={title} onChange={(e) => setTitle(e.target.value)}/>
            </div>

            <div>
                <textarea value={content} onChange={(e) => setContent(e.target.value)}/>
            </div>

            {error && <p style={{color: 'red'}}>{error}</p>}

            <button onClick={handleSubmit} disabled={loading}>
                {loading ? '저장 중...' : '수정'}
            </button>
        </main>
    );
}