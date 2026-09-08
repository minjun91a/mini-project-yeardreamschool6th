'use client';

import {useEffect, useState} from "react";
import {
    MapContainer,
    TileLayer,
    Popup,
    CircleMarker,
    useMap,
} from 'react-leaflet';

import 'leaflet/dist/leaflet.css';

function MapCenter({position}) {
    const map = useMap();

    useEffect(() => {
        if (!position) {
            return;
        }

        map.setView(
            [position.latitude, position.longitude],
            15
        );
    }, [position, map]);

    return null;
}

function PlacesCenter({places}) {
    const map = useMap();

    useEffect(() => {
        if (places.length === 0) {
            return;
        }

        const position = getPlacePosition(places[0]);

        if (!position) {
            return;
        }

        map.setView(position, 15);
    }, [places, map]);

    return null;
}

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

function getStatusColor(status) {
    if (status === 'quiet') {
        return '#3C7135';
    }

    if (status === 'normal') {
        return '#8C6B00';
    }

    if (status === 'busy') {
        return '#A34038';
    }

    return '#A4A49B';
}

function getMarkerRadius(place, selectedPlace) {
    if (selectedPlace?._id === place._id) {
        return 12;
    }

    return place.currentStatus?.status === 'unknown' ||
        !place.currentStatus?.status
        ? 7
        : 10;
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
                지도 불러오는 중...
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

            <PlacesCenter places={places} />

            {userLocation && (
                <>
                    <MapCenter position={userLocation}/>

                    <CircleMarker
                        center={[
                            userLocation.latitude,
                            userLocation.longitude,
                        ]}
                        radius={9}
                        pathOptions={{
                            color: '#FFFFFF',
                            fillColor: '#148F3D',
                            fillOpacity: 1,
                            weight: 3,
                        }}
                    >
                        <Popup>현재 위치</Popup>
                    </CircleMarker>
                </>
            )}

            {places.map((place) => {
                const position = getPlacePosition(place);

                if (!position) {
                    return null;
                }

                return (
                    <CircleMarker
                        key={place._id}
                        center={position}
                        radius={getMarkerRadius(place, selectedPlace)}
                        pathOptions={{
                            color:
                                selectedPlace?._id === place._id
                                    ? '#1F1F1F'
                                    : '#FFFFFF',
                            fillColor:
                                selectedPlace?._id === place._id
                                    ? '#C6F047'
                                    : getStatusColor(
                                        place.currentStatus?.status
                                    ),
                            fillOpacity: place.currentStatus?.status &&
                                place.currentStatus.status !== 'unknown'
                                ? 1
                                : 0.45,
                            weight: 3,
                        }}
                        eventHandlers={{
                            click: () => onSelectPlace(place),
                        }}
                    />
                );
            })}
        </MapContainer>
    );
}
