'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Bell, Search, MessageCircle, Heart, Plus, Camera, X, MoreHorizontal, ArrowLeft, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CommunityPage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPost, setNewPost] = useState({ title: '', content: '' });
    const [selectedImages, setSelectedImages] = useState<string[]>([]); // Supports up to 10

    const [userProfile, setUserProfile] = useState<{ id: string; nickname: string; avatar_url: string; role: string } | null>(null);

    // Search states
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Detail states
    const [selectedPost, setSelectedPost] = useState<any | null>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editPostId, setEditPostId] = useState<string | null>(null);

    const router = useRouter();

    useEffect(() => {
        fetchPosts();
        fetchUser();
    }, []);

    const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('id, nickname, avatar_url, role')
                .eq('id', user.id)
                .single();

            if (profile) {
                setUserProfile(profile);
            } else {
                setUserProfile({ id: user.id, nickname: '새로운 주민', avatar_url: '', role: 'USER' });
            }
        } else {
            setUserProfile({ id: '', nickname: '현지인', avatar_url: '', role: 'USER' });
        }
    };

    const fetchPosts = async () => {
        setLoading(true);
        // Fetch posts
        let query = supabase
            .from('community_posts')
            .select(`
                *,
                author:profiles(nickname, avatar_url, role),
                comments:community_comments(count)
            `)
            .order('created_at', { ascending: false });

        if (searchQuery) {
            query = query.or(`content.ilike.%${searchQuery}%,author_name.ilike.%${searchQuery}%`);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching posts:', JSON.stringify(error, null, 2));
        } else if (data) {
            // Filter out posts from blocked users
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: blocks } = await supabase
                    .from('user_blocks')
                    .select('blocked_id')
                    .eq('blocker_id', user.id);

                if (blocks && blocks.length > 0) {
                    const blockedIds = blocks.map(b => b.blocked_id);
                    setPosts(data.filter(post => !blockedIds.includes(post.author_id)));
                } else {
                    setPosts(data);
                }
            } else {
                setPosts(data);
            }
        }
        setLoading(false);
    };

    const handleCreatePost = async () => {
        if (!newPost.content) {
            alert('내용을 입력해주세요.');
            return;
        }

        if (isEditing && editPostId) {
            const { error } = await supabase
                .from('community_posts')
                .update({
                    title: newPost.title || newPost.content.substring(0, 20),
                    content: newPost.content,
                    images: selectedImages,
                })
                .eq('id', editPostId);

            if (error) {
                console.error('Update error:', error);
                alert('수정 실패: ' + error.message);
            } else {
                alert('게시글이 수정되었습니다.');
                setShowCreateModal(false);
                setNewPost({ title: '', content: '' });
                setSelectedImages([]);
                setIsEditing(false);
                setEditPostId(null);
                fetchPosts();
            }
            return;
        }

        const { error } = await supabase.from('community_posts').insert({
            title: newPost.title || newPost.content.substring(0, 20),
            content: newPost.content,
            images: selectedImages,
            likes: 0,
            views: 0,
            author_name: userProfile?.nickname || '현지인',
            author_id: userProfile?.id || null
        });

        if (error) {
            console.error('Insert error:', error);
            if (error.message.includes('column "images" does not exist')) {
                alert('DB에 "images" 컬럼이 아직 없습니다. Supabase에서 SQL을 다시 실행해 주세요.');
            } else {
                alert('등록 실패: ' + error.message);
            }
        } else {
            // Award points for creating a post
            const { error: pointError } = await supabase.rpc('award_points', { user_id: userProfile?.id, amount: 10 });
            if (pointError) console.error('Point award error:', pointError);

            alert('게시글이 등록되었습니다! (+10P)');
            setShowCreateModal(false);
            setNewPost({ title: '', content: '' });
            setSelectedImages([]);
            fetchPosts();
        }
    };

    const handleEditClick = (post: any) => {
        setNewPost({ title: post.title, content: post.content });
        setSelectedImages(post.images || []);
        setIsEditing(true);
        setEditPostId(post.id);
        setShowCreateModal(true);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        if (selectedImages.length + files.length > 10) {
            alert('사진은 최대 10장까지 등록 가능합니다.');
            return;
        }

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target?.result as string;
                setSelectedImages(prev => [...prev, base64]);
            };
            reader.readAsDataURL(file);
        });
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLike = async (e: React.MouseEvent, postId: string, currentLikes: number) => {
        e.stopPropagation();

        // Use RPC to safely increment likes without requiring full UPDATE permission
        const { error } = await supabase.rpc('increment_likes', { post_id: postId });

        if (error) {
            console.error('Like error:', error);
            alert('좋아요 반영 실패: ' + error.message);
        } else {
            // Award points for liking
            const { error: pointError } = await supabase.rpc('award_points', { user_id: userProfile?.id, amount: 5 });
            if (pointError) console.error('Point award error:', pointError);

            setPosts(posts.map(p => p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p));
            if (selectedPost?.id === postId) {
                setSelectedPost({ ...selectedPost, likes: (selectedPost.likes || 0) + 1 });
            }
        }
    };

    const openDetail = async (post: any) => {
        setSelectedPost(post);
        // view increment
        supabase.from('community_posts').update({ views: (post.views || 0) + 1 }).eq('id', post.id).then();

        const { data } = await supabase
            .from('community_comments')
            .select('*')
            .eq('post_id', post.id)
            .order('created_at', { ascending: true });

        setComments(data || []);
        setPosts(posts.map(p => p.id === post.id ? { ...p, views: (p.views || 0) + 1 } : p));
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !selectedPost) return;

        const { data, error } = await supabase
            .from('community_comments')
            .insert({
                post_id: selectedPost.id,
                content: newComment,
                author_name: userProfile?.nickname || '경동이',
                author_id: userProfile?.id || null
            })
            .select()
            .single();

        if (error) {
            console.error('Comment error:', error);
            alert('댓글 등록 실패: ' + error.message);
            // Award points for commenting
            const { error: pointError } = await supabase.rpc('award_points', { user_id: userProfile?.id, amount: 5 });
            if (pointError) console.error('Point award error:', pointError);

            setComments([...comments, data]);
            setNewComment('');
            setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, comment_count: (p.comment_count || 0) + 1 } : p));
        }
    };

    const handleDeletePost = async (e: React.MouseEvent, postId: string) => {
        e.stopPropagation();
        if (!confirm('정말 이 게시글을 삭제하시겠습니까?')) return;

        const { error } = await supabase.from('community_posts').delete().eq('id', postId);
        if (error) {
            alert('삭제 실패: ' + error.message);
        } else {
            alert('삭제되었습니다.');
            setPosts(posts.filter(p => p.id !== postId));
            if (selectedPost?.id === postId) setSelectedPost(null);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('정말 이 댓글을 삭제하시겠습니까?')) return;

        const { error } = await supabase.from('community_comments').delete().eq('id', commentId);
        if (error) {
            alert('댓글 삭제 실패: ' + error.message);
        } else {
            setComments(comments.filter(c => c.id !== commentId));
            if (selectedPost) {
                setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, comment_count: Math.max(0, (p.comment_count || 1) - 1) } : p));
            }
        }
    };

    const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);

    const handleReport = async (item: any, type: 'post' | 'comment') => {
        const reason = prompt('신고 사유를 입력해주세요 (예: 욕설, 스팸, 부적절한 콘텐츠)');
        if (!reason) return;

        const { error } = await supabase.from('reports').insert({
            reporter_id: userProfile?.id,
            reported_user_id: item.author_id, // Ensure this exists on item
            content_type: type,
            content_id: item.id,
            reason: reason
        });

        if (error) {
            alert('신고 접수 중 오류가 발생했습니다: ' + error.message);
        } else {
            alert('성공적으로 신고가 접수되었습니다. 관리자 검토 후 조치될 예정입니다.');
        }
    };

    const handleBlockUser = async (userId: string) => {
        if (!confirm('이 사용자를 차단하시겠습니까? 차단하면 이 사용자의 게시글이 보이지 않습니다.')) return;

        const { error } = await supabase.from('user_blocks').insert({
            blocker_id: userProfile?.id,
            blocked_id: userId
        });

        if (error) {
            alert('차단 처리 중 오류가 발생했습니다: ' + error.message);
        } else {
            alert('사용자가 차단되었습니다.');
            // Optimistically update UI to remove posts from blocked user
            setPosts(posts.filter(p => p.author_id !== userId));
        }
    };

    const renderContent = (text: string) => {
        return text.split(/(\s+)/).map((word, i) => {
            if (word.startsWith('#')) {
                return <span key={i} style={{ color: '#FF5A00', fontWeight: 700 }}>{word}</span>;
            }
            return word;
        });
    };

    const ImageSlider = ({ images, height = '350px' }: { images: string[], height?: string }) => {
        const [currentIndex, setCurrentIndex] = useState(0);
        if (!images || images.length === 0) return null;

        return (
            <div style={{ position: 'relative', width: '100%', height, background: '#f5f5f5' }}>
                <img
                    src={images[currentIndex]}
                    alt={`img-${currentIndex}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: '0.3s' }}
                />

                {images.length > 1 && (
                    <>
                        <div style={{
                            position: 'absolute', bottom: '16px', right: '16px',
                            background: 'rgba(0,0,0,0.6)', color: 'white',
                            padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700
                        }}>
                            {currentIndex + 1} / {images.length}
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => prev > 0 ? prev - 1 : prev); }}
                            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', visibility: currentIndex === 0 ? 'hidden' : 'visible' }}
                        >
                            <ChevronLeft size={20} color="#333" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => prev < images.length - 1 ? prev + 1 : prev); }}
                            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', visibility: currentIndex === images.length - 1 ? 'hidden' : 'visible' }}
                        >
                            <ChevronRight size={20} color="#333" />
                        </button>
                    </>
                )}
            </div>
        );
    };

    const filteredPosts = posts.filter(p =>
        p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.author_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={{ background: '#F8F9FA', minHeight: '100vh', paddingBottom: '100px' }}>
            <header style={{
                position: 'sticky', top: 0, zIndex: 100,
                background: 'white', padding: '16px 20px',
                display: 'flex', flexDirection: 'column', gap: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#111' }}>커뮤니티</h1>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <button onClick={() => setIsSearching(!isSearching)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                            <Search size={24} color="#333" />
                        </button>
                        <Bell size={24} color="#333" />
                    </div>
                </div>
                {isSearching && (
                    <div style={{ background: '#f5f5f5', borderRadius: '12px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Search size={18} color="#999" />
                        <input type="text" placeholder="글 내용이나 작성자 검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus style={{ background: 'transparent', border: 'none', width: '100%', outline: 'none', fontSize: '14px' }} />
                        {searchQuery && <X size={18} color="#999" onClick={() => setSearchQuery('')} style={{ cursor: 'pointer' }} />}
                    </div>
                )}
            </header>

            <main style={{ padding: '16px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>로딩 중...</div>
                ) : filteredPosts.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {filteredPosts.map((post) => (
                            <div key={post.id} onClick={() => openDetail(post)} style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.02)', cursor: 'pointer' }}>
                                <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>👤</div>
                                        <div>
                                            <div style={{ fontSize: '15px', fontWeight: 700 }}>{post.author_name || '시장돌이'}</div>
                                            <div style={{ fontSize: '12px', color: '#999' }}>{new Date(post.created_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <div style={{ position: 'relative' }}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id); }}
                                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                                            >
                                                <MoreHorizontal size={20} color="#999" />
                                            </button>

                                            {activeMenuPostId === post.id && (
                                                <div style={{
                                                    position: 'absolute', top: '30px', right: 0,
                                                    background: 'white', borderRadius: '8px',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                    zIndex: 10, minWidth: '120px', overflow: 'hidden'
                                                }}>
                                                    {(userProfile?.role === 'ADMIN' || userProfile?.id === post.author_id) ? (
                                                        <>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleEditClick(post); setActiveMenuPostId(null); }}
                                                                style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'white', cursor: 'pointer', textAlign: 'left', fontSize: '14px' }}
                                                            >
                                                                수정하기
                                                            </button>
                                                            <button
                                                                onClick={(e) => { handleDeletePost(e, post.id); setActiveMenuPostId(null); }}
                                                                style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'white', cursor: 'pointer', textAlign: 'left', fontSize: '14px', color: '#FF4444' }}
                                                            >
                                                                삭제하기
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleReport(post, 'post'); setActiveMenuPostId(null); }}
                                                                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 16px', border: 'none', background: 'white', cursor: 'pointer', textAlign: 'left', fontSize: '14px' }}
                                                            >
                                                                <span style={{ fontSize: '16px' }}>🚨</span> 신고하기
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleBlockUser(post.author_id); setActiveMenuPostId(null); }}
                                                                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 16px', border: 'none', background: 'white', cursor: 'pointer', textAlign: 'left', fontSize: '14px', color: '#888' }}
                                                            >
                                                                <span style={{ fontSize: '16px' }}>🚫</span> 차단하기
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <ImageSlider images={post.images || (post.image_url ? [post.image_url] : [])} />

                                <div style={{ padding: '16px 20px' }}>
                                    <p style={{ fontSize: '15px', lineHeight: 1.6, color: '#333', marginBottom: '16px', fontWeight: 500 }}>{renderContent(post.content)}</p>
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', borderTop: '1px solid #f5f5f5', paddingTop: '16px' }}>
                                        <button onClick={(e) => handleLike(e, post.id, post.likes)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                            <Heart size={20} color={post.likes > 0 ? "#FF4444" : "#999"} fill={post.likes > 0 ? "#FF4444" : "transparent"} />
                                            <span style={{ fontSize: '13px', fontWeight: 600 }}>{post.likes}</span>
                                        </button>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MessageCircle size={20} color="#999" /><span style={{ fontSize: '13px', fontWeight: 600 }}>{post.comment_count || 0}</span></div>
                                        <div style={{ fontSize: '12px', color: '#bbb', marginLeft: 'auto' }}>조회 {post.views}회</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>결과가 없습니다.</div>}
            </main>

            <button onClick={() => setShowCreateModal(true)} style={{ position: 'fixed', bottom: '100px', right: '20px', width: '56px', height: '56px', borderRadius: '28px', background: '#FF5A00', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', boxShadow: '0 8px 24px rgba(255,90,0,0.3)', zIndex: 100, cursor: 'pointer' }}><Plus size={28} /></button>

            {showCreateModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <div style={{ width: '100%', maxWidth: '500px', background: 'white', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', minHeight: '80vh' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 800 }}>시장 소식 올리기</h2>
                            <X size={24} onClick={() => setShowCreateModal(false)} style={{ cursor: 'pointer' }} />
                        </div>
                        <textarea placeholder="경동시장에서 어떤 일이 있었나요? #해시태그" value={newPost.content} onChange={e => setNewPost({ ...newPost, content: e.target.value })} style={{ width: '100%', minHeight: '150px', border: 'none', fontSize: '16px', outline: 'none', resize: 'none' }} />

                        <div style={{ marginTop: '20px' }}>
                            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px' }}>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={handleImageChange}
                                />
                                <div onClick={() => fileInputRef.current?.click()} style={{ minWidth: '80px', height: '80px', borderRadius: '12px', background: '#f5f5f5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                    <Camera size={24} color="#999" />
                                    <span style={{ fontSize: '11px', color: '#999' }}>{selectedImages.length}/10</span>
                                </div>
                                {selectedImages.map((img, i) => (
                                    <div key={i} style={{ position: 'relative', minWidth: '80px', height: '80px' }}>
                                        <img src={img} style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }} alt="preview" />
                                        <X size={14} onClick={() => setSelectedImages(selectedImages.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'white', borderRadius: '50%', padding: '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', cursor: 'pointer' }} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button onClick={handleCreatePost} style={{ width: '100%', padding: '16px', borderRadius: '12px', background: '#FF5A00', color: 'white', border: 'none', fontWeight: 800, fontSize: '16px', marginTop: '20px', cursor: 'pointer' }}>게시하기</button>
                    </div>
                </div>
            )}

            {selectedPost && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1100, background: 'white', display: 'flex', flexDirection: 'column' }}>
                    <header style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid #eee' }}>
                        <ArrowLeft size={24} onClick={() => setSelectedPost(null)} style={{ cursor: 'pointer' }} />
                        <h2 style={{ fontSize: '18px', fontWeight: 800 }}>소식 상세</h2>
                    </header>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                            <div>
                                <div style={{ fontWeight: 700 }}>{selectedPost.author_name}</div>
                                <div style={{ fontSize: '12px', color: '#999' }}>{new Date(selectedPost.created_at).toLocaleString()}</div>
                            </div>
                        </div>
                        <p style={{ fontSize: '16px', lineHeight: 1.7, color: '#333', marginBottom: '20px' }}>{renderContent(selectedPost.content)}</p>

                        <ImageSlider images={selectedPost.images || (selectedPost.image_url ? [selectedPost.image_url] : [])} height="auto" />

                        <div style={{ display: 'flex', gap: '20px', padding: '16px 0', borderTop: '1px solid #f5f5f5', borderBottom: '1px solid #f5f5f5', marginTop: '20px' }}>
                            <button
                                onClick={(e) => handleLike(e, selectedPost.id, selectedPost.likes)}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                            >
                                <Heart size={20} color={selectedPost.likes > 0 ? "#FF4444" : "#999"} fill={selectedPost.likes > 0 ? "#FF4444" : "transparent"} />
                                <span style={{ fontWeight: 600 }}>{selectedPost.likes}</span>
                            </button>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MessageCircle size={20} color="#999" /><span style={{ fontWeight: 600 }}>{comments.length}</span></div>
                            <div style={{ marginLeft: 'auto', color: '#999', fontSize: '13px' }}>조회 {selectedPost.views}회</div>
                        </div>

                        <div style={{ marginTop: '24px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '16px' }}>댓글 {comments.length}</h3>
                            {comments.map((c, i) => (
                                <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                                        {c.avatar_url ? <img src={c.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : '👤'}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ fontSize: '13px', fontWeight: 700 }}>{c.author_name || `익명 ${i + 1}`}</div>
                                            {(userProfile?.role === 'ADMIN' || userProfile?.id === c.author_id) && (
                                                <button
                                                    onClick={() => handleDeleteComment(c.id)}
                                                    style={{ background: 'transparent', border: 'none', color: '#FF4444', fontSize: '11px', cursor: 'pointer' }}
                                                >
                                                    삭제
                                                </button>
                                            )}
                                        </div>
                                        <p style={{ fontSize: '14px', color: '#444' }}>{c.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ padding: '12px 20px', borderTop: '1px solid #eee', background: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                            type="text"
                            placeholder="댓글을 입력하세요..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                            style={{ flex: 1, padding: '12px 16px', background: '#f5f5f5', borderRadius: '24px', border: 'none', outline: 'none' }}
                        />
                        <Send
                            size={24}
                            onClick={handleAddComment}
                            color={newComment.trim() ? '#FF5A00' : '#ccc'}
                            style={{ cursor: newComment.trim() ? 'pointer' : 'default' }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
