'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ChevronLeft, Package, Truck, ShoppingBag, ChevronRight } from 'lucide-react';
import { Order } from '@/types/order';

export default function MyOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const fetchOrders = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Check if user is admin
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            const isUserAdmin = profile?.role === 'ADMIN';
            setIsAdmin(isUserAdmin);

            let query = supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            // If not admin, only show own orders
            if (!isUserAdmin) {
                query = query.eq('user_id', user.id);
            }

            const { data, error } = await query;

            if (error) console.error('Error fetching orders:', error);
            if (data) setOrders(data as Order[]);
            setLoading(false);
        };
        fetchOrders();
    }, [router]);

    if (loading) return (
        <div style={{ padding: '20px', background: '#121212', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            불러오는 중...
        </div>
    );

    return (
        <div style={{ padding: '0 0 100px', background: '#121212', minHeight: '100vh', color: 'white' }}>
            <header style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #222' }}>
                <ChevronLeft onClick={() => router.back()} style={{ cursor: 'pointer' }} />
                <h1 style={{ fontSize: '18px', fontWeight: 600 }}>
                    {isAdmin ? '전체 주문 관리 (관리자)' : '주문/배송 조회'}
                </h1>
            </header>

            <main style={{ padding: '20px' }}>
                {orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', border: '1px solid #222', borderRadius: '16px' }}>
                        <ShoppingBag size={48} color="#333" style={{ margin: '0 auto 16px' }} />
                        <p style={{ color: '#555' }}>주문 내역이 없습니다.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                onClick={() => router.push(`/my/orders/${order.id}`)}
                                style={{ background: '#1E1E1E', borderRadius: '16px', padding: '16px', border: '1px solid #333', cursor: 'pointer' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '12px', color: '#888' }}>
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </span>
                                    <span style={{
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        color: ['delivered', 'shipping'].includes(order.status) ? '#4CAF50' :
                                            ['purchasing', 'preparing'].includes(order.status) ? '#FFC107' : '#fff'
                                    }}>
                                        {order.status === 'pending' ? '접수 대기' :
                                            order.status === 'confirmed' ? '주문 확인' :
                                                order.status === 'purchasing' ? '구매 진행 중' :
                                                    order.status === 'preparing' ? '배송 준비 중' :
                                                        order.status === 'shipping' ? '배송 중' :
                                                            order.status === 'delivered' ? '배송 완료' : '취소됨'}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>
                                            주문번호 {order.order_number}
                                        </p>
                                        <p style={{ fontSize: '13px', color: '#aaa' }}>
                                            총 {order.total_amount.toLocaleString()}원
                                        </p>
                                    </div>
                                    <ChevronRight size={20} color="#555" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
