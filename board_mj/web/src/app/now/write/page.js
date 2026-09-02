'use client'

import {useRouter} from "next/navigation";
import {useEffect, useState} from "react";
import {apiFetch} from "@/lib/api";

const STATUS_OPTIONS = [
    {value: 'quiet', label: '🟢 여유'},
    {value: 'normal', label: '🟡 보통'},
    {value: 'busy', label: '🔴 혼잡'}
];

export default function NowWritePage() {
    const router = useRouter();

    const [places, setPlaces] = useState([]);
    const [placeId, setPlaceId] = useState('');
    const [status, setStatus] = useState('');
    const [content, setContent] = useState('');

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadPlaces = async () => {
            try {
                const data = await apiFetch('/api/places');
                setPlaces(data.places);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadPlaces();
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError('');

        if (!placeId) {
            setError('장소를 선택해주세요.');
            return;
        }

        if (!status) {
            setError('현재 상태를 선택해주세요.');
            return;
        }

        if (!content.trim()) {
            setError('내용을 입력해주세요.');
            return;
        }

        try {
            setSubmitting(true);

            await apiFetch('/api/posts', {
                method: 'POST',
                body: JSON.stringify({
                    kind: 'now',
                    placeId,
                    status,
                    content
                })
            });

            router.push('/now');
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main>
            <h1>NOW 작성</h1>

            {error && (
                <p>{error}</p>
            )}

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="place">장소</label>

                    <select
                        id="place"
                        value={placeId}
                        onChange={(e) => setPlaceId(e.target.value)}
                        disabled={loading}
                    >
                        <option value="">
                            {loading ? '장소 불러오는 중...' : '장소를 선택해주세요.'}
                        </option>

                        {places.map((place) => (
                            <option
                                key={place._id}
                                value={place._id}
                            >
                                {place.name}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div>
                    <p>현재 상태</p>

                    {STATUS_OPTIONS.map((option) => (
                        <label key={option.value}>
                            <input
                                type="radio"
                                name="status"
                                value={option.value}
                                checked={status === option.value}
                                onChange={(e) => setStatus(e.target.value)}
                            />

                            {option.label}
                        </label>
                    ))}
                </div>

                <div>
                    <label htmlFor="content">현장 한마디</label>

                    <textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="지금 상황을 알려주세요."
                        maxLength={1000}
                    />
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                >
                    {submitting ? '등록 중...' : 'NOW 등록'}
                </button>
            </form>
        </main>
    );
}