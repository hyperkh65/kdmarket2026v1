'use client';

import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Bell, Search, MapPin, Truck, Utensils, Carrot, Fish, Beef, Coffee, ShoppingBag, Pill, ChefHat, Navigation, ArrowRight, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMarkerSvg } from '@/components/MapMarker';

// Category Info mapping helper
const getCategoryStyle = (category: string) => {
    let iconColor = '#607D8B';
    let iconType = 'bag';

    const cat = category || '';
    if (cat.includes('카페') || cat.includes('디저트')) {
        iconColor = '#9C27B0'; iconType = 'cafe';
    } else if (cat.includes('음식') || cat.includes('맛집') || cat.includes('식당') || cat.includes('분식')) {
        iconColor = '#FF9800'; iconType = 'food';
    } else if (cat.includes('채소') || cat.includes('과일') || cat.includes('청과')) {
        iconColor = '#8BC34A'; iconType = 'veggie';
    } else if (cat.includes('수산') || cat.includes('생선')) {
        iconColor = '#2196F3'; iconType = 'fish';
    } else if (cat.includes('정육') || cat.includes('고기')) {
        iconColor = '#F44336'; iconType = 'meat';
    } else if (cat.includes('인삼') || cat.includes('한약') || cat.includes('건강')) {
        iconColor = '#3F51B5'; iconType = 'herbal';
    }

    return { iconColor, iconType };
};

