'use client';

import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import styles from './cart.module.css';
import { Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

export default function CartPage() {
    const { items, removeItem, clearCart, totalPrice } = useCart();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Group items by shop for display
    const groupedItems = items.reduce((acc: Record<string, typeof items>, item) => {
        if (!acc[item.shopName]) acc[item.shopName] = [];
        acc[item.shopName].push(item);
        return acc;
    }, {} as Record<string, typeof items>);

    const handleCheckout = async () => {
        if (items.length === 0) return;

        const confirmOrder = confirm('주문을 접수하시겠습니까?\n(MVP 버전이라 실제 결제는 연동되지 않습니다)');
        if (!confirmOrder) return;

        setIsSubmitting(true);
        try {
            const user = (await supabase.auth.getUser()).data.user;
            let userId = user?.id;

            if (!userId) {
                // MVP: Allow testing without login by using a temporary UUID
                // In production, force login.
                console.warn("No user logged in, using guest ID for MVP demo");
                userId = uuidv4();

                // Note: This relies on Supabase RLS being open or handling this guest ID.
                // For true guest checkout, usually you create an anon user.
            }

            // Create Order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: userId,
                    delivery_type: 'PARCEL', // Default for now
                    address: { address: '서울시 동대문구...', detail: '101호' },
                    phone: '010-0000-0000',
                    total_estimated: totalPrice,
                    status: 'RECEIVED'
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // Create Order Items
            const orderItems = items.map((item: any) => ({
                order_id: order.id,
                shop_id: item.shopId,
                name: item.name,
                price_estimated: item.price,
                qty: item.qty
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            alert('주문이 성공적으로 접수되었습니다!');
            clearCart();
            router.push('/');

        } catch (error: any) {
            console.error('Checkout error:', error);
            alert('주문 실패: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <Link href="/"><ArrowLeft /></Link>
                <h1>장바구니</h1>
            </header>

            <div className={styles.content}>
                {items.length === 0 ? (
                    <div className={styles.empty}>장바구니가 비어있습니다.</div>
                ) : (
                    Object.entries(groupedItems).map(([shopName, shopItems]) => {
                        const typedItems = shopItems as typeof items;
                        return (
                            <div key={shopName} className={styles.shopGroup}>
                                <h3 className={styles.shopTitle}>{shopName}</h3>
                                {typedItems.map((item) => (
                                    <div key={item.id} className={styles.itemRow}>
                                        <div>
                                            <div className={styles.itemName}>{item.name}</div>
                                            <div className={styles.itemPrice}>{item.price.toLocaleString()}원</div>
                                        </div>
                                        <button onClick={() => removeItem(item.id)} className={styles.removeBtn}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        );
                    })
                )}
            </div>

            <div className={styles.footer}>
                <div className={styles.totalRow}>
                    <span>총 결제예정금액</span>
                    <span className={styles.totalPrice}>{totalPrice.toLocaleString()}원</span>
                </div>
                <button
                    className={styles.checkoutBtn}
                    onClick={handleCheckout}
                    disabled={items.length === 0 || isSubmitting}
                >
                    {isSubmitting ? '처리 중...' : '주문 접수하기'}
                </button>
            </div>
        </main>
    );
}
