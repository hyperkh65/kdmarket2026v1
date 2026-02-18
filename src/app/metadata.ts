import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '경동시장 로컬 플랫폼 - 시장을 내 손안에',
    description: '경동시장 특화 지도, 위키, 묶음배송 서비스. 찾기/신뢰/구매/배송을 한 번에 해결하세요.',
    keywords: ['경동시장', '청량리시장', '건어물', '한약재', '시장배송', '대행구매'],
    authors: [{ name: '경동시장 플랫폼팀' }],
    openGraph: {
        title: '경동시장 로컬 플랫폼',
        description: '시장 동선 파악부터 묶음배송까지, 경동시장의 모든 것',
        type: 'website',
        locale: 'ko_KR',
    },
    viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 1,
    },
    themeColor: '#ff5a5f',
};
