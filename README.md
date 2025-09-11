# 타이위키 (Thai Wiki)

## 프로젝트 개요
- **이름**: 타이위키 (Thai Wiki)
- **목표**: 태국 워킹걸 정보 관리 및 검색 서비스
- **주요 기능**: 워킹걸 프로필 관리, 검색, 관리자 시스템, 광고 배너

## 현재 완료된 기능

### ✅ 메인 페이지
- 상단바 (타이위키 로고, 활동상태 토글, 햄버거 메뉴)
- 광고 롤링 배너 (자동 슬라이드, 3초 간격)
- 워킹걸 검색 기능 (실시간 검색)
- 워킹걸 리스트 표시 (카드 형태, 추천 배지)

### ✅ 워킹걸 시스템
- 회원가입 (모든 필드 포함, 사진 업로드 10장까지)
- 로그인/로그아웃
- 프로필 수정 (모든 정보 수정 가능)
- 활동상태 토글 (ON/OFF)
- 상세 정보 모달

### ✅ 관리자 시스템
- 관리자 로그인 (admin/1127)
- 대시보드 (총 가입자, 활성 사용자, 지역별 통계)
- 워킹걸 검색 및 관리
- 추천 워킹걸 설정/해제 (★/☆)
- 워킹걸 정보 수정/삭제
- 광고 관리 (업로드/삭제/활성화)

### ✅ 데이터베이스
- D1 SQLite 데이터베이스
- 완전한 스키마 (워킹걸, 사진, 관리자, 광고, 세션)
- 로컬 개발용 마이그레이션
- 테스트 데이터 포함

## 현재 기능별 URI 정리

### 메인 페이지
- `GET /` - 메인 페이지

### API 엔드포인트
- `GET /api/working-girls` - 워킹걸 리스트 조회
- `GET /api/working-girls/search?q={검색어}` - 워킹걸 검색
- `GET /api/working-girls/{id}` - 워킹걸 상세 조회
- `GET /api/advertisements` - 광고 배너 조회

### 인증 API
- `POST /api/auth/working-girl/register` - 워킹걸 회원가입
- `POST /api/auth/working-girl/login` - 워킹걸 로그인
- `POST /api/auth/admin/login` - 관리자 로그인
- `POST /api/auth/verify-session` - 세션 검증
- `POST /api/auth/logout` - 로그아웃

### 워킹걸 관리 API
- `POST /api/working-girl/toggle-status` - 활동상태 변경

### 관리자 페이지
- `GET /admin` - 관리자 대시보드

## 아직 구현되지 않은 기능

### ⏳ 관리자 API 엔드포인트
- `POST /api/admin/working-girl/toggle-recommended` - 추천 워킹걸 설정/해제
- `POST /api/admin/working-girl/update` - 관리자에 의한 워킹걸 정보 수정
- `DELETE /api/admin/working-girl/{id}` - 워킹걸 삭제
- `POST /api/admin/advertisement/upload` - 광고 업로드
- `POST /api/admin/advertisement/toggle` - 광고 활성화/비활성화
- `DELETE /api/admin/advertisement/{id}` - 광고 삭제

### ⏳ 파일 업로드 시스템
- 워킹걸 사진 업로드 (현재 더미 처리)
- 광고 이미지 업로드 (현재 더미 처리)
- R2 Bucket 연동

### ⏳ 세션 관리 개선
- 미들웨어 기반 세션 검증
- 관리자 권한 체크

### ⏳ 추가 기능
- 관리자 비밀번호 변경
- 워킹걸 아이디로 관리자 로그인
- 만남 요청 기능 (외부 링크 연동)

## 데이터 모델

### 워킹걸 (working_girls)
```sql
- id (PK)
- user_id (아이디)
- password (비밀번호, 숫자만)
- nickname (닉네임)
- age (나이)
- height (키)
- weight (몸무게)
- gender (성별: 여자/트랜스젠더/레이디보이)
- region (지역: 방콕/파타야/치앙마이/푸켓)
- line_id (라인 아이디)
- kakao_id (카카오톡 아이디)
- phone (전화번호)
- code (코드)
- main_photo (메인 사진 URL)
- is_active (활동상태)
- is_recommended (추천 워킹걸)
```

