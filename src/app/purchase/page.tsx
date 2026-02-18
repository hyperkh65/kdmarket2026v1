'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { supabase } from '@/lib/supabaseClient';
import { ShoppingCart, Trash2, Plus, Minus, AlertCircle, Package, Truck, Zap } from 'lucide-react';

declare global {
    interface Window {
        IMP: any;
    }
}

export default function PurchaseAgencyPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [deliveryFees, setDeliveryFees] = useState<any[]>([]);
    const [selectedDelivery, setSelectedDelivery] = useState<string>('direct');
    const [loading, setLoading] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState<string>('kakaopay');

    // 배송 정보
    const [deliveryInfo, setDeliveryInfo] = useState({
        recipient_name: '',
        recipient_phone: '',
        delivery_address: '',
        delivery_address_detail: '',
        delivery_memo: ''
    });

    // Point System
    const [myPoints, setMyPoints] = useState(0);
    const [usePoints, setUsePoints] = useState(0);

    useEffect(() => {
        checkUser();
        fetchCartItems();
        fetchDeliveryFees();
    }, []);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('로그인이 필요합니다.');
            router.push('/login');
            return;
        }
        setUser(user);

        // Fetch Points
        const { data: profile } = await supabase
            .from('profiles')
            .select('points')
            .eq('id', user.id)
            .single();

        if (profile) setMyPoints(profile.points || 0);
    };

    const fetchCartItems = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('cart_items')
            .select(`
                *,
                product:shop_products(
                    *,
                    shop:shops(id, name)
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching cart:', error);
        } else {
            setCartItems(data || []);
        }
        setLoading(false);
    };

    const fetchDeliveryFees = async () => {
        const { data, error } = await supabase
            .from('delivery_fees')
            .select('*')
            .eq('is_active', true)
            .order('base_fee', { ascending: true });

        if (error) {
            console.error('Error fetching delivery fees:', error);
        } else {
            setDeliveryFees(data || []);
        }
    };

    const updateQuantity = async (itemId: string, newQuantity: number) => {
        if (newQuantity < 1) return;

        const { error } = await supabase
            .from('cart_items')
            .update({ quantity: newQuantity })
            .eq('id', itemId);

        if (!error) {
            fetchCartItems();
        }
    };

    const removeFromCart = async (itemId: string) => {
        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('id', itemId);

        if (!error) {
            fetchCartItems();
        }
    };

    // 금액 계산
    const subtotal = cartItems.reduce((sum, item) => {
        return sum + (item.product?.price || 0) * item.quantity;
    }, 0);

    const serviceFee = subtotal < 50000 ? 0 :
        subtotal < 100000 ? 10000 :
            subtotal < 150000 ? 20000 :
                subtotal < 200000 ? 30000 : 40000;

    const deliveryFee = selectedDelivery === 'direct' ? 40000 : (deliveryFees.find(d => d.method === selectedDelivery)?.base_fee || 0);
    const totalAmount = subtotal + serviceFee + deliveryFee - usePoints;

    const canCheckout = subtotal >= 50000 &&
        deliveryInfo.recipient_name &&
        deliveryInfo.recipient_phone &&
        deliveryInfo.delivery_address;

    const handleCheckout = async () => {
        if (!canCheckout) {
            alert('배송 정보를 모두 입력해주세요.');
            return;
        }

        // 무통장 입금의 경우 바로 주문 처리 (심사 통과를 위한 실연동 경로)
        if (paymentMethod === 'bank') {
            if (!confirm('무통장 입금으로 주문을 완료하시겠습니까?\n계좌번호: 신한은행 110-140-449515 김현')) return;

            try {
                const { data: orderNumber, error } = await supabase.rpc('create_purchase_order', {
                    p_user_id: user.id,
                    p_subtotal: subtotal,
                    p_service_fee: serviceFee,
                    p_delivery_fee: deliveryFee,
                    p_total_amount: totalAmount,
                    p_delivery_method: selectedDelivery,
                    p_recipient_name: deliveryInfo.recipient_name,
                    p_recipient_phone: deliveryInfo.recipient_phone,
                    p_delivery_address: deliveryInfo.delivery_address,
                    p_delivery_address_detail: deliveryInfo.delivery_address_detail || '', // Ensure empty string if undefined
                    p_delivery_memo: deliveryInfo.delivery_memo || '' // Ensure empty string if undefined
                });

                if (error) throw error;
                alert(`주문이 성공적으로 접수되었습니다.\n입금 후 관리자가 확인하여 배송을 시작합니다.\n주문번호: ${orderNumber}`);
                router.push('/my');
                return;
            } catch (error: any) {
                console.error('Bank checkout error:', error);
                alert(`주문 처리 중 오류가 발생했습니다.\n내용: ${error.message || error.details || JSON.stringify(error)}`);
                return;
            }
        }

        if (!window.IMP) {
            alert('결제 모듈을 불러오는 중입니다. 잠시만 기다려주세요.');
            return;
        }

        if (!confirm('주문 및 결제를 진행하시겠습니까?')) return;

        // 1. 주문 번호 생성
        const orderTimestamp = new Date().getTime();
        const tempOrderNumber = `ORD-${orderTimestamp}`;

        // 2. 결제 요청 (카카오페이 전용 테스트 계정)
        const pgProvider = paymentMethod === 'kakaopay' ? 'kakaopay' : 'html5_inicis';

        window.IMP.request_pay({
            pg: pgProvider,
            pay_method: 'card',
            merchant_uid: tempOrderNumber,
            name: `경동시장 구매대행: ${cartItems[0]?.product?.name}${cartItems.length > 1 ? ` 외 ${cartItems.length - 1}건` : ''}`,
            amount: totalAmount,
            buyer_email: user?.email,
            buyer_name: deliveryInfo.recipient_name,
            buyer_tel: deliveryInfo.recipient_phone,
            buyer_addr: deliveryInfo.delivery_address + ' ' + deliveryInfo.delivery_address_detail,
            m_redirect_url: `${window.location.origin}/purchase/result`, // 모바일 환경 결제 완료 후 리다이렉트
        }, async (rsp: any) => {
            if (rsp.success) {
                try {
                    // DB 주문 생성
                    const { data: orderNumber, error } = await supabase.rpc('create_purchase_order', {
                        p_user_id: user.id,
                        p_subtotal: subtotal,
                        p_service_fee: serviceFee,
                        p_delivery_fee: deliveryFee,
                        p_total_amount: totalAmount,
                        p_delivery_method: selectedDelivery,
                        p_recipient_name: deliveryInfo.recipient_name,
                        p_recipient_phone: deliveryInfo.recipient_phone,
                        p_delivery_address: deliveryInfo.delivery_address,
                        p_delivery_address_detail: deliveryInfo.delivery_address_detail || '',
                        p_delivery_memo: deliveryInfo.delivery_memo || ''
                    });

                    if (error) throw error;

                    // Deduct points
                    if (usePoints > 0) {
                        await supabase.rpc('award_points', { user_id: user.id, amount: -usePoints });
                    }

                    alert(`결제가 완료되었습니다.\n주문번호: ${orderNumber}`);
                    router.push('/my');
                } catch (error: any) {
                    console.error('Finalize error:', error);
                    alert(`결제는 완료되었으나 주문 저장 중 오류가 발생했습니다.\n내용: ${error.message || error.details || JSON.stringify(error)}`);
                }
            } else {
                alert(`결제에 실패하였습니다. ${rsp.error_msg}`);
            }
        });
    };

    const getDeliveryIcon = (method: string) => {
        if (method === 'direct') return <Truck size={20} />;
        if (method.startsWith('quick')) return <Zap size={20} />;
        if (method === 'parcel') return <Package size={20} />;
        return <Truck size={20} />;
    };

    if (loading) {
        return (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <p style={{ color: '#999' }}>로딩 중...</p>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f8f8f8', paddingBottom: '100px' }}>
            <Script
                src="https://cdn.iamport.kr/v1/iamport.js"
                onLoad={() => {
                    if (window.IMP) {
                        // 카카오페이 테스트 최적화 식별코드 (imp10391932)
                        const impCode = process.env.NEXT_PUBLIC_PORTONE_IMP_KEY || 'imp10391932';
                        window.IMP.init(impCode);
                    }
                }}
            />

            {/* 헤더 */}
            <div style={{ background: '#222', color: 'white', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 100 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ShoppingCart size={24} />
                    <h1 style={{ fontSize: '20px', fontWeight: 900 }}>구매대행 장바구니</h1>
                </div>
            </div>

            {/* 안내 배너 */}
            <div style={{ background: 'linear-gradient(135deg, #FF5A00 0%, #FF8A00 100%)', padding: '24px 20px', color: 'white' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '8px' }}>🛒 경동시장 전문가 구매대행</h2>
                    <p style={{ fontSize: '14px', opacity: 0.95, marginBottom: '20px', lineHeight: 1.6 }}>
                        경동시장을 잘 아는 <strong>전문 관리자가 직접</strong> 상품을 골라드립니다
                    </p>
                    <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                            <div style={{ fontSize: '24px' }}>✅</div>
                            <div>
                                <p style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>현장 직접 검수</p>
                                <p style={{ fontSize: '13px', opacity: 0.9, lineHeight: 1.5 }}>관리자가 경동시장 현장에서 직접 상품을 확인하고 신선도를 검수합니다</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <div style={{ fontSize: '24px' }}>📸</div>
                            <div>
                                <p style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>사진으로 확인</p>
                                <p style={{ fontSize: '13px', opacity: 0.9, lineHeight: 1.5 }}>구매한 상품과 포장 상태를 사진으로 찍어 투명하게 공개합니다</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
                {cartItems.length === 0 ? (
                    <div style={{ background: 'white', borderRadius: '16px', padding: '60px 20px', textAlign: 'center' }}>
                        <ShoppingCart size={48} color="#ddd" style={{ margin: '0 auto 16px' }} />
                        <p style={{ color: '#999', fontSize: '15px' }}>장바구니가 비어있습니다</p>
                        <button onClick={() => router.push('/')} style={{ marginTop: '20px', padding: '12px 24px', background: '#FF5A00', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700 }}>쇼핑 계속하기</button>
                    </div>
                ) : (
                    <>
                        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '16px' }}>주문 상품</h3>
                            {cartItems.map((item) => (
                                <div key={item.id} style={{ display: 'flex', gap: '12px', padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
                                    <img
                                        src={item.product?.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200'}
                                        alt={item.product?.name}
                                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '13px', color: '#FF5A00', fontWeight: 700 }}>{item.product?.shop?.name}</p>
                                        <p style={{ fontSize: '15px', fontWeight: 700 }}>{item.product?.name}</p>
                                        <p style={{ fontSize: '16px', fontWeight: 900 }}>{(item.product?.price || 0).toLocaleString()}원</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ width: '28px', height: '28px', border: '1px solid #ddd', borderRadius: '4px', background: 'white' }}><Minus size={14} /></button>
                                            <span style={{ fontSize: '15px', fontWeight: 700 }}>{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ width: '28px', height: '28px', border: '1px solid #ddd', borderRadius: '4px', background: 'white' }}><Plus size={14} /></button>
                                            <button onClick={() => removeFromCart(item.id)} style={{ marginLeft: 'auto', padding: '6px 12px', color: '#EB5757', background: 'none', border: 'none', fontSize: '13px', fontWeight: 600 }}><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '16px' }}>배송 방법</h3>
                            {deliveryFees.map((method) => (
                                <div
                                    key={method.method}
                                    onClick={() => { setSelectedDelivery(method.method); setUsePoints(0); }}
                                    style={{
                                        padding: '16px',
                                        border: selectedDelivery === method.method ? '2px solid #FF5A00' : '1px solid #eee',
                                        borderRadius: '12px',
                                        marginBottom: '12px',
                                        cursor: 'pointer',
                                        background: selectedDelivery === method.method ? '#FFF4E5' : 'white'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {getDeliveryIcon(method.method)}
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: '15px', fontWeight: 700 }}>{method.name}</p>
                                            <p style={{ fontSize: '12px', color: '#666' }}>{method.description}</p>
                                        </div>
                                        <p style={{ fontSize: '16px', fontWeight: 900 }}>
                                            {method.method === 'direct' ? '40,000원' : (method.base_fee === 0 ? '착불' : `${method.base_fee.toLocaleString()}원`)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {selectedDelivery === 'direct' && (
                            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '16px' }}>경동 포인트 사용</h3>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '14px', color: '#666' }}>보유 포인트</span>
                                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#FF5A00' }}>{myPoints.toLocaleString()} P</span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="number"
                                        value={usePoints}
                                        onChange={(e) => {
                                            let val = parseInt(e.target.value) || 0;
                                            if (val > myPoints) val = myPoints;
                                            if (val < 0) val = 0;
                                            setUsePoints(val);
                                        }}
                                        style={{ flex: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'right' }}
                                    />
                                    <button
                                        onClick={() => setUsePoints(myPoints)}
                                        style={{ padding: '0 16px', background: '#333', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}
                                    >
                                        전액 사용
                                    </button>
                                </div>
                                <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>* 직접 배송 시에만 포인트를 사용할 수 있습니다.</p>
                            </div>
                        )}

                        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '16px' }}>배송 정보</h3>
                            <input type="text" value={deliveryInfo.recipient_name} onChange={(e) => setDeliveryInfo({ ...deliveryInfo, recipient_name: e.target.value })} placeholder="받는 분 성함" style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '12px' }} />
                            <input type="tel" value={deliveryInfo.recipient_phone} onChange={(e) => setDeliveryInfo({ ...deliveryInfo, recipient_phone: e.target.value })} placeholder="연락처" style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '12px' }} />
                            <input type="text" value={deliveryInfo.delivery_address} onChange={(e) => setDeliveryInfo({ ...deliveryInfo, delivery_address: e.target.value })} placeholder="배송 주소" style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '12px' }} />
                            <input type="text" value={deliveryInfo.delivery_address_detail} onChange={(e) => setDeliveryInfo({ ...deliveryInfo, delivery_address_detail: e.target.value })} placeholder="상세 주소" style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }} />
                        </div>

                        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '16px' }}>결제 수단</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                <button onClick={() => setPaymentMethod('kakaopay')} style={{ padding: '12px 4px', fontSize: '12px', borderRadius: '12px', border: paymentMethod === 'kakaopay' ? '2px solid #FEE500' : '1px solid #eee', background: paymentMethod === 'kakaopay' ? '#FFFCE0' : 'white', fontWeight: 700 }}>카카오페이</button>
                                <button onClick={() => setPaymentMethod('card')} style={{ padding: '12px 4px', fontSize: '12px', borderRadius: '12px', border: paymentMethod === 'card' ? '2px solid #FF5A00' : '1px solid #eee', background: paymentMethod === 'card' ? '#FFF4E5' : 'white', fontWeight: 700 }}>신용카드</button>
                                <button onClick={() => setPaymentMethod('bank')} style={{ padding: '12px 4px', fontSize: '12px', borderRadius: '12px', border: paymentMethod === 'bank' ? '2px solid #222' : '1px solid #eee', background: paymentMethod === 'bank' ? '#f0f0f0' : 'white', fontWeight: 700 }}>무통장입금</button>
                            </div>
                        </div>

                        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>상품 금액</span><span>{subtotal.toLocaleString()}원</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>수수료</span><span>{serviceFee.toLocaleString()}원</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>배송비</span><span>{deliveryFee === 0 ? '착불' : `${deliveryFee.toLocaleString()}원`}</span></div>
                            {usePoints > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: '#FF5A00' }}>
                                    <span>포인트 사용</span>
                                    <span>- {usePoints.toLocaleString()} P</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
                                <span style={{ fontSize: '18px', fontWeight: 900 }}>총 결제 금액</span>
                                <span style={{ fontSize: '24px', fontWeight: 900, color: '#FF5A00' }}>{totalAmount.toLocaleString()}원</span>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={!canCheckout}
                            style={{
                                width: '100%', padding: '20px', background: canCheckout ? '#FF5A00' : '#ccc', color: 'white', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: 900, cursor: canCheckout ? 'pointer' : 'not-allowed'
                            }}
                        >
                            {canCheckout ? `${totalAmount.toLocaleString()}원 결제하기` : '배송 정보를 입력해주세요'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
