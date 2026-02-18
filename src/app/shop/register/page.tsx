'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Camera, Store, MapPin } from 'lucide-react';

export default function ShopRxegisterPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [bizNum, setBizNum] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert('가게 등록 신청이 완료되었습니다! 관리자 심사 후 등록됩니다.');
        router.push('/');
    };

    return (
        <div style={{ padding: '20px', paddingBottom: '80px', background: '#f8f9fa', minHeight: '100vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <button onClick={() => router.back()} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                    <ChevronLeft size={24} color="#333" />
                </button>
                <h2 style={{ marginLeft: '10px', fontSize: '20px', fontWeight: 'bold' }}>가게 등록하기</h2>
            </div>

            <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Photo Upload Placeholder */}
                    <div style={{
                        width: '100%', height: '150px', background: '#f0f0f0', borderRadius: '12px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        color: '#888', border: '2px dashed #ddd'
                    }}>
                        <Camera size={32} />
                        <span style={{ fontSize: '12px', marginTop: '8px' }}>가게 대표 사진 등록</span>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#555' }}>가게 이름</label>
                        <input
                            type="text"
                            placeholder="예: 경동 청과"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px' }}
                            required
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#555' }}>카테고리</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px' }}
                        >
                            <option value="">카테고리 선택</option>
                            <option value="fruit">청과/채소</option>
                            <option value="seafood">수산물/건어물</option>
                            <option value="herbal">한약재</option>
                            <option value="food">음식점/디저트</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#555' }}>사업자 등록번호 (선택)</label>
                        <input
                            type="text"
                            placeholder="000-00-00000"
                            value={bizNum}
                            onChange={(e) => setBizNum(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px' }}
                        />
                        <p style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>사업자 인증 마크를 받을 수 있습니다.</p>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#555' }}>위치 설정</label>
                        <button type="button" style={{
                            width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', background: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#555'
                        }}>
                            <MapPin size={18} /> 지도에서 위치 찾기
                        </button>
                    </div>

                    <button type="submit" style={{
                        marginTop: '10px', width: '100%', padding: '16px', borderRadius: '12px',
                        background: '#FF6B00', color: 'white', fontSize: '16px', fontWeight: 'bold', border: 'none'
                    }}>
                        등록 신청하기
                    </button>
                </form>
            </div>
        </div>
    );
}
