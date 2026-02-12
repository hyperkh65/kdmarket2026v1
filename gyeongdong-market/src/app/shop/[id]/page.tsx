import { supabase } from '@/lib/supabaseClient';
import styles from './page.module.css';
import ShopDetailClient from './ShopDetailClient';

// Force dynamic rendering for SEO and real-time data
export const dynamic = 'force-dynamic';

export default async function ShopDetail({ params }: { params: { id: string } }) {
    const { id } = params;

    // 1. Fetch Shop Data (Server-side)
    const { data: shop, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !shop) {
        return <div className={styles.error}>가게를 찾을 수 없습니다.</div>;
    }

    return <ShopDetailClient shop={shop} />;
}
