# 경동시장 로컬 플랫폼 MVP

## 🎯 프로젝트 개요
경동시장 특화 로컬 플랫폼 - "찾기/신뢰/구매/배송"을 한 번에 해결

### 핵심 가치
- **2.5D 지도**: 시장 동선 이해 및 빠른 가게 찾기
- **위키**: 집단지성 기반 정보 최신화
- **사장님 인증**: 공식 정보로 신뢰 구축
- **묶음배송(대행구매)**: 짐/주차/시간 문제 해결

## 🚀 기술 스택
- **Frontend**: Next.js 16 (App Router) + TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Map**: Leaflet + OpenStreetMap
- **Styling**: CSS Modules (Vanilla CSS)
- **Deployment**: Vercel (Frontend) / Supabase (Backend)

## 📁 프로젝트 구조
```
src/
├── app/
│   ├── page.tsx              # 홈 (지도)
│   ├── shop/[id]/            # 가게 상세
│   ├── cart/                 # 장바구니
│   ├── admin/                # 운영자 콘솔
│   └── picker/               # 피커 화면
├── components/
│   ├── Map.tsx               # 지도 (Zone 오버레이)
│   ├── WikiEditor.tsx        # 위키 편집
│   └── NotificationCenter.tsx # 실시간 알림
├── context/
│   └── CartContext.tsx       # 장바구니 상태
└── lib/
    └── supabaseClient.ts     # Supabase 클라이언트
```

## 🗄️ 데이터베이스 설정

### 1. Supabase 프로젝트 생성
1. [Supabase](https://supabase.com) 접속
2. 새 프로젝트 생성
3. SQL Editor에서 다음 파일들을 순서대로 실행:
   - `supabase_schema.sql` (메인 스키마)
   - `storage_schema.sql` (Storage 설정)
   - `picker_policies.sql` (RLS 정책)
   - `seed_data.sql` (테스트 데이터)

### 2. 환경 변수 설정
`.env.local` 파일에 Supabase 정보 입력:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 🏃 로컬 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

## ✅ 구현된 기능 (MVP)

### 사용자 기능
- ✅ 2.5D 지도 (Zone 오버레이)
- ✅ 가게 검색 및 상세 정보
- ✅ 위키 편집 (사진 증빙)
- ✅ 장바구니 (가게별 그룹핑)
- ✅ 주문 접수 (대체 규칙)

### 운영자 기능
- ✅ 주문 목록 및 필터링
- ✅ 주문 상태 변경
- ✅ 실시간 알림

### 피커 기능
- ✅ 주문 체크리스트
- ✅ 품절 처리
- ✅ 구매 완료 체크
- ✅ 진행률 추적

## 📊 주요 테이블

- `zones`: 시장 구역
- `pois`: 주요 지점 (게이트, 화장실 등)
- `shops`: 가게 정보
- `wiki_revisions`: 위키 수정 이력
- `orders`: 주문
- `order_items`: 주문 품목
- `picker_events`: 피킹 이벤트

## 🎨 페이지 구성

| 경로 | 설명 |
|------|------|
| `/` | 홈 (지도 + 가게 검색) |
| `/shop/[id]` | 가게 상세 (위키 + 주문) |
| `/cart` | 장바구니 |
| `/admin` | 운영자 콘솔 |
| `/picker` | 피커 화면 |

## 🔐 보안 (RLS)

Supabase Row Level Security로 권한 관리:
- 사용자: 본인 주문만 접근
- 피커: 배정된 주문 접근
- 운영자: 전체 접근

## 📱 모바일 최적화

- Mobile-First 디자인
- 터치 친화적 UI
- 반응형 레이아웃

## 🚧 향후 개발 계획

- [ ] 사장님 인증 플로우
- [ ] 결제 연동 (토스페이먼츠)
- [ ] 푸시 알림 (FCM)
- [ ] 리뷰 시스템
- [ ] 가격 히스토리
- [ ] 큐레이션 세트

## 📄 라이선스
MIT

## 👥 팀
경동시장 로컬 플랫폼 개발팀
