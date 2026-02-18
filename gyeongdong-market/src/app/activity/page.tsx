'use client';

import { Bell, Map as MapIcon, Calendar, Camera, Trophy, Plus, MapPin, ArrowRight } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function Activity() {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newCourse, setNewCourse] = useState({ title: '', desc: '', hashtags: '' });
    const [stops, setStops] = useState<any[]>([]);
    const [shopSearch, setShopSearch] = useState('');
    const [shopSuggestions, setShopSuggestions] = useState<any[]>([]);
    const [courseFile, setCourseFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [userProfile, setUserProfile] = useState<any>(null);

    // Detail Modal State
    const [selectedCourse, setSelectedCourse] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        fetchCourses();
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setUserProfile(data);
        }
    }

    const fetchCourses = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('courses')
            .select('*, author:profiles(nickname, avatar_url, role)')
            .order('likes', { ascending: false });

        if (error) {
            console.error('Error fetching courses detailed:', JSON.stringify(error, null, 2));
            console.error('Error details:', error);
        } else if (data) {
            // Filter out courses from blocked users
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: blocks } = await supabase
                    .from('user_blocks')
                    .select('blocked_id')
                    .eq('blocker_id', user.id);

                if (blocks && blocks.length > 0) {
                    const blockedIds = blocks.map(b => b.blocked_id);
                    setCourses(data.filter(course => !blockedIds.includes(course.author_id)));
                } else {
                    setCourses(data);
                }
            } else {
                setCourses(data);
            }
        }
        setLoading(false);
    };

    const fetchShopSuggestions = async (term: string) => {
        if (term.length < 1) {
            setShopSuggestions([]);
            return;
        }
        const { data } = await supabase
            .from('shops')
            .select('id, name, category')
            .ilike('name', `%${term}%`)
            .limit(5);
        if (data) setShopSuggestions(data);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchShopSuggestions(shopSearch);
        }, 300);
        return () => clearTimeout(timer);
    }, [shopSearch]);

    const addStop = (shop: any) => {
        if (stops.find(s => s.id === shop.id)) return;
        setStops([...stops, shop]);
        setShopSearch('');
        setShopSuggestions([]);
    };

    const removeStop = (id: string) => {
        setStops(stops.filter(s => s.id !== id));
    };

    const uploadFile = async (file: File, path: string) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${path}/${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('images').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('images').getPublicUrl(fileName);
        return data.publicUrl;
    };

    const handleCreateCourse = async () => {
        if (!userProfile) {
            alert('로그인이 필요합니다.');
            return;
        }
        if (!newCourse.title || !newCourse.desc) {
            alert('제목과 설명을 입력해주세요.');
            return;
        }

        let imageUrl = 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500'; // Default
        if (courseFile) {
            try {
                imageUrl = await uploadFile(courseFile, 'courses');
            } catch (error: any) {
                alert('이미지 업로드 실패: ' + error.message);
                return;
            }
        }
        const [activeMenuCourseId, setActiveMenuCourseId] = useState<string | null>(null);

        const handleReport = async (item: any, type: 'course' | 'comment') => {
            const reason = prompt('신고 사유를 입력해주세요 (예: 욕설, 스팸, 부적절한 콘텐츠)');
            if (!reason) return;

            const { error } = await supabase.from('reports').insert({
                reporter_id: userProfile?.id,
                reported_user_id: item.author_id,
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

        const handleBlockUser = async (targetUserId: string) => {
            if (!confirm('이 사용자를 차단하시겠습니까? 차단하면 이 사용자의 코스가 보이지 않습니다.')) return;

            const { error } = await supabase.from('user_blocks').insert({
                blocker_id: userProfile?.id,
                blocked_id: targetUserId
            });

            if (error) {
                alert('차단 처리 중 오류가 발생했습니다: ' + error.message);
            } else {
                alert('사용자가 차단되었습니다.');
                setCourses(courses.filter(c => c.author_id !== targetUserId));
            }
        };

        // Parse hashtags
        const tags = newCourse.hashtags.split(' ')
            .filter(tag => tag.startsWith('#'))
            .map(tag => tag.trim());

        const { error } = await supabase.from('courses').insert({
            title: newCourse.title,
            description: newCourse.desc,
            image_url: imageUrl,
            likes: 0,
            tags: tags.length > 0 ? tags : ['#추천코스', '#직접만듦'],
            stops: stops,
            author_id: userProfile.id
        });

        if (error) {
            alert('등록 실패: ' + error.message);
        } else {
            // Award points for creating course
            await supabase.rpc('award_points', { user_id: userProfile.id, amount: 10 });

            alert('코스가 등록되었습니다! (10P 지급)');
            setNewCourse({ title: '', desc: '', hashtags: '' });
            setStops([]);
            setCourseFile(null);
            setShowCreateForm(false);
            fetchCourses();
        }
    };

    const handleLike = async (e: React.MouseEvent, courseId: string) => {
        e.stopPropagation();

        // Use RPC to bypass RLS update restriction

        // Optimistic update
        setCourses(courses.map(c => c.id === courseId ? { ...c, likes: (c.likes || 0) + 1 } : c));
        if (selectedCourse?.id === courseId) {
            setSelectedCourse({ ...selectedCourse, likes: (selectedCourse.likes || 0) + 1 });
        }

        const { error } = await supabase.rpc('increment_course_likes', { course_id: courseId });
        if (error) {
            console.error('Like error:', error);
            // Revert
            fetchCourses();
        } else {
            // Award points
            if (userProfile) {
                await supabase.rpc('award_points', { user_id: userProfile.id, amount: 5 });
            }
        }
    };

    const handleDeleteCourse = async (courseId: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        const { error } = await supabase.from('courses').delete().eq('id', courseId);
        if (error) {
            alert('삭제 실패: ' + error.message);
        } else {
            alert('삭제되었습니다.');
            setSelectedCourse(null);
            fetchCourses();
        }
    };

    // --- Comments Logic ---
    const fetchComments = async (courseId: string) => {
        const { data } = await supabase
            .from('course_comments')
            .select('*, author:profiles(nickname, avatar_url)')
            .eq('course_id', courseId)
            .order('created_at', { ascending: true });
        if (data) setComments(data);
    };

    const handleAddComment = async () => {
        if (!userProfile) return alert('로그인이 필요합니다.');
        if (!newComment.trim()) return;

        const { error } = await supabase.from('course_comments').insert({
            course_id: selectedCourse.id,
            author_id: userProfile.id,
            text: newComment
        });

        if (error) {
            alert('댓글 작성 실패: ' + error.message);
        } else {
            // Award points
            await supabase.rpc('award_points', { user_id: userProfile.id, amount: 5 });
            setNewComment('');
            fetchComments(selectedCourse.id);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('삭제하시겠습니까?')) return;
        const { error } = await supabase.from('course_comments').delete().eq('id', commentId);
        if (error) {
            alert('삭제 실패: ' + error.message);
        } else {
            fetchComments(selectedCourse.id);
        }
    };

    const openCourseDetail = (course: any) => {
        setSelectedCourse(course);
        fetchComments(course.id);
    };

    return (
        <div style={{ padding: '20px', paddingBottom: '90px', background: '#F8F9FA', minHeight: '100vh', position: 'relative' }}>
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                background: 'white',
                padding: '24px 20px',
                borderRadius: '24px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.06)'
            }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>시장 탐험 & 활동</h1>
                    <p style={{ color: '#666', fontSize: '14px' }}>나만의 코스를 만들고 공유해보세요!</p>
                </div>
                <button
                    onClick={() => setShowCreateForm(true)}
                    style={{ width: '48px', height: '48px', background: '#FF5A00', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', boxShadow: '0 4px 12px rgba(255,90,0,0.4)', cursor: 'pointer' }}
                >
                    <Plus size={24} color="white" />
                </button>
            </header>

            {/* Create Course Form Modal */}
            {showCreateForm && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 2000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div style={{ background: 'white', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px', padding: '24px', position: 'relative' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>새로운 코스 만들기</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <input
                                type="text" placeholder="코스 제목 (예: 데이트 코스)"
                                value={newCourse.title} onChange={e => setNewCourse({ ...newCourse, title: e.target.value })}
                                style={{ padding: '14px', borderRadius: '12px', border: '1px solid #ddd', background: '#f9f9f9', fontSize: '16px' }}
                            />
                            <textarea
                                placeholder="코스 설명 (어떤 순서로 방문하면 좋을까요?)"
                                value={newCourse.desc} onChange={e => setNewCourse({ ...newCourse, desc: e.target.value })}
                                style={{ padding: '14px', borderRadius: '12px', border: '1px solid #ddd', background: '#f9f9f9', minHeight: '100px', fontSize: '14px', resize: 'none' }}
                            />
                            <input
                                type="text" placeholder="해시태그 입력 (예: #데이트 #맛집)"
                                value={newCourse.hashtags} onChange={e => setNewCourse({ ...newCourse, hashtags: e.target.value })}
                                style={{ padding: '14px', borderRadius: '12px', border: '1px solid #ddd', background: '#f9f9f9', fontSize: '14px', color: '#FF5A00', fontWeight: 600 }}
                            />

                            {/* Course Image Upload */}
                            <div style={{ border: '2px dashed #eee', borderRadius: '16px', padding: '20px', textAlign: 'center', background: '#fcfcfc' }}>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    accept="image/*"
                                    onChange={(e) => e.target.files && setCourseFile(e.target.files[0])}
                                />
                                {courseFile ? (
                                    <div style={{ position: 'relative' }}>
                                        <img src={URL.createObjectURL(courseFile)} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '12px' }} />
                                        <button onClick={() => setCourseFile(null)} style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 30, height: 30 }}>X</button>
                                    </div>
                                ) : (
                                    <div onClick={() => fileInputRef.current?.click()} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#999' }}>
                                        <Camera size={32} color="#ddd" />
                                        <span style={{ fontSize: '14px', fontWeight: 600 }}>대표 사진 업로드</span>
                                    </div>
                                )}
                            </div>

                            {/* Course Stops Section */}
                            <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '16px' }}>
                                <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px', color: '#555' }}>코스 장소 추가 ({stops.length})</h4>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                                    {stops.map((stop, idx) => (
                                        <div key={stop.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '10px 14px', borderRadius: '10px', border: '1px solid #eee' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ width: '20px', height: '20px', background: '#333', color: 'white', borderRadius: '50%', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{idx + 1}</span>
                                                <span style={{ fontSize: '14px', fontWeight: 600 }}>{stop.name}</span>
                                            </div>
                                            <button onClick={() => removeStop(stop.id)} style={{ background: 'transparent', border: 'none', color: '#ff4444', fontSize: '12px', fontWeight: 700 }}>삭제</button>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text" placeholder="방문할 상점 검색..."
                                        value={shopSearch} onChange={e => setShopSearch(e.target.value)}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '14px' }}
                                    />
                                    {shopSuggestions.length > 0 && (
                                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, marginTop: '4px', border: '1px solid #eee' }}>
                                            {shopSuggestions.map(shop => (
                                                <div key={shop.id} onClick={() => addStop(shop)} style={{ padding: '12px 16px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <div style={{ fontSize: '14px', fontWeight: 600 }}>{shop.name}</div>
                                                        <div style={{ fontSize: '12px', color: '#999' }}>{shop.category}</div>
                                                    </div>
                                                    <Plus size={16} color="#FF5A00" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                <button onClick={() => setShowCreateForm(false)} style={{ flex: 1, padding: '16px', background: '#eee', color: '#666', borderRadius: '12px', border: 'none', fontWeight: 700, cursor: 'pointer' }}>취소</button>
                                <button onClick={handleCreateCourse} style={{ flex: 1, padding: '16px', background: '#333', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 700, cursor: 'pointer' }}>등록하기</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Course List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, paddingLeft: '4px' }}>인기 추천 코스 Top 10</h3>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>로딩 중...</div>
                ) : courses.length > 0 ? (
                    courses.map((course, i) => (
                        <div key={course.id}
                            onClick={() => openCourseDetail(course)}
                            style={{
                                background: 'white',
                                borderRadius: '20px',
                                overflow: 'hidden',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                                position: 'relative',
                                cursor: 'pointer',
                                transition: 'transform 0.2s'
                            }}
                        >
                            <div style={{ height: '180px', position: 'relative' }}>
                                <img
                                    src={course.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800'}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                        e.currentTarget.src = 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=800';
                                    }}
                                />
                                <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                                    {i + 1}위
                                </div>
                                <button
                                    onClick={(e) => handleLike(e, course.id)}
                                    style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'white', border: 'none', borderRadius: '20px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer' }}
                                >
                                    <span style={{ fontSize: '16px', color: '#FF5A00' }}>♥</span>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#333' }}>{course.likes || 0}</span>
                                </button>
                            </div>
                            <div style={{ padding: '20px' }}>
                                <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{course.title}</h4>
                                <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.5', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{course.description}</p>

                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {course.tags?.map((tag: string, idx: number) => (
                                        <span key={idx} style={{ fontSize: '12px', color: '#888', background: '#f5f5f5', padding: '4px 8px', borderRadius: '4px' }}>{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>등록된 코스가 없습니다. 첫 코스를 만들어보세요!</div>
                )}
            </div>

            {/* Course Detail Modal */}
            {selectedCourse && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', zIndex: 3000,
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
                }} onClick={() => setSelectedCourse(null)}>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '100%', maxWidth: '600px', height: '90vh',
                            background: 'white', borderRadius: '24px 24px 0 0',
                            padding: '24px', overflowY: 'auto', position: 'relative',
                            animation: 'slideUp 0.3s ease-out'
                        }}
                    >
                        <div style={{ width: '40px', height: '5px', background: '#ddd', borderRadius: '3px', margin: '0 auto 20px' }}></div>

                        {/* Detail Header */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                <h2 style={{ fontSize: '22px', fontWeight: 800, lineHeight: 1.3 }}>{selectedCourse.title}</h2>
                                {(userProfile?.role === 'ADMIN' || userProfile?.id === selectedCourse.author_id) && (
                                    <button
                                        onClick={() => handleDeleteCourse(selectedCourse.id)}
                                        style={{ background: '#ffeeee', color: '#ff4444', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                                    >
                                        삭제
                                    </button>
                                )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <img src={selectedCourse.author?.avatar_url || 'https://via.placeholder.com/32'} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                                <span style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>{selectedCourse.author?.nickname || '익명'}</span>
                                <span style={{ fontSize: '12px', color: '#999' }}>· {new Date(selectedCourse.created_at).toLocaleDateString()}</span>
                            </div>
                            <p style={{ fontSize: '15px', lineHeight: 1.6, color: '#444' }}>{selectedCourse.description}</p>
                        </div>

                        {/* Stops Route */}
                        {selectedCourse.stops && selectedCourse.stops.length > 0 && (
                            <div style={{ background: '#F8F9FA', borderRadius: '16px', padding: '16px', marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: '#666' }}>📍 코스 경로</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {selectedCourse.stops.map((stop: any, idx: number) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                <div style={{ width: '24px', height: '24px', background: '#FF5A00', color: 'white', borderRadius: '50%', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{idx + 1}</div>
                                                {idx < selectedCourse.stops.length - 1 && <div style={{ width: '2px', height: '16px', background: '#ddd' }}></div>}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '15px', fontWeight: 700, color: '#333' }}>{stop.name}</div>
                                                <div style={{ fontSize: '13px', color: '#888' }}>{stop.category}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Comments Section */}
                        <div style={{ borderTop: '1px solid #eee', paddingTop: '24px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>댓글 {comments.length}개</h3>

                            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                                <input
                                    type="text"
                                    placeholder="댓글을 남겨보세요..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                    style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#f5f5f5', border: 'none', fontSize: '14px' }}
                                />
                                <button
                                    onClick={handleAddComment}
                                    style={{ background: '#333', color: 'white', border: 'none', borderRadius: '12px', padding: '0 16px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
                                >
                                    등록
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {comments.map((comment) => (
                                    <div key={comment.id} style={{ display: 'flex', gap: '12px' }}>
                                        <img src={comment.author?.avatar_url || 'https://via.placeholder.com/32'} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '13px', fontWeight: 600 }}>{comment.author?.nickname || '익명'}</span>
                                                <span style={{ fontSize: '11px', color: '#999' }}>{new Date(comment.created_at).toLocaleDateString()}</span>
                                                {(userProfile?.id === comment.author_id || userProfile?.role === 'ADMIN') && (
                                                    <button onClick={() => handleDeleteComment(comment.id)} style={{ padding: 0, border: 'none', background: 'transparent', color: '#ff4444', fontSize: '11px', cursor: 'pointer' }}>삭제</button>
                                                )}
                                            </div>
                                            <p style={{ fontSize: '14px', color: '#444', lineHeight: 1.4 }}>{comment.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
