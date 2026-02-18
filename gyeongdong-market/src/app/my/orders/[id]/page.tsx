'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ChevronLeft, Package, Truck, CheckCircle, Clock, ShoppingCart, User, Phone, MapPin } from 'lucide-react';
import { Order, OrderItem } from '@/types/order';

export default function OrderDetailPage() {
    const router = useRouter();
    const params = useParams();
    const [order, setOrder] = useState<Order | null>(null);
    const [items, setItems] = useState<OrderItem[]>([]);
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);

    const [isAdmin, setIsAdmin] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Admin Edit State
    const [editData, setEditData] = useState({
        status: '',
        courier_name: '',
        courier_contact: '',
        tracking_number: '',
        purchase_proof_images: '',
        tracking_images: ''
    });

    useEffect(() => {
        const fetchOrderAndCheckRole = async () => {
            if (!params.id) return;

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                setIsAdmin(profile?.role === 'ADMIN');
            }

            const fetchOrderData = async () => {
                const { data: orderData, error: orderError } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('id', params.id)
                    .single();

                if (orderError) {
                    alert('주문 정보를 불러오지 못했습니다.');
                    router.back();
                    return;
                }

                setOrder(orderData as Order);
                setEditData({
                    status: orderData.status,
                    courier_name: orderData.courier_name || '',
                    courier_contact: orderData.courier_contact || '',
                    tracking_number: orderData.tracking_number || '',
                    purchase_proof_images: orderData.purchase_proof_images ? orderData.purchase_proof_images.join(', ') : '',
                    tracking_images: orderData.tracking_images ? orderData.tracking_images.join(', ') : ''
                });

                const { data: itemsData } = await supabase
                    .from('order_items')
                    .select(`
                        *,
                        shop:shops(name)
                    `)
                    .eq('order_id', params.id);

                if (itemsData) setItems(itemsData as any[]);
                setLoading(false);
            };

            fetchOrderData();

            // Realtime Subscription
            const channel = supabase
                .channel(`order_detail_${params.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'orders',
                        filter: `id=eq.${params.id}`
                    },
                    (payload) => {
                        console.log('Realtime update received:', payload);
                        setOrder(payload.new as Order);
                        // Also update edit data to reflect remote changes if not currently editing? 
                        // For simplicity, we just update the view.
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        };

        fetchOrderAndCheckRole();
    }, [params.id, router]);

    const handleUpdateOrder = async () => {
        if (!order) return;
        setLoading(true);
        try {
            const updates: any = {
                status: editData.status,
                courier_name: editData.courier_name,
                courier_contact: editData.courier_contact,
                tracking_number: editData.tracking_number,
                purchase_proof_images: editData.purchase_proof_images
                    ? editData.purchase_proof_images.split(',').map(s => s.trim()).filter(s => s)
                    : [],
                tracking_images: editData.tracking_images
                    ? editData.tracking_images.split(',').map(s => s.trim()).filter(s => s)
                    : [],
            };

            // Status specific timestamp logic (optional, can be handled by trigger or here)
            if (updates.status === 'shipping' && !order.shipped_at) updates.shipped_at = new Date().toISOString();
            if (updates.status === 'delivered' && !order.delivered_at) updates.delivered_at = new Date().toISOString();

            const { error } = await supabase
                .from('orders')
                .update(updates)
                .eq('id', order.id);

            if (error) throw error;

            alert('주문 상태가 업데이트되었습니다.');
            setIsEditing(false);
            // State will be updated via Realtime or we can manually update
            setOrder({ ...order, ...updates });
        } catch (error: any) {
            alert('업데이트 오류: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'purchase_proof_images' | 'tracking_images') => {
        if (!e.target.files || !order) return;
        const files = Array.from(e.target.files);
        setLoading(true);
        const newUrls: string[] = [];
        try {
            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${order.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('images')
                    .upload(`proofs/${fileName}`, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('images')
                    .getPublicUrl(`proofs/${fileName}`);

                newUrls.push(publicUrl);
            }

            const current = editData[field] ? editData[field].split(',').map(s => s.trim()).filter(s => s) : [];
            const updated = [...current, ...newUrls].join(', ');

            setEditData(prev => ({ ...prev, [field]: updated }));
            alert(`${newUrls.length}장의 사진이 업로드되었습니다.`);
        } catch (error: any) {
            alert('이미지 업로드 실패: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !order) return (
        <div style={{ padding: '20px', background: '#121212', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            불러오는 중...
        </div>
    );

    const steps = [
        { id: 'pending', label: '주문접수', icon: <Clock size={16} /> },
        { id: 'purchasing', label: '구매진행', icon: <ShoppingCart size={16} /> },
        { id: 'preparing', label: '배송준비', icon: <Package size={16} /> },
        { id: 'shipping', label: '배송중', icon: <Truck size={16} /> },
        { id: 'delivered', label: '도착완료', icon: <CheckCircle size={16} /> },
    ];

    const currentStepIndex = steps.findIndex(s => s.id === order.status) !== -1
        ? steps.findIndex(s => s.id === order.status)
        : order.status === 'confirmed' ? 0 : -1;

    return (
        <div style={{ padding: '0 0 100px', background: '#121212', minHeight: '100vh', color: 'white' }}>
            <header style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #222', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ChevronLeft onClick={() => router.back()} style={{ cursor: 'pointer' }} />
                    <h1 style={{ fontSize: '18px', fontWeight: 600 }}>주문 상세 내역</h1>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        style={{ background: isEditing ? '#FF5A00' : '#333', border: 'none', padding: '6px 12px', borderRadius: '4px', color: 'white', fontSize: '12px', fontWeight: 600 }}
                    >
                        {isEditing ? '편집 취소' : '관리자 편집'}
                    </button>
                )}
            </header>

            <main style={{ padding: '20px' }}>
                {/* Admin Controls */}
                {isAdmin && isEditing && (
                    <div style={{ background: '#2C2C2C', borderRadius: '16px', padding: '20px', marginBottom: '20px', border: '1px solid #444' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#FF5A00' }}>관리자 컨트롤 패널</h3>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#aaa' }}>진행 상태</label>
                            <select
                                value={editData.status}
                                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#444', color: 'white', border: 'none' }}
                            >
                                {steps.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                <option value="confirmed">주문 확인</option>
                                <option value="cancelled">취소됨</option>
                            </select>
                        </div>

                        {/* Additional Fields based on status */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#aaa' }}>구매 인증 사진 추가</label>
                            <input type="file" multiple accept="image/*" onChange={(e) => handleImageUpload(e, 'purchase_proof_images')} style={{ color: '#aaa', fontSize: '12px' }} />
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#aaa' }}>배송 정보 (택배사/기사님)</label>
                            <input
                                type="text"
                                value={editData.courier_name}
                                onChange={(e) => setEditData({ ...editData, courier_name: e.target.value })}
                                placeholder="예: CJ대한통운 김배송"
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#444', color: 'white', border: 'none', marginBottom: '8px' }}
                            />
                            <input
                                type="text"
                                value={editData.tracking_number}
                                onChange={(e) => setEditData({ ...editData, tracking_number: e.target.value })}
                                placeholder="운송장번호"
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#444', color: 'white', border: 'none' }}
                            />
                        </div>

                        <button
                            onClick={handleUpdateOrder}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#FF5A00', color: 'white', border: 'none', fontWeight: 700 }}
                        >
                            변경사항 저장 및 고객 알림
                        </button>
                    </div>
                )}

                {/* Order Status Timeline */}
                <div style={{ background: '#1E1E1E', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                        {/* Connecting Line */}
                        <div style={{ position: 'absolute', top: '12px', left: '0', right: '0', height: '2px', background: '#333', zIndex: 0 }} />

                        {steps.map((step, index) => {
                            const isCompleted = index <= currentStepIndex;
                            const isActive = index === currentStepIndex;

                            return (
                                <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, position: 'relative' }}>
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: isCompleted ? '#FF5A00' : '#333',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '8px',
                                        border: isActive ? '3px solid #121212' : 'none',
                                        boxShadow: isActive ? '0 0 0 2px #FF5A00' : 'none'
                                    }}>
                                        <span style={{ color: isCompleted ? 'white' : '#666' }}>{step.icon}</span>
                                    </div>
                                    <span style={{ fontSize: '10px', color: isCompleted ? '#fff' : '#666', fontWeight: isCompleted ? 600 : 400 }}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Status Specific Info */}
                {order.purchase_proof_images && order.purchase_proof_images.length > 0 && (
                    <div style={{ background: '#252525', borderRadius: '16px', padding: '20px', marginBottom: '20px', border: '1px solid #333' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#FFC107', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <ShoppingCart size={16} /> 구매 완료 인증
                        </h3>
                        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                            {order.purchase_proof_images.map((img, idx) => (
                                <img key={idx} src={img} alt="구매 인증" style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', background: '#333' }} />
                            ))}
                        </div>
                    </div>
                )}

                {(order.courier_name || order.tracking_number) && (
                    <div style={{ background: '#252525', borderRadius: '16px', padding: '20px', marginBottom: '20px', border: '1px solid #333' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#2196F3', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Truck size={16} /> 배송 정보
                        </h3>
                        {order.courier_name && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                                <span style={{ color: '#aaa' }}>배송담당/택배사</span>
                                <span>{order.courier_name}</span>
                            </div>
                        )}
                        {order.courier_contact && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                                <span style={{ color: '#aaa' }}>연락처</span>
                                <a href={`tel:${order.courier_contact}`} style={{ color: '#FF5A00', textDecoration: 'underline' }}>{order.courier_contact}</a>
                            </div>
                        )}
                        {order.tracking_number && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                <span style={{ color: '#aaa' }}>운송장번호</span>
                                <span>{order.tracking_number}</span>
                            </div>
                        )}
                    </div>
                )}


                {/* Order Items */}
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#888', marginBottom: '12px' }}>주문 상품</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {items.map((item) => (
                            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#1E1E1E', padding: '12px', borderRadius: '12px' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: '#333', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {!imageErrors[item.id] && (item.product_image_url || '/placeholder.png') ? (
                                        <img
                                            src={item.product_image_url || '/placeholder.png'}
                                            alt={item.product_name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={() => setImageErrors((prev: Record<string, boolean>) => ({ ...prev, [item.id]: true }))}
                                        />
                                    ) : (
                                        <Package size={24} color="#555" />
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    {item.shop && (
                                        <p style={{ fontSize: '12px', color: '#aaa', marginBottom: '4px', fontWeight: 600 }}>
                                            {item.shop.name} {'>'}
                                        </p>
                                    )}
                                    <p style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>{item.product_name}</p>
                                    <p style={{ fontSize: '13px', color: '#888' }}>
                                        {item.product_price.toLocaleString()}원 × {item.quantity}개
                                    </p>
                                </div>
                                <span style={{ fontSize: '14px', fontWeight: 600 }}>{item.subtotal.toLocaleString()}원</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payment Info */}
                <div style={{ background: '#1E1E1E', borderRadius: '16px', padding: '20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#888', marginBottom: '16px' }}>결제 내역</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#aaa' }}>
                        <span>상품 합계</span>
                        <span>{order.subtotal.toLocaleString()}원</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#aaa' }}>
                        <span>수수료</span>
                        <span>{order.service_fee.toLocaleString()}원</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '13px', color: '#aaa' }}>
                        <span>배송비</span>
                        <span>{order.delivery_fee.toLocaleString()}원</span>
                    </div>
                    <div style={{ borderTop: '1px solid #333', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>총 결제 금액</span>
                        <span style={{ fontSize: '18px', fontWeight: 700, color: '#FF5A00' }}>{order.total_amount.toLocaleString()}원</span>
                    </div>
                </div>
            </main>
        </div>
    );
}
