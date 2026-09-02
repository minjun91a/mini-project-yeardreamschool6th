'use client'

import {useRouter, useSearchParams} from "next/navigation";
import {useEffect, useState} from "react";
import {apiFetch} from "@/lib/api";

const STATUS_OPTIONS = [
    {value: 'quiet', label: '🟢 여유'},
    {value: 'normal', label: '🟡 보통'},
    {value: 'busy', label: '🔴 혼잡'}
];

export default function NowWritePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialPlaceId = searchParams.get('placeId');

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

                if (initialPlaceId) {
                    const exists = data.places.some(
                        (place) => place._id === initialPlaceId
                    );

                    if (exists) {
                        setPlaceId(initialPlaceId);
                    }
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadPlaces();
    }, [initialPlaceId]);

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
        <main className="now-write-page">
            <h1 className="now-write-title">NOW 작성</h1>

            {error && (
                <p>{error}</p>
            )}

            <form onSubmit={handleSubmit}>
                <div className="now-write-field">
                    <label
                        htmlFor="place"
                        className="now-write-label"
                    >
                        장소
                    </label>

                    <select
                        id="place"
                        className="now-write-select"
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
                
                <div className="now-write-field">
                    <p className="now-write-label">현재 상태</p>

                    <div className="now-status-option">
                        {STATUS_OPTIONS.map((option) => (
                            <label
                                key={option.value}
                                className="now-status-option"
                            >
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
                </div>

                <div className="now-write-field">
                    <label
                        htmlFor="content"
                        className="now-write-label"
                    >
                        현장 한마디
                    </label>

                    <textarea
                        id="content"
                        className="now-write-textarea"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="지금 상황을 알려주세요."
                        maxLength={1000}
                    />
                </div>

                <button
                    type="submit"
                    className="now-write-submit"
                    disabled={submitting}
                >
                    {submitting ? '등록 중...' : 'NOW 등록'}
                </button>
            </form>
        </main>
    );
}