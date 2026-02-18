'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { User, Settings, Heart, Bell, List, FileText, MapPin, Store, Megaphone, HelpCircle, LogOut, ChevronRight, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function MyPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState({ points: 0, favoriteCount: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setUser(user);

            // Fetch Profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileData) setProfile(profileData);

            // Fetch Stats
            const { count: favoriteCount } = await supabase
                .from('favorites')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            setStats({
                points: profileData?.points || 0,
                favoriteCount: favoriteCount || 0
            });
            setLoading(false);
        };
        fetchData();
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        localStorage.clear();
        router.push('/login');
    };

    if (loading) return (
        <div style={{ padding: '20px', background: '#121212', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            서버에서 유저 정보를 불러오는 중...
        </div>
    );

    const SectionHeader = ({ title }: { title: string }) => (
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#888', marginBottom: '8px', paddingLeft: '4px' }}>{title}</h3>
    );

    const MenuItem = ({ icon, text, href, onClick, color = "#fff" }: { icon: any, text: string, href?: string, onClick?: () => void, color?: string }) => {
        const content = (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {icon}
                    <span style={{ fontSize: '16px', color: color, fontWeight: 500 }}>{text}</span>
                </div>
                <ChevronRight size={18} color="#555" />
            </div>
        );

        if (href) return <Link href={href} style={{ textDecoration: 'none' }}>{content}</Link>;
        return <div onClick={onClick}>{content}</div>;
    };

    const roleText =
        profile?.role === 'ADMIN' ? '관리자' :
            profile?.role === 'OWNER' ? '사장님 회원' :
                '일반 회원';

    return (
        <div style={{ padding: '20px 20px 100px', background: '#121212', minHeight: '100vh', color: 'white', maxWidth: '500px', margin: '0 auto' }}>
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 700 }}>나의 경동</h1>
                <Settings size={24} color="#fff" style={{ cursor: 'pointer' }} />
            </header>

            {/* Profile Card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#333', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <User size={32} color="#aaa" />
                    )}
                </div>
                <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>
                        {profile?.nickname || user.user_metadata?.full_name || '경동 주민'}
                    </h2>
                    <p style={{ fontSize: '13px', color: '#888' }}>
                        {roleText}
                    </p>
                </div>
            </div>

            {/* Points & Stats */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
                <div style={{ flex: 1, background: '#1E1E1E', padding: '16px', borderRadius: '16px' }}>
                    <span style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>경동 포인트</span>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: '#FF5A00' }}>{stats.points.toLocaleString()} P</span>
                </div>
                <div style={{ flex: 1, background: '#1E1E1E', padding: '16px', borderRadius: '16px', cursor: 'pointer' }} onClick={() => router.push('/my/favorites')}>
                    <span style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>단골 맺은 가게</span>
                    <span style={{ fontSize: '18px', fontWeight: 700 }}>{stats.favoriteCount} 곳</span>
                </div>
            </div>

            {/* My Interests */}
            <div style={{ marginBottom: '32px' }}>
                <SectionHeader title="나의 관심" />
                <div style={{ background: '#1E1E1E', borderRadius: '16px', padding: '0 16px' }}>
                    <MenuItem icon={<Heart size={20} color="#fff" />} text="관심목록" href="/my/favorites" />
                    <MenuItem icon={<Bell size={20} color="#fff" />} text="키워드 알림 설정" href="/my/keywords" />
                    <MenuItem icon={<ShoppingCart size={20} color="#fff" />} text="장바구니" href="/purchase" />
                </div>
            </div>

            {/* My Activity */}
            <div style={{ marginBottom: '32px' }}>
                <SectionHeader title="나의 활동" />
                <div style={{ background: '#1E1E1E', borderRadius: '16px', padding: '0 16px' }}>
                    <MenuItem icon={<Store size={20} color="#fff" />} text="주문/배송 조회" href="/my/orders" />
                    <MenuItem icon={<FileText size={20} color="#fff" />} text="내가 남긴 리뷰글" href="/my/reviews" />
                    <MenuItem icon={<MapPin size={20} color="#fff" />} text="내가 남긴 피드글" href="/my/posts" />
                </div>
            </div>

            {/* My Business (Conditional) */}
            {profile?.role === 'ADMIN' ? (
                <div style={{ marginBottom: '32px' }}>
                    <SectionHeader title="관리자 메뉴" />
                    <div style={{ background: '#1E1E1E', borderRadius: '16px', padding: '0 16px' }}>
                        <MenuItem
                            icon={<Settings size={20} color="#FF5A00" />}
                            text="전체 관리자 대시보드"
                            href="/admin"
                            color="#FF5A00"
                        />
                        <MenuItem
                            icon={<Megaphone size={20} color="#fff" />}
                            text="금주의 시장 소식 관리"
                            href="/admin?tab=news"
                        />
                        <MenuItem
                            icon={<Bell size={20} color="#fff" />}
                            text="커뮤니티 신고 내역 관리"
                            href="/admin?tab=community"
                        />
                    </div>
                </div>
            ) : profile?.role === 'OWNER' ? (
                <div style={{ marginBottom: '32px' }}>
                    <SectionHeader title="나의 비즈니스" />
                    <div style={{ background: '#1E1E1E', borderRadius: '16px', padding: '0 16px' }}>
                        <MenuItem icon={<Store size={20} color="#fff" />} text="비즈프로필 관리" href="#" />
                        <MenuItem icon={<Megaphone size={20} color="#fff" />} text="내 가게 소식 올리기" href="#" />
                    </div>
                </div>
            ) : (
                <div style={{ marginBottom: '32px' }}>
                    <SectionHeader title="비즈니스 서비스" />
                    <div style={{ background: '#1E1E1E', borderRadius: '16px', padding: '0 16px' }}>
                        <MenuItem
                            icon={<Store size={20} color="#FF5A00" />}
                            text="경동시장 사장님 인증 신청"
                            href="/owner/verify"
                            color="#FF5A00"
                        />
                    </div>
                </div>
            )}

            {/* Customer Support & Policies */}
            <div style={{ marginBottom: '32px' }}>
                <SectionHeader title="설정 및 지원" />
                <div style={{ background: '#1E1E1E', borderRadius: '16px', padding: '0 16px' }}>
                    <MenuItem icon={<Bell size={20} color="#fff" />} text="알림 설정" href="/my/notifications" />
                    <MenuItem icon={<HelpCircle size={20} color="#fff" />} text="고객센터" href="/my/support" />
                    <MenuItem icon={<FileText size={20} color="#fff" />} text="서비스 이용약관" href="/terms" />
                    <MenuItem icon={<FileText size={20} color="#fff" />} text="개인정보 처리방침" href="/privacy" />
                    <MenuItem icon={<LogOut size={20} color="#EB5757" />} text="로그아웃" onClick={handleLogout} color="#EB5757" />
                    <div
                        onClick={async () => {
                            if (confirm('정말로 탈퇴하시겠습니까? 탈퇴 시 모든 정보가 삭제되며 복구할 수 없습니다.')) {
                                const { error } = await supabase.rpc('delete_own_account'); // Assuming we created this RPC
                                if (error) {
                                    alert('탈퇴 처리 중 오류가 발생했습니다: ' + error.message);
                                } else {
                                    alert('성공적으로 탈퇴되었습니다. 이용해 주셔서 감사합니다.');
                                    await supabase.auth.signOut();
                                    localStorage.clear();
                                    router.push('/login');
                                }
                            }
                        }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', cursor: 'pointer', borderTop: '1px solid #333', marginTop: '8px' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>회원 탈퇴</span>
                        </div>
                        <ChevronRight size={16} color="#666" />
                    </div>
                </div>
            </div>
        </div>
    );
}
