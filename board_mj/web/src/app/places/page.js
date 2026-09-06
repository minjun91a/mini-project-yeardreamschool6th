'use client';

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {apiFetch} from '@/lib/api';

const CATEGORY_LABEL = {
    cafe: '카페',
    restaurant: '맛집',
    bar: '술집',
    popup: '팝업',
    shopping: '쇼핑',
    park: '공원',
    culture: '문화',
    etc: '기타',
};

export default function PlacesPage() {
    const [query, setQuery] = useState('');
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!query.trim()) {
            setPlaces([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setLoading(true);

                const data = await apiFetch(
                    `/api/places?q=${encodeURIComponent(query.trim())}`
                );

                setPlaces(data.places || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [query]);

    function loadNearbyPlaces() {
        if (!navigator.geolocation) {
            setError('현재 브라우저에서는 위치 정보를 사용할 수 없습니다.');
            return;
        }

        setLocationLoading(true);
        setError('');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const {latitude, longitude} = position.coords;

                    const data = await apiFetch(
                        `/api/places/nearby?longitude=${longitude}&latitude=${latitude}&maxDistance=3000`
                    );

                    setPlaces(data.places || []);
                } catch (err) {
                    setError(err.message);
                } finally {
                    setLocationLoading(false);
                }
            },
            () => {
                setError('현재 위치를 가져오지 못했습니다.');
                setLocationLoading(false);
            }
        );
    }

    return (
        <main className="places-page">
            <header className="places-app-header">
                <h1>
                    장소 <span>보기</span>
                </h1>

                <p>지도와 검색으로 주변의 지금을 확인하세요.</p>
            </header>

            <section className="places-map-shell">
                <div className="places-search">
                    <span className="places-search-icon">⌕</span>

                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="장소, 지역 검색"
                    />

                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery('')}
                            aria-label="검색어 지우기"
                        >
                            ×
                        </button>
                    )}
                </div>

                <div className="places-category-row">
                    <button className="active">전체</button>
                    <button>카페</button>
                    <button>맛집</button>
                    <button>편의점</button>
                    <button>주차</button>
                    <button>문화</button>
                </div>

                <div className="places-map">
                    <div className="places-map-placeholder">
                        <span className="places-map-pin">●</span>

                        <strong>지도 연결 예정</strong>

                        <p>
                            다음 단계에서 실제 지도와
                            <br />
                            장소 마커를 연결합니다.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="places-location-button"
                        onClick={loadNearbyPlaces}
                        disabled={locationLoading}
                    >
                        {locationLoading ? '...' : '◎'}
                    </button>
                </div>
            </section>

            {error && (
                <p className="places-error">
                    {error}
                </p>
            )}

            <section className="places-results">
                {loading && (
                    <p className="places-state">
                        검색 중...
                    </p>
                )}

                {!loading && places.length > 0 && (
                    <>
                        <h2>주변 장소</h2>

                        {places.map((place) => (
                            <Link
                                href={`/places/${place._id}`}
                                key={place._id}
                                className="places-result-card"
                            >
                                <div className="places-result-main">
                                    <strong>{place.name}</strong>

                                    <span>
                                        {CATEGORY_LABEL[place.category] ||
                                            place.category}
                                    </span>

                                    <p>{place.address}</p>
                                </div>

                                {place.distance != null && (
                                    <strong className="places-distance">
                                        {place.distance < 1000
                                            ? `${Math.round(place.distance)}m`
                                            : `${(place.distance / 1000).toFixed(1)}km`}
                                    </strong>
                                )}
                            </Link>
                        ))}
                    </>
                )}
            </section>
        </main>
    );
}