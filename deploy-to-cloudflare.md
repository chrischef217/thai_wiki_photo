# 🚀 Cloudflare Pages 배포 가이드

## 1️⃣ 필수 설정 (Deploy 탭에서 완료)
- Cloudflare API 키 설정
- GitHub 연동 설정

## 2️⃣ 배포 명령어
```bash
# 프로젝트 디렉토리로 이동
cd /home/user/webapp

# 빌드
npm run build

# Cloudflare Pages 프로젝트 생성 (최초 1회만)
npx wrangler pages project create thai-wiki-photo-test \
  --production-branch main \
  --compatibility-date 2025-01-01

# 배포 실행
npx wrangler pages deploy dist --project-name thai-wiki-photo-test

# 또는 package.json 스크립트 사용
npm run deploy:prod
```

## 3️⃣ 배포 후 확인
- 배포 URL: https://thai-wiki-photo-test.pages.dev
- 또는 고유 URL: https://[commit-hash].thai-wiki-photo-test.pages.dev

## 4️⃣ 파일 업로드 테스트 페이지들
- 메인 사이트: https://thai-wiki-photo-test.pages.dev
- 실제 파일 업로드: https://thai-wiki-photo-test.pages.dev/test-upload.html
- 샘플 업로드: https://thai-wiki-photo-test.pages.dev/base64-test.html

## 5️⃣ 데이터베이스 설정 (필요시)
```bash
# D1 데이터베이스 생성
npx wrangler d1 create thai-wiki-photo-test-db

# 마이그레이션 실행
npx wrangler d1 migrations apply thai-wiki-photo-test-db

# 시드 데이터 추가
npx wrangler d1 execute thai-wiki-photo-test-db --file=./seed.sql
```

## 6️⃣ 문제 해결
- 인증 실패 시: `npx wrangler auth login`
- 프로젝트 확인: `npx wrangler pages project list`
- 배포 로그 확인: Cloudflare Dashboard → Pages → thai-wiki-photo-test