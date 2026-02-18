'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, CheckCircle, ChevronLeft } from 'lucide-react';

export default function ReceiptVerification() {
    const router = useRouter();
    const [isScanning, setIsScanning] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    const handleUpload = () => {
        setIsScanning(true);
        // Simulate scanning delay
        setTimeout(() => {
            setIsScanning(false);
            setIsComplete(true);
        }, 2000);
    };

    return (
        <div style={{ padding: '20px', background: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .spinner {
                    animation: spin 1s linear infinite;
                }
            `}</style>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                <button onClick={() => router.back()} style={{ background: 'none', border: 'none', padding: '0' }}>
                    <ChevronLeft size={24} color="#333" />
                </button>
                <h1 style={{ flex: 1, textAlign: 'center', fontSize: '18px', fontWeight: 700, marginRight: '24px' }}>영수증 인증</h1>
            </div>

            {!isComplete ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

                    {isScanning ? (
                        <div style={{ textAlign: 'center' }}>
                            <div className="spinner" style={{
                                width: '64px', height: '64px', border: '6px solid #f3f3f3',
                                borderTop: '6px solid #FF5A00', borderRadius: '50%', margin: '0 auto 24px'
                            }}></div>
                            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#333', marginBottom: '8px' }}>영수증 분석 중...</h3>
                            <p style={{ color: '#888' }}>잠시만 기다려주세요.</p>
                        </div>
                    ) : (
                        <>
                            <div
                                onClick={handleUpload}
                                style={{
                                    width: '100%', maxWidth: '300px', height: '400px',
                                    background: '#F8F9FA', borderRadius: '24px', border: '3px dashed #E0E0E0',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    color: '#AAA', cursor: 'pointer', marginBottom: '32px'
                                }}
                            >
                                <Camera size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
                                <span style={{ fontWeight: 600 }}>영수증 촬영 또는 업로드</span>
                            </div>
                            <p style={{ fontSize: '14px', color: '#888', textAlign: 'center', padding: '0 20px', lineHeight: 1.5 }}>
                                오늘 경동시장에서 구매한 영수증을 찍어주세요.<br />
                                <span style={{ color: '#FF5A00', fontWeight: 700 }}>건당 100P</span>를 적립해드립니다!
                            </p>
                        </>
                    )}
                </div>
            ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.5s' }}>
                    <CheckCircle size={80} color="#00C73C" style={{ marginBottom: '24px' }} />
                    <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#333', marginBottom: '8px' }}>인증 완료!</h2>
                    <p style={{ fontSize: '18px', color: '#666', marginBottom: '40px' }}>
                        <span style={{ color: '#FF5A00', fontWeight: 800 }}>100P</span>가 적립되었습니다.
                    </p>
                    <button
                        onClick={() => router.back()}
                        style={{
                            width: '100%', padding: '18px', borderRadius: '16px',
                            background: '#333', color: 'white', fontSize: '16px', fontWeight: 800, border: 'none'
                        }}
                    >
                        확인
                    </button>
                </div>
            )}
        </div>
    );
}
