'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ChevronLeft, UserCheck, Check, X, ExternalLink, Calendar, MapPin, Megaphone, Plus, Trash2, Bell } from 'lucide-react';
import { Suspense } from 'react';

function AdminContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') as any;

    const [activeTab, setActiveTab] = useState<'verifications' | 'orders' | 'community' | 'news'>(
        ['verifications', 'orders', 'community', 'news'].includes(initialTab) ? initialTab : 'verifications'
    );

    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [marketNews, setMarketNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    // Order Modal State
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [orderUpdateData, setOrderUpdateData] = useState({
        status: '',
        courier_name: '',
        courier_contact: '',
        tracking_number: '',
        purchase_proof_images: '', // Comma separated URLs for simplicity first
        tracking_images: ''
    });

    // News Form State
    const [showNewsModal, setShowNewsModal] = useState(false);
    const [newsData, setNewsData] = useState({
        id: '',
        title: '',
        type: 'NEWS',
        content: '',
        url: ''
    });

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile?.role !== 'ADMIN') {
                alert('접근 권한이 없습니다.');
                router.push('/');
                return;
            }

            setIsAdmin(true);
            fetchData();
        };
        checkAdmin();
    }, [router, activeTab]);

    const fetchData = async () => {
        setLoading(true);
        if (activeTab === 'verifications') {
            await fetchVerifications();
        } else if (activeTab === 'orders') {
            await fetchOrders();
        } else if (activeTab === 'community') {
            await fetchReports();
        } else if (activeTab === 'news') {
            await fetchMarketNews();
        }
        setLoading(false);
    };

    const fetchVerifications = async () => {
        const { data } = await supabase
            .from('owner_verifications')
            .select('*')
            .eq('status', 'PENDING')
            .order('created_at', { ascending: true });
        if (data) setPendingRequests(data);
    };

    const fetchOrders = async () => {
        const { data } = await supabase
            .from('orders')
            .select(`
                *,
                user:profiles(nickname, full_name)
            `)
            .order('created_at', { ascending: false });
        if (data) setOrders(data);
    };

    const fetchReports = async () => {
        const { data } = await supabase
            .from('reports')
            .select(`
                *,
                reporter:profiles!reports_reporter_id_profiles_fkey(nickname)
            `)
            .order('created_at', { ascending: false });
        if (data) setReports(data);
    };

    const fetchMarketNews = async () => {
        const { data } = await supabase
            .from('market_news')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setMarketNews(data);
    };

    const handleSaveNews = async () => {
        if (!newsData.title) return alert('제목을 입력해주세요.');

        setLoading(true);
        try {
            if (newsData.id) {
                // Update
                const { error } = await supabase
                    .from('market_news')
                    .update({
                        title: newsData.title,
                        type: newsData.type,
                        content: newsData.content,
                        url: newsData.url,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', newsData.id);
                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase
                    .from('market_news')
                    .insert({
                        title: newsData.title,
                        type: newsData.type,
                        content: newsData.content,
                        url: newsData.url
                    });
                if (error) throw error;
            }

            alert('저장되었습니다.');
            setShowNewsModal(false);
            fetchMarketNews();
        } catch (error: any) {
            alert('오류: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteNews = async (id: string) => {
        if (!confirm('정말로 이 소식을 삭제하시겠습니까?')) return;
        const { error } = await supabase.from('market_news').delete().eq('id', id);
        if (error) alert('삭제 실패: ' + error.message);
        else fetchMarketNews();
    };

    const handleReportAction = async (reportId: string, status: 'resolved' | 'ignored') => {
        const { error } = await supabase
            .from('reports')
            .update({ status })
            .eq('id', reportId);
        if (!error) {
            setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
            alert('처리되었습니다.');
        }
    };

    const handleDeleteReportedContent = async (report: any) => {
        if (!confirm('정말로 이 콘텐츠를 삭제하시겠습니까?')) return;

        let table = '';
        if (report.content_type === 'post') table = 'community_posts';
        else if (report.content_type === 'comment') table = 'community_comments';
        else if (report.content_type === 'course') table = 'courses';

        if (!table) return alert('지원되지 않는 삭제 유형입니다.');

        const { error } = await supabase.from(table).delete().eq('id', report.content_id);
        if (error) alert('삭제 실패: ' + error.message);
        else {
            await handleReportAction(report.id, 'resolved');
            alert('콘텐츠가 삭제되고 신고가 해결 처리되었습니다.');
        }
    };

    const handleVerificationAction = async (requestId: string, userId: string, status: 'APPROVED' | 'REJECTED') => {
        if (!confirm(`${status === 'APPROVED' ? '승인' : '거절'}하시겠습니까?`)) return;

        setLoading(true);
        try {
            const { error: updateError } = await supabase
                .from('owner_verifications')
                .update({ status })
                .eq('id', requestId);
            if (updateError) throw updateError;

            if (status === 'APPROVED') {
                const { error: roleError } = await supabase.from('profiles').update({ role: 'OWNER' }).eq('id', userId);
                if (roleError) throw roleError;
            }

            setPendingRequests(prev => prev.filter(r => r.id !== requestId));
            alert('처리되었습니다.');
        } catch (error: any) {
            alert('오류: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const openOrderModal = (order: any) => {
        setSelectedOrder(order);
        setOrderUpdateData({
            status: order.status,
            courier_name: order.courier_name || '',
            courier_contact: order.courier_contact || '',
            tracking_number: order.tracking_number || '',
            purchase_proof_images: order.purchase_proof_images ? order.purchase_proof_images.join(', ') : '',
            tracking_images: order.tracking_images ? order.tracking_images.join(', ') : ''
        });
        setIsOrderModalOpen(true);
    };

    const handleUpdateOrder = async () => {
        if (!selectedOrder) return;
        setLoading(true);
        try {
            const updates: any = {
                status: orderUpdateData.status,
                courier_name: orderUpdateData.courier_name,
                courier_contact: orderUpdateData.courier_contact,
                tracking_number: orderUpdateData.tracking_number,
                purchase_proof_images: orderUpdateData.purchase_proof_images
                    ? orderUpdateData.purchase_proof_images.split(',').map(s => s.trim()).filter(s => s)
                    : [],
                tracking_images: orderUpdateData.tracking_images
                    ? orderUpdateData.tracking_images.split(',').map(s => s.trim()).filter(s => s)
                    : [],
            };

            // Status specific logic
            if (updates.status === 'shipping' && !updates.confirmed_at) updates.shipped_at = new Date().toISOString();
            if (updates.status === 'delivered' && !updates.confirmed_at) updates.delivered_at = new Date().toISOString();

            const { error } = await supabase
                .from('orders')
                .update(updates)
                .eq('id', selectedOrder.id);

            if (error) throw error;

            alert('주문 상태가 업데이트되었습니다.');
            setIsOrderModalOpen(false);
            fetchOrders();
        } catch (error: any) {
            alert('업데이트 오류: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>, field: 'purchase_proof_images' | 'tracking_images') => {
        if (!e.target.files || !selectedOrder) return;

        const files = Array.from(e.target.files);
        // Limit total images to 50
        if (files.length + (orderUpdateData[field] ? orderUpdateData[field].split(',').length : 0) > 50) {
            alert('최대 50장까지만 업로드 가능합니다.');
            return;
        }

        setLoading(true);
        const newUrls: string[] = [];

        try {
            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${selectedOrder.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('images')
                    .upload(`proofs/${fileName}`, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('images')
                    .getPublicUrl(`proofs/${fileName}`);

                newUrls.push(publicUrl);
            }

            const currentUrls = orderUpdateData[field] ? orderUpdateData[field].split(',').map(s => s.trim()).filter(s => s) : [];
            const updatedUrls = [...currentUrls, ...newUrls].join(', ');

            setOrderUpdateData(prev => ({
                ...prev,
                [field]: updatedUrls
            }));

            alert(`${newUrls.length}장의 사진이 업로드되었습니다.`);
        } catch (error: any) {
            alert('이미지 업로드 실패: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['verifications', 'orders', 'community', 'news'].includes(tab)) {
            setActiveTab(tab as any);
        }
    }, [searchParams]);

    if (!isAdmin || loading) {
        return (
            <div style={{
                padding: '40px',
                color: 'white',
                background: '#121212',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
            }}>
                <div style={{ marginBottom: '20px' }}>관리 권한을 확인하고 정보를 불러오고 있습니다...</div>
                <div style={{ width: '40px', height: '40px', border: '3px solid #333', borderTopColor: '#FF5A00', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <style>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div style={{ padding: '0 0 100px', background: '#121212', minHeight: '100vh', color: 'white' }}>
            {/* Header */}
            <header style={{ padding: '20px', borderBottom: '1px solid #222' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <ChevronLeft onClick={() => router.push('/my')} style={{ cursor: 'pointer' }} />
                    <h1 style={{ fontSize: '18px', fontWeight: 600 }}>관리자 대시보드</h1>
                </div>

                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                    <button
                        onClick={() => setActiveTab('verifications')}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: 600,
                            background: activeTab === 'verifications' ? '#fff' : '#333',
                            color: activeTab === 'verifications' ? '#000' : '#888',
                            border: 'none',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        사장님 인증 ({pendingRequests.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: 600,
                            background: activeTab === 'orders' ? '#fff' : '#333',
                            color: activeTab === 'orders' ? '#000' : '#888',
                            border: 'none',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        주문 관리
                    </button>
                    <button
                        onClick={() => setActiveTab('community')}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: 600,
                            background: activeTab === 'community' ? '#fff' : '#333',
                            color: activeTab === 'community' ? '#000' : '#888',
                            border: 'none',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        커뮤니티/신고 ({reports.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('news')}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: 600,
                            background: activeTab === 'news' ? '#fff' : '#333',
                            color: activeTab === 'news' ? '#000' : '#888',
                            border: 'none',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        시장 소식
                    </button>
                </div>
            </header>

            <main style={{ padding: '20px' }}>
                {activeTab === 'verifications' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {pendingRequests.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#555', padding: '40px 0' }}>대기 중인 신청이 없습니다.</p>
                        ) : (
                            pendingRequests.map((req) => (
                                <div key={req.id} style={{ background: '#1E1E1E', borderRadius: '16px', padding: '20px', border: '1px solid #333' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{req.shop_name}</h3>
                                        <span style={{ fontSize: '12px', color: '#888' }}>{new Date(req.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ fontSize: '14px', marginBottom: '16px' }}>
                                        <p>사업자번호: {req.biz_registration_number}</p>
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                            <a href={req.biz_reg_doc_url} target="_blank" style={{ color: '#aaa', textDecoration: 'underline' }}>사업자등록증</a>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => handleVerificationAction(req.id, req.user_id, 'REJECTED')} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#333', color: '#EB5757', border: 'none' }}>거절</button>
                                        <button onClick={() => handleVerificationAction(req.id, req.user_id, 'APPROVED')} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#FF5A00', color: 'white', border: 'none' }}>승인</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {orders.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#555', padding: '40px 0' }}>주문 내역이 없습니다.</p>
                        ) : (
                            orders.map((order) => (
                                <div key={order.id} onClick={() => openOrderModal(order)} style={{ background: '#1E1E1E', borderRadius: '16px', padding: '16px', border: '1px solid #333', cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '13px', color: '#FF5A00', fontWeight: 600 }}>{order.order_number}</span>
                                        <span style={{
                                            fontSize: '12px',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            background: order.status === 'delivered' ? '#4CAF50' :
                                                order.status === 'shipping' ? '#2196F3' :
                                                    order.status === 'purchasing' ? '#FFC107' : '#333',
                                            color: '#fff'
                                        }}>
                                            {order.status === 'pending' ? '승인 대기' :
                                                order.status === 'confirmed' ? '주문 확인' :
                                                    order.status === 'purchasing' ? '구매 중' :
                                                        order.status === 'preparing' ? '배송 준비' :
                                                            order.status === 'shipping' ? '배송 중' : '배송 완료'}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                                        <p style={{ fontWeight: 600 }}>{order.total_amount.toLocaleString()}원</p>
                                        <p style={{ color: '#aaa', fontSize: '13px', marginTop: '4px' }}>주문자: {order.recipient_name} ({order.recipient_phone})</p>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                        {new Date(order.created_at).toLocaleString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'community' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 800 }}>신고 및 커뮤니티 관리</h2>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {reports.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#555', padding: '40px 0' }}>들어온 신고가 없습니다.</p>
                            ) : (
                                reports.map((report) => (
                                    <div key={report.id} style={{ background: '#1E1E1E', borderRadius: '16px', padding: '16px', border: '1px solid #333' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <span style={{ fontSize: '14px', color: '#888', fontWeight: 600 }}>
                                                {report.content_type.toUpperCase()} 신고
                                            </span>
                                            <span style={{
                                                fontSize: '11px',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                background: report.status === 'pending' ? '#FF5A00' : '#444',
                                                color: 'white',
                                                fontWeight: 700
                                            }}>
                                                {report.status === 'pending' ? '대기중' :
                                                    report.status === 'resolved' ? '처리됨' : '무시됨'}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '14px', marginBottom: '12px', color: '#fff', lineHeight: 1.5 }}>
                                            <strong style={{ color: '#FF5A00' }}>신고 사유:</strong> {report.reason}
                                        </p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#666', borderTop: '1px solid #222', paddingTop: '12px' }}>
                                            <span>신고자: {report.reporter?.nickname || '알 수 없음'}</span>
                                            <span>{new Date(report.created_at).toLocaleDateString()}</span>
                                        </div>
                                        {report.status === 'pending' && (
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                                <button
                                                    onClick={() => handleReportAction(report.id, 'ignored')}
                                                    style={{ flex: 1, padding: '10px', background: '#333', color: '#eee', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                                                >
                                                    무시하기
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteReportedContent(report)}
                                                    style={{ flex: 1, padding: '10px', background: 'rgba(235, 87, 87, 0.2)', color: '#EB5757', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                                                >
                                                    콘텐츠 삭제
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'news' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 800 }}>금주의 시장 소식 관리</h2>
                            <button
                                onClick={() => {
                                    setNewsData({ id: '', title: '', type: 'NEWS', content: '', url: '' });
                                    setShowNewsModal(true);
                                }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    background: '#FF5A00', color: 'white', border: 'none',
                                    padding: '8px 16px', borderRadius: '12px', fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                <Plus size={18} /> 소식 추가
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {marketNews.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#555', padding: '40px 0' }}>등록된 소식이 없습니다.</p>
                            ) : (
                                marketNews.map((news) => (
                                    <div key={news.id} style={{ background: '#1E1E1E', borderRadius: '16px', padding: '16px', border: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', overflow: 'hidden', flex: 1 }}>
                                            <span style={{
                                                background: news.type === 'EVENT' ? '#00C73C' : '#FF5A5F',
                                                color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, flexShrink: 0
                                            }}>
                                                {news.type}
                                            </span>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                                                <span style={{ fontSize: '15px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {news.title}
                                                </span>
                                                <span style={{ fontSize: '11px', color: '#666' }}>
                                                    {new Date(news.created_at).toLocaleDateString()} {news.url ? '🔗 링크있음' : ''}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                                            <button
                                                onClick={() => {
                                                    setNewsData({
                                                        id: news.id,
                                                        title: news.title || '',
                                                        type: news.type || 'NEWS',
                                                        content: news.content || '',
                                                        url: news.url || ''
                                                    });
                                                    setShowNewsModal(true);
                                                }}
                                                style={{ background: '#333', border: 'none', color: '#aaa', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                                            >
                                                수정
                                            </button>
                                            <button
                                                onClick={() => handleDeleteNews(news.id)}
                                                style={{ background: 'rgba(235, 87, 87, 0.1)', border: 'none', color: '#EB5757', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Order Edit Modal */}
            {isOrderModalOpen && selectedOrder && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#1E1E1E', width: '100%', maxWidth: '500px', borderRadius: '16px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>주문 관리 ({selectedOrder.order_number})</h2>
                            <X onClick={() => setIsOrderModalOpen(false)} style={{ cursor: 'pointer' }} />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '13px' }}>진행 상태 변경</label>
                            <select
                                value={orderUpdateData.status}
                                onChange={(e) => setOrderUpdateData({ ...orderUpdateData, status: e.target.value })}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#333', color: 'white', border: '1px solid #444', fontSize: '16px' }}
                            >
                                <option value="pending">승인 대기</option>
                                <option value="confirmed">주문 확인 (결제완료)</option>
                                <option value="purchasing">구매 진행 중</option>
                                <option value="preparing">배송 준비 중</option>
                                <option value="shipping">배송 중</option>
                                <option value="delivered">배송 완료</option>
                                <option value="cancelled">주문 취소</option>
                            </select>
                        </div>

                        {orderUpdateData.status === 'purchasing' && (
                            <div style={{ marginBottom: '20px', padding: '16px', background: '#252525', borderRadius: '8px' }}>
                                <h4 style={{ fontSize: '14px', marginBottom: '12px', color: '#FFC107' }}>구매 진행 정보</h4>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#aaa' }}>구매 인증 사진 업로드 (최대 50장)</label>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, 'purchase_proof_images')}
                                    style={{ marginBottom: '10px', color: '#aaa', fontSize: '14px' }}
                                />
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                                    {orderUpdateData.purchase_proof_images.split(',').map((url, idx) => {
                                        const trimmed = url.trim();
                                        if (!trimmed) return null;
                                        return (
                                            <div key={idx} style={{ position: 'relative', width: '60px', height: '60px' }}>
                                                <img src={trimmed} alt="proof" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {(orderUpdateData.status === 'shipping' || orderUpdateData.status === 'delivered') && (
                            <div style={{ marginBottom: '20px', padding: '16px', background: '#252525', borderRadius: '8px' }}>
                                <h4 style={{ fontSize: '14px', marginBottom: '12px', color: '#2196F3' }}>배송 정보 입력</h4>

                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#aaa' }}>배송담당자 이름 / 택배사</label>
                                    <input
                                        type="text"
                                        value={orderUpdateData.courier_name}
                                        onChange={(e) => setOrderUpdateData({ ...orderUpdateData, courier_name: e.target.value })}
                                        placeholder="예: 김배송, 알뜰택배, CJ대한통운"
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#333', color: 'white', border: '1px solid #444' }}
                                    />
                                </div>

                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#aaa' }}>배송담당자 연락처 (선택)</label>
                                    <input
                                        type="text"
                                        value={orderUpdateData.courier_contact}
                                        onChange={(e) => setOrderUpdateData({ ...orderUpdateData, courier_contact: e.target.value })}
                                        placeholder="010-0000-0000"
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#333', color: 'white', border: '1px solid #444' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#aaa' }}>운송장 번호 (선택)</label>
                                    <input
                                        type="text"
                                        value={orderUpdateData.tracking_number}
                                        onChange={(e) => setOrderUpdateData({ ...orderUpdateData, tracking_number: e.target.value })}
                                        placeholder="1234567890"
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#333', color: 'white', border: '1px solid #444' }}
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleUpdateOrder}
                            style={{ width: '100%', padding: '16px', borderRadius: '12px', background: '#FF5A00', color: 'white', border: 'none', fontWeight: 700, fontSize: '16px', cursor: 'pointer' }}
                        >
                            저장하기
                        </button>
                    </div>
                </div>
            )}

            {/* News Add/Edit Modal */}
            {showNewsModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#1E1E1E', width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '32px', border: '1px solid #333' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>시장 소식 {newsData.id ? '수정' : '추가'}</h2>
                            <X onClick={() => setShowNewsModal(false)} style={{ cursor: 'pointer', color: '#888' }} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#aaa', fontWeight: 600 }}>유형</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {(['NEWS', 'EVENT'] as const).map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setNewsData({ ...newsData, type })}
                                            style={{
                                                flex: 1, padding: '12px', borderRadius: '12px',
                                                background: newsData.type === type ? '#FF5A00' : '#333',
                                                border: 'none', color: newsData.type === type ? 'white' : '#888',
                                                fontWeight: 700, cursor: 'pointer'
                                            }}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#aaa', fontWeight: 600 }}>제목</label>
                                <input
                                    type="text"
                                    value={newsData.title}
                                    onChange={(e) => setNewsData({ ...newsData, title: e.target.value })}
                                    placeholder="소식 제목을 입력하세요"
                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#252525', border: '1px solid #444', color: 'white', fontSize: '16px' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#aaa', fontWeight: 600 }}>상세 내용 (선택)</label>
                                <textarea
                                    value={newsData.content}
                                    onChange={(e) => setNewsData({ ...newsData, content: e.target.value })}
                                    placeholder="상세 내용을 입력하세요"
                                    style={{ width: '100%', height: '100px', padding: '14px', borderRadius: '12px', background: '#252525', border: '1px solid #444', color: 'white', fontSize: '16px', resize: 'none' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#aaa', fontWeight: 600 }}>링크 URL (선택)</label>
                                <input
                                    type="text"
                                    value={newsData.url}
                                    onChange={(e) => setNewsData({ ...newsData, url: e.target.value })}
                                    placeholder="https://..."
                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#252525', border: '1px solid #444', color: 'white', fontSize: '14px' }}
                                />
                            </div>

                            <button
                                onClick={handleSaveNews}
                                style={{
                                    width: '100%', padding: '16px', borderRadius: '16px',
                                    background: '#FF5A00', color: 'white', border: 'none',
                                    fontWeight: 800, fontSize: '16px', cursor: 'pointer',
                                    marginTop: '10px', boxShadow: '0 4px 12px rgba(255, 90, 0, 0.2)'
                                }}
                            >
                                저장하기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AdminDashboard() {
    return (
        <Suspense fallback={<div style={{ padding: '40px', color: 'white', background: '#121212', minHeight: '100vh' }}>관리자 페이지 로딩 중...</div>}>
            <AdminContent />
        </Suspense>
    );
}
