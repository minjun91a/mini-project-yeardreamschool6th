'use client'

import {useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api";

export default function NewPost() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit() {
        setError('');
        setLoading(true);

        try {
            const data = await apiFetch('/api/posts', {
                method: 'POST',
                body: JSON.stringify({title, content}),
            });

            router.push(`/posts/${data.post._id}`);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="post-write-page">
            <h1 className="post-write-title">
                글쓰기
            </h1>

            <div className="post-write-field">
                <input
                    className="post-write-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="제목"
                />
            </div>

            <div className="post-write-field">
            <textarea
                className="post-write-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="내용"
                rows={10}
            />
            </div>

            {error && (
                <p className="error">
                    {error}
                </p>
            )}

            <button
                className="post-write-submit"
                onClick={handleSubmit}
                disabled={loading}
            >
                {loading ? '저장 중...' : '작성'}
            </button>
        </main>
    );
}