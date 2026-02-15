'use client';

import { MapContainer, TileLayer, Marker, Polygon, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Custom Marker Icons for pseudo-2.5D look
const createCustomIcon = (color: string) => new L.DivIcon({
    className: 'custom-marker',
    html: `<div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 0 50%;
        transform: rotate(45deg);
        border: 3px solid white;
        box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});

const icons = {
    default: createCustomIcon('#FF5A5F'),
    herbal: createCustomIcon('#27ae60'),
    food: createCustomIcon('#f39c12'),
    seafood: createCustomIcon('#3498db')
};

interface Shop {
    id: string;
    lat: number;
    lng: number;
    name: string;
    category: string;
}

interface Zone {
    id: string;
    name: string;
    type: string;
    polygon: any;
}

interface MapProps {
    shops: Shop[];
    onShopSelect: (shop: Shop) => void;
}

export default function Map({ shops, onShopSelect }: MapProps) {
    const center: [number, number] = [37.5804, 127.0384];
    const [zones, setZones] = useState<Zone[]>([]);

    useEffect(() => {
        async function fetchZones() {
            const { data } = await supabase.from('zones').select('*');
            if (data) setZones(data);
        }
        fetchZones();
    }, []);

    const getZoneCoordinates = (zoneName: string): [number, number][] => {
        const offsets: Record<string, [number, number][]> = {
            '건어물 거리': [[37.5800, 127.0380], [37.5800, 127.0388], [37.5808, 127.0388], [37.5808, 127.0380]],
            '한약재 시장': [[37.5808, 127.0380], [37.5808, 127.0388], [37.5816, 127.0388], [37.5816, 127.0380]],
            '농산물 구역': [[37.5800, 127.0388], [37.5800, 127.0396], [37.5808, 127.0396], [37.5808, 127.0388]],
            '중앙 광장': [[37.5808, 127.0388], [37.5808, 127.0396], [37.5816, 127.0396], [37.5816, 127.0388]]
        };
        return offsets[zoneName] || [];
    };

    const getZoneStyle = (type: string) => {
        const colors: Record<string, string> = {
            'SEARCH': '#3498db',
            'HERBAL': '#27ae60',
            'FOOD': '#f39c12',
            'DEFAULT': '#9b59b6'
        };
        const color = colors[type] || colors['DEFAULT'];
        return {
            color: color,
            fillColor: color,
            fillOpacity: 0.15,
            weight: 0, // No border for cleaner look
        };
    };

    return (
        <div style={{ height: '100%', width: '100%', borderRadius: '0 0 20px 20px', overflow: 'hidden' }}>
            <MapContainer
                center={center}
                zoom={17}
                style={{ height: '100%', width: '100%', background: '#f8f9fa' }}
                zoomControl={false}
            >
                {/* Cleaner Tile Layer (CartoDB Positron) */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />

                {/* Zone Overlays with depth effect via SVG filters or just cleaner styles */}
                {zones.map((zone) => {
                    const coords = getZoneCoordinates(zone.name);
                    if (coords.length === 0) return null;

                    return (
                        <Polygon
                            key={zone.id}
                            positions={coords}
                            pathOptions={getZoneStyle(zone.type)}
                        >
                            <Popup autoClose={false} closeButton={false} className="zone-popup">
                                <div style={{ fontWeight: 600, color: '#555', fontSize: '12px' }}>{zone.name}</div>
                            </Popup>
                        </Polygon>
                    );
                })}

                {/* Shop Markers */}
                {shops.map((shop) => {
                    let icon = icons.default;
                    if (shop.category?.includes('한약')) icon = icons.herbal;
                    if (shop.category?.includes('농산')) icon = icons.food;
                    if (shop.category?.includes('수산')) icon = icons.seafood;

                    return (
                        <Marker
                            key={shop.id}
                            position={[shop.lat, shop.lng]}
                            icon={icon}
                            eventHandlers={{
                                click: () => onShopSelect(shop),
                            }}
                        />
                    );
                })}
            </MapContainer>
        </div>
    );
}
