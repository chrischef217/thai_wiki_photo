# Thai Wiki - 태국 워킹걸 정보 관리 시스템

## 프로젝트 개요
- **이름**: Thai Wiki (타이위키)
- **목표**: 태국 워킹걸 정보를 체계적으로 관리하고 사진과 함께 프로필을 제공하는 웹 애플리케이션
- **특징**: 사진 업로드, 프로필 관리, 조건 정보, 라이트박스 사진 보기

## 현재 완료된 기능 ✅

### 1. 워킹걸 프로필 관리
- 닉네임, 나이, 키, 몸무게, 거주지역, 코드 등 기본 정보 관리
- **조건(conditions)** 필드 추가 - 줄바꿈 지원하는 textarea 입력
- 프로필 등록 및 수정 기능
- 로그인한 워킹걸은 직접 프로필 편집 페이지로 이동

### 2. 사진 관리 시스템
- **Base64 인코딩**으로 사진 저장 (Cloudflare D1 데이터베이스)
- 다중 사진 업로드 (최대 3장)
- 프로필 목록에서 사진 미리보기
- **사진 클릭시 원본 크기 라이트박스 표시** ⭐ (최신 완료 기능)

### 3. 사용자 인터페이스
- 반응형 디자인 (모바일 우선)
- TailwindCSS 스타일링
- 프로필 상세보기 팝업 모달
- 사진 라이트박스 (배경 클릭/X버튼으로 닫기)
- 실시간 알림 시스템

### 4. 데이터베이스
- Cloudflare D1 SQLite 데이터베이스
- 사용자(users) 테이블과 사진(photos) 테이블
- 마이그레이션 시스템으로 스키마 관리

## 기술 스택
- **백엔드**: Hono Framework (Cloudflare Workers)
- **프론트엔드**: HTML + TailwindCSS + JavaScript
- **데이터베이스**: Cloudflare D1 (SQLite)
- **배포**: Cloudflare Pages
- **개발 도구**: Vite + TypeScript + PM2

## URL 및 접속 정보
- **개발 서버**: https://3000-ivn7qqwkug2m31nhzjr1c-6532622b.e2b.dev
- **프로젝트명**: thai-wiki-photo-test
- **GitHub**: (설정 필요시 setup_github_environment 호출 후 연결)

## 데이터 모델

### Working Girls 테이블
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT NOT NULL,
  age INTEGER,
  height TEXT,
  weight TEXT,
  region TEXT,
  code TEXT UNIQUE,
  conditions TEXT,  -- 조건 정보 (줄바꿈 지원)
  password TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Photos 테이블
```sql
CREATE TABLE photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  photo_url TEXT NOT NULL,  -- Base64 인코딩된 이미지 데이터
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 주요 기능 상세

### 사진 라이트박스 시스템 ⭐
1. **프로필 팝업에서 사진 클릭**
2. **전역 함수 `window.openPhotoLightbox()` 호출**
3. **전체 화면 라이트박스로 원본 크기 표시**
4. **배경 클릭 또는 X 버튼으로 닫기**
5. **Base64 URL 안전한 이스케이프 처리**

### 사진 저장 방식
- **Base64 인코딩**: 파일을 Base64 문자열로 변환하여 D1 데이터베이스에 직접 저장
- **장점**: 별도 파일 스토리지 불필요, 트랜잭션 일관성
- **단점**: 데이터베이스 크기 증가 (프로토타입에 적합)

## 사용자 가이드

### 일반 사용자
1. **메인 페이지**에서 등록된 워킹걸 목록 확인
2. **프로필 클릭**으로 상세 정보 팝업 보기
3. **사진 클릭**으로 원본 크기 사진 보기
4. **조건 정보** 확인

### 워킹걸 (등록자)
1. **워킹걸 등록** 버튼으로 프로필 생성
2. **사진 업로드** (최대 3장)
3. **조건 정보** 입력 (줄바꿈 지원)
4. **로그인 후 자동으로 편집 페이지**로 이동하여 프로필 수정

## 배포 상태
- **플랫폼**: Cloudflare Pages (개발 환경)
- **상태**: ✅ 활성화
- **데이터베이스**: ✅ 로컬 D1 SQLite (--local 모드)
- **마지막 업데이트**: 2025-09-25

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
```

## 완료된 주요 기능 요약
✅ 워킹걸 등록 및 프로필 관리  
✅ 다중 사진 업로드 (Base64)  
✅ 프로필 상세보기 팝업  
✅ **사진 클릭시 라이트박스 표시** (최신 완료)  
✅ 조건 필드 추가 및 줄바꿈 지원  
✅ 로그인 사용자 자동 리다이렉트  
✅ 반응형 모바일 UI  
✅ 실시간 알림 시스템  

## 백업 정보
- **백업 파일**: https://page.gensparksite.com/project_backups/tooluse_ugX-KM0vQGyLGVZT9DL7EQ.tar.gz
- **백업 날짜**: 2025-09-25
- **설명**: 완벽히 작동하는 모든 기능이 포함된 버전