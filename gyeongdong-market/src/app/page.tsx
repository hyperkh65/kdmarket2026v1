'use client';

// Dynamic import for Leaflet to avoid SSR issues
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import styles from './page.module.css'; // Will create this next
import { supabase } from '@/lib/supabaseClient';
import { ShoppingBag, Search, Menu } from 'lucide-react';
import Link from 'next/link';

// Use dynamic import for Map to prevent SSR issues with Leaflet
const Map = dynamic(() => import('@/components/Map'), {
    ssr: false,
    loading: () => <p>지도를 불러오는 중...</p>
});

interface Shop {
    id: string;
    name: string;
    category: string;
    lat: number;
    lng: number;
}

export default function Home() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

    useEffect(() => {
        async function fetchShops() {
            const { data, error } = await supabase
                .from('shops')
                .select('*')
                .limit(50);

            if (data) {
                // Ensure data matches Shop interface (e.g. fill defaults if needed)
                const validShops: Shop[] = data.map(item => ({
                    id: item.id,
                    name: item.name,
                    category: item.category || '기타',
                    lat: item.lat || 37.5804, // Default fallback
                    lng: item.lng || 127.0384
                }));
                setShops(validShops);
            }
            if (error) console.error('Error fetching shops:', error);
        }
        fetchShops();
    }, []);

    return (
        <main className={styles.container}>
            {/* 1. Header (Floating Search Bar) */}
            <header className={styles.header}>
                <div className={styles.searchBar}>
                    <Menu size={20} className={styles.menuIcon} />
                    <input type="text" placeholder="경동시장 가게 찾기 (예: 건어물)" className={styles.searchInput} />
                    <Search size={20} className={styles.searchIcon} />
                </div>
            </header>

            {/* 2. Map (Full Screen) */}
            <div className={styles.mapContainer}>
                <Map shops={shops} onShopSelect={setSelectedShop} />
            </div>

            {/* 3. Bottom Shop Drawer Area */}
            <div className={styles.bottomBar}>
                {selectedShop && (
                    <div className={styles.shopCard}>
                        <h3>{selectedShop.name}</h3>
                        <p className={styles.category}>{selectedShop.category}</p>
                        <div className={styles.actions}>
                            <Link href={`/shop/${selectedShop.id}`} className={styles.detailButton} style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}>
                                상세보기
                            </Link>
                            <button className={styles.closeButton} onClick={() => setSelectedShop(null)}>닫기</button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
