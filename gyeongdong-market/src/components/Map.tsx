'use client';

import { MapContainer, TileLayer, Marker, Polygon, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Fix Leaflet's default icon path issues in Next.js
const icon = new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface Shop {
    id: string;
    lat: number;
    lng: number;
    name: string;
    category?: string;
}

interface Zone {
    id: string;
    name: string;
    type: string;
    polygon: any; // GeoJSON
}

interface MapProps {
    shops: Shop[];
    onShopSelect: (shop: Shop) => void;
}

export default function Map({ shops, onShopSelect }: MapProps) {
    const center: [number, number] = [37.5804, 127.0384];
    const [zones, setZones] = useState<Zone[]>([]);

    useEffect(() => {
        // Fetch zones for overlay
        async function fetchZones() {
            const { data } = await supabase.from('zones').select('*');
            if (data) setZones(data);
        }
        fetchZones();
    }, []);

    // Convert PostGIS polygon to Leaflet coordinates
    // For MVP, we'll use simple rectangular zones around the center
    const getZoneCoordinates = (zoneName: string): [number, number][] => {
        const offsets: Record<string, [number, number][]> = {
            '건어물 거리': [
                [37.5800, 127.0380],
                [37.5800, 127.0388],
                [37.5808, 127.0388],
                [37.5808, 127.0380]
            ],
            '한약재 시장': [
                [37.5808, 127.0380],
                [37.5808, 127.0388],
                [37.5816, 127.0388],
                [37.5816, 127.0380]
            ],
            '농산물 구역': [
                [37.5800, 127.0388],
                [37.5800, 127.0396],
                [37.5808, 127.0396],
                [37.5808, 127.0388]
            ],
            '중앙 광장': [
                [37.5808, 127.0388],
                [37.5808, 127.0396],
                [37.5816, 127.0396],
                [37.5816, 127.0388]
            ]
        };
        return offsets[zoneName] || [];
    };

    const getZoneColor = (type: string) => {
        return type === 'SEARCH' ? '#3498db' : '#e74c3c';
    };

    return (
        <MapContainer
            center={center}
            zoom={17}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Zone Overlays (2.5D effect) */}
            {zones.map((zone) => {
                const coords = getZoneCoordinates(zone.name);
                if (coords.length === 0) return null;

                return (
                    <Polygon
                        key={zone.id}
                        positions={coords}
                        pathOptions={{
                            color: getZoneColor(zone.type),
                            fillColor: getZoneColor(zone.type),
                            fillOpacity: 0.2,
                            weight: 2
                        }}
                    >
                        <Popup>
                            <strong>{zone.name}</strong><br />
                            유형: {zone.type}
                        </Popup>
                    </Polygon>
                );
            })}

            {/* Shop Markers */}
            {shops.map((shop) => (
                <Marker
                    key={shop.id}
                    position={[shop.lat, shop.lng]}
                    icon={icon}
                    eventHandlers={{
                        click: () => onShopSelect(shop),
                    }}
                >
                    <Popup>
                        <strong>{shop.name}</strong><br />
                        {shop.category}
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
