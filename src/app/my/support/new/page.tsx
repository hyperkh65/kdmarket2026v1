'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ChevronLeft, Send } from 'lucide-react';

const CATEGORIES = ['앱 오류 제보', '상점 정보 수정', '서비스 제안', '기타 문의'];

export default function NewInquiryPage() {
    const router = useRouter();
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;

        setIsSubmitting(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.push('/login');
            return;
        }

        const { data: profile } = await supabase.from('profiles').select('nickname').eq('id', user.id).single();

        const { error } = await supabase.from('customer_support').insert({
            user_id: user.id,
            nickname: profile?.nickname || '익명',
            category,
            title,
            content,
            is_private: true
        });

        if (error) {
            alert('문의 등록 실패: ' + error.message);
            setIsSubmitting(false);
        } else {
            alert('문의가 등록되었습니다. 곧 답변 드리겠습니다.');
            router.push('/my/support');
        }
    };

    return (
        <div style={{ padding: '0 0 100px', background: '#121212', minHeight: '100vh', color: 'white', maxWidth: '500px', margin: '0 auto' }}>
            <header style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #222' }}>
                <ChevronLeft onClick={() => router.back()} style={{ cursor: 'pointer' }} />
                <h1 style={{ fontSize: '18px', fontWeight: 600 }}>1:1 문의 작성</h1>
            </header>

            <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ fontSize: '14px', color: '#888', marginBottom: '8px', display: 'block' }}>카테고리 선택</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setCategory(cat)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    border: '1px solid',
                                    borderColor: category === cat ? '#FF5A00' : '#333',
                                    background: category === cat ? 'rgba(255, 90, 0, 0.1)' : 'transparent',
                                    color: category === cat ? '#FF5A00' : '#888',
                                    fontSize: '13px',
                                    cursor: 'pointer'
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label style={{ fontSize: '14px', color: '#888', marginBottom: '8px', display: 'block' }}>제목</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="문의 제목을 입력해주세요"
                        style={{ width: '100%', background: '#1E1E1E', border: '1px solid #333', borderRadius: '12px', padding: '12px', color: 'white', outline: 'none' }}
                        required
                    />
                </div>

                <div>
                    <label style={{ fontSize: '14px', color: '#888', marginBottom: '8px', display: 'block' }}>문의 내용</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="문의하실 내용을 상세히 적어주시면 빠른 해결에 도움이 됩니다."
                        style={{ width: '100%', height: '200px', background: '#1E1E1E', border: '1px solid #333', borderRadius: '12px', padding: '12px', color: 'white', outline: 'none', resize: 'none' }}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                        marginTop: '20px',
                        padding: '16px',
                        borderRadius: '12px',
                        background: '#FF5A00',
                        border: 'none',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        opacity: isSubmitting ? 0.7 : 1
                    }}
                >
                    <Send size={18} /> {isSubmitting ? '보내는 중...' : '문의 등록하기'}
                </button>
            </form>
        </div>
    );
}
