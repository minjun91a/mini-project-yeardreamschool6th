'use client';

import {useEffect, useState} from 'react';
import {
    MapContainer,
    TileLayer,
    Popup,
    Marker,
    useMap,
} from 'react-leaflet';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';

function getPlacePosition(place) {
    const coordinates = place?.location?.coordinates;

    if (!Array.isArray(coordinates) || coordinates.length < 2) {
        return null;
    }

    const [longitude, latitude] = coordinates;

    if (
        !Number.isFinite(longitude) ||
        !Number.isFinite(latitude)
    ) {
        return null;
    }

    return [latitude, longitude];
}

function MapViewport({places, userLocation, selectedPlace}) {
    const map = useMap();

    useEffect(() => {
        const selectedPosition = getPlacePosition(selectedPlace);

        if (selectedPosition) {
            map.setView(selectedPosition, 16);
            return;
        }

        const positions = places
            .map(getPlacePosition)
            .filter(Boolean);

        if (userLocation) {
            positions.unshift([
                userLocation.latitude,
                userLocation.longitude
            ]);
        }

        if (positions.length === 0) {
            return;
        }

        if (positions.length === 1) {
            map.setView(positions[0], 15);
            return;
        }

        map.fitBounds(positions, {
            padding: [36, 36],
            maxZoom: 15
        });
    }, [places, userLocation, selectedPlace, map]);

    return null;
}

function getPinStatus(place) {
    return place.currentStatus?.status || 'unknown';
}

function createPlaceIcon({place, selectedPlace}) {
    const status = getPinStatus(place);
    const selected = selectedPlace?._id === place._id;
    const external = place.isExternalResult;

    return L.divIcon({
        className: [
            'places-map-pin',
            `status-${status}`,
            selected ? 'selected' : '',
            external ? 'external' : ''
        ].filter(Boolean).join(' '),
        html: '<span></span>',
        iconSize: selected ? [34, 42] : [28, 36],
        iconAnchor: selected ? [17, 40] : [14, 34],
        popupAnchor: [0, -34]
    });
}

function createUserLocationIcon() {
    return L.divIcon({
        className: 'places-map-pin user-location',
        html: '<span></span>',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -16]
    });
}

function MapResizeFix() {
    const map = useMap();

    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 100);

        return () => clearTimeout(timer);
    }, [map]);

    return null;
}

export default function PlacesMap({
    places,
    userLocation,
    selectedPlace,
    onSelectPlace,
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="places-map-loading">
                지도를 불러오는 중...
            </div>
        );
    }

    return (
        <MapContainer
            center={[37.5445, 127.0560]}
            zoom={14}
            className="places-leaflet-map"
            scrollWheelZoom
        >
            <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapResizeFix/>

            <MapViewport
                places={places}
                userLocation={userLocation}
                selectedPlace={selectedPlace}
            />

            {userLocation && (
                <Marker
                    position={[
                        userLocation.latitude,
                        userLocation.longitude,
                    ]}
                    icon={createUserLocationIcon()}
                    zIndexOffset={1000}
                >
                    <Popup>현재 위치</Popup>
                </Marker>
            )}

            {places.map((place) => {
                const position = getPlacePosition(place);

                if (!position) {
                    return null;
                }

                return (
                    <Marker
                        key={place._id}
                        position={position}
                        icon={createPlaceIcon({place, selectedPlace})}
                        zIndexOffset={
                            selectedPlace?._id === place._id ? 500 : 0
                        }
                        eventHandlers={{
                            click: () => onSelectPlace(place),
                        }}
                    >
                        <Popup>{place.name}</Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
