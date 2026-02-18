'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ChevronLeft, Bell, X, Plus, Info } from 'lucide-react';

export default function KeywordSettingsPage() {
    const router = useRouter();
    const [keywords, setKeywords] = useState<any[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchKeywords = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data } = await supabase
                .from('keyword_settings')
                .select('*')
                .eq('user_id', user.id);

            if (data) setKeywords(data);
            setLoading(false);
        };
        fetchKeywords();
    }, [router]);

    const addKeyword = async () => {
        if (!inputValue.trim()) return;
        if (keywords.length >= 10) {
            alert('키워드는 최대 10개까지 설정할 수 있습니다.');
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('keyword_settings')
            .insert({ user_id: user.id, keyword: inputValue.trim() })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') alert('이미 등록된 키워드입니다.');
            else alert('키워드 추가 중 오류가 발생했습니다.');
        } else if (data) {
            setKeywords([...keywords, data]);
            setInputValue('');
        }
    };

    const deleteKeyword = async (id: string) => {
        const { error } = await supabase
            .from('keyword_settings')
            .delete()
            .eq('id', id);

        if (!error) {
            setKeywords(keywords.filter(k => k.id !== id));
        }
    };

    return (
        <div style={{ padding: '0 0 100px', background: '#121212', minHeight: '100vh', color: 'white' }}>
            <header style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #222' }}>
                <ChevronLeft onClick={() => router.back()} style={{ cursor: 'pointer' }} />
                <h1 style={{ fontSize: '18px', fontWeight: 600 }}>키워드 알림 설정</h1>
            </header>

            <main style={{ padding: '24px' }}>
                <div style={{ background: '#1E1E1E', padding: '16px', borderRadius: '12px', marginBottom: '32px', display: 'flex', gap: '12px', alignItems: 'start' }}>
                    <Info size={20} color="#FF5A00" style={{ marginTop: '2px' }} />
                    <p style={{ fontSize: '14px', color: '#aaa', lineHeight: 1.5 }}>
                        설정한 키워드가 포함된 가게의 새 소식이나<br />특가 상품이 등록되면 알림을 드립니다.
                    </p>
                </div>

                <div style={{ position: 'relative', marginBottom: '40px' }}>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                        placeholder="예: 등갈비, 제철과일, 떨이"
                        style={{
                            width: '100%', padding: '16px 50px 16px 16px', borderRadius: '14px',
                            background: '#1E1E1E', border: '1px solid #333', color: 'white', fontSize: '15px'
                        }}
                    />
                    <button
                        onClick={addKeyword}
                        style={{
                            position: 'absolute', right: '8px', top: '8px', width: '36px', height: '36px',
                            borderRadius: '10px', background: '#FF5A00', border: 'none', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                        }}
                    >
                        <Plus size={20} color="white" />
                    </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 600 }}>설정된 키워드</h3>
                    <span style={{ fontSize: '13px', color: '#666' }}>{keywords.length}/10</span>
                </div>

                {loading ? (
                    <p style={{ color: '#444', textAlign: 'center' }}>불러오는 중...</p>
                ) : keywords.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', border: '1px dashed #222', borderRadius: '16px' }}>
                        <Bell size={40} color="#222" style={{ marginBottom: '16px' }} />
                        <p style={{ color: '#555', fontSize: '14px' }}>등록된 키워드가 없습니다.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {keywords.map((k) => (
                            <div
                                key={k.id}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px 8px 16px',
                                    background: '#333', borderRadius: '20px', fontSize: '14px'
                                }}
                            >
                                <span>{k.keyword}</span>
                                <X
                                    size={16}
                                    color="#888"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => deleteKeyword(k.id)}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
