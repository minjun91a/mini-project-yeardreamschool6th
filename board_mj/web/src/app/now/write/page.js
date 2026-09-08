'use client'

import {useRouter, useSearchParams} from "next/navigation";
import {Suspense, useEffect, useState} from "react";
import {apiFetch} from "@/lib/api";

const STATUS_OPTIONS = [
    {value: 'quiet', label: '🟢 여유'},
    {value: 'normal', label: '🟡 보통'},
    {value: 'busy', label: '🔴 혼잡'}
];

export default function NowWritePage() {
    return (
        <Suspense
            fallback={
                <main className="now-write-page">
                    <section className="now-write-compose">
                        <p className="now-write-search-message">
                            불러오는 중...
                        </p>
                    </section>
                </main>
            }
        >
            <NowWriteContent />
        </Suspense>
    );
}

function NowWriteContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialPlaceId = searchParams.get('placeId');

    const [placeId, setPlaceId] = useState('');
    const [placeQuery, setPlaceQuery] = useState('');
    const [placeResults, setPlaceResults] = useState([]);
    const [selectedPlace, setSelectedPlace] = useState(null);

    const [status, setStatus] = useState('');
    const [content, setContent] = useState('');

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');

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

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            setImageFile(null);
            setImagePreview('');
            return;
        }

        if (!file.type.startsWith('image/')) {
            setError('이미지 파일만 선택할 수 있습니다.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('이미지는 5MB 이하만 업로드할 수 있습니다.');
            return;
        }

        setError('');
        setImageFile(file);

        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
    }

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

            let longitude = null;
            let latitude = null;

            if (navigator.geolocation) {
                try {
                    const position = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(
                            resolve,
                            reject,
                            {
                                enableHighAccuracy: true,
                                timeout: 10000,
                                maximumAge: 60000
                            }
                        );
                    });

                    longitude = position.coords.longitude;
                    latitude = position.coords.latitude;
                } catch (locationError) {
                    console.warn('위치 정보를 가져오지 못했습니다.', locationError);
                }
            }

            const formData = new FormData();

            formData.append('kind', 'now');
            formData.append('placeId', placeId);
            formData.append('status', status);
            formData.append('content', content);

            if (longitude !== null) {
                formData.append('longitude', String(longitude));
            }

            if (latitude !== null) {
                formData.append('latitude', String(latitude));
            }

            if (imageFile) {
                formData.append('image', imageFile);
            }

            await apiFetch('/api/posts', {
                method: 'POST',
                body: formData
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
            <form
                className="now-write-compose"
                onSubmit={handleSubmit}
            >
                <header className="now-write-topbar">
                    <button
                        type="button"
                        className="now-write-cancel"
                        onClick={() => router.back()}
                    >
                        취소
                    </button>

                    <h1 className="now-write-topbar-title">
                        글 작성
                    </h1>

                    <button
                        type="submit"
                        className="now-write-next"
                        disabled={submitting}
                    >
                        {submitting ? '등록 중...' : '등록'}
                    </button>
                </header>

                {error && (
                    <p className="now-write-error">
                        {error}
                    </p>
                )}

                <section className="now-write-place-section">
                    {!selectedPlace ? (
                        <>
                            <input
                                id="place-search"
                                className="now-write-place-search"
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
                                <p className="now-write-search-message">
                                    장소 검색 중...
                                </p>
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
                                            <span>{place.address}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <button
                            type="button"
                            className="now-write-selected-place"
                            onClick={() => {
                                setSelectedPlace(null);
                                setPlaceId('');
                            }}
                        >
                        <span className="now-write-place-pin">
                            <svg
                                viewBox="0 0 24 24"
                                width="18"
                                height="18"
                                aria-hidden="true"
                            >
                                <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" />
                                <circle cx="12" cy="10" r="2.2" />
                            </svg>
                        </span>

                            <span className="now-write-place-info">
                            <strong>{selectedPlace.name}</strong>
                            <small>{selectedPlace.address}</small>
                        </span>

                            <span className="now-write-place-change">
                            변경
                        </span>
                        </button>
                    )}
                </section>

                <section className="now-write-content-section">
                    <label
                        htmlFor="content"
                        className="now-write-question"
                    >
                        지금 이 장소에서 무슨 일이
                        <br />
                        일어나고 있나요?
                    </label>

                    <textarea
                        id="content"
                        className="now-write-compose-textarea"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="지금 상황을 알려주세요."
                        maxLength={1000}
                        spellCheck={false}
                    />

                    <span className="now-write-count">
                    {content.length}/1000
                </span>
                </section>

                <section className="now-write-status-section">
                    <p className="now-write-status-title">
                        현재 상태
                    </p>

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
                </section>

                <section className="now-write-media-section">
                    <label className="now-write-image-button">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                        />

                        <span className="now-write-image-icon">
                            <svg
                                viewBox="0 0 24 24"
                                width="18"
                                height="18"
                                aria-hidden="true"
                            >
                                <rect
                                    x="3"
                                    y="4"
                                    width="18"
                                    height="16"
                                    rx="2"
                                />
                                <circle
                                    cx="15.5"
                                    cy="8.5"
                                    r="1.5"
                                />
                                <path d="M4 17l5-5 4 4 2-2 5 5" />
                            </svg>
                        </span>

                        사진 / 동영상
                    </label>

                    {imagePreview && (
                        <div className="now-write-image-preview">
                            <img
                                src={imagePreview}
                                alt="업로드할 현장 사진 미리보기"
                            />
                        </div>
                    )}
                </section>
            </form>
        </main>
    );
}