export default function Home() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Dynamic Content State
    const [popularShops, setPopularShops] = useState<any[]>([]);
    const [recommendedCourse, setRecommendedCourse] = useState<any>(null);
    const [marketNews, setMarketNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const categories = [
        { name: '바로배달', icon: <Truck size={24} />, color: '#4CAF50' },
        { name: '먹거리', icon: <Utensils size={24} />, color: '#FF9800' },
        { name: '채소/과일', icon: <Carrot size={24} />, color: '#8BC34A' },
        { name: '수산물', icon: <Fish size={24} />, color: '#2196F3' },
        { name: '정육/계란', icon: <Beef size={24} />, color: '#F44336' },
        { name: '건어물', icon: <ShoppingBag size={24} />, color: '#795548' },
        { name: '카페/간식', icon: <Coffee size={24} />, color: '#9C27B0' },
        { name: '간편/밀키트', icon: <ChefHat size={24} />, color: '#E91E63' },
        { name: '한약/건강', icon: <Pill size={24} />, color: '#3F51B5' },
        { name: '생활용품', icon: <ShoppingBag size={24} />, color: '#607D8B' },
    ];

    // Resident Reviews State
    const [residentReviews, setResidentReviews] = useState<any[]>([]);
    const [userLocation, setUserLocation] = useState({ lat: 37.5804, lng: 127.0384 }); // Default to Jegi-dong Office

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

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            // Get Current Location
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                    (err) => console.log('Location access denied, using Jegi-dong center.')
                );
            }

            // 1. Fetch Popular Shops
            const { data: shops } = await supabase
                .from('shops')
                .select('*')
                .order('view_count', { ascending: false })
                .limit(5);
            if (shops) setPopularShops(shops);

            // 2. Fetch Resident Reviews (Join with shops to get names)
            const { data: reviews } = await supabase
                .from('reviews')
                .select('*, shops(name, category, lat, lng)')
                .order('created_at', { ascending: false })
                .limit(10);

            if (reviews) {
                // Decorate with distances
                const decorated = reviews.map(r => ({
                    ...r,
                    distance: r.shops ? getDistance(userLocation.lat, userLocation.lng, r.shops.lat, r.shops.lng) : '---'
                }));
                setResidentReviews(decorated);
            }

            // 3. Fetch Top Recommended Course
            const { data: courses } = await supabase
                .from('courses')
                .select('*')
                .order('likes', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (courses) setRecommendedCourse(courses);

            // 4. Fetch Latest Market News
            const { data: news } = await supabase
                .from('market_news')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(2);
            if (news) setMarketNews(news);

            setLoading(false);
        };

        fetchData();
    }, [userLocation.lat]);

    // Autocomplete Search
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (searchTerm.length < 1) {
                setSuggestions([]);
                return;
            }

            const { data } = await supabase
                .from('shops')
                .select('id, name, category')
                .ilike('name', `%${searchTerm}%`)
                .limit(5);

            if (data) setSuggestions(data);
        };

        const timeoutId = setTimeout(fetchSuggestions, 300); // 300ms debounce
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handleSearch = () => {
        if (searchTerm) {
            router.push(`/explore?q=${encodeURIComponent(searchTerm)}`);
        }
    };

    return (
        <div style={{ paddingBottom: '90px', background: 'white', minHeight: '100vh' }}>
            {/* 1. HEADER */}
            <header style={{ padding: '16px 20px 8px', position: 'sticky', top: 0, background: 'white', zIndex: 100 }}>
                {/* Top Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <span style={{ fontSize: '22px', fontWeight: 900, color: '#FF5A00', letterSpacing: '-1px' }}>경동마켓</span>
                        <div style={{ width: '1px', height: '16px', background: '#ddd' }}></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <MapPin size={16} color="#555" />
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>제기동</span>
                            <span style={{ fontSize: '10px', color: '#888' }}>▼</span>
                        </div>
                    </div>
                    <Bell size={24} color="#333" />
                </div>

                {/* Search Bar & Autocomplete */}
                <div style={{ position: 'relative' }}>
                    <input
                        type="text"
                        placeholder="찾으시는 상점명을 입력하세요"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        style={{
                            width: '100%',
                            padding: '14px 44px 14px 16px',
                            background: '#F5F6F8',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '15px',
                            color: '#333',
                            outline: 'none'
                        }}
                    />
                    <Search size={22} color="#00C73C" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }} onClick={handleSearch} />

                    {/* Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0,
                            background: 'white', borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            marginTop: '8px', padding: '8px 0', zIndex: 101,
                            border: '1px solid #f0f0f0'
                        }}>
                            {suggestions.map((s) => (
                                <Link href={`/shop/${s.id}`} key={s.id} style={{ textDecoration: 'none' }}>
                                    <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Search size={14} color="#bbb" />
                                            <span style={{ fontSize: '14px', color: '#333' }}>{s.name}</span>
                                        </div>
                                        <span style={{ fontSize: '11px', color: '#999', background: '#eee', padding: '2px 6px', borderRadius: '4px' }}>{s.category}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </header>

            {/* 2. CATEGORY GRID */}
            <section style={{ padding: '24px 16px 32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px 8px' }}>
                    {categories.map((cat, i) => (
                        <div
                            key={i}
                            onClick={() => router.push(`/explore?category=${encodeURIComponent(cat.name)}`)}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                        >
                            <div style={{
                                width: '48px', height: '48px',
                                background: '#F0F4F8',
                                borderRadius: '16px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                                transition: 'transform 0.2s'
                            }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                                <div style={{ color: cat.color }}>
                                    {cat.icon}
                                </div>
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#666' }}>{cat.name}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* 3. RECOMMENDED COURSE (DB Linked) */}
            <section style={{ padding: '0 20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#222' }}>
                        오늘의 <span style={{ color: '#FF5A00' }}>추천 코스</span>
                    </h2>
                    <Link href="/activity" style={{ fontSize: '13px', color: '#888' }}>전체보기</Link>
                </div>

                {loading ? (
                    <div style={{ height: '160px', background: '#f5f5f5', borderRadius: '16px' }} />
                ) : recommendedCourse ? (
                    <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', position: 'relative', height: '180px' }}>
                        <img
                            src={recommendedCourse.image_url || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                <span style={{ background: '#FF5A00', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>HOT</span>
                                <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 700 }}>{recommendedCourse.title}</h3>
                            </div>
                            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', marginBottom: '8px', lineHeight: '1.4' }}>
                                {recommendedCourse.description}
                            </p>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                {recommendedCourse.stops && recommendedCourse.stops.length > 0 ? (
                                    <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', scrollbarWidth: 'none', width: '100%', padding: '4px 0' }}>
                                        {recommendedCourse.stops.map((stop: any, idx: number) => (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                                <div style={{ width: '16px', height: '16px', background: '#FF5A00', color: 'white', borderRadius: '50%', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                                                    {idx + 1}
                                                </div>
                                                <span style={{ fontSize: '11px', fontWeight: 600, color: 'white' }}>{stop.name}</span>
                                                {idx < recommendedCourse.stops.length - 1 && <ArrowRight size={10} color="rgba(255,255,255,0.5)" />}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    recommendedCourse.tags?.map((tag: string, i: number) => (
                                        <span key={i} style={{ fontSize: '11px', color: '#ddd' }}>{tag}</span>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#999', background: '#f9f9f9', borderRadius: '16px' }}>
                        등록된 추천 코스가 없습니다.
                    </div>
                )}
            </section>

            <div style={{ height: '8px', background: '#F8F9FA' }}></div>

            {/* 4. POPULAR SHOPS (DB Linked) */}
            <section style={{ padding: '24px 0 24px 20px' }}>
                <div style={{ paddingRight: '20px', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#222' }}>
                        <span style={{ color: '#00C73C' }}>우리동네</span> 인기상점
                    </h2>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '16px',
                    overflowX: 'auto',
                    paddingBottom: '20px',
                    paddingRight: '20px',
                    scrollSnapType: 'x mandatory'
                }}>
                    {loading ? (
                        [1, 2, 3].map(i => <div key={i} style={{ minWidth: '220px', height: '200px', background: '#f5f5f5', borderRadius: '16px' }} />)
                    ) : popularShops.map((shop, i) => (
                        <Link href={`/shop/${shop.id}`} key={shop.id} style={{ textDecoration: 'none' }}>
                            <div style={{
                                minWidth: '220px',
                                background: 'white',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                                scrollSnapAlign: 'start',
                                border: '1px solid #eee'
                            }}>
                                <div style={{ position: 'relative', height: '140px' }}>
                                    {shop.images?.[0] ? (
                                        <img
                                            src={shop.images?.[0]}
                                            alt={shop.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                const parent = e.currentTarget.parentElement;
                                                if (parent) {
                                                    const placeholder = document.createElement('div');
                                                    placeholder.style.width = '100%';
                                                    placeholder.style.height = '100%';
                                                    placeholder.style.background = getCategoryStyle(shop.category).iconColor;
                                                    placeholder.style.display = 'flex';
                                                    placeholder.style.alignItems = 'center';
                                                    placeholder.style.justifyContent = 'center';
                                                    placeholder.innerHTML = getMarkerSvg(
                                                        getCategoryStyle(shop.category).iconType,
                                                        getCategoryStyle(shop.category).iconColor,
                                                        false
                                                    ).replace('width="40" height="40"', 'width="60" height="60"');
                                                    parent.appendChild(placeholder);
                                                }
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                width: '100%', height: '100%',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: getCategoryStyle(shop.category).iconColor
                                            }}
                                            dangerouslySetInnerHTML={{
                                                __html: getMarkerSvg(
                                                    getCategoryStyle(shop.category).iconType,
                                                    getCategoryStyle(shop.category).iconColor,
                                                    false
                                                ).replace('width="40" height="40"', 'width="60" height="60"')
                                            }}
                                        />
                                    )}
                                    <div style={{
                                        position: 'absolute', top: '12px', left: '12px',
                                        background: 'rgba(0,0,0,0.6)', color: 'white',
                                        padding: '4px 8px', borderRadius: '8px',
                                        fontSize: '11px', fontWeight: 700
                                    }}>
                                        {i + 1}위
                                    </div>
                                    {shop.is_verified && (
                                        <div style={{
                                            position: 'absolute', top: '12px', right: '12px',
                                            background: '#00C73C', color: 'white',
                                            width: '24px', height: '24px', borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                            fontSize: '14px'
                                        }}>
                                            ✓
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: '16px' }}>
                                    <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px', color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shop.name}</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#555' }}>
                                        <span style={{ color: '#FFB300' }}>★</span>
                                        <span style={{ fontWeight: 600 }}>{shop.rating || 0}</span>
                                        <span style={{ color: '#eee', margin: '0 4px' }}>|</span>
                                        <span>{shop.category}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            <div style={{ height: '8px', background: '#F8F9FA' }}></div>

            {/* 5. JEGI-DONG RESIDENT REVIEWS */}
            <section style={{ padding: '24px 20px', background: '#111', color: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '19px', fontWeight: 800 }}>
                        제기동 <span style={{ color: '#00C73C' }}>찐주민</span>의 맛집 후기
                    </h2>
                    <span style={{ fontSize: '12px', color: '#666' }}>최신순</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {residentReviews.length > 0 ? residentReviews.map((review) => (
                        <div key={review.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FF5A00' }}></div>
                                <span style={{ fontWeight: 800, fontSize: '16px' }}>{review.shops?.name}</span>
                                <span style={{ fontSize: '13px', color: '#666' }}>
                                    {review.shops?.category} · {review.distance}
                                </span>
                            </div>

                            <div style={{ padding: '20px', background: '#222', borderRadius: '16px', position: 'relative' }}>
                                <p style={{ fontSize: '14px', lineHeight: 1.5, color: '#eee', marginBottom: '12px' }}>
                                    {review.text}
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                                        👤
                                    </div>
                                    <span style={{ fontSize: '13px', color: '#999' }}>{review.nickname || '익명'}</span>
                                    <span style={{
                                        fontSize: '11px',
                                        color: '#4DA2FF',
                                        background: 'rgba(77,162,255,0.1)',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        fontWeight: 600
                                    }}>
                                        {review.residency_period}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div style={{ padding: '40px 0', textAlign: 'center', color: '#666' }}>
                            동네 주민들의 따끈한 후기를 준비 중입니다.
                        </div>
                    )}

                    <button
                        onClick={() => router.push('/feed')}
                        style={{
                            width: '100%', padding: '14px', borderRadius: '12px',
                            background: 'rgba(255,90,0,0.1)', color: '#FF5A00',
                            border: '1px solid #FF5A00', fontWeight: 700,
                            fontSize: '14px', marginTop: '10px'
                        }}
                    >
                        커뮤니티 인기글 더보기
                    </button>

                    <button
                        onClick={() => router.push('/report')}
                        style={{
                            width: '100%',
                            background: '#333',
                            color: '#eee',
                            border: 'none',
                            padding: '14px',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: 600,
                            marginTop: '10px',
                            cursor: 'pointer'
                        }}
                    >
                        주민 맛집 제보하기
                    </button>
                </div>
            </section>

            <div style={{ height: '8px', background: '#F8F9FA' }}></div>

            {/* 5. MARKET NEWS (DB Linked - Admin Managed) */}
            <section style={{ padding: '24px 20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>📢 금주의 시장 소식</h3>
                <div style={{ background: '#F0F8FF', borderRadius: '16px', padding: '20px' }}>
                    {loading ? (
                        <div style={{ height: '40px', background: '#e0e0e0', borderRadius: '8px' }} />
                    ) : marketNews.length > 0 ? (
                        marketNews.map((news) => (
                            <div key={news.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                                <span style={{ background: news.type === 'EVENT' ? '#00C73C' : '#FF5A5F', color: 'white', fontSize: '11px', padding: '4px 8px', borderRadius: '4px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                    {news.type || 'NEWS'}
                                </span>
                                <span style={{ fontSize: '15px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{news.title}</span>
                            </div>
                        ))
                    ) : (
                        <div style={{ color: '#666', fontSize: '14px' }}>등록된 소식이 없습니다.</div>
                    )}
                </div>
            </section>
        </div>
    );
}
