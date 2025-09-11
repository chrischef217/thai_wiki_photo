#!/bin/bash
# 타이위키 Cloudflare Pages 배포 스크립트

echo "🚀 타이위키 Cloudflare Pages 배포 시작..."

# 1. API 토큰 확인
echo "1️⃣ Cloudflare 인증 확인..."
npx wrangler whoami
if [ $? -ne 0 ]; then
    echo "❌ Cloudflare API 토큰이 설정되지 않았습니다."
    echo "Deploy 탭에서 API 토큰을 설정해주세요."
    exit 1
fi

# 2. 프로젝트 빌드
echo "2️⃣ 프로젝트 빌드..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ 빌드 실패"
    exit 1
fi

# 3. D1 데이터베이스 생성 (있으면 스킵)
echo "3️⃣ D1 데이터베이스 확인/생성..."
npx wrangler d1 create thaiwiki-production 2>/dev/null || echo "데이터베이스가 이미 존재하거나 생성됨"

# 4. 마이그레이션 적용
echo "4️⃣ 데이터베이스 마이그레이션..."
npx wrangler d1 migrations apply thaiwiki-production --remote
if [ $? -ne 0 ]; then
    echo "⚠️ 마이그레이션 실패 - 수동으로 적용이 필요할 수 있습니다."
fi

# 5. Pages 프로젝트 생성
echo "5️⃣ Cloudflare Pages 프로젝트 생성..."
npx wrangler pages project create thaiwiki --production-branch main --compatibility-date 2024-01-01 2>/dev/null || echo "프로젝트가 이미 존재하거나 생성됨"

# 6. 배포 실행
echo "6️⃣ Cloudflare Pages에 배포..."
npx wrangler pages deploy dist --project-name thaiwiki
if [ $? -eq 0 ]; then
    echo "✅ 배포 완료!"
    echo "🌐 사이트 URL: https://thaiwiki.pages.dev"
    echo "🔧 관리자: admin / 1127"
    echo "👤 테스트 계정: user001 / 1234"
else
    echo "❌ 배포 실패"
    exit 1
fi

echo "🎉 배포가 완료되었습니다!"