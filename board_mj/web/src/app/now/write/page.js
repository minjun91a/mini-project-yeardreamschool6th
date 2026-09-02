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

    const [placeId, setPlaceId] = useState('');
    const [placeQuery, setPlaceQuery] = useState('');
    const [placeResults, setPlaceResults] = useState([]);
    const [selectedPlace, setSelectedPlace] = useState(null);

    const [status, setStatus] = useState('');
    const [content, setContent] = useState('');

    const [loading, setLoading] = useState(true);
    const [searchingPlaces, setSearchingPlaces] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadInitialPlace = async () => {
            try {
                if (!initialPlaceId) {
                    return;
                }

                const data = await apiFetch(
                    `/api/places/${initialPlaceId}`
                );

                const place = data.place;

                setPlaceId(place._id);
                setSelectedPlace(place);
                setPlaceQuery(place.name);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (initialPlaceId) {
            loadInitialPlace();
        } else {
            setLoading(false);
        }
    }, [initialPlaceId]);

    const searchPlaces = async (query) => {
        setError('');

        if (!query.trim()) {
            setPlaceResults([]);
            return;
        }

        try {
            setSearchingPlaces(true);

            const data = await apiFetch(
                `/api/places?q=${encodeURIComponent(query)}&limit=10`
            );

            setPlaceResults(data.places || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setSearchingPlaces(false);
        }
    };

    useEffect(() => {
        if (selectedPlace) {
            return;
        }

        if (!placeQuery.trim()) {
            setPlaceResults([]);
        }

        const timer = setTimeout(() => {
            searchPlaces(placeQuery);
        }, 400);

        return () => {
            clearTimeout(timer);
        };
    }, [placeQuery, selectedPlace]);

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
                        htmlFor="place-search"
                        className="now-write-label"
                    >
                        장소
                    </label>

                    <input
                        id="place-search"
                        className="now-write-search"
                        type="text"
                        value={placeQuery}
                        onChange={(e) => {
                            const value = e.target.value;

                            setPlaceQuery(value);

                            setSelectedPlace(null);
                            setPlaceId('');
                        }}

                        placeholder="장소 이름이나 주소를 검색하세요"
                        disabled={loading}
                    />

                    {searchingPlaces && (
                        <p>장소 검색 중...</p>
                    )}

                    {placeResults.length > 0 && (
                        <div className="place-search-results">
                            {placeResults.map((place) => (
                                <button
                                    key={place._id}
                                    type="button"
                                    className="place-search-item"
                                    onClick={() => {
                                        setSelectedPlace(place);
                                        setPlaceId(place._id);

                                        setPlaceQuery(place.name);
                                        setPlaceResults([]);
                                    }}
                                >
                                    <strong>{place.name}</strong>

                                    <span>
                                        {place.address}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {selectedPlace && (
                        <div className="selected-place">
                            <strong className="selected-place-name">
                                {selectedPlace.name}
                            </strong>

                            <span className="selected-place-address">
                                {selectedPlace.address}
                            </span>
                        </div>
                    )}
                </div>

                <div className="now-write-field">
                    <p className="now-write-label">현재 상태</p>

                    <div className="now-status-options">
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