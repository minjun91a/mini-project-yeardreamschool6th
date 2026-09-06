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
            <h1 className="now-write-title">
                지금 알려주기
            </h1>

            <p className="now-write-description">
                지금 이곳의 상황을 알려주세요.
            </p>

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
                        spellCheck={false}
                    />
                </div>

                <div className="now-write-image">
                    <label className="now-write-image-label">
                        현장 사진
                    </label>

                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                    />

                    {imagePreview && (
                        <div className="now-write-image-preview">
                            <img
                                src={imagePreview}
                                alt="업로드할 현장 사진 미리보기"
                            />
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    className="now-write-submit"
                    disabled={submitting}
                >
                    {submitting ? '등록 중...' : '등록하기'}
                </button>
            </form>
        </main>
    );
}