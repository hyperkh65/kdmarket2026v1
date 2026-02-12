'use client';

import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import styles from './page.module.css';
import { Package, Truck, CheckCircle, AlertCircle } from 'lucide-react';
import NotificationCenter from '@/components/NotificationCenter';

// Force dynamic rendering for admin dashboard
export const dynamic = 'force-dynamic';

interface Order {
    id: string;
    status: string;
    total_estimated: number;
    created_at: string;
    user_id: string;
    items?: any[];
}

export default function AdminPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL'); // ALL, RECEIVED, PICKING, SHIPPED

    const fetchOrders = async () => {
        setLoading(true);
        let query = supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    shop_id, name, qty, price_estimated
                )
            `)
            .order('created_at', { ascending: false });

        if (filter !== 'ALL') {
            query = query.eq('status', filter);
        }

        const { data, error } = await query;
        if (error) console.error('Error fetching orders:', error);
        else setOrders(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchOrders();
        // Setup realtime subscription later for live updates
    }, [filter]);

    const updateStatus = async (orderId: string, newStatus: string) => {
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);

        if (error) {
            alert('상태 변경 실패: ' + error.message);
        } else {
            // Optimistic update
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const colors: any = {
            RECEIVED: '#3498db',
            PICKING: '#f39c12',
            PACKING: '#9b59b6',
            SHIPPED: '#2ecc71',
            DELIVERED: '#27ae60',
            CANCELED: '#e74c3c'
        };
        return (
            <span className={styles.badge} style={{ backgroundColor: colors[status] || '#999' }}>
                {status}
            </span>
        );
    };

    return (
        <main className={styles.container}>
            <NotificationCenter />
            <header className={styles.header}>
                <h1>운영자 콘솔 (Admin)</h1>
                <div className={styles.filters}>
                    <button onClick={() => setFilter('ALL')} className={filter === 'ALL' ? styles.activeFilter : ''}>전체</button>
                    <button onClick={() => setFilter('RECEIVED')} className={filter === 'RECEIVED' ? styles.activeFilter : ''}>접수됨</button>
                    <button onClick={() => setFilter('PICKING')} className={filter === 'PICKING' ? styles.activeFilter : ''}>피킹중</button>
                    <button onClick={() => setFilter('SHIPPED')} className={filter === 'SHIPPED' ? styles.activeFilter : ''}>배송중</button>
                </div>
            </header>

            <div className={styles.orderList}>
                {loading ? (
                    <div className={styles.loading}>로딩중...</div>
                ) : orders.length === 0 ? (
                    <div className={styles.empty}>주문이 없습니다.</div>
                ) : (
                    orders.map((order) => (
                        <div key={order.id} className={styles.orderCard}>
                            <div className={styles.cardHeader}>
                                <div>
                                    <span className={styles.orderId}>#{order.id.slice(0, 8)}</span>
                                    <span className={styles.date}>{new Date(order.created_at).toLocaleString()}</span>
                                </div>
                                <StatusBadge status={order.status} />
                            </div>

                            <div className={styles.items}>
                                {order.order_items?.map((item: any, idx: number) => (
                                    <div key={idx} className={styles.itemRow}>
                                        <span>{item.name} x {item.qty}</span>
                                        <span>{item.price_estimated.toLocaleString()}원</span>
                                    </div>
                                ))}
                            </div>

                            <div className={styles.cardFooter}>
                                <div className={styles.total}>
                                    합계: {order.total_estimated?.toLocaleString()}원
                                </div>
                                <div className={styles.actions}>
                                    {order.status === 'RECEIVED' && (
                                        <button onClick={() => updateStatus(order.id, 'PICKING')} className={styles.actionBtn}>
                                            <Package size={16} /> 피킹 시작
                                        </button>
                                    )}
                                    {order.status === 'PICKING' && (
                                        <button onClick={() => updateStatus(order.id, 'PACKING')} className={styles.actionBtn}>
                                            <CheckCircle size={16} /> 피킹 완료
                                        </button>
                                    )}
                                    {order.status === 'PACKING' && (
                                        <button onClick={() => updateStatus(order.id, 'SHIPPED')} className={styles.actionBtn}>
                                            <Truck size={16} /> 배송 시작
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </main>
    );
}
