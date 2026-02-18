'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ChevronLeft, Heart, Store, MapPin, Star } from 'lucide-react';

export default function FavoritesPage() {
    const router = useRouter();
    const [favorites, setFavorites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFavorites = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data, error } = await supabase
                .from('favorites')
                .select(`
                    id,
                    shop_id,
                    shops (*)
                `)
                .eq('user_id', user.id);

            if (error) {
                console.error('Fetch favorites error:', error);
            }

            if (data) {
                // Filter out cases where shops join might have failed (returns null)
                const validShops = data
                    .filter(f => f.shops !== null)
                    .map(f => f.shops);
                setFavorites(validShops);
            }
            setLoading(false);
        };
        fetchFavorites();
    }, [router]);

    const removeFavorite = async (shopId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('shop_id', shopId);

        if (!error) {
            setFavorites(favorites.filter(s => s.id !== shopId));
        }
    };

    return (
        <div style={{ padding: '0 0 100px', background: '#121212', minHeight: '100vh', color: 'white' }}>
            <header style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #222' }}>
                <ChevronLeft onClick={() => router.back()} style={{ cursor: 'pointer' }} />
                <h1 style={{ fontSize: '18px', fontWeight: 600 }}>단골 가게 (관심목록)</h1>
            </header>

            <main style={{ padding: '20px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', marginTop: '40px', color: '#666' }}>불러오는 중...</div>
                ) : favorites.length === 0 ? (
                    <div style={{ textAlign: 'center', marginTop: '100px' }}>
                        <Heart size={48} color="#333" style={{ marginBottom: '16px' }} />
                        <p style={{ color: '#888', fontSize: '15px' }}>아직 단골 가게가 없어요.<br />마음에 드는 가게를 찜해보세요!</p>
                        <button
                            onClick={() => router.push('/explore')}
                            style={{ marginTop: '20px', padding: '12px 24px', borderRadius: '10px', background: '#FF5A00', border: 'none', color: 'white', fontWeight: 600 }}
                        >
                            시장 구경하러 가기
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {favorites.map((shop) => (
                            <div
                                key={shop.id}
                                onClick={() => router.push(`/shop/${shop.id}`)}
                                style={{ display: 'flex', gap: '16px', padding: '16px', background: '#1E1E1E', borderRadius: '16px', cursor: 'pointer' }}
                            >
                                <div style={{ width: '80px', height: '80px', background: '#333', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Store color="#666" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <span style={{ fontSize: '12px', color: '#FF5A00', fontWeight: 600 }}>{shop.category}</span>
                                            <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '2px 0 6px' }}>{shop.name}</h3>
                                        </div>
                                        <Heart
                                            size={20}
                                            fill="#FF5A00"
                                            color="#FF5A00"
                                            onClick={(e) => removeFavorite(shop.id, e)}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#888' }}>
                                        <Star size={14} fill="#FFD700" color="#FFD700" />
                                        <span>4.8</span>
                                        <span style={{ margin: '0 4px' }}>•</span>
                                        <MapPin size={14} />
                                        <span>경동시장 내</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
