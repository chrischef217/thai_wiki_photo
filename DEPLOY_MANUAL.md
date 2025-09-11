# 🚀 타이위키 수동 배포 가이드

## ✅ 현재 상황
- Cloudflare 계정 연결 완료
- GitHub 계정 연결 완료
- 프로젝트 코드 준비 완료

## 🔧 수동 배포 단계

### 1단계: GitHub 저장소 생성 및 푸시

#### A. GitHub에서 새 저장소 생성
1. **GitHub.com** → **"New repository"**
2. **Repository name**: `thaiwiki` (또는 원하는 이름)
3. **Public** 선택
4. **"Create repository"** 클릭

#### B. 로컬에서 GitHub에 푸시
```bash
# 현재 프로젝트 디렉토리에서 실행
cd /home/user/webapp

# GitHub 저장소 연결 (YOUR_USERNAME을 실제 GitHub 사용자명으로 변경)
git remote add origin https://github.com/YOUR_USERNAME/thaiwiki.git

# 메인 브랜치로 푸시
git push -u origin main
```

### 2단계: Cloudflare Pages에서 GitHub 연결 배포

#### A. Cloudflare Dashboard에서 Pages 생성
1. **Cloudflare Dashboard** → **Workers & Pages** → **Create**
2. **Pages** 탭 선택 → **Connect to Git**
3. **GitHub** 선택 → 방금 만든 `thaiwiki` 저장소 선택

#### B. 빌드 설정
```
Framework preset: None
Build command: npm run build
Build output directory: dist
Root directory: /
```

#### C. 환경 변수 설정 (필요시)
- 특별한 환경 변수는 현재 불필요

### 3단계: D1 데이터베이스 설정

#### A. D1 데이터베이스 생성
```bash
# Cloudflare CLI로 데이터베이스 생성
npx wrangler d1 create thaiwiki-production
```

출력 예시:
```
✅ Successfully created DB 'thaiwiki-production' in region APAC
Created your database using D1's new storage backend.

[[d1_databases]]
binding = "DB"
database_name = "thaiwiki-production"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

#### B. wrangler.jsonc 업데이트
위에서 출력된 `database_id`를 복사해서 `wrangler.jsonc` 파일에 추가:

```jsonc
{
  "name": "thaiwiki",
  "compatibility_date": "2025-09-11",
  "pages_build_output_dir": "./dist",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "thaiwiki-production",
      "database_id": "여기에-실제-database-id-입력"
    }
  ]
}
```

#### C. 마이그레이션 적용
```bash
# 프로덕션 데이터베이스에 테이블 생성
npx wrangler d1 migrations apply thaiwiki-production

# 테스트 데이터 삽입
npx wrangler d1 execute thaiwiki-production --file=./seed.sql
```

### 4단계: 배포 완료 확인

#### A. Cloudflare Pages에서 배포 확인
- Cloudflare Dashboard → Workers & Pages → thaiwiki
- 빌드 로그 확인
- 자동 배포 URL 확인

#### B. 기능 테스트
배포 완료 후 다음 기능들이 작동하는지 확인:

- [ ] **메인 페이지 로딩**
- [ ] **워킹걸 리스트 표시** 
- [ ] **검색 기능**
- [ ] **워킹걸 로그인** (user001/1234)
- [ ] **관리자 로그인** (admin/1127)
- [ ] **데이터베이스 연결**

## 🆘 문제 해결

### GitHub 인증 문제
```bash
# Personal Access Token 사용
git remote set-url origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/thaiwiki.git
```

### Cloudflare API 인증 문제
```bash
# 브라우저에서 로그인
npx wrangler login

# 또는 API 토큰 직접 설정
export CLOUDFLARE_API_TOKEN="your-api-token"
```

### 빌드 실패 문제
```bash
# 로컬에서 빌드 테스트
npm run build

# 의존성 재설치
npm install
```

## 🎯 성공 시 결과

### 예상 URL
- **메인**: https://thaiwiki.pages.dev
- **브랜치**: https://main.thaiwiki.pages.dev

### 접속 정보
- **관리자**: admin / 1127
- **테스트 계정**: user001 / 1234

### 성능
- **글로벌 CDN**: 전 세계 빠른 접속
- **SSL 자동**: HTTPS 보안
- **무료 호스팅**: 월 100,000 요청

## 📞 도움이 필요하면
각 단계에서 오류가 발생하면 오류 메시지를 공유해 주세요!