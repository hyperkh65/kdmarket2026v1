'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ChevronLeft, MessageCircle, Heart, Eye, Trash2 } from 'lucide-react';

export default function MyPostsPage() {
    const router = useRouter();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyPosts = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data, error } = await supabase
                .from('community_posts')
                .select('*')
                .eq('author_id', user.id)
                .order('created_at', { ascending: false });

            if (data) {
                setPosts(data);
            }
            setLoading(false);
        };
        fetchMyPosts();
    }, [router]);

    const handleDelete = async (postId: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        const { error } = await supabase.from('community_posts').delete().eq('id', postId);
        if (!error) {
            setPosts(posts.filter(p => p.id !== postId));
        } else {
            alert('삭제 실패: ' + error.message);
        }
    };

    return (
        <div style={{ padding: '0 0 100px', background: '#121212', minHeight: '100vh', color: 'white', maxWidth: '500px', margin: '0 auto' }}>
            <header style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #222', position: 'sticky', top: 0, background: '#121212', zIndex: 10 }}>
                <ChevronLeft onClick={() => router.back()} style={{ cursor: 'pointer' }} />
                <h1 style={{ fontSize: '18px', fontWeight: 600 }}>내 동네생활 글</h1>
            </header>

            <main style={{ padding: '20px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', marginTop: '40px', color: '#666' }}>불러오는 중...</div>
                ) : posts.length === 0 ? (
                    <div style={{ textAlign: 'center', marginTop: '100px' }}>
                        <p style={{ color: '#888', fontSize: '15px' }}>작성한 게시글이 없습니다.<br />이웃들과 이야기를 나누어보세요!</p>
                        <button
                            onClick={() => router.push('/feed')}
                            style={{ marginTop: '20px', padding: '12px 24px', borderRadius: '10px', background: '#FF5A00', border: 'none', color: 'white', fontWeight: 600 }}
                        >
                            글 쓰러 가기
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {posts.map((post) => (
                            <div
                                key={post.id}
                                onClick={() => router.push(`/feed`)}
                                style={{ padding: '16px', background: '#1E1E1E', borderRadius: '16px', cursor: 'pointer' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '12px', color: '#FF5A00', fontWeight: 600 }}>{post.category || '생활정보'}</span>
                                    <Trash2 size={16} color="#555" onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }} />
                                </div>
                                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</h3>
                                <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.content}</p>
                                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#666' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Heart size={14} /> {post.likes || 0}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <MessageCircle size={14} /> {post.comment_count || 0}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Eye size={14} /> {post.views || 0}
                                    </div>
                                    <div style={{ marginLeft: 'auto' }}>
                                        {new Date(post.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
