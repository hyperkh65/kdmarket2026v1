'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ChevronLeft } from 'lucide-react';

export default function SignUp() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                        role: 'USER',
                    },
                },
            });

            if (error) throw error;

            alert('회원가입이 완료되었습니다! 로그인해주세요.');
            router.push('/login');
        } catch (error: any) {
            alert('회원가입 실패: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', minHeight: '100vh', background: 'white', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
                <button onClick={() => router.back()} style={{ background: 'none', border: 'none', padding: '0', cursor: 'pointer' }}>
                    <ChevronLeft size={28} color="#333" />
                </button>
            </div>

            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#FF5A00', marginBottom: '8px' }}>회원가입</h1>
                <p style={{ color: '#666' }}>경동마켓의 다양한 혜택을 누려보세요!</p>
            </div>

            <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#555' }}>이름</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="이름을 입력해주세요"
                        required
                        style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '15px', outline: 'none' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#555' }}>이메일</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@email.com"
                        required
                        style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '15px', outline: 'none' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#555' }}>비밀번호</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="비밀번호 입력 (6자리 이상)"
                        required
                        minLength={6}
                        style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '15px', outline: 'none' }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        marginTop: '20px', padding: '18px', borderRadius: '12px', border: 'none',
                        background: loading ? '#ccc' : '#FF5A00', color: 'white', fontSize: '16px', fontWeight: 800,
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? '가입 중...' : '가입하기'}
                </button>
            </form>
        </div>
    );
}
