'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ChevronLeft, Plus, Lock, MessageSquare, CheckCircle } from 'lucide-react';

export default function SupportPage() {
    const router = useRouter();
    const [inquiries, setInquiries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<any>(null);

    useEffect(() => {
        const fetchInquiries = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setUserProfile(profile);

            // Fetch inquiries (RLS handles privacy)
            const { data, error } = await supabase
                .from('customer_support')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) setInquiries(data);
            setLoading(false);
        };
        fetchInquiries();
    }, [router]);

    return (
        <div style={{ padding: '0 0 100px', background: '#121212', minHeight: '100vh', color: 'white', maxWidth: '500px', margin: '0 auto' }}>
            <header style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #222' }}>
                <ChevronLeft onClick={() => router.push('/my')} style={{ cursor: 'pointer' }} />
                <h1 style={{ fontSize: '18px', fontWeight: 600 }}>고객센터</h1>
            </header>

            <main style={{ padding: '20px' }}>
                {/* App Intro Section */}
                <section style={{ background: '#1E1E1E', padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: '#FF5A00' }}>경동시장 앱 서비스 소개</h2>
                    <p style={{ fontSize: '14px', color: '#ccc', lineHeight: 1.6, marginBottom: '12px' }}>
                        전통시장의 정과 현대적 편리함을 잇는 '경동시장' 앱입니다.
                        지역 주민들에게는 실시간 상점 정보와 커뮤니티를,
                        상인분들에게는 비즈니스 성장의 기회를 제공하는 것을 목적으로 합니다.
                    </p>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        버전 정보: v1.2.0 (Stable)<br />
                        개발팀: Advanced Agentic Coding Team
                    </div>
                </section>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 600 }}>1:1 문의 내역</h3>
                    <button
                        onClick={() => router.push('/my/support/new')}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#333', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 500 }}
                    >
                        <Plus size={16} /> 문의하기
                    </button>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>불러오는 중...</div>
                ) : inquiries.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', background: '#1E1E1E', borderRadius: '16px', color: '#888' }}>
                        <MessageSquare size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                        <p>문의하신 내역이 없습니다.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {inquiries.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => router.push(`/my/support/${item.id}`)}
                                style={{ padding: '16px', background: '#1E1E1E', borderRadius: '16px', cursor: 'pointer', borderLeft: item.status === 'ANSWERED' ? '4px solid #FF5A00' : 'none' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '11px', color: '#888', background: '#333', padding: '2px 8px', borderRadius: '4px' }}>{item.category}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {item.is_private && <Lock size={12} color="#666" />}
                                        <span style={{ fontSize: '12px', color: item.status === 'ANSWERED' ? '#FF5A00' : '#888', fontWeight: 600 }}>
                                            {item.status === 'ANSWERED' ? '답변완료' : '검토중'}
                                        </span>
                                    </div>
                                </div>
                                <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>{item.title}</h4>
                                <div style={{ fontSize: '11px', color: '#555' }}>
                                    {new Date(item.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
