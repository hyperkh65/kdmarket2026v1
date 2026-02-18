'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ChevronLeft, Bell, Settings, ArrowRight, MessageSquare, Heart, Bookmark, ShoppingBag, Terminal } from 'lucide-react';

export default function NotificationSettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({
        keyword_enabled: true,
        purchase_enabled: true,
        community_enabled: true,
        shop_interest_enabled: true,
        marketing_enabled: false
    });

    useEffect(() => {
        const fetchSettings = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data, error } = await supabase
                .from('notification_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (data) {
                setSettings(data);
            } else if (error && error.code === 'PGRST116') {
                // No settings yet, create default
                const { data: newSettings } = await supabase
                    .from('notification_settings')
                    .insert({ user_id: user.id })
                    .select()
                    .single();
                if (newSettings) setSettings(newSettings);
            }
            setLoading(false);
        };
        fetchSettings();
    }, [router]);

    const toggleSetting = async (key: keyof typeof settings) => {
        const newSettings = { ...settings, [key]: !settings[key] };
        setSettings(newSettings);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
            .from('notification_settings')
            .update({ [key]: newSettings[key] })
            .eq('user_id', user.id);
    };

    const ToggleItem = ({ title, desc, icon, active, onToggle }: { title: string, desc: string, icon: any, active: boolean, onToggle: () => void }) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', borderBottom: '1px solid #222' }}>
            <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#1E1E1E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {icon}
                </div>
                <div>
                    <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>{title}</h4>
                    <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.4 }}>{desc}</p>
                </div>
            </div>
            <div
                onClick={onToggle}
                style={{
                    width: '50px', height: '28px', borderRadius: '15px',
                    background: active ? '#FF5A00' : '#333',
                    position: 'relative', cursor: 'pointer', transition: 'all 0.3s'
                }}
            >
                <div style={{
                    width: '22px', height: '22px', borderRadius: '50%', background: 'white',
                    position: 'absolute', top: '3px', left: active ? '25px' : '3px',
                    transition: 'all 0.3s'
                }} />
            </div>
        </div>
    );

    return (
        <div style={{ padding: '0 0 100px', background: '#121212', minHeight: '100vh', color: 'white' }}>
            <header style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, background: '#121212', zIndex: 10 }}>
                <ChevronLeft onClick={() => router.back()} style={{ cursor: 'pointer' }} />
                <h1 style={{ fontSize: '18px', fontWeight: 600 }}>알림 설정</h1>
            </header>

            <main style={{ padding: '0 20px' }}>
                <SectionHeader title="기본 알림" />
                <ToggleItem
                    title="키워드 알림"
                    desc="설정한 키워드가 포함된 새 글이 올라오면 알림을 드립니다."
                    icon={<Terminal size={20} color="#FF5A00" />}
                    active={settings.keyword_enabled}
                    onToggle={() => toggleSetting('keyword_enabled')}
                />
                <div
                    onClick={() => router.push('/my/keywords')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#1E1E1E', borderRadius: '12px', marginTop: '12px', cursor: 'pointer' }}
                >
                    <span style={{ fontSize: '14px', color: '#aaa' }}>알림 키워드 설정하러 가기</span>
                    <ArrowRight size={16} color="#666" />
                </div>

                <div style={{ marginTop: '32px' }}>
                    <SectionHeader title="활동 알림" />
                    <ToggleItem
                        title="주문 및 결제 알림"
                        desc="상품 구매 정보 및 배송 상태 알림을 보내드립니다."
                        icon={<ShoppingBag size={20} color="#FF5A00" />}
                        active={settings.purchase_enabled}
                        onToggle={() => toggleSetting('purchase_enabled')}
                    />
                    <ToggleItem
                        title="커뮤니티 및 소셜 알림"
                        desc="내 글의 좋아요, 댓글 및 소통 알림을 드립니다."
                        icon={<MessageSquare size={20} color="#FF5A00" />}
                        active={settings.community_enabled}
                        onToggle={() => toggleSetting('community_enabled')}
                    />
                    <ToggleItem
                        title="관심 매장 소식"
                        desc="단골 맺은 매장의 새 메뉴 및 공지 알림을 드립니다."
                        icon={<Heart size={20} color="#FF5A00" />}
                        active={settings.shop_interest_enabled}
                        onToggle={() => toggleSetting('shop_interest_enabled')}
                    />
                </div>

                <div style={{ marginTop: '32px' }}>
                    <SectionHeader title="마케팅 알림" />
                    <ToggleItem
                        title="혜택 및 이벤트 알림"
                        desc="경동시장 특가 상품 및 이벤트 정보를 보내드립니다."
                        icon={<Bell size={20} color="#888" />}
                        active={settings.marketing_enabled}
                        onToggle={() => toggleSetting('marketing_enabled')}
                    />
                </div>
            </main>
        </div>
    );
}

const SectionHeader = ({ title }: { title: string }) => (
    <div style={{ paddingTop: '24px', paddingBottom: '8px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h3>
    </div>
);
