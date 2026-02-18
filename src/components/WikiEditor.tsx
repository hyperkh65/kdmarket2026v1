'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Edit3, Check, X } from 'lucide-react';

export default function WikiEditor({ shopId, initialContent }: { shopId: string, initialContent: string | null }) {
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState(initialContent || '');
    const [originalContent, setOriginalContent] = useState(initialContent || '');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('위키를 편집하려면 로그인이 필요합니다.');
                setLoading(false);
                return;
            }

            // Check if wiki page exists
            const { data: existing } = await supabase.from('wiki_pages').select('id').eq('shop_id', shopId).maybeSingle();

            let error;
            if (existing) {
                const { error: updateError } = await supabase
                    .from('wiki_pages')
                    .update({
                        content: content,
                        last_edited_by: user.id,
                        last_edited_at: new Date()
                    })
                    .eq('id', existing.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('wiki_pages')
                    .insert({
                        shop_id: shopId,
                        content: content,
                        last_edited_by: user.id
                    });
                error = insertError;
            }

            if (error) throw error;

            setOriginalContent(content);
            setIsEditing(false);
            alert('위키가 수정되었습니다! 📝');
        } catch (e: any) {
            console.error(e);
            alert('저장 실패: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', background: 'white', marginTop: '12px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>🗺️ 대동여지도 (위키)</h3>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', background: '#F0F0F0', border: 'none', color: '#555', fontSize: '13px', fontWeight: 600 }}
                    >
                        <Edit3 size={14} /> 편집하기
                    </button>
                ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => {
                                setContent(originalContent);
                                setIsEditing(false);
                            }}
                            style={{ padding: '6px 12px', borderRadius: '8px', background: '#eee', border: 'none', color: '#555' }}
                        >
                            <X size={16} />
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            style={{ padding: '6px 12px', borderRadius: '8px', background: '#222', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                            {loading ? '...' : <><Check size={16} /> 저장</>}
                        </button>
                    </div>
                )}
            </div>

            {isEditing ? (
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="이 가게만의 꿀팁이나 정보를 자유롭게 공유해주세요! (예: 사장님이 서비스를 잘 주셔요, 2층 좌석 뷰가 좋아요)"
                    style={{ width: '100%', minHeight: '150px', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '14px', lineHeight: 1.6 }}
                />
            ) : (
                <div style={{ position: 'relative' }}>
                    <div style={{ fontSize: '14px', lineHeight: 1.6, color: '#444', whiteSpace: 'pre-wrap' }}>
                        {content || (
                            <span style={{ color: '#999' }}>
                                아직 작성된 위키 내용이 없습니다.<br />
                                첫 번째 위키 작성자가 되어보세요! 🏆
                            </span>
                        )}
                    </div>
                    {content && (
                        <button
                            onClick={async () => {
                                const reason = prompt('신고 사유를 입력해주세요 (예: 욕설, 스팸, 부적절한 콘텐츠)');
                                if (!reason) return;
                                const { data: { user } } = await supabase.auth.getUser();
                                if (!user) return alert('로그인이 필요합니다.');

                                const { error } = await supabase.from('reports').insert({
                                    reporter_id: user.id,
                                    content_type: 'wiki',
                                    content_id: shopId,
                                    reason: reason
                                });

                                if (error) alert('신고 실패: ' + error.message);
                                else alert('신고가 접수되었습니다.');
                            }}
                            style={{ position: 'absolute', bottom: 0, right: 0, background: 'none', border: 'none', color: '#ccc', fontSize: '11px', cursor: 'pointer' }}
                        >
                            🚨 신고하기
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
