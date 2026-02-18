'use client';

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import ShopDetailClient from './ShopDetailClient';

// Fallback Mock Data (MZ Style) - Ensure critical shops exist even if DB fails
const MZ_MOCK_SHOPS = [
    {
        id: 'shop_1',
        name: '경동다방 (Kyungdong Cafe)',
        category: '카페/디저트',
        lat: 37.5804, lng: 127.0384,
        is_verified: true,
        hours_text: '매일 11:00 - 21:00',
        tags: ['#뉴트로', '#쌍화차라떼', '#힙플레이스'],
        description: '할머니의 레시피를 재해석한 🎈쌍화차 라떼와 수제 약과 디저트가 있는 공간입니다. 시장 2층 청년몰의 힙한 분위기를 즐겨보세요.',
        min_order_price: 12000,
        delivery_time: '20-30분',
        rating: 4.8,
        review_count: 128,
        images: ['https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=500']
    },
    {
        id: 'shop_11',
        name: '스타벅스 경동1960',
        category: '카페/디저트',
        lat: 37.5800, lng: 127.0388,
        is_verified: true,
        hours_text: '매일 09:00 - 20:00',
        tags: ['#폐극장개조', '#핫플', '#베이커리'],
        description: '1960년대 극장을 개조한 특별한 스타벅스 📽️ 레트로한 공간에서 고품질 커피를 즐겨보세요.',
        min_order_price: 5000,
        delivery_time: '포장가능',
        rating: 4.8,
        review_count: 5600,
        images: ['https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=500']
    }
];

export default function ShopDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [shop, setShop] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchShop = async () => {
            setLoading(true);
            try {
                // 1. Try DB Fetch (Client-Side)
                // Using .maybeSingle() to avoid error on 0 rows
                let { data, error } = await supabase
                    .from('shops')
                    .select('*')
                    .eq('id', id)
                    .maybeSingle();

                if (error) {
                    console.warn(`Shop fetch error for ID: ${id}`, error);
                }

                if (!data) {
                    console.warn(`Shop not found in DB for ID: ${id}, checking mocks.`);
                    // 2. Try Mock Data
                    const mock = MZ_MOCK_SHOPS.find(s => s.id === id);
                    if (mock) {
                        data = mock;
                    } else {
                        // 3. Generate Generic Fallback if ID looks like 'shop_'
                        if (id.startsWith('shop_')) {
                            data = {
                                id,
                                name: '임시 가게 정보',
                                description: '데이터베이스 연결을 확인 중이거나 정보를 불러오는 중입니다.',
                                images: ['https://source.unsplash.com/800x600/?market'],
                                category: '기타',
                                min_order_price: 10000,
                                delivery_time: '30-40분',
                                rating: 0,
                                review_count: 0
                            };
                        }
                    }
                }

                if (data) {
                    setShop(data);
                } else {
                    setError('가게 정보를 찾을 수 없습니다.');
                }
            } catch (err) {
                console.error(err);
                setError('오류가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchShop();
    }, [id]);

    if (loading) return (
        <div style={{ padding: '100px 20px', textAlign: 'center', color: '#999' }}>
            <div style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 700 }}>가게 정보를 불러오는 중...</div>
            <div style={{ fontSize: '14px' }}>잠시만 기다려주세요.</div>
        </div>
    );

    if (error || !shop) return (
        <div style={{ padding: '100px 20px', textAlign: 'center', color: '#999' }}>
            <div style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 700 }}>{error || '가게 정보 없음'}</div>
            <button
                onClick={() => window.location.reload()}
                style={{ padding: '10px 20px', background: '#333', color: 'white', borderRadius: '8px', border: 'none' }}
            >
                다시 시도
            </button>
        </div>
    );

    return <ShopDetailClient initialShop={shop} />;
}
