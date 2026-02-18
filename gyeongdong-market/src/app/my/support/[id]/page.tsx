'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ChevronLeft, User, ShieldCheck, Send } from 'lucide-react';

export default function InquiryDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [inquiry, setInquiry] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setUserProfile(profile);

            const { data, error } = await supabase
                .from('customer_support')
                .select('*')
                .eq('id', id)
                .single();

            if (data) {
                setInquiry(data);
                setReply(data.admin_reply || '');
            } else if (error) {
                alert('접근 권한이 없거나 삭제된 문의입니다.');
                router.push('/my/support');
            }
            setLoading(false);
        };
        fetchData();
    }, [id, router]);

    const handleAdminReply = async () => {
        if (!reply.trim()) return;
        setIsSubmitting(true);

        const { error } = await supabase
            .from('customer_support')
            .update({
                admin_reply: reply,
                status: 'ANSWERED'
            })
            .eq('id', id);

        if (error) {
            alert('답변 등록 실패: ' + error.message);
        } else {
            alert('답변이 등록되었습니다.');
            setInquiry({ ...inquiry, admin_reply: reply, status: 'ANSWERED' });
        }
        setIsSubmitting(false);
    };

    if (loading) return <div style={{ background: '#121212', height: '100vh' }} />;

    return (
        <div style={{ padding: '0 0 100px', background: '#121212', minHeight: '100vh', color: 'white', maxWidth: '500px', margin: '0 auto' }}>
            <header style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #222' }}>
                <ChevronLeft onClick={() => router.back()} style={{ cursor: 'pointer' }} />
                <h1 style={{ fontSize: '18px', fontWeight: 600 }}>문의 내용 확인</h1>
            </header>

            <main style={{ padding: '20px' }}>
                {/* Inquiry Section */}
                <div style={{ background: '#1E1E1E', padding: '20px', borderRadius: '16px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontSize: '12px', color: '#FF5A00', fontWeight: 600 }}>{inquiry.category}</span>
                        <span style={{ fontSize: '12px', color: '#666' }}>{new Date(inquiry.created_at).toLocaleString()}</span>
                    </div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>{inquiry.title}</h2>
                    <p style={{ fontSize: '15px', color: '#ddd', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{inquiry.content}</p>
                    <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #333', display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '13px' }}>
                        <User size={14} /> 작성자: {inquiry.nickname || '익명'}
                    </div>
                </div>

                {/* Admin Reply Section */}
                <div style={{ background: inquiry.admin_reply ? '#1E1E1E' : '#121212', padding: inquiry.admin_reply ? '20px' : '0', borderRadius: '16px', border: inquiry.admin_reply ? '1px solid rgba(255, 90, 0, 0.2)' : 'none' }}>
                    {inquiry.admin_reply ? (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#FF5A00', fontWeight: 700, fontSize: '15px' }}>
                                <ShieldCheck size={18} /> 경동시장 관리자 답변
                            </div>
                            <p style={{ fontSize: '14px', color: '#ccc', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{inquiry.admin_reply}</p>
                        </>
                    ) : (
                        userProfile?.role !== 'ADMIN' && (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#555', fontSize: '14px' }}>
                                담당자가 내용을 확인 중입니다. 잠시만 기다려주세요!
                            </div>
                        )
                    )}
                </div>

                {/* Admin Action Section */}
                {userProfile?.role === 'ADMIN' && (
                    <div style={{ marginTop: '40px', borderTop: '1px solid #333', paddingTop: '24px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: '#FF5A00' }}>관리자 답변 작성</h3>
                        <textarea
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            placeholder="이곳에 답변을 작성하세요..."
                            style={{ width: '100%', height: '150px', background: '#1E1E1E', border: '1px solid #333', borderRadius: '12px', padding: '12px', color: 'white', outline: 'none', resize: 'none', marginBottom: '12px' }}
                        />
                        <button
                            onClick={handleAdminReply}
                            disabled={isSubmitting}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '12px',
                                background: '#FF5A00',
                                border: 'none',
                                color: 'white',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                opacity: isSubmitting ? 0.7 : 1
                            }}
                        >
                            <Send size={18} /> 답변 {inquiry.admin_reply ? '수정' : '등록'}하기
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
