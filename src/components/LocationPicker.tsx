'use client';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState, useEffect } from 'react';

const pickerIcon = new L.DivIcon({
    className: 'location-picker-marker',
    html: `<div style="width: 32px; height: 32px; background: #FF5A00; border: 3px solid white; border-radius: 50%; box-shadow: 0 4px 10px rgba(255,90,0,0.5); display: flex; alignItems: center; justifyContent: center; color: white; font-weight: bold; position: relative;">
            <div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #FF5A00;"></div>
            📍
          </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32]
});

interface LocationPickerProps {
    onLocationSelect: (lat: number, lng: number) => void;
    initialLocation?: [number, number] | null;
}

function MapEvents({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        }
    });
    return null;
}

export default function LocationPicker({ onLocationSelect, initialLocation }: LocationPickerProps) {
    const defaultCenter: [number, number] = [37.5804, 127.0384]; // Jegi-dong Office
    const [selectedPos, setSelectedPos] = useState<[number, number] | null>(initialLocation || null);

    useEffect(() => {
        if (initialLocation) {
            setSelectedPos(initialLocation);
        }
    }, [initialLocation]);

    const handleSelect = (lat: number, lng: number) => {
        setSelectedPos([lat, lng]);
        onLocationSelect(lat, lng);
    };

    return (
        <div style={{ height: '100%', width: '100%', position: 'relative' }}>
            <MapContainer
                center={selectedPos || defaultCenter}
                zoom={17}
                style={{ height: '100%', width: '100%', background: '#F5F5F5' }}
                zoomControl={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; CARTO'
                />

                {selectedPos && (
                    <Marker position={selectedPos} icon={pickerIcon} />
                )}

                <MapEvents onLocationSelect={handleSelect} />
            </MapContainer>

            <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                right: '12px',
                zIndex: 1000,
                background: 'rgba(255,255,255,0.9)',
                color: '#333',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                textAlign: 'center',
                fontWeight: 600,
                pointerEvents: 'none',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(4px)'
            }}>
                지도를 클릭하여 정확한 위치를 표시해 주세요
            </div>
        </div>
    );
}