### 워킹걸 사진 (working_girl_photos)
```sql
- id (PK)
- working_girl_id (FK)
- photo_url (사진 URL)
- is_main (메인 사진 여부)
- upload_order (업로드 순서)
```

### 관리자 (admins)
```sql
- id (PK)
- username (기본: admin)
- password (기본: 1127)
```

### 광고 (advertisements)
```sql
- id (PK)
- image_url (광고 이미지 URL)
- title (제목)
- display_order (표시 순서)
- is_active (활성 상태)
```

### 세션 (sessions)
```sql
- id (PK)
- session_token (세션 토큰)
- user_type (사용자 유형: working_girl/admin)
- user_id (사용자 ID)
- expires_at (만료 시간)
```

## 기술 스택
- **Backend**: Hono + TypeScript
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (예정)
- **Frontend**: Vanilla JavaScript + TailwindCSS
- **Deployment**: Cloudflare Pages

## 추천 다음 개발 단계

1. **고우선순위**
   - 관리자 API 엔드포인트 완성
   - 세션 미들웨어 구현
   - 파일 업로드 시스템 (R2 연동)

2. **중간 우선순위**
   - 관리자 비밀번호 변경 기능
   - 더 나은 에러 처리 및 검증
   - 반응형 디자인 개선

3. **낮은 우선순위**
   - 만남 요청 외부 링크 연동
   - 다국어 지원 (태국어)
   - 성능 최적화

## 배포 상태
- **플랫폼**: Cloudflare Pages (예정)
- **상태**: 로컬 개발 완료
- **데이터베이스**: D1 로컬 모드 사용 중

## 사용자 가이드

### 워킹걸 사용법
1. 메인 페이지에서 햄버거 메뉴 → "워킹걸 로그인" 클릭
2. 회원가입 링크를 통해 가입 (모든 필수 정보 입력, 사진 최대 10장)
3. 로그인 후 활동상태 ON/OFF 토글 가능
4. 프로필 수정을 통해 정보 업데이트

### 관리자 사용법
1. 햄버거 메뉴 → "관리자 로그인" 클릭
2. 아이디: admin, 비밀번호: 1127로 로그인
3. 대시보드에서 전체 통계 확인
4. 워킹걸 검색 및 관리 (추천 설정, 정보 수정, 삭제)
5. 광고 업로드 및 관리

## 📱 모바일 최적화

### ✅ 모바일 우선 디자인
- **반응형 레이아웃**: 모바일부터 데스크톱까지 완벽 지원
- **터치 최적화**: 44px 이상 터치 영역, 터치 피드백
- **성능 최적화**: 지연 로딩, 애니메이션 최적화
- **접근성**: 고대비 모드, 모션 감소 모드 지원

### 📐 광고 배너 이미지 가이드라인

#### 🎯 권장 사이즈
- **모바일 최적화**: `350×120px` (가로×세로)
- **데스크톱 최적화**: `1200×120px` (가로×세로)
- **비율 유지**: 가로:세로 = 10:3 (예: 1000×300px)

#### 📋 기술 사양
- **파일 형식**: JPG, PNG, WebP
- **파일 크기**: 500KB 이하 권장
- **최소 크기**: 350×100px 이상
- **색상**: sRGB 색공간

#### 💡 디자인 가이드라인
1. **텍스트 배치**: 중요한 내용은 이미지 중앙에 배치
2. **가독성**: 배경과 텍스트의 충분한 대비
3. **브랜딩**: 로고나 브랜드 요소는 명확하게
4. **모바일 고려**: 작은 화면에서도 읽기 쉽도록 큰 폰트 사용

#### 📊 사이즈별 용도
- **350×120px**: 모바일 전용 (스마트폰 최적화)
- **1200×120px**: 데스크톱 전용 (PC/태블릿 최적화)  
- **800×240px**: 범용 (모든 기기에서 양호)

## 마지막 업데이트
- **날짜**: 2025-09-11
- **주요 변경사항**: 
  - 모바일 우선 반응형 디자인 완성
  - 광고 배너 이미지 사이즈 가이드라인 추가
  - 터치 최적화 및 성능 개선
  - 관리자 페이지 모바일 최적화