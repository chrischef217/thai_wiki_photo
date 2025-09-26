# Thai Wiki - 태국 워킹걸 정보 관리 시스템

## 프로젝트 개요
- **이름**: Thai Wiki (타이위키)
- **목표**: 태국 워킹걸 정보를 체계적으로 관리하고 사진과 함께 프로필을 제공하는 웹 애플리케이션
- **특징**: 관리자 시스템, 사진 관리, 프로필 관리, 검색 및 필터링 기능

## 현재 완료된 기능 ✅

### 1. 사용자 인터페이스 개선 (2025-09-26)
- ✅ **햄버거 메뉴에서 워킹걸 로그인 제거** - 관리자 로그인만 유지
- ✅ **메인 페이지 워킹걸 카드에 키/몸무게 정보 추가**
- ✅ **프로필 팝업 모달 완전히 개선** - 연락처 제외한 모든 정보 표시

### 2. 관리자 시스템 (2025-09-26) ⭐ 최신 완료
- ✅ **완전한 워킹걸 관리 대시보드**
  - 워킹걸 등록, 수정, 삭제 기능
  - 실시간 검색 및 필터링
  - 사진 업로드/삭제 관리
  - 통계 대시보드 (지역별, 상태별 통계)
- ✅ **관리자 전용 API 엔드포인트**
  - POST/PUT/DELETE /api/admin/working-girls
  - 사진 관리 포함한 완전한 CRUD
- ✅ **사진 라이트박스 및 갤러리**
  - 원본 크기 사진 보기
  - 사진 삭제 기능
  - 사진 순서 관리

### 3. 워킹걸 프로필 관리
- 아이디, 닉네임, 나이, 키, 몸무게, 성별, 거주지역 등 기본 정보
- 연락처 정보 (전화번호, 라인ID, 위챗ID)
- 추천 워킹걸 설정 및 활성/비활성 상태 관리
- 다중 사진 업로드 및 관리

### 4. 사진 관리 시스템
- **Base64 인코딩**으로 사진 저장 (Cloudflare D1 데이터베이스)
- 다중 사진 업로드 지원
- 프로필 목록에서 사진 미리보기
- **사진 클릭시 원본 크기 라이트박스 표시**
- 관리자 페이지에서 사진 삭제 기능

### 5. 사용자 인터페이스
- 반응형 디자인 (모바일 우선)
- TailwindCSS 스타일링
- 프로필 상세보기 팝업 모달
- 사진 라이트박스 (배경 클릭/X버튼으로 닫기)
- 실시간 검색 및 필터링

### 6. 데이터베이스
- Cloudflare D1 SQLite 데이터베이스
- working_girls, photos, admins, sessions 테이블
- 마이그레이션 시스템으로 스키마 관리

## 기술 스택
- **백엔드**: Hono Framework (Cloudflare Workers)
- **프론트엔드**: HTML + TailwindCSS + JavaScript
- **데이터베이스**: Cloudflare D1 (SQLite)
- **배포**: Cloudflare Pages
- **개발 도구**: Vite + TypeScript + PM2

## URL 및 접속 정보
- **개발 서버**: https://3000-ivn7qqwkug2m31nhzjr1c-6532622b.e2b.dev
- **프로젝트명**: thai-wiki-complete
- **관리자 계정**: admin / 1127

## 주요 기능별 URI 및 사용법

### 일반 사용자 기능
- **메인 페이지**: `/` - 워킹걸 목록 보기 (키/몸무게 정보 포함)
- **검색 기능**: `/` - 닉네임, 지역, 나이 등으로 실시간 검색
- **프로필 상세**: 카드 클릭 - 연락처 제외한 모든 정보 표시

### 관리자 기능
- **관리자 로그인**: 햄버거 메뉴 → "관리자 로그인"
- **관리자 대시보드**: `/admin` - 통계 및 워킹걸 관리
- **워킹걸 등록**: 관리자 페이지 → "새 워킹걸 등록" 버튼
- **워킹걸 수정**: 관리자 페이지 → 테이블에서 편집 아이콘 클릭
- **사진 관리**: 등록/수정 모달에서 사진 업로드/삭제

