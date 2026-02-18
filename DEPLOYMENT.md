# 경동시장 로컬 플랫폼 - 배포 가이드

## 🚀 Vercel 배포

### 1. GitHub 연동
```bash
# Git 초기화 (이미 완료)
git init
git add .
git commit -m "Initial commit"

# GitHub 레포지토리 생성 후
git remote add origin https://github.com/your-username/gyeongdong-market.git
git push -u origin main
```

### 2. Vercel 배포
1. [Vercel](https://vercel.com) 접속
2. **Import Project** 클릭
3. GitHub 레포지토리 선택
4. **Environment Variables** 설정:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```
5. **Deploy** 클릭

### 3. 도메인 설정 (선택)
- Vercel 대시보드 → Settings → Domains
- 커스텀 도메인 추가 (예: `gyeongdong-market.com`)

## 📱 모바일 앱 변환

### Android/iOS (Capacitor)
```bash
npm install @capacitor/core @capacitor/cli
npx cap init

# Android
npm install @capacitor/android
npx cap add android
npx cap sync
npx cap open android

# iOS
npm install @capacitor/ios
npx cap add ios
npx cap sync
npx cap open ios
```

### macOS (Electron)
```bash
npm install electron electron-builder
# electron-main.js 설정 필요
npm run build:electron
```

## 🔧 성능 최적화 체크리스트

- [x] Next.js Image 최적화
- [x] React Compiler 활성화
- [x] CSS Modules 사용
- [x] Dynamic Import (Map 컴포넌트)
- [x] Supabase RLS 설정
- [ ] Lighthouse 점수 90+ 확인
- [ ] 이미지 WebP 변환
- [ ] Service Worker (PWA)

## 📊 모니터링

### Vercel Analytics
- 자동으로 활성화됨
- 대시보드에서 트래픽 확인

### Supabase Monitoring
- Database → Logs
- Realtime → Connections
- Storage → Usage

## 🔐 보안 체크리스트

- [x] RLS 정책 설정
- [x] 환경 변수 분리
- [x] CORS 설정 (Supabase)
- [ ] Rate Limiting
- [ ] HTTPS 강제

## 🎯 런칭 전 테스트

1. **기능 테스트**
   - [ ] 지도 로딩
   - [ ] 가게 검색
   - [ ] 장바구니 추가
   - [ ] 주문 생성
   - [ ] 피커 플로우
   - [ ] 관리자 콘솔

2. **성능 테스트**
   - [ ] Lighthouse (모바일/데스크톱)
   - [ ] 로딩 시간 < 3초
   - [ ] First Contentful Paint < 1.8초

3. **호환성 테스트**
   - [ ] Chrome
   - [ ] Safari
   - [ ] Firefox
   - [ ] 모바일 브라우저

## 📞 지원

문제 발생 시:
1. Vercel 로그 확인
2. Supabase 로그 확인
3. 브라우저 콘솔 확인

## 🎉 런칭 후

1. Google Search Console 등록
2. Naver 웹마스터 도구 등록
3. 소셜 미디어 공유 테스트
4. 사용자 피드백 수집
