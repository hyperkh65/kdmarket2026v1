'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import styles from '../page.module.css'; // Reusing home styles for simplicity

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isOwner, setIsOwner] = useState(false); // Toggle for "Owner Login"
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. ADMIN LOGIN CHECK (Hardcoded for MVP)
        if (email === '2days.kr@gmail.com' && password === '8412384123') {
            localStorage.setItem('user_role', 'ADMIN');
            localStorage.setItem('user_email', email);
            alert('관리자님 환영합니다.');
            router.push('/admin');
            return;
        }

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.user) {
                // Check Role from Metadata
                const role = data.user.user_metadata.role || 'USER';

                localStorage.setItem('user_role', role);
                localStorage.setItem('user_email', email);

                alert(`${role === 'OWNER' ? '사장님' : '회원님'} 환영합니다.`);

                if (role === 'OWNER') {
                    router.push('/my'); // Or Dashboard
                } else {
                    router.push('/');
                }
            }
        } catch (error: any) {
            alert('로그인 실패: ' + error.message);
        }
    };

    return (
        <div style={{ padding: '20px', minHeight: '100vh', background: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#FF5A00', marginBottom: '8px' }}>경동마켓</h1>
                <p style={{ color: '#666' }}>{isOwner ? '사장님, 오늘도 대박나세요!' : '우리 동네 시장의 모든 것'}</p>
            </div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Visual Toggle for User/Owner */}
                <div style={{ display: 'flex', background: '#F5F5F5', padding: '4px', borderRadius: '12px', marginBottom: '12px' }}>
                    <button
                        type="button"
                        onClick={() => setIsOwner(false)}
                        style={{
                            flex: 1, padding: '10px', borderRadius: '10px', border: 'none', fontWeight: 600,
                            background: !isOwner ? 'white' : 'transparent',
                            color: !isOwner ? '#333' : '#999',
                            boxShadow: !isOwner ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                        }}
                    >
                        일반 회원
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsOwner(true)}
                        style={{
                            flex: 1, padding: '10px', borderRadius: '10px', border: 'none', fontWeight: 600,
                            background: isOwner ? 'white' : 'transparent',
                            color: isOwner ? '#333' : '#999',
                            boxShadow: isOwner ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                        }}
                    >
                        사장님
                    </button>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#555' }}>이메일</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@email.com"
                        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '15px' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#555' }}>비밀번호</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="비밀번호 입력"
                        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '15px' }}
                    />
                </div>

                <button type="submit" style={{
                    marginTop: '20px', padding: '16px', borderRadius: '12px', border: 'none',
                    background: '#FF5A00', color: 'white', fontSize: '16px', fontWeight: 800
                }}>
                    로그인
                </button>
            </form>

            <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: '#888' }}>
                계정이 없으신가요?
                <span
                    onClick={() => {
                        if (isOwner) router.push('/register');
                        else router.push('/signup');
                    }}
                    style={{ color: '#FF5A00', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', marginLeft: '4px' }}
                >
                    {isOwner ? '사장님 입점 신청' : '회원가입'}
                </span>
            </div>

            <div style={{ marginTop: '32px', borderTop: '1px solid #eee', paddingTop: '24px' }}>
                <p style={{ textAlign: 'center', color: '#999', fontSize: '12px', marginBottom: '16px' }}>SNS 계정으로 3초 만에 시작하기</p>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={async () => {
                            const { error } = await supabase.auth.signInWithOAuth({
                                provider: 'google',
                                options: {
                                    redirectTo: `${window.location.origin}/auth/callback`,
                                },
                            });
                            if (error) alert(error.message);
                        }}
                        style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #eee', background: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <img src="https://cdn-icons-png.flaticon.com/512/2991/2991148.png" width={20} alt="Google" />
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>구글</span>
                    </button>
                    <button
                        onClick={async () => {
                            const { error } = await supabase.auth.signInWithOAuth({
                                provider: 'kakao',
                                options: {
                                    redirectTo: `${window.location.origin}/auth/callback`,
                                },
                            });
                            if (error) alert(error.message);
                        }}
                        style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#FEE500', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <img src="https://upload.wikimedia.org/wikipedia/commons/e/e3/KakaoTalk_logo.svg" width={20} alt="Kakao" />
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#3c1e1e' }}>카카오</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
