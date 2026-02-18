'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ChevronLeft, Store, FileText, CheckCircle, Upload, MapPin, Camera } from 'lucide-react';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), { ssr: false });

export default function OwnerVerifyPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Form Stats
    const [shopName, setShopName] = useState('');
    const [category, setCategory] = useState('');
    const [bizNumber, setBizNumber] = useState('');
    const [address, setAddress] = useState('');
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [bizDocUrl, setBizDocUrl] = useState('');
    const [shopPhotoUrl, setShopPhotoUrl] = useState('');

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) router.push('/login');
            else setUser(user);
        };
        checkUser();
    }, [router]);

    const handleSubmit = async () => {
        if (!shopName || !category || !bizNumber || !location || !bizDocUrl) {
            alert('모든 필수 정보를 입력해주세요.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.from('owner_verifications').insert({
                user_id: user.id,
                shop_name: shopName,
                shop_category: category,
                biz_registration_number: bizNumber,
                shop_lat: location.lat,
                shop_lng: location.lng,
                shop_address: address,
                biz_reg_doc_url: bizDocUrl,
                sign_photo_url: shopPhotoUrl,
                status: 'PENDING'
            });

            if (error) throw error;
            setStep(4); // Success step
        } catch (error: any) {
            alert('인증 신청 중 오류가 발생했습니다: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const categories = ['음식/식당', '채소/과일', '수산/선어', '건어물', '약재/인삼', '정육/축산', '의류/잡화', '기타'];

    return (
        <div style={{ padding: '0 0 100px', background: '#121212', minHeight: '100vh', color: 'white' }}>
            {/* Header */}
            <header style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                {step < 4 && <ChevronLeft onClick={() => step > 1 ? setStep(step - 1) : router.back()} style={{ cursor: 'pointer' }} />}
                <h1 style={{ fontSize: '18px', fontWeight: 600 }}>사장님 인증 신청</h1>
            </header>

            {/* Progress Bar */}
            {step < 4 && (
                <div style={{ height: '4px', background: '#333', width: '100%', display: 'flex' }}>
                    <div style={{ height: '100%', background: '#FF5A00', width: `${(step / 3) * 100}%`, transition: 'width 0.3s' }}></div>
                </div>
            )}

            <main style={{ padding: '30px 24px' }}>
                {step === 1 && (
                    <div className="animate-in fade-in duration-500">
                        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px', lineHeight: 1.4 }}>
                            가게의 기본 정보를<br />입력해 주세요
                        </h2>
                        <p style={{ color: '#888', marginBottom: '32px', fontSize: '14px' }}>심사 후 서비스에 실제 등록되는 정보입니다.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#888', marginBottom: '8px' }}>가게 이름 (상호명)</label>
                                <input
                                    type="text"
                                    value={shopName}
                                    onChange={(e) => setShopName(e.target.value)}
                                    placeholder="상호를 입력하세요"
                                    style={{ width: '100%', padding: '16px', borderRadius: '12px', background: '#1E1E1E', border: '1px solid #333', color: 'white' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#888', marginBottom: '8px' }}>카테고리</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setCategory(cat)}
                                            style={{
                                                padding: '12px 4px', fontSize: '13px', borderRadius: '8px', border: 'none',
                                                background: category === cat ? '#FF5A00' : '#1E1E1E',
                                                color: category === cat ? 'white' : '#aaa',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            disabled={!shopName || !category}
                            onClick={() => setStep(2)}
                            style={{
                                width: '100%', padding: '18px', borderRadius: '14px', border: 'none',
                                background: (shopName && category) ? '#FF5A00' : '#333',
                                color: (shopName && category) ? 'white' : '#777',
                                fontSize: '16px', fontWeight: 700, marginTop: '40px'
                            }}
                        >
                            다음 단계
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-in fade-in duration-500">
                        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px', lineHeight: 1.4 }}>
                            가게의 정확한 위치를<br />지정해 주세요
                        </h2>
                        <p style={{ color: '#888', marginBottom: '24px', fontSize: '14px' }}>지도를 클릭하여 건물 입구에 핀을 꽂아주세요.</p>

                        <div style={{ height: '300px', borderRadius: '16px', overflow: 'hidden', border: '2px solid #333', marginBottom: '20px' }}>
                            <LocationPicker
                                onLocationSelect={(lat, lng) => setLocation({ lat, lng })}
                                initialLocation={location ? [location.lat, location.lng] : undefined}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: '#888', marginBottom: '8px' }}>상세 주소 (예: 2층 201호)</label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="상세 위치를 입력하세요"
                                style={{ width: '100%', padding: '16px', borderRadius: '12px', background: '#1E1E1E', border: '1px solid #333', color: 'white' }}
                            />
                        </div>

                        <button
                            disabled={!location}
                            onClick={() => setStep(3)}
                            style={{
                                width: '100%', padding: '18px', borderRadius: '14px', border: 'none',
                                background: location ? '#FF5A00' : '#333',
                                color: location ? 'white' : '#777',
                                fontSize: '16px', fontWeight: 700, marginTop: '40px'
                            }}
                        >
                            위치 설정 완료
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div className="animate-in fade-in duration-500">
                        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px', lineHeight: 1.4 }}>
                            사업자 정보를<br />등록해 주세요
                        </h2>
                        <p style={{ color: '#888', marginBottom: '32px', fontSize: '14px' }}>심사는 영업일 기준 3~4일이 소요됩니다.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#888', marginBottom: '8px' }}>사업자 등록번호</label>
                                <input
                                    type="text"
                                    value={bizNumber}
                                    onChange={(e) => setBizNumber(e.target.value)}
                                    placeholder="000-00-00000"
                                    style={{ width: '100%', padding: '16px', borderRadius: '12px', background: '#1E1E1E', border: '1px solid #333', color: 'white' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#888', marginBottom: '8px' }}>사업자등록증 사진 (필수)</label>
                                <div style={{ border: '2px dashed #333', borderRadius: '12px', padding: '24px', textAlign: 'center', cursor: 'pointer' }} onClick={() => setBizDocUrl('https://placehold.co/600x400?text=Business+License')}>
                                    <Upload size={24} color="#888" style={{ marginBottom: '8px' }} />
                                    <p style={{ fontSize: '13px', color: (bizDocUrl ? '#00E676' : '#888') }}>
                                        {bizDocUrl ? '파일 업로드 완료' : '파일 선택 또는 사진 촬영'}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#888', marginBottom: '8px' }}>가게 정면 사진 (선택)</label>
                                <div style={{ border: '2px dashed #333', borderRadius: '12px', padding: '24px', textAlign: 'center', cursor: 'pointer' }} onClick={() => setShopPhotoUrl('https://placehold.co/600x400?text=Shop+Front')}>
                                    <Camera size={24} color="#888" style={{ marginBottom: '8px' }} />
                                    <p style={{ fontSize: '13px', color: (shopPhotoUrl ? '#00E676' : '#888') }}>
                                        {shopPhotoUrl ? '사진 업로드 완료' : '가게 간판이 보이는 정면 사진'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            disabled={!bizNumber || !bizDocUrl || loading}
                            onClick={handleSubmit}
                            style={{
                                width: '100%', padding: '18px', borderRadius: '14px', border: 'none',
                                background: (bizNumber && bizDocUrl) ? '#FF5A00' : '#333',
                                color: (bizNumber && bizDocUrl) ? 'white' : '#777',
                                fontSize: '16px', fontWeight: 700, marginTop: '40px',
                                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                            }}
                        >
                            {loading ? '신청 중...' : '심사 신청하기'}
                        </button>
                    </div>
                )}

                {step === 4 && (
                    <div style={{ textAlign: 'center', paddingTop: '60px' }} className="animate-in zoom-in duration-500">
                        <CheckCircle size={80} color="#00E676" style={{ marginBottom: '24px' }} />
                        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px' }}>신청이 완료되었습니다!</h2>
                        <p style={{ color: '#aaa', lineHeight: 1.6, marginBottom: '40px' }}>
                            영업일 기준 3~4일 이내에 심사가 완료됩니다.<br />
                            심사 결과는 '나의 경동'에서 확인하실 수 있습니다.
                        </p>
                        <button
                            onClick={() => router.push('/my')}
                            style={{ width: '100%', padding: '16px', borderRadius: '12px', background: '#333', color: 'white', border: 'none', fontWeight: 600 }}
                        >
                            마이페이지로 돌아가기
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
