'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import styles from './page.module.css';
import { ArrowLeft, Edit2, ShieldCheck, MapPin, Phone, Clock, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import WikiEditor from '@/components/WikiEditor';

// Mock data for MVP usage since we don't have full product data in DB yet
const MOCK_PRODUCTS = [
    { name: '건오징어 (1축)', price: 45000 },
    { name: '국산 쥐포 (10장)', price: 12000 },
    { name: '멸치 (볶음용 1kg)', price: 18000 }
];

export default function ShopDetailClient({ shop }: { shop: any }) {
    const { addItem } = useCart();
    const [isWikiOpen, setIsWikiOpen] = useState(false);

    const handleAddToCart = (productName: string, price: number) => {
        addItem({
            id: `${shop.id}-${productName}-${Date.now()}`,
            shopId: shop.id,
            shopName: shop.name,
            name: productName,
            price: price,
            qty: 1
        });
        alert('장바구니에 담겼습니다!');
    };

    return (
        <main className={styles.container}>
            {/* Header Image Area */}
            <div className={styles.imageHeader}>
                <div className={styles.placeholderImage}>
                    <span>{shop.name}</span>
                </div>
                <Link href="/" className={styles.backButton}>
                    <ArrowLeft color="white" />
                </Link>
            </div>

            {/* Content Area */}
            <div className={styles.content}>
                <div className={styles.titleRow}>
                    <h1>{shop.name}</h1>
                    {shop.is_verified && <ShieldCheck className={styles.verifiedIcon} size={20} />}
                </div>
                <p className={styles.category}>{shop.category}</p>

                {/* Wiki Info Section */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>기본 정보</h2>
                        <button className={styles.editButton} onClick={() => setIsWikiOpen(true)}>
                            <Edit2 size={14} />정보 수정
                        </button>
                    </div>

                    <div className={styles.infoRow}>
                        <Clock size={16} />
                        <span>{shop.hours_text || '영업시간 정보 없음'}</span>
                    </div>
                    <div className={styles.infoRow}>
                        <MapPin size={16} />
                        <span>섹터 {shop.zone_id || '미지정'}</span>
                    </div>
                    {shop.phone && (
                        <div className={styles.infoRow}>
                            <Phone size={16} />
                            <a href={`tel:${shop.phone}`}>{shop.phone}</a>
                        </div>
                    )}
                </div>

                {/* Menu / Items History */}
                <div className={styles.section}>
                    <h2>주요 품목 & 가격</h2>
                    <div className={styles.wikiAlert}>
                        📢 가격은 변동될 수 있습니다.
                    </div>
                    <ul className={styles.priceList}>
                        {MOCK_PRODUCTS.map((p) => (
                            <li key={p.name}>
                                <div>
                                    <div>{p.name}</div>
                                    <div className={styles.price}>{p.price.toLocaleString()}원</div>
                                </div>
                                <button className={styles.smallAddButton} onClick={() => handleAddToCart(p.name, p.price)}>
                                    담기
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Floating Action Button for Ordering */}
            <div className={styles.fabContainer}>
                <Link href="/cart" className={styles.orderButton} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                    <ShoppingCart size={20} /> 장바구니 확인하기
                </Link>
            </div>

            {/* Wiki Editor Modal */}
            {isWikiOpen && <WikiEditor shopId={shop.id} onClose={() => setIsWikiOpen(false)} />}
        </main>
    );
}
