'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ChevronLeft, Star, Trash2, Store } from 'lucide-react';

export default function MyReviewsPage() {
    const router = useRouter();
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyReviews = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data, error } = await supabase
                .from('reviews')
                .select(`
                    *,
                    shops (name)
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (data) {
                setReviews(data);
            }
            setLoading(false);
        };
        fetchMyReviews();
    }, [router]);

    const handleDelete = async (reviewId: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
        if (!error) {
            setReviews(reviews.filter(r => r.id !== reviewId));
        } else {
            alert('삭제 실패: ' + error.message);
        }
    };

    return (
        <div style={{ padding: '0 0 100px', background: '#121212', minHeight: '100vh', color: 'white', maxWidth: '500px', margin: '0 auto' }}>
            <header style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #222', position: 'sticky', top: 0, background: '#121212', zIndex: 10 }}>
                <ChevronLeft onClick={() => router.back()} style={{ cursor: 'pointer' }} />
                <h1 style={{ fontSize: '18px', fontWeight: 600 }}>후기 및 제안한 장소</h1>
            </header>

            <main style={{ padding: '20px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', marginTop: '40px', color: '#666' }}>불러오는 중...</div>
                ) : reviews.length === 0 ? (
                    <div style={{ textAlign: 'center', marginTop: '100px' }}>
                        <p style={{ color: '#888', fontSize: '15px' }}>작성한 후기가 없습니다.<br />시장의 숨은 맛집들을 리뷰해 보세요!</p>
                        <button
                            onClick={() => router.push('/explore')}
                            style={{ marginTop: '20px', padding: '12px 24px', borderRadius: '10px', background: '#FF5A00', border: 'none', color: 'white', fontWeight: 600 }}
                        >
                            가게 구경하러 가기
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {reviews.map((review) => (
                            <div
                                key={review.id}
                                onClick={() => router.push(`/shop/${review.shop_id}`)}
                                style={{ padding: '16px', background: '#1E1E1E', borderRadius: '16px', cursor: 'pointer' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Store size={16} color="#FF5A00" />
                                        <span style={{ fontWeight: 700, fontSize: '15px' }}>{review.shops?.name || '정보 없음'}</span>
                                    </div>
                                    <Trash2 size={16} color="#555" onClick={(e) => { e.stopPropagation(); handleDelete(review.id); }} />
                                </div>
                                <div style={{ display: 'flex', gap: '2px', marginBottom: '8px' }}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Star key={star} size={14} fill={star <= review.rating ? "#FFD700" : "none"} color={star <= review.rating ? "#FFD700" : "#333"} />
                                    ))}
                                </div>
                                <p style={{ fontSize: '14px', color: '#ddd', marginBottom: '12px', lineHeight: 1.5 }}>{review.text}</p>
                                {review.photo_urls && review.photo_urls.length > 0 && (
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', overflowX: 'auto' }}>
                                        {review.photo_urls.map((url: string, idx: number) => (
                                            <img key={idx} src={url} alt="review" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                                        ))}
                                    </div>
                                )}
                                <div style={{ fontSize: '11px', color: '#666' }}>
                                    {new Date(review.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
