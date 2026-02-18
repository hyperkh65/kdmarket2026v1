'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Search, SlidersHorizontal, Navigation, X, MapPin, User, ChevronLeft,
    Phone, MessageCircle, Bookmark, Share2, ArrowRight,
    Truck, Utensils, Carrot, Fish, Beef, Coffee, ShoppingBag, Pill, ChefHat, CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

// Dynamic import for Map
const Map = dynamic(() => import('@/components/Map'), {
    ssr: false,
    loading: () => <div style={{ height: '100%', background: '#121212', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>지도를 불러오는 중...</div>
});

interface Shop {
    id: string;
    name: string;
    category: string;
    lat: number;
    lng: number;
    is_verified?: boolean;
    image_url?: string;
    phone?: string;
}

const categoriesList = [
    { name: '바로배달', icon: <Truck size={24} />, color: '#4CAF50', desc: '오늘 문 앞까지' },
    { name: '먹거리', icon: <Utensils size={24} />, color: '#FF9800', desc: '시장 대표 손맛' },
    { name: '채소/과일', icon: <Carrot size={24} />, color: '#8BC34A', desc: '산지직송 신선함' },
    { name: '수산물', icon: <Fish size={24} />, color: '#2196F3', desc: '새벽 경매 직송' },
    { name: '정육/계란', icon: <Beef size={24} />, color: '#F44336', desc: '등급 좋은 고기' },
    { name: '건어물', icon: <ShoppingBag size={24} />, color: '#795548', desc: '말린 것의 진수' },
    { name: '카페/간식', icon: <Coffee size={24} />, color: '#9C27B0', desc: '시장의 여유' },
    { name: '간편/밀키트', icon: <ChefHat size={24} />, color: '#E91E63', desc: '요리가 쉬워지는' },
    { name: '한약/건강', icon: <Pill size={24} />, color: '#3F51B5', desc: '활력을 채우는' },
    { name: '생활용품', icon: <ShoppingBag size={24} />, color: '#607D8B', desc: '없는 게 없는' },
    { name: '전체보기', icon: <Search size={24} />, color: '#FF5A00', desc: '모든 상점 탐색' },
];

function ExploreContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialCategory = searchParams.get('category') || null;

    const [shops, setShops] = useState<Shop[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [showDirections, setShowDirections] = useState(false);
    const [directionsTarget, setDirectionsTarget] = useState<Shop | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [favorites, setFavorites] = useState<string[]>([]);
    const [showInquiryModal, setShowInquiryModal] = useState(false);
    const [inquiryTarget, setInquiryTarget] = useState<Shop | null>(null);

    useEffect(() => {
        // Load favorites from localStorage
        const saved = localStorage.getItem('market_favorites');
        if (saved) {
            try {
                setFavorites(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse favorites", e);
            }
        }
        async function fetchShops() {
            const { data } = await supabase.from('shops').select('*').limit(1000);
            if (data) setShops(data);
        }
        fetchShops();

        // Start geolocation immediately for better experience
        if (navigator.geolocation) {
            setIsLocating(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserLocation([pos.coords.latitude, pos.coords.longitude]);
                    setIsLocating(false);
                },
                () => setIsLocating(false),
                { timeout: 5000 }
            );
        }
    }, []);

    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        return d >= 1 ? `${d.toFixed(1)}km` : `${Math.round(d * 1000)}m`;
    };

    const handleCall = (phone?: string) => {
        if (phone) window.location.href = `tel:${phone}`;
        else alert('전화번호 정보가 없습니다.');
    };

    const handleShare = (shop: Shop) => {
        if (navigator.share) {
            navigator.share({
                title: shop.name,
                text: `${shop.name} - 경동시장에서 만나보세요!`,
                url: window.location.origin + `/shop/${shop.id}`,
            });
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(window.location.origin + `/shop/${shop.id}`);
            alert('상점 링크가 복사되었습니다.');
        }
    };

    const toggleFavorite = (shopId: string) => {
        setFavorites(prev => {
            const newFavs = prev.includes(shopId)
                ? prev.filter(id => id !== shopId)
                : [...prev, shopId];
            localStorage.setItem('market_favorites', JSON.stringify(newFavs));
            return newFavs;
        });
    };

    const handleInquiry = (shop: Shop) => {
        setInquiryTarget(shop);
        setShowInquiryModal(true);
    };

    const filteredShops = shops.filter(s => {
        const matchesCategory = !selectedCategory || selectedCategory === '전체보기' || (() => {
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
        })();
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    }).sort((a, b) => {
        if (!userLocation) return 0;
        const distA = Math.sqrt(Math.pow(a.lat - userLocation[0], 2) + Math.pow(a.lng - userLocation[1], 2));
        const distB = Math.sqrt(Math.pow(b.lat - userLocation[0], 2) + Math.pow(b.lng - userLocation[1], 2));
        return distA - distB;
    });

    return (
        <main style={{ height: '100vh', background: '#121212', position: 'relative', overflow: 'hidden', color: 'white', display: 'flex', flexDirection: 'column' }}>

            {/* 1. Top Bar */}
            <div style={{ padding: '20px 20px 10px', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 100 }}>
                {selectedCategory && (
                    <button
                        onClick={() => setSelectedCategory(null)}
                        style={{ background: '#222', border: 'none', borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                        <ChevronLeft size={24} color="#eee" />
                    </button>
                )}
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '14px', top: '12px' }} size={18} color="#666" />
                    <input
                        type="text"
                        placeholder="상점 이름을 검색해보세요"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '100%', height: '44px', background: '#1E1E1E', border: '1px solid #333', borderRadius: '14px', paddingLeft: '44px', color: 'white', outline: 'none' }}
                    />
                </div>
            </div>

            {/* 2. Content Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px 100px' }}>
                {!selectedCategory ? (
                    /* Landing - Category Grid */
                    <div>
                        <div style={{ margin: '20px 0 30px' }}>
                            <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>어떤 상점을<br /><span style={{ color: '#FF5A00' }}>찾으시나요?</span></h1>
                            <p style={{ color: '#888', fontSize: '14px' }}>경동시장의 873개 전문 상점을 만나보세요</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                            {categoriesList.map((cat, i) => (
                                <div
                                    key={i}
                                    onClick={() => setSelectedCategory(cat.name)}
                                    style={{
                                        background: '#1E1E1E', borderRadius: '20px', padding: '20px', border: '1px solid #2a2a2a',
                                        cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#444'}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#2a2a2a'}
                                >
                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: '14px', background: cat.color + '15',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: cat.color, marginBottom: '16px'
                                    }}>
                                        {cat.icon}
                                    </div>
                                    <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>{cat.name}</div>
                                    <div style={{ fontSize: '11px', color: '#666' }}>{cat.desc}</div>
                                    <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', opacity: 0.1, transform: 'rotate(-15deg)' }}>
                                        {cat.icon}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* List View */
                    <div style={{ animation: 'slideUp 0.3s ease-out' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', margin: '14px 0 20px' }}>
                            <h2 style={{ fontSize: '22px', fontWeight: 800 }}>{selectedCategory === '전체보기' ? '모든 상점' : selectedCategory}</h2>
                            <span style={{ fontSize: '14px', color: '#FF5A00', fontWeight: 600 }}>{filteredShops.length}개의 상점</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {filteredShops.length > 0 ? filteredShops.map(shop => {
                                const dist = userLocation
                                    ? getDistance(userLocation[0], userLocation[1], shop.lat, shop.lng)
                                    : '거리 확인불가';

                                return (
                                    <div key={shop.id} style={{ background: '#1E1E1E', borderRadius: '24px', overflow: 'hidden', border: '1px solid #2a2a2a', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}>
                                        {/* Shop Info Card Part */}
                                        <div style={{ padding: '20px 20px 16px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                        <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>{shop.name}</h3>
                                                        {shop.is_verified && <CheckCircle size={16} color="#FF5A00" fill="#FF5A00" style={{ color: 'white' }} />}
                                                    </div>
                                                    <div style={{ fontSize: '13px', color: '#999' }}>{shop.category} · {dist}</div>
                                                </div>
                                                <div style={{ width: '80px', height: '80px', borderRadius: '16px', overflow: 'hidden', background: '#2a2a2a' }}>
                                                    <img
                                                        src={shop.image_url || `https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=200&auto=format&fit=crop`}
                                                        alt={shop.name}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1513135557534-682d53fd7046?q=80&w=200&auto=format&fit=crop'; }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Action Buttons Bar */}
                                            <div style={{
                                                display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #2a2a2a',
                                                borderBottom: '1px solid #2a2a2a', padding: '12px 0', margin: '0 -20px 16px', background: 'rgba(255,255,255,0.02)'
                                            }}>
                                                {[
                                                    { icon: <Phone size={20} />, label: '전화', onClick: () => handleCall(shop.phone) },
                                                    { icon: <MessageCircle size={20} />, label: '문의', onClick: () => handleInquiry(shop) },
                                                    {
                                                        icon: <Bookmark size={20} fill={favorites.includes(shop.id) ? '#FF5A00' : 'none'} />,
                                                        label: '저장',
                                                        onClick: () => toggleFavorite(shop.id),
                                                        active: favorites.includes(shop.id)
                                                    },
                                                    { icon: <Navigation size={20} />, label: '길찾기', onClick: () => { setDirectionsTarget(shop); setShowDirections(true); } },
                                                    { icon: <Share2 size={20} />, label: '공유', onClick: () => handleShare(shop) }
                                                ].map((btn, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={btn.onClick}
                                                        style={{
                                                            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                            gap: '6px', background: 'transparent', border: 'none', cursor: 'pointer',
                                                            color: (idx === 2 && favorites.includes(shop.id)) ? '#FF5A00' : '#bbb',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        <div style={{ color: (idx === 3 || (idx === 2 && favorites.includes(shop.id))) ? '#FF5A00' : 'inherit' }}>{btn.icon}</div>
                                                        <span style={{ fontSize: '11px', fontWeight: 600 }}>{btn.label}</span>
                                                    </button>
                                                ))}
                                            </div>

                                            <Link href={`/shop/${shop.id}`} style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                width: '100%', padding: '14px', background: 'rgba(255,90,0,0.1)', color: '#FF5A00',
                                                borderRadius: '14px', fontWeight: 700, textDecoration: 'none', fontSize: '15px'
                                            }}>
                                                상세 정보 (주문/위키) 보기 <ArrowRight size={18} />
                                            </Link>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div style={{ textAlign: 'center', padding: '60px 0', color: '#666' }}>
                                    <Search size={48} strokeWidth={1} style={{ marginBottom: '16px' }} />
                                    <p>조건에 맞는 상점이 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Directions Map Modal */}
            {showDirections && directionsTarget && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 2000, background: '#121212', display: 'flex', flexDirection: 'column',
                    animation: 'fadeIn 0.3s'
                }}>
                    <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(18,18,18,0.9)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button
                                onClick={() => { setShowDirections(false); setDirectionsTarget(null); }}
                                style={{ background: '#222', border: 'none', borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <X size={24} color="white" />
                            </button>
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{directionsTarget.name} 길찾기</h3>
                                {userLocation && (
                                    <p style={{ fontSize: '12px', color: '#888' }}>
                                        현재 위치로부터 {getDistance(userLocation[0], userLocation[1], directionsTarget.lat, directionsTarget.lng)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ flex: 1, position: 'relative' }}>
                        {/* @ts-ignore */}
                        <Map
                            shops={[directionsTarget]}
                            onShopSelect={() => { }}
                            darkMode={true}
                            userLocation={userLocation}
                            selectedShop={directionsTarget}
                        />
                    </div>

                    <div style={{ padding: '24px 20px 40px', background: '#1E1E1E', borderRadius: '32px 32px 0 0', marginTop: '-32px', zIndex: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,90,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF5A00' }}>
                                <MapPin size={22} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '12px', color: '#888' }}>도착지</div>
                                <div style={{ fontWeight: 700 }}>{directionsTarget.name}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => { setShowDirections(false); setDirectionsTarget(null); }}
                            style={{ width: '100%', padding: '16px', background: '#FF5A00', border: 'none', borderRadius: '16px', color: 'white', fontWeight: 700, fontSize: '16px' }}
                        >
                            길안내 종료
                        </button>
                    </div>
                </div>
            )}

            {/* 4. Inquiry Bottom Sheet/Modal */}
            {showInquiryModal && inquiryTarget && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 3000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end',
                    animation: 'fadeIn 0.2s'
                }}>
                    <div style={{
                        width: '100%', background: '#1E1E1E', borderRadius: '32px 32px 0 0',
                        padding: '24px 20px 40px', animation: 'slideUp 0.3s ease-out'
                    }}>
                        <div style={{ width: '40px', height: '4px', background: '#333', borderRadius: '2px', margin: '0 auto 24px' }}></div>
                        <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>문의하기</h3>
                        <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>{inquiryTarget.name} 상점과 연결해 드릴까요?</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button
                                onClick={() => handleCall(inquiryTarget.phone)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '12px', padding: '16px',
                                    background: '#2a2a2a', border: '1px solid #333', borderRadius: '16px', color: 'white', cursor: 'pointer'
                                }}
                            >
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(76,175,80,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4CAF50' }}>
                                    <Phone size={20} />
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontWeight: 700 }}>전화 문의</div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>상점과 직접 통화합니다</div>
                                </div>
                            </button>

                            <button
                                onClick={() => { setShowInquiryModal(false); router.push(`/shop/${inquiryTarget.id}?tab=review`); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '12px', padding: '16px',
                                    background: '#2a2a2a', border: '1px solid #333', borderRadius: '16px', color: 'white', cursor: 'pointer'
                                }}
                            >
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,152,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF9800' }}>
                                    <MessageCircle size={20} />
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontWeight: 700 }}>리뷰/커뮤니티</div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>다른 이용자들의 후기를 확인하세요</div>
                                </div>
                            </button>

                            <button
                                onClick={() => { alert('준비 중인 기능입니다.'); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '12px', padding: '16px',
                                    background: '#2a2a2a', border: '1px solid #333', borderRadius: '16px', color: 'white', cursor: 'pointer'
                                }}
                            >
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(254,229,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FEE500' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 900, color: '#3A1D1D' }}>TALK</div>
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontWeight: 700 }}>카카오톡 채널</div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>간편한 채팅 상담 (준비중)</div>
                                </div>
                            </button>
                        </div>

                        <button
                            onClick={() => setShowInquiryModal(false)}
                            style={{
                                width: '100%', marginTop: '24px', padding: '16px', background: 'transparent',
                                border: '1px solid #333', borderRadius: '16px', color: '#888', fontWeight: 600
                            }}
                        >
                            취소
                        </button>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
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
