# 경동시장 로컬 플랫폼 - 빠른 시작 가이드

## 🚀 5분 안에 시작하기

### 1. 환경 설정
```bash
# 프로젝트 클론
git clone https://github.com/your-username/gyeongdong-market.git
cd gyeongdong-market

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 열어서 Supabase 정보 입력
```

### 2. Supabase 설정
1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor에서 다음 파일들을 **순서대로** 실행:
   ```
   ① supabase_schema.sql
   ② storage_schema.sql  
   ③ picker_policies.sql
   ④ seed_data.sql
   ```
3. Project Settings → API에서 URL과 anon key 복사
4. `.env.local`에 붙여넣기

### 3. 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속!

## 📱 주요 페이지

| URL | 설명 |
|-----|------|
| `/` | 홈 (지도) |
| `/shop/[id]` | 가게 상세 |
| `/cart` | 장바구니 |
| `/picker` | 피커 화면 |
| `/admin` | 관리자 콘솔 |

## 🎯 테스트 시나리오

1. **사용자**: 홈 → 마커 클릭 → 상세보기 → 담기 → 주문
2. **피커**: `/picker` → 주문 선택 → 피킹 시작 → 완료
3. **관리자**: `/admin` → 주문 확인 → 상태 변경

## 🚀 배포

### Vercel (추천)
```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel
```

자세한 내용은 `DEPLOYMENT.md` 참고

## 📞 문제 해결

**지도가 안 보여요**
- Leaflet CSS가 로드되었는지 확인
- 브라우저 콘솔 확인

**마커가 안 보여요**
- Supabase에 `seed_data.sql` 실행했는지 확인
- 네트워크 탭에서 API 호출 확인

**주문이 안 돼요**
- `.env.local`에 Supabase 키 확인
- RLS 정책이 올바른지 확인

## 📚 더 알아보기

- [README.md](./README.md) - 전체 문서
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 배포 가이드
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