### API 엔드포인트
```
GET    /api/working-girls              # 워킹걸 목록
GET    /api/working-girls/search       # 워킹걸 검색  
GET    /api/working-girls/:id          # 워킹걸 상세
POST   /api/admin/login              # 관리자 로그인
GET    /api/admin/working-girls       # 관리자용 워킹걸 목록
POST   /api/admin/working-girls       # 워킹걸 등록
PUT    /api/admin/working-girls/:id   # 워킹걸 수정
DELETE /api/admin/working-girls/:id   # 워킹걸 삭제
```

## 데이터 아키텍처

### Working Girls 테이블
```sql
CREATE TABLE working_girls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,      -- 아이디
  nickname TEXT NOT NULL,             -- 닉네임  
  age INTEGER,                        -- 나이
  height INTEGER,                     -- 키 (cm)
  weight INTEGER,                     -- 몸무게 (kg)
  gender TEXT DEFAULT 'female',       -- 성별
  region TEXT NOT NULL,               -- 거주지역
  phone TEXT,                         -- 전화번호
  line_id TEXT,                       -- 라인ID  
  wechat_id TEXT,                     -- 위챗ID
  is_recommended BOOLEAN DEFAULT 0,   -- 추천 워킹걸
  is_active BOOLEAN DEFAULT 1,        -- 활성 상태
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Photos 테이블
```sql
CREATE TABLE photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  working_girl_id INTEGER NOT NULL,
  photo_data TEXT NOT NULL,           -- Base64 인코딩된 이미지
  photo_order INTEGER DEFAULT 1,     -- 사진 순서
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (working_girl_id) REFERENCES working_girls(id)
);
```

## 사용자 가이드

### 일반 사용자
1. **메인 페이지**에서 등록된 워킹걸 목록 확인 (키/몸무게 정보 포함)
2. **검색바**에서 닉네임, 지역, 나이 등으로 검색
3. **프로필 카드 클릭**으로 상세 정보 팝업 보기 (연락처 제외)
4. **사진 클릭**으로 원본 크기 사진 보기

### 관리자
1. **햄버거 메뉴**에서 "관리자 로그인" (admin/1127)
2. **대시보드**에서 통계 확인
3. **"새 워킹걸 등록"** 버튼으로 워킹걸 등록
4. **테이블에서 편집/삭제** 아이콘으로 관리
5. **등록/수정 모달**에서 모든 정보 및 사진 관리

## 완성된 4가지 주요 요청사항 ✅
1. ✅ **햄버거 메뉴에서 워킹걸 로그인 제거** - 관리자 로그인만 유지
2. ✅ **관리자 페이지에 워킹걸 관리 기능 추가** - 등록, 수정, 삭제, 사진관리 완료
3. ✅ **메인 페이지 워킹걸 카드에 키/몸무게 정보 표시** - 아이콘과 함께 표시
4. ✅ **프로필 팝업에 연락처 제외한 모든 등록 데이터 표시** - 체계적 정보 구성

## 배포 상태
- **플랫폼**: Cloudflare Pages 
- **상태**: ✅ 로컬 개발 완료 (배포 준비 완료)
- **프로덕션 URL**: https://thai-wiki-complete.pages.dev (API 키 설정 후 배포)
- **데이터베이스**: ✅ Cloudflare D1 SQLite 
- **마지막 업데이트**: 2025-09-26

## 개발 명령어
```bash
# 개발 서버 시작
npm run build
pm2 start ecosystem.config.cjs

# 데이터베이스 마이그레이션  
npm run db:migrate:local

# 로그 확인
pm2 logs thai-wiki-photo-test --nostream

# 서비스 재시작
pm2 restart thai-wiki-photo-test

# 프로덕션 배포 (API 키 설정 후)
npm run deploy:prod
```

## 다음 배포 단계
1. **Cloudflare API 키 설정**: Deploy 탭에서 API 키 구성
2. **프로덕션 배포**: `npx wrangler pages deploy dist --project-name thai-wiki-complete`
3. **데이터베이스 마이그레이션**: 프로덕션 환경에서 D1 마이그레이션 실행

## 완료된 핵심 기능 요약
✅ 관리자 시스템 (등록/수정/삭제/사진관리)  
✅ 워킹걸 프로필 완전 관리  
✅ 다중 사진 업로드 (Base64)  
✅ 프로필 상세보기 팝업 (연락처 제외)  
✅ 메인 페이지 키/몸무게 정보 표시  
✅ 사진 클릭시 라이트박스 표시  
✅ 실시간 검색 및 필터링  
✅ 반응형 모바일 UI  
✅ 통계 대시보드