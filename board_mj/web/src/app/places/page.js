'use client';

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {apiFetch} from '@/lib/api';
import dynamic from "next/dynamic";

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

const CATEGORY_FILTERS = [
    {value: 'all', label: '전체'},
    {value: 'cafe', label: '카페'},
    {value: 'restaurant', label: '맛집'},
    {value: 'bar', label: '술집'},
    {value: 'popup', label: '팝업'},
    {value: 'shopping', label: '쇼핑'},
    {value: 'park', label: '공원'},
    {value: 'culture', label: '문화'},
];

const PlacesMap = dynamic(
    () => import('./PlacesMap'),
    {
        ssr: false,
    }
);

export default function PlacesPage() {
    const [query, setQuery] = useState('');
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [error, setError] = useState('');
    const [userLocation, setUserLocation] = useState(null);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        if (!query.trim()) {
            setPlaces([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setLoading(true);
                setUserLocation(null);

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

                    setUserLocation({
                        latitude,
                        longitude,
                    });

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

    const filteredPlaces =
        selectedCategory === 'all'
            ? places
            : places.filter(
                (place) => place.category === selectedCategory
            );

    return (
        <main className="places-page">

            <section className="places-map-shell">
                <div className="places-search-row">
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

                    <button
                        type="button"
                        className="places-filter-button"
                        aria-label="필터"
                    >
                        ☷
                    </button>
                </div>

                <div className="places-category-row">
                    {CATEGORY_FILTERS.map((category) => (
                        <button
                            key={category.value}
                            type="button"
                            className={
                                selectedCategory === category.value
                                    ? 'active'
                                    : ''
                            }
                            onClick={() => {
                                setSelectedCategory(category.value);
                                setSelectedPlace(null);
                            }}
                        >
                            {category.label}
                        </button>
                    ))}
                </div>

                <div className="places-map">
                    <PlacesMap
                        places={filteredPlaces}
                        userLocation={userLocation}
                        selectedPlace={selectedPlace}
                        onSelectPlace={setSelectedPlace}
                    />

                    {selectedPlace && (
                        <Link
                            href={`/places/${selectedPlace._id}`}
                            className="places-map-card"
                        >
                            <div className="places-map-card-main">
                                <div className="places-map-card-title-row">
                                    <strong>{selectedPlace.name}</strong>

                                    {selectedPlace.distance != null && (
                                        <span className="places-map-card-distance">
                                            {selectedPlace.distance < 1000
                                                ? `${Math.round(selectedPlace.distance)}m`
                                                : `${(selectedPlace.distance / 1000).toFixed(1)}km`}
                                        </span>
                                    )}
                                </div>

                                <div className="places-map-card-tags">
                                    <span className="places-map-card-category">
                                        {CATEGORY_LABEL[selectedPlace.category] ||
                                            selectedPlace.category}
                                    </span>

                                    <span className="places-map-card-status">
                                        지금 정보 보기
                                    </span>
                                </div>

                                <p>{selectedPlace.address}</p>

                                <span className="places-map-card-link">
                                    장소 상세 보기 →
                                </span>
                            </div>
                        </Link>
                    )}

                    <button
                        type="button"
                        className="places-location-button"
                        onClick={loadNearbyPlaces}
                        disabled={locationLoading}
                    >
                        {locationLoading ? (
                            <span>...</span>
                        ) : (
                            <svg
                                viewBox="0 0 24 24"
                                width="19"
                                height="19"
                                aria-hidden="true"
                            >
                                <circle cx="12" cy="12" r="4"/>
                                <path d="M12 2v3"/>
                                <path d="M12 19v3"/>
                                <path d="M2 12h3"/>
                                <path d="M19 12h3"/>
                            </svg>
                        )}
                    </button>
                </div>
            </section>

            {error && (
                <p className="places-error">
                    {error}
                </p>
            )}

            {loading && (
                <p className="places-map-state">
                    장소 찾는 중...
                </p>
            )}
        </main>
    );
}