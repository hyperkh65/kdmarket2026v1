'use client';

import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { CheckCircle, XCircle, Camera, Package, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface OrderItem {
    id: string;
    name: string;
    qty: number;
    price_estimated: number;
    status: string;
    shop_id: string;
}

interface Order {
    id: string;
    status: string;
    created_at: string;
    order_items: OrderItem[];
}

export default function PickerPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchPickingOrders();
    }, []);

    const fetchPickingOrders = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (*)
            `)
            .in('status', ['RECEIVED', 'PICKING'])
            .order('created_at', { ascending: true });

        if (error) console.error('Error fetching orders:', error);
        else setOrders(data || []);
        setLoading(false);
    };

    const startPicking = async (orderId: string) => {
        const { error } = await supabase
            .from('orders')
            .update({ status: 'PICKING' })
            .eq('id', orderId);

        if (!error) {
            const order = orders.find(o => o.id === orderId);
            if (order) setSelectedOrder({ ...order, status: 'PICKING' });
        }
    };

    const markItemStatus = async (itemId: string, status: 'PICKED' | 'OUT_OF_STOCK') => {
        const { error } = await supabase
            .from('order_items')
            .update({ status })
            .eq('id', itemId);

        if (!error && selectedOrder) {
            setSelectedOrder({
                ...selectedOrder,
                order_items: selectedOrder.order_items.map(item =>
                    item.id === itemId ? { ...item, status } : item
                )
            });
        }
    };

    const completePicking = async () => {
        if (!selectedOrder) return;

        const allPicked = selectedOrder.order_items.every(
            item => item.status === 'PICKED' || item.status === 'OUT_OF_STOCK'
        );

        if (!allPicked) {
            alert('모든 품목을 처리해주세요.');
            return;
        }

        const { error } = await supabase
            .from('orders')
            .update({ status: 'PACKING' })
            .eq('id', selectedOrder.id);

        if (!error) {
            alert('피킹 완료! 합포장 단계로 이동합니다.');
            setSelectedOrder(null);
            fetchPickingOrders();
        }
    };

    if (selectedOrder) {
        return (
            <main className={styles.container}>
                <header className={styles.header}>
                    <button onClick={() => setSelectedOrder(null)} className={styles.backBtn}>
                        <ArrowLeft />
                    </button>
                    <h1>주문 #{selectedOrder.id.slice(0, 8)}</h1>
                </header>

                <div className={styles.content}>
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{
                            width: `${(selectedOrder.order_items.filter(i => i.status === 'PICKED').length / selectedOrder.order_items.length) * 100}%`
                        }} />
                    </div>

                    <div className={styles.itemList}>
                        {selectedOrder.order_items.map((item) => (
                            <div key={item.id} className={styles.itemCard}>
                                <div className={styles.itemInfo}>
                                    <h3>{item.name}</h3>
                                    <p>수량: {item.qty}개 | 예상가: {item.price_estimated.toLocaleString()}원</p>
                                </div>
                                <div className={styles.itemActions}>
                                    {item.status === 'PICKED' ? (
                                        <div className={styles.statusBadge} style={{ background: '#2ecc71' }}>
                                            <CheckCircle size={16} /> 완료
                                        </div>
                                    ) : item.status === 'OUT_OF_STOCK' ? (
                                        <div className={styles.statusBadge} style={{ background: '#e74c3c' }}>
                                            <XCircle size={16} /> 품절
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => markItemStatus(item.id, 'PICKED')}
                                                className={styles.pickBtn}
                                            >
                                                <CheckCircle size={16} /> 구매완료
                                            </button>
                                            <button
                                                onClick={() => markItemStatus(item.id, 'OUT_OF_STOCK')}
                                                className={styles.outOfStockBtn}
                                            >
                                                <XCircle size={16} /> 품절
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.footer}>
                    <button onClick={completePicking} className={styles.completeBtn}>
                        <Package size={20} /> 피킹 완료 (합포장으로)
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <h1>피커 대시보드</h1>
                <Link href="/admin" className={styles.adminLink}>관리자</Link>
            </header>

            <div className={styles.content}>
                {loading ? (
                    <div className={styles.loading}>로딩중...</div>
                ) : orders.length === 0 ? (
                    <div className={styles.empty}>대기 중인 주문이 없습니다.</div>
                ) : (
                    <div className={styles.orderList}>
                        {orders.map((order) => (
                            <div key={order.id} className={styles.orderCard}>
                                <div className={styles.cardHeader}>
                                    <span className={styles.orderId}>#{order.id.slice(0, 8)}</span>
                                    <span className={styles.badge} style={{
                                        background: order.status === 'RECEIVED' ? '#3498db' : '#f39c12'
                                    }}>
                                        {order.status}
                                    </span>
                                </div>
                                <div className={styles.cardBody}>
                                    <p>{order.order_items?.length || 0}개 품목</p>
                                    <p className={styles.time}>{new Date(order.created_at).toLocaleString()}</p>
                                </div>
                                <button
                                    onClick={() => order.status === 'RECEIVED'
                                        ? startPicking(order.id)
                                        : setSelectedOrder(order)
                                    }
                                    className={styles.startBtn}
                                >
                                    {order.status === 'RECEIVED' ? '피킹 시작' : '계속하기'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
