'use client';

import { MapContainer, TileLayer, Marker, Polygon, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Navigation } from 'lucide-react';

// Custom Marker Icons for pseudo-2.5D look
// Using standard colors with a star for verified shops
import { getMarkerSvg } from './MapMarker';

// Custom Marker Icons for pseudo-2.5D look
// Using standard colors with a star for verified shops
const createCustomIcon = (type: string, color: string, isVerified: boolean) => {
    const svgHtml = getMarkerSvg(type, color, isVerified);

    return new L.DivIcon({
        className: 'custom-mz-marker',
        html: `<div style="
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            ${svgHtml}
        </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20], // Center for circular markers
        popupAnchor: [0, -20]
    });
};

/* ... icons object removed as we generate dynamically ... */

interface Shop {
    id: string;
    lat: number;
    lng: number;
    name: string;
    category: string;
    is_verified?: boolean;
}

interface MapProps {
    shops: Shop[];
    onShopSelect: (shop: Shop) => void;
    darkMode?: boolean;
    userLocation?: [number, number] | null;
    selectedShop?: Shop | null;
}

const userLocationIcon = new L.DivIcon({
    className: 'user-location-marker',
    html: `<div style="width: 20px; height: 20px; background: #007AFF; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,122,255,0.5); position: relative;">
            <div style="position: absolute; top: -10px; left: -10px; right: -10px; bottom: -10px; background: rgba(0,122,255,0.15); border-radius: 50%; animation: pulse-location 2s infinite;"></div>
          </div>
          <style>
            @keyframes pulse-location {
                0% { transform: scale(1); opacity: 0.8; }
                100% { transform: scale(2.5); opacity: 0; }
            }
          </style>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

// Animation for the routing path to show direction
const routeAnimationStyle = `
  @keyframes route-flow {
    from { stroke-dashoffset: 40; }
    to { stroke-dashoffset: 0; }
  }
  .animated-route {
    stroke-dasharray: 10, 15;
    animation: route-flow 1.5s linear infinite;
  }
`;

function LocateControl({ userLocation }: { userLocation: [number, number] | null }) {
    const map = useMap();

    const handleLocate = () => {
        if (userLocation) {
            map.setView(userLocation, 18, { animate: true });
        } else {
            alert('위치 정보를 가져올 수 없습니다. 브라우저의 위치 권한을 확인해주세요.');
        }
    };

    return (
        <div style={{ position: 'absolute', bottom: '24px', right: '16px', zIndex: 1000 }}>
            <button
                onClick={handleLocate}
                style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'white',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#007AFF'
                }}
            >
                <Navigation size={22} fill={userLocation ? "#007AFF" : "none"} />
            </button>
        </div>
    );
}

function RoutingLayer({ userLocation, destination }: { userLocation: [number, number], destination: { lat: number, lng: number } }) {
    const map = useMap();
    const [route, setRoute] = useState<[number, number][]>([]);

    useEffect(() => {
        const fetchRoute = async () => {
            try {
                // OSRM foot routing API
                const url = `https://router.project-osrm.org/route/v1/foot/${userLocation[1]},${userLocation[0]};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
                const response = await fetch(url);
                const data = await response.json();

                if (data.code === 'Ok' && data.routes.length > 0) {
                    const coords = data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
                    setRoute(coords);

                    // Fit map bounds to show the whole route
                    const bounds = L.latLngBounds([userLocation, [destination.lat, destination.lng]]);
                    map.fitBounds(bounds, { padding: [50, 50] });
                }
            } catch (error) {
                console.error('Routing error:', error);
            }
        };

        fetchRoute();
    }, [userLocation, destination, map]);

    if (route.length === 0) return null;

    return (
        <Polyline
            positions={route}
            className="animated-route"
            pathOptions={{
                color: '#007AFF',
                weight: 7,
                opacity: 0.9,
                lineJoin: 'round',
                lineCap: 'round'
            }}
        />
    );
}

export default function Map({ shops, onShopSelect, darkMode = false, userLocation, selectedShop }: MapProps) {
    const center: [number, number] = [37.5804, 127.0384];

    return (
        <div style={{ height: '100%', width: '100%', borderRadius: '0 0 20px 20px', overflow: 'hidden' }}>
            <style>{routeAnimationStyle}</style>
            <MapContainer
                center={userLocation || center}
                zoom={17}
                minZoom={14}
                maxBounds={[[37.54, 126.99], [37.62, 127.09]]}
                style={{ height: '100%', width: '100%', background: darkMode ? '#1a1a1a' : '#f5f6f8' }}
                zoomControl={false}
            >
                <TileLayer
                    url={darkMode
                        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    }
                    attribution='&copy; CARTO'
                    maxZoom={20}
                />

                {/* User Current Location */}
                {userLocation && (
                    <Marker position={userLocation} icon={userLocationIcon} />
                )}

                {userLocation && selectedShop && (
                    <RoutingLayer userLocation={userLocation} destination={{ lat: selectedShop.lat, lng: selectedShop.lng }} />
                )}

                <LocateControl userLocation={userLocation || null} />

                {/* Shop Markers */}
                {shops.map((shop) => {
                    if (!shop.lat || !shop.lng || isNaN(shop.lat) || isNaN(shop.lng)) return null;

                    let iconColor = '#607D8B'; // 생활용품/기타
                    let iconType = 'bag';

                    const cat = shop.category || '';
                    if (cat.includes('배달')) {
                        iconColor = '#4CAF50'; iconType = 'truck'; // 바로배달
                    } else if (cat.includes('카페') || cat.includes('디저트') || cat.includes('간식')) {
                        iconColor = '#9C27B0'; iconType = 'cafe'; // 카페/간식
                    } else if (cat.includes('음식') || cat.includes('맛집') || cat.includes('식당') || cat.includes('분식')) {
                        iconColor = '#FF9800'; iconType = 'food'; // 먹거리
                    } else if (cat.includes('채소') || cat.includes('과일') || cat.includes('청과')) {
                        iconColor = '#8BC34A'; iconType = 'veggie'; // 채소/과일
                    } else if (cat.includes('수산') || cat.includes('생선') || cat.includes('해물')) {
                        iconColor = '#2196F3'; iconType = 'fish'; // 수산물
                    } else if (cat.includes('정육') || cat.includes('고기') || cat.includes('계란')) {
                        iconColor = '#F44336'; iconType = 'meat'; // 정육/계란
                    } else if (cat.includes('건어물')) {
                        iconColor = '#795548'; iconType = 'bag'; // 건어물
                    } else if (cat.includes('밀키트') || cat.includes('간편')) {
                        iconColor = '#E91E63'; iconType = 'chef'; // 간편/밀키트
                    } else if (cat.includes('한약') || cat.includes('인삼') || cat.includes('건강')) {
                        iconColor = '#3F51B5'; iconType = 'herbal'; // 한약/건강
                    } else if (cat.includes('생활용품') || cat.includes('잡화') || cat.includes('생필품') || cat.includes('마트') || cat.includes('편의점')) {
                        iconColor = '#607D8B'; iconType = 'bag'; // 생활용품
                    } else if (shop.name.includes('경동시장')) {
                        iconColor = '#FF5A00'; iconType = 'mz';
                    }

                    const isVerified = shop.is_verified || false;
                    const icon = createCustomIcon(iconType, iconColor, isVerified);

                    return (
                        <Marker
                            key={shop.id}
                            position={[shop.lat, shop.lng]}
                            icon={icon}
                            eventHandlers={{
                                click: () => onShopSelect(shop),
                                mouseover: (e) => {
                                    e.target.openPopup();
                                },
                                mouseout: (e) => {
                                    e.target.closePopup();
                                }
                            }}
                        >
                            <Popup closeButton={false} offset={[0, -20]}>
                                <div style={{
                                    padding: '2px 4px',
                                    textAlign: 'center',
                                    fontFamily: 'Pretendard, sans-serif'
                                }}>
                                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#333', marginBottom: '1px' }}>{shop.name}</div>
                                    <div style={{ fontSize: '11px', color: '#666' }}>{shop.category}</div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
