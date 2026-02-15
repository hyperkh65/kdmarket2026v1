'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import styles from './page.module.css';
import { ShoppingBag, Star, Share2, ChevronLeft, MapPin, Edit3 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import WikiEditor from '@/components/WikiEditor';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ShopDetailClient({ params }: { params: { id: string } }) {
    const [shop, setShop] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('menu');
    const [isWikiOpen, setIsWikiOpen] = useState(false);
    const { addItem, items } = useCart();
    const router = useRouter();

    // Mock items for MVP
    const mockItems = [
        { id: '1', name: '6년근 고려홍삼 300g', price: 120000 },
        { id: '2', name: '가정용 건삼 500g', price: 45000 },
        { id: '3', name: '홍삼 절편 선물세트', price: 35000 },
    ];

    useEffect(() => {
        async function fetchShop() {
            const { data } = await supabase.from('shops').select('*').eq('id', params.id).single();
            if (data) setShop(data);
        }
        fetchShop();
    }, [params.id]);

    if (!shop) return <div style={{ padding: '20px' }}>로딩중...</div>;

    const cartItemCount = items.length;

    return (
        <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
            {/* Hero Section */}
            <div className={styles.hero}>
                <img src={`https://source.unsplash.com/800x600/?market,store,${shop.category}`}
                    alt={shop.name}
                    className={styles.heroImage}
                    onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/800x600?text=Shop+Image'}
                />
                <div className={styles.headerOverlay}>
                    <button className={styles.backButton} onClick={() => router.back()}>
                        <ChevronLeft size={24} />
                    </button>
                    <button className={styles.backButton}>
                        <Share2 size={20} />
                    </button>
                </div>
            </div>

            {/* Content Container */}
            <div className={styles.contentContainer}>
                <h1 className={styles.shopName}>{shop.name}</h1>
                <div className={styles.meta}>
                    <span className={styles.rating}>
                        <Star size={16} className={styles.star} fill="#FFC107" />
                        4.8 (124)
                    </span>
                    <span>•</span>
                    <span>{shop.category || '일반'}</span>
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'menu' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('menu')}
                    >
                        메뉴
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'wiki' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('wiki')}
                    >
                        위키
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'info' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('info')}
                    >
                        정보
                    </button>
                </div>

                {/* Tab Content: Menu */}
                {activeTab === 'menu' && (
                    <div className={styles.section}>
                        {mockItems.map(item => (
                            <div key={item.id} className={styles.menuItem}>
                                <div className={styles.itemInfo}>
                                    <h4>{item.name}</h4>
                                    <p className={styles.itemPrice}>{item.price.toLocaleString()}원</p>
                                </div>
                                <button className={styles.addButton} onClick={() => addItem({
                                    id: Date.now().toString(), // Simple ID generation for MVP
                                    shopId: shop.id,
                                    shopName: shop.name,
                                    name: item.name,
                                    price: item.price,
                                    qty: 1
                                })} style={{
                                    border: '1px solid #ddd', padding: '6px 12px', borderRadius: '14px', background: 'white', fontSize: '12px'
                                }}>
                                    담기
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tab Content: Wiki */}
                {activeTab === 'wiki' && (
                    <div className={styles.section}>
                        <div style={{ background: '#f0f4ff', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#333' }}>
                                <Edit3 size={16} /> 우리가 만드는 시장 정보
                            </h4>
                            <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.5' }}>
                                이 가게의 숨겨진 팁이나 변경된 정보를 공유해주세요. 여러분의 제보가 시장을 더 편리하게 만듭니다.
                            </p>
                            <button onClick={() => setIsWikiOpen(true)} style={{
                                width: '100%', marginTop: '12px', padding: '10px', background: '#3498db', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600
                            }}>
                                정보 수정 제안하기
                            </button>
                        </div>
                        {/* Wiki History Placeholder */}
                        <div style={{ marginLeft: '10px', paddingLeft: '10px', borderLeft: '2px solid #eee' }}>
                            <div style={{ marginBottom: '12px' }}>
                                <div style={{ fontSize: '12px', color: '#888' }}>2024.10.15</div>
                                <div style={{ fontSize: '14px' }}>영업시간이 18:00까지로 변경되었습니다.</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Content: Info */}
                {activeTab === 'info' && (
                    <div className={styles.section}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: '#555' }}>
                            <MapPin size={18} />
                            <span>서울 동대문구 고산자로36길 3</span>
                        </div>
                        <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
                            {shop.description || '사장님이 직접 산지에서 가져온 신선한 재료만 취급합니다. 30년 전통의 믿을 수 있는 가게입니다.'}
                        </p>
                    </div>
                )}
            </div>

            {/* Floating Cart Button */}
            {cartItemCount > 0 && (
                <div className={styles.floatingCart} onClick={() => router.push('/cart')}>
                    <span className={styles.cartCount}>{cartItemCount}개 담김</span>
                    <button className={styles.addToCartBtn}>
                        장바구니 보기
                    </button>
                    <ShoppingBag size={20} />
                </div>
            )}

            {isWikiOpen && <WikiEditor shopId={shop.id} onClose={() => setIsWikiOpen(false)} />}
        </div>
    );
}
