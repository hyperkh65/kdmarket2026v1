'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, Suspense } from 'react';
import styles from './page.module.css';
import { supabase } from '@/lib/supabaseClient';
import { Search, SlidersHorizontal, Navigation, X, MapPin, Star, User, Truck, Utensils, Carrot, Fish, Beef, Coffee, ShoppingBag, Pill, ChefHat, ChevronUp, ChevronDown, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// Dynamic import for Map
const Map = dynamic(() => import('@/components/Map'), {
    ssr: false,
    loading: () => <div style={{ height: '100%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>지도를 불러오는 중...</div>
});

interface Shop {
    id: string;
    name: string;
    category: string;
    lat: number;
    lng: number;
    is_verified?: boolean;
    image_url?: string;
}

// Mock Reviews Data
const MOCK_REVIEWS = [
    { id: 1, shop: '이삭토스트 고려대점', category: '토스트', user: '이웅', user_verify: '2년 이상 거주', content: '이삭은 진짜...사랑이지유... 참살이길코너에 진짜작게 포장주문할수있게 돼있는...', img: 'https://images.unsplash.com/photo-1584776296944-ab6fb986e9d0?w=200&h=200&fit=crop', dist: '255m', rating: 5 },
    { id: 2, shop: '스시이안앤 청량리역점', category: '초밥', user: '어사도', user_verify: '4년 이상 거주', content: '초밥 생각날때 이용하는데 가성비가 좋네요.', img: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200&h=200&fit=crop', dist: '1.3km', rating: 4 },
    { id: 3, shop: '신가네왕코등갈비', category: '갈비/숯불', user: '맛잘알', user_verify: '1년 거주', content: '27년 왕코등갈비 당근에 인사드립니다. 72시간의 기다림..', img: 'https://images.unsplash.com/photo-1544025162-d76690b68f11?w=200&h=200&fit=crop', dist: '989m', rating: 5 }
];

function ExploreContent() {
    const searchParams = useSearchParams();
    const initialCategory = searchParams.get('category') || '전체';

    const [shops, setShops] = useState<Shop[]>([]);
    const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [residentReviews, setResidentReviews] = useState<any[]>([]);
    const [isVerifiedOnly, setIsVerifiedOnly] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

    const categoriesList = [
        { name: '전체', icon: <Search size={20} />, color: '#bbb' },
        { name: '바로배달', icon: <Truck size={20} />, color: '#4CAF50' },
        { name: '먹거리', icon: <Utensils size={20} />, color: '#FF9800' },
        { name: '채소/과일', icon: <Carrot size={20} />, color: '#8BC34A' },
        { name: '수산물', icon: <Fish size={20} />, color: '#2196F3' },
        { name: '정육/계란', icon: <Beef size={20} />, color: '#F44336' },
        { name: '건어물', icon: <ShoppingBag size={20} />, color: '#795548' },
        { name: '카페/간식', icon: <Coffee size={20} />, color: '#9C27B0' },
        { name: '간편/밀키트', icon: <ChefHat size={20} />, color: '#E91E63' },
        { name: '한약/건강', icon: <Pill size={20} />, color: '#3F51B5' },
        { name: '생활용품', icon: <ShoppingBag size={20} />, color: '#607D8B' },
    ];

    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        return d >= 1 ? `${d.toFixed(1)}km` : `${Math.round(d * 1000)}m`;
    };

    const categories = ['전체', '바로배달', '먹거리', '채소/과일', '수산물', '정육/계란', '건어물', '카페/간식', '간편/밀키트', '한약/건강', '생활용품'];

    useEffect(() => {
        // 1. Initial Data Fetch
        async function fetchShops() {
            const { data } = await supabase.from('shops').select('*').limit(1000);
            if (data) setShops(data);
        }
        fetchShops();

        // 2. Fetch Resident Reviews
        async function fetchReviews() {
            const { data: reviews, error } = await supabase
                .from('reviews')
                .select('*, shops(id, name, category, lat, lng)')
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) {
                console.error("Reviews fetch error:", error.message);
                return;
            }

            if (reviews) {
                setResidentReviews(reviews);
            }
        }
        fetchReviews();

        // 3. Check Permission & Start Geolocation
        const hasPermission = localStorage.getItem('location_permission');
        if (hasPermission === 'true') {
            startTracking();
        } else {
            setShowPermissionModal(true);
        }
    }, []);

    useEffect(() => {
        // Sync category with URL if it changes
        const cat = searchParams.get('category');
        if (cat) setSelectedCategory(cat);
    }, [searchParams]);

    const startTracking = () => {
        if (!navigator.geolocation) return;
        setIsLocating(true);

        const defaultLoc: [number, number] = [37.5804, 127.0384]; // Jegi-dong Office

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLocation([pos.coords.latitude, pos.coords.longitude]);
                setIsLocating(false);
            },
            (err) => {
                console.warn("Location access failed, using default:", err.message);
                setUserLocation(defaultLoc);
                setIsLocating(false);
            },
            { enableHighAccuracy: false, timeout: 5000, maximumAge: Infinity }
        );
    };

    const handleGrantPermission = () => {
        localStorage.setItem('location_permission', 'true');
        setShowPermissionModal(false);
        startTracking();
    };

    const handleRecenter = () => {
        if (userLocation) {
            const loc = userLocation;
            setUserLocation(null);
            setTimeout(() => setUserLocation(loc), 10);
        }
    };

    const displayShops = shops.filter(s => {
        if (isVerifiedOnly && !s.is_verified) return false;
        if (selectedCategory === '전체') return true;
        const cat = s.category || '';

        switch (selectedCategory) {
            case '바로배달': return cat.includes('배달');
            case '먹거리': return cat.includes('음식') || cat.includes('맛집') || cat.includes('식당') || cat.includes('분식');
            case '채소/과일': return cat.includes('채소') || cat.includes('과일') || cat.includes('청과');
            case '수산물': return cat.includes('수산') || cat.includes('생선') || cat.includes('해물');
            case '정육/계란': return cat.includes('정육') || cat.includes('고기') || cat.includes('계란');
            case '건어물': return cat.includes('건어물');
            case '카페/간식': return cat.includes('카페') || cat.includes('디저트') || cat.includes('간식');
            case '간편/밀키트': return cat.includes('밀키트') || cat.includes('간편');
            case '한약/건강': return cat.includes('한약') || cat.includes('인삼') || cat.includes('건강');
            case '생활용품': return cat.includes('생활용품') || cat.includes('잡화') || cat.includes('생필품');
            default: return false;
        }
    });

    return (
        <main style={{ height: '100vh', background: '#121212', position: 'relative', overflow: 'hidden', color: 'white' }}>


            {/* Category selection Window (Modal) */}
            {showCategoryModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 2000, background: 'rgba(0,0,0,0.85)',
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                    paddingTop: '60px', backdropFilter: 'blur(10px)'
                }}>
                    <div style={{
                        width: '90%', maxWidth: '400px', background: '#1E1E1E',
                        borderRadius: '24px', padding: '24px', position: 'relative',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)', border: '1px solid #333'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>카테고리 선택</h3>
                            <button onClick={() => setShowCategoryModal(false)} style={{ background: 'transparent', border: 'none' }}><X size={24} color="white" /></button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                            {categoriesList.map((cat, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setSelectedCategory(cat.name);
                                        setShowCategoryModal(false);
                                    }}
                                    style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                                        padding: '16px 8px', borderRadius: '16px',
                                        background: selectedCategory === cat.name ? 'rgba(255,90,0,0.1)' : '#262626',
                                        border: selectedCategory === cat.name ? '1.5px solid #FF5A00' : '1.5px solid transparent',
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ color: cat.color }}>{cat.icon}</div>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#eee' }}>{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Map - Dynamic Height */}
            <div style={{
                height: (selectedShop || selectedCategory !== '전체') ? '55%' : '75%',
                width: '100%',
                position: 'relative',
                transition: 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
                {/* @ts-ignore */}
                <Map shops={displayShops} onShopSelect={setSelectedShop} darkMode={false} userLocation={userLocation} selectedShop={selectedShop} />
            </div>

            {/* 3. Bottom Sheet / Reviews List - Dynamic Height */}
            <div style={{
                height: (selectedShop || selectedCategory !== '전체') ? '45%' : '25%',
                background: '#121212',
                borderRadius: '32px 32px 0 0',
                marginTop: '-32px',
                position: 'relative',
                zIndex: 10,
                padding: '24px 20px 80px',
                overflowY: 'auto',
                boxShadow: '0 -10px 40px rgba(0,0,0,0.4)',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                transition: 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
                <div style={{ width: '40px', height: '5px', background: '#333', borderRadius: '3px', margin: '0 auto 24px' }} />

                {selectedShop ? (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h2 style={{ fontSize: '20px', fontWeight: 700 }}>{selectedShop.name}</h2>
                                {selectedShop.is_verified && <CheckCircle size={18} color="#FF5A00" fill="#FF5A00" style={{ color: 'white' }} />}
                            </div>
                            <button onClick={() => setSelectedShop(null)} style={{ background: 'transparent', border: 'none' }}><X size={20} color="#666" /></button>
                        </div>
                        <p style={{ color: '#888', marginBottom: '16px' }}>{selectedShop.category}</p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Link href={`/shop/${selectedShop.id}`} style={{
                                flex: 1, padding: '14px',
                                background: '#333', color: 'white', textAlign: 'center',
                                borderRadius: '12px', fontWeight: 700, textDecoration: 'none'
                            }}>
                                상세 정보 보기
                            </Link>
                            <button
                                onClick={() => {
                                    if (userLocation) {
                                        const originalShop = selectedShop;
                                        setSelectedShop(null);
                                        setTimeout(() => setSelectedShop(originalShop), 50);
                                    }
                                }}
                                style={{
                                    flex: 1, padding: '14px',
                                    background: '#FF5A00', color: 'white', textAlign: 'center',
                                    borderRadius: '12px', fontWeight: 700, border: 'none', cursor: 'pointer'
                                }}
                            >
                                안내 시작
                            </button>
                        </div>
                    </div>
                ) : selectedCategory !== '전체' ? (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: 800 }}>
                                <span style={{ color: '#FF5A00' }}>{selectedCategory}</span> 추천 목록
                            </h3>
                            <span style={{ fontSize: '13px', color: '#888', fontWeight: 500 }}>{displayShops.length}개의 점포</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {displayShops.length > 0 ? displayShops.map(shop => {
                                const dist = userLocation
                                    ? getDistance(userLocation[0], userLocation[1], shop.lat, shop.lng)
                                    : '---';

                                return (
                                    <div
                                        key={shop.id}
                                        onClick={() => setSelectedShop(shop)}
                                        style={{
                                            display: 'flex', gap: '16px', background: '#1E1E1E', padding: '12px',
                                            borderRadius: '16px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)',
                                            transition: 'transform 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        <div style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', background: '#2a2a2a' }}>
                                            <img
                                                src={shop.image_url || `https://source.unsplash.com/featured/?market,${shop.category || 'shop'}`}
                                                alt={shop.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    e.currentTarget.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=200&auto=format&fit=crop';
                                                }}
                                            />
                                        </div>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{shop.name}</h4>
                                                {shop.is_verified && <CheckCircle size={14} color="#FF5A00" fill="#FF5A00" style={{ color: 'white' }} />}
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#999', marginBottom: '8px' }}>
                                                {shop.category} · {dist}
                                            </div>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <span style={{ fontSize: '11px', background: 'rgba(255,90,0,0.1)', color: '#FF5A00', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>주민추천</span>
                                                <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', color: '#bbb', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>배달가능</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>
                                    해당 카테고리의 상점이 없습니다.
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            제기동 찐주민의 맛집 후기
                            <span style={{ fontSize: '12px', color: '#666', fontWeight: 400 }}>최신순</span>
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {residentReviews.length > 0 ? residentReviews.map(review => {
                                const dist = (userLocation && review.shops)
                                    ? getDistance(userLocation[0], userLocation[1], review.shops.lat, review.shops.lng)
                                    : '---';

                                return (
                                    <div key={review.id} style={{ display: 'flex', gap: '16px' }}>
                                        <div style={{ flex: 1 }}>
                                            <Link href={`/shop/${review.shop_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                    <span style={{ border: '1px solid #FF5A00', width: '12px', height: '12px', borderRadius: '50%', display: 'flex' }}></span>
                                                    <span style={{ fontWeight: 700, fontSize: '15px' }}>{review.shops?.name}</span>
                                                    <span style={{ fontSize: '12px', color: '#666' }}>{review.shops?.category} · {dist}</span>
                                                </div>
                                            </Link>
                                            <div style={{ background: '#1E1E1E', padding: '12px', borderRadius: '12px' }}>
                                                <p style={{ fontSize: '14px', lineHeight: '1.4', color: '#ddd', marginBottom: '10px' }}>
                                                    {review.text}
                                                </p>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <User size={14} color="#666" />
                                                    <span style={{ fontSize: '12px', color: '#888' }}>{review.nickname || '익명'}</span>
                                                    <span style={{
                                                        fontSize: '11px',
                                                        background: 'rgba(79,172,254,0.1)',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        color: '#4facfe',
                                                        fontWeight: 600
                                                    }}>
                                                        {review.residency_period}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ width: '80px', height: '80px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden', background: '#222' }}>
                                            <img
                                                src={review.photo_urls?.[0] || `https://source.unsplash.com/featured/?food,${review.shops?.category || 'market'}`}
                                                alt="review"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    e.currentTarget.src = 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=200&auto=format&fit=crop';
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>
                                    후기를 불러오는 중입니다...
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Permission Modal */}
            {showPermissionModal && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px'
                }}>
                    <div style={{ background: 'white', padding: '24px', borderRadius: '20px', width: '100%', maxWidth: '320px', textAlign: 'center' }}>
                        <div style={{ margin: '0 auto 16px', width: '60px', height: '60px', borderRadius: '50%', background: '#F0F4F8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MapPin size={32} color="#FF5A00" />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#222', marginBottom: '12px' }}>
                            위치 정보 이용 안내
                        </h3>
                        <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.5', marginBottom: '24px' }}>
                            <strong>내 주변 경동시장 점포 안내</strong>를 위해<br />
                            사용자의 현재 위치 정보를 사용합니다.<br /><br />
                            수집된 위치 정보는 상점 추천 및 길안내 목적으로만 사용되며, 서버에 저장되지 않습니다.
                        </p>
                        <button
                            onClick={handleGrantPermission}
                            style={{
                                width: '100%', padding: '14px',
                                background: '#FF5A00', color: 'white',
                                border: 'none', borderRadius: '12px',
                                fontSize: '16px', fontWeight: 700
                            }}>
                            동의하고 시작하기
                        </button>
                    </div>
                </div>
            )}
            {/* 1. Header & Search - Collapsible Glassmorphism style */}
            <header style={{
                position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000,
                padding: isHeaderCollapsed ? '8px 16px' : '16px 16px 8px',
                background: isHeaderCollapsed ? 'rgba(18, 18, 18, 0.4)' : 'rgba(18, 18, 18, 0.7)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
                {!isHeaderCollapsed && (
                    <div style={{
                        transition: 'opacity 0.3s',
                        opacity: isHeaderCollapsed ? 0 : 1
                    }}>
                        <div style={{
                            background: 'rgba(40, 40, 40, 0.9)',
                            borderRadius: '16px',
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                            border: '1px solid rgba(255,255,255,0.08)'
                        }}>
                            <Search size={18} color="#FF5A00" />
                            <input
                                type="text"
                                placeholder={isVerifiedOnly ? "인증된 상점 검색" : "경동시장 873개 점포 검색"}
                                style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '15px', width: '100%', outline: 'none', fontWeight: 500 }}
                            />
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                {/* Compact Verified Toggle */}
                                <button
                                    onClick={() => setIsVerifiedOnly(!isVerifiedOnly)}
                                    title="인증된 상점만 보기"
                                    style={{
                                        background: isVerifiedOnly ? '#FF5A00' : 'rgba(255,255,255,0.05)',
                                        border: 'none', borderRadius: '10px', width: '36px', height: '36px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                        transition: '0.2s', color: isVerifiedOnly ? 'white' : '#999'
                                    }}
                                >
                                    <CheckCircle size={20} strokeWidth={2.5} />
                                </button>

                                <button
                                    onClick={() => setShowCategoryModal(true)}
                                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                >
                                    <SlidersHorizontal size={18} color="white" />
                                </button>
                                <button
                                    onClick={handleRecenter}
                                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                >
                                    <Navigation size={18} color={isLocating ? "#FF5A00" : "white"} />
                                </button>
                            </div>
                        </div>

                        {/* Categories List */}
                        <div id="category-bar" style={{
                            display: 'flex',
                            gap: '10px',
                            overflowX: 'auto',
                            marginTop: '16px',
                            padding: '4px 0 12px',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            WebkitOverflowScrolling: 'touch'
                        }}>
                            {categoriesList.map((cat, i) => (
                                <button key={i}
                                    onClick={() => setSelectedCategory(cat.name)}
                                    style={{
                                        padding: '10px 18px',
                                        borderRadius: '28px',
                                        background: selectedCategory === cat.name ? '#FF5A00' : '#000',
                                        color: 'white',
                                        border: selectedCategory === cat.name ? 'none' : '1px solid rgba(255,255,255,0.2)',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.3s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                        cursor: 'pointer',
                                        transform: selectedCategory === cat.name ? 'scale(1.05)' : 'scale(1)'
                                    }}>
                                    <span style={{ display: 'flex', color: selectedCategory === cat.name ? 'white' : cat.color }}>{cat.icon}</span>
                                    {cat.name}
                                </button>
                            ))}
                            <style>{`#category-bar::-webkit-scrollbar { display: none; }`}</style>
                        </div>
                    </div>
                )}

                {/* Vertical Fold Toggle Button */}
                <button
                    onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
                    style={{
                        width: '100%',
                        height: '24px',
                        background: 'transparent',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#666'
                    }}
                >
                    <div style={{ width: '30px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', position: 'relative' }}>
                        {isHeaderCollapsed ? <ChevronDown size={16} style={{ position: 'absolute', top: '4px', left: '7px' }} /> : <ChevronUp size={16} style={{ position: 'absolute', top: '-14px', left: '7px' }} />}
                    </div>
                </button>
            </header>
        </main>
    );
}

export default function ExplorePage() {
    return (
        <Suspense fallback={<div style={{ background: '#121212', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>로딩 중...</div>}>
            <ExploreContent />
        </Suspense>
    );
}
