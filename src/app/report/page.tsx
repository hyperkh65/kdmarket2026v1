'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, MapPin, Camera, Star, CheckCircle, Info } from 'lucide-react';

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
    ssr: false,
    loading: () => <div style={{ height: '240px', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>지도를 불러오는 중...</div>
});

const CATEGORIES = [
    '바로배달', '먹거리', '채소/과일', '수산물', '정육/계란',
    '건어물', '카페/간식', '간편/밀키트', '한약/건강', '생활용품'
];

const RESIDENCY_PERIODS = [
    '1년 거주', '2년 거주', '3년 거주', '4년 거주', '5년 이상 거주', '10년 이상 거주', '제기동 토박이'
];

export default function ReportPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Form State
    const [shopName, setShopName] = useState('');
    const [category, setCategory] = useState('');
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);
    const [reviewText, setReviewText] = useState('');
    const [rating, setRating] = useState(5);
    const [nickname, setNickname] = useState('');
    const [residency, setResidency] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');

    useEffect(() => {
        // Try to get current location initially
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setLat(pos.coords.latitude);
                setLng(pos.coords.longitude);
            });
        }
    }, []);

    const handleSubmit = async () => {
        if (!shopName || !category || !lat || !lng || !reviewText || !nickname || !residency) {
            alert('모든 필수 정보를 입력해 주세요!');
            return;
        }

        setLoading(true);
        try {
            // 1. Create or Find Shop
            const shopId = `user_reported_${Date.now()}`;
            const { error: shopError } = await supabase.from('shops').insert({
                id: shopId,
                name: shopName,
                category: category,
                lat: lat,
                lng: lng,
                is_verified: false,
                rating: rating,
                review_count: 1
            });

            if (shopError) throw shopError;

            // 2. Add Review
            const { error: reviewError } = await supabase.from('reviews').insert({
                shop_id: shopId,
                nickname: nickname,
                residency_period: residency,
                rating: rating,
                text: reviewText,
                photo_urls: photoUrl ? [photoUrl] : [],
                created_at: new Date().toISOString()
            });

            if (reviewError) throw reviewError;

            setSubmitted(true);
        } catch (error: any) {
            console.error('Submission error:', error.message);
            alert('제보 중 오류가 발생했습니다: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div style={{ height: '100vh', background: '#111', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
                <CheckCircle size={64} color="#00C73C" style={{ marginBottom: '24px' }} />
                <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px' }}>제보가 접수되었습니다!</h2>
                <p style={{ fontSize: '16px', color: '#999', lineHeight: 1.6, marginBottom: '40px' }}>
                    감사합니다! 사장님이 직접 확인 후<br />
                    경동시장 공식 맛집으로 등록될 예정입니다.
                </p>
                <button
                    onClick={() => router.push('/')}
                    style={{ width: '100%', maxWidth: '240px', padding: '16px', borderRadius: '12px', background: '#FF5A00', color: 'white', border: 'none', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}
                >
                    홈으로 가기
                </button>
            </div>
        );
    }

    return (
        <main style={{ minHeight: '100vh', background: '#111', color: 'white' }}>
            {/* Header */}
            <header style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, background: '#111', zIndex: 100, borderBottom: '1px solid #222' }}>
                <button onClick={() => router.back()} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                    <ArrowLeft size={24} />
                </button>
                <h1 style={{ fontSize: '18px', fontWeight: 700 }}>찐주민 맛집 제보</h1>
            </header>

            <div style={{ padding: '24px 20px 100px' }}>
                {/* Progress Bar */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '32px' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ flex: 1, height: '4px', background: i <= step ? '#FF5A00' : '#333', borderRadius: '2px' }} />
                    ))}
                </div>

                {/* Step 1: 기본 정보 */}
                {step === 1 && (
                    <div className="fade-in">
                        <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>어디를 추천하시나요?</h2>
                        <p style={{ fontSize: '14px', color: '#666', marginBottom: '32px' }}>나만 알고 싶은 경동시장 찐맛집을 알려주세요.</p>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#999', marginBottom: '10px' }}>맛집 이름</label>
                            <input
                                type="text"
                                placeholder="예: 안동집, 통닭골목 단골집"
                                value={shopName}
                                onChange={(e) => setShopName(e.target.value)}
                                style={{ width: '100%', background: '#222', border: '1px solid #333', borderRadius: '12px', padding: '16px', color: 'white', fontSize: '16px', outline: 'none' }}
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#999', marginBottom: '10px' }}>카테고리</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setCategory(cat)}
                                        style={{
                                            padding: '12px',
                                            borderRadius: '8px',
                                            background: category === cat ? 'rgba(255,90,0,0.1)' : '#222',
                                            border: `1px solid ${category === cat ? '#FF5A00' : '#333'}`,
                                            color: category === cat ? '#FF5A00' : '#ccc',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            disabled={!shopName || !category}
                            onClick={() => setStep(2)}
                            style={{ width: '100%', padding: '16px', borderRadius: '12px', background: (shopName && category) ? '#FF5A00' : '#333', color: (shopName && category) ? 'white' : '#666', border: 'none', fontSize: '16px', fontWeight: 700, marginTop: '20px', cursor: 'pointer' }}
                        >
                            다음 단계로
                        </button>
                    </div>
                )}

                {/* Step 2: 위치 정보 */}
                {step === 2 && (
                    <div className="fade-in">
                        <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>위치가 어디인가요?</h2>
                        <p style={{ fontSize: '14px', color: '#666', marginBottom: '32px' }}>찾아오기 쉽도록 정확한 위치를 찍어주세요.</p>

                        <div style={{ height: '300px', borderRadius: '20px', overflow: 'hidden', marginBottom: '24px', border: '1px solid #333' }}>
                            <LocationPicker
                                initialLocation={lat && lng ? [lat, lng] : null}
                                onLocationSelect={(la, ln) => { setLat(la); setLng(ln); }}
                            />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px', background: '#1a1a1a', borderRadius: '12px', marginBottom: '32px' }}>
                            <Info size={18} color="#4DA2FF" />
                            <p style={{ fontSize: '13px', color: '#888' }}>지도를 클릭하여 핀을 이동시킬 수 있습니다.</p>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setStep(1)}
                                style={{ flex: 1, padding: '16px', borderRadius: '12px', background: '#222', color: '#999', border: 'none', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}
                            >
                                이전
                            </button>
                            <button
                                disabled={!lat || !lng}
                                onClick={() => setStep(3)}
                                style={{ flex: 2, padding: '16px', borderRadius: '12px', background: (lat && lng) ? '#FF5A00' : '#333', color: (lat && lng) ? 'white' : '#666', border: 'none', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}
                            >
                                마지막 단계로
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: 후기 정보 */}
                {step === 3 && (
                    <div className="fade-in">
                        <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>마지막으로 리뷰를 써주세요</h2>
                        <p style={{ fontSize: '14px', color: '#666', marginBottom: '32px' }}>이곳이 왜 맛집인지 주민의 시선으로 알려주세요.</p>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#999', marginBottom: '10px' }}>별점</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {[1, 2, 3, 4, 5].map(i => (
                                    <button key={i} onClick={() => setRating(i)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                        <Star size={32} fill={i <= rating ? '#FFB300' : 'none'} color={i <= rating ? '#FFB300' : '#333'} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#999', marginBottom: '10px' }}>나의 닉네임</label>
                            <input
                                type="text"
                                placeholder="예: 제기동토박이, 떡볶이덕후"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                style={{ width: '100%', background: '#222', border: '1px solid #333', borderRadius: '12px', padding: '16px', color: 'white', fontSize: '16px', outline: 'none' }}
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#999', marginBottom: '10px' }}>거주 기간</label>
                            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                                {RESIDENCY_PERIODS.map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setResidency(p)}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '20px',
                                            flexShrink: 0,
                                            background: residency === p ? '#FF5A00' : '#222',
                                            border: 'none',
                                            color: 'white',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#999', marginBottom: '10px' }}>맛집 후기</label>
                            <textarea
                                placeholder="이곳만의 매력, 추천 메뉴 등을 자세히 적어주시면 다른 주민들에게 큰 도움이 됩니다."
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                                style={{ width: '100%', background: '#222', border: '1px solid #333', borderRadius: '12px', padding: '16px', color: 'white', fontSize: '16px', minHeight: '120px', outline: 'none', resize: 'none' }}
                            />
                        </div>

                        <div style={{ marginBottom: '32px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#999', marginBottom: '10px' }}>사진 등록 (선택)</label>
                            <button
                                onClick={() => setPhotoUrl('https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop')}
                                style={{ width: '100px', height: '100px', background: '#222', border: '1px dashed #444', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                            >
                                <Camera size={24} color="#666" />
                                <span style={{ fontSize: '12px', color: '#666' }}>추가하기</span>
                            </button>
                            {photoUrl && (
                                <div style={{ marginTop: '12px', position: 'relative', width: '100px', height: '100px' }}>
                                    <img src={photoUrl} alt="upload" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                                    <button onClick={() => setPhotoUrl('')} style={{ position: 'absolute', top: '-8px', right: '-8px', width: '20px', height: '20px', borderRadius: '50%', background: '#FF5A00', color: 'white', border: 'none', fontSize: '12px', cursor: 'pointer' }}>×</button>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setStep(2)}
                                style={{ flex: 1, padding: '16px', borderRadius: '12px', background: '#222', color: '#999', border: 'none', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}
                            >
                                이전
                            </button>
                            <button
                                disabled={loading || !reviewText || !nickname || !residency}
                                onClick={handleSubmit}
                                style={{ flex: 2, padding: '16px', borderRadius: '12px', background: (reviewText && nickname && residency) ? '#00C73C' : '#333', color: (reviewText && nickname && residency) ? 'white' : '#666', border: 'none', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}
                            >
                                {loading ? '등록 중...' : '제보 완료하기'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .fade-in {
                    animation: fadeIn 0.4s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </main>
    );
}
