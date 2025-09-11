# 타이위키 배포 가이드

## 🚀 Cloudflare Pages 배포 방법

### 전제 조건
1. ✅ Cloudflare 계정 (무료)
2. ✅ GitHub 계정
3. ✅ Cloudflare API 토큰

### 1단계: 환경 설정

#### A. Cloudflare API 토큰 설정
```bash
# Deploy 탭에서 API 키를 설정한 후 실행
cd /home/user/webapp
npx wrangler whoami  # API 키 검증
```

#### B. GitHub 저장소 설정
```bash
# GitHub 탭에서 저장소를 연결한 후 실행
git remote -v  # 원격 저장소 확인
```

### 2단계: D1 데이터베이스 생성

```bash
# 프로덕션 D1 데이터베이스 생성
cd /home/user/webapp
npx wrangler d1 create thaiwiki-production

# 출력된 database_id를 wrangler.jsonc에 복사
# "database_id": "여기에-실제-ID-입력"
```

### 3단계: 마이그레이션 적용

```bash
# 프로덕션 데이터베이스에 마이그레이션 적용
npx wrangler d1 migrations apply thaiwiki-production
```

### 4단계: Cloudflare Pages 프로젝트 생성

```bash
# Pages 프로젝트 생성
npx wrangler pages project create thaiwiki \
  --production-branch main \
  --compatibility-date 2024-01-01
```

### 5단계: 빌드 및 배포

```bash
# 프로젝트 빌드
npm run build

# Cloudflare Pages에 배포
npx wrangler pages deploy dist --project-name thaiwiki
```

### 6단계: 환경 변수 설정 (필요시)

```bash
# 프로덕션 환경 변수 설정
npx wrangler pages secret put API_KEY --project-name thaiwiki
```

## 📱 배포 후 확인사항

### 1. URL 접속 확인
- 프로덕션: https://thaiwiki.pages.dev
- 브랜치: https://main.thaiwiki.pages.dev

### 2. 기능 테스트
- [ ] 메인 페이지 로딩
- [ ] 워킹걸 리스트 표시
- [ ] 검색 기능
- [ ] 워킹걸 로그인/회원가입
- [ ] 관리자 로그인 (admin/1127)
- [ ] 광고 배너 표시

### 3. 데이터베이스 테스트
```bash
# 프로덕션 DB 상태 확인
npx wrangler d1 execute thaiwiki-production --command="SELECT COUNT(*) FROM working_girls"

# 테스트 데이터 삽입 (필요시)
npx wrangler d1 execute thaiwiki-production --file=./seed.sql
```

## 🔧 문제 해결

### 배포 실패 시
1. **API 토큰 재확인**
```bash
npx wrangler whoami
```

2. **프로젝트 이름 충돌**
```bash
# 다른 이름으로 재시도
npx wrangler pages project create thaiwiki-v2 --production-branch main
npx wrangler pages deploy dist --project-name thaiwiki-v2
```

3. **데이터베이스 문제**
```bash
# D1 데이터베이스 목록 확인
npx wrangler d1 list

# 마이그레이션 상태 확인
npx wrangler d1 migrations list thaiwiki-production
```

## 📞 추가 도움

### Cloudflare 문서
- [Cloudflare Pages 가이드](https://developers.cloudflare.com/pages/)
- [D1 데이터베이스 문서](https://developers.cloudflare.com/d1/)
- [Wrangler CLI 문서](https://developers.cloudflare.com/workers/wrangler/)

### 프로젝트 파일 구조
```
webapp/
├── src/index.tsx          # 메인 애플리케이션
├── migrations/            # DB 마이그레이션
├── public/static/         # 정적 파일
├── wrangler.jsonc        # Cloudflare 설정
├── package.json          # 종속성 및 스크립트
└── dist/                 # 빌드 출력 (배포용)
```

## 🎯 성공 시 결과
- **메인 URL**: https://thaiwiki.pages.dev
- **관리자 접속**: admin / 1127
- **테스트 계정**: user001 / 1234
- **글로벌 CDN**: 전 세계 빠른 접속
- **SSL 인증서**: 자동 HTTPS
- **무료 호스팅**: 매월 100,000 요청 무료