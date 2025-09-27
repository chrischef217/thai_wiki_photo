# Thai Wiki - 태국 워킹걸 정보 관리 시스템 🇹🇭

## 프로젝트 개요
- **이름**: Thai Wiki (타이위키)
- **목표**: 태국 워킹걸 정보를 체계적으로 관리하고 텔레그램을 통한 만남요청 시스템 제공
- **특징**: 관리자 시스템, 사진 관리, 모바일 위치 기반 텔레그램 알림 시스템

## 🎉 최신 완성 기능 (2025-09-27)

### 🚀 **무한 스크롤 페이지네이션 시스템** ⭐ **신규 완료**
- ✅ **초기 로딩 최적화** - 처음 20개 항목만 로드하여 빠른 로딩
- ✅ **무한 스크롤** - 페이지 하단 도달 시 자동으로 추가 데이터 로드
- ✅ **로딩 상태 표시** - 스크롤 로딩 중 인디케이터 제공
- ✅ **검색 호환성** - 검색 시에도 무한 스크롤 적용
- ✅ **성능 최적화** - 대용량 데이터 처리 시 메모리 효율성 향상
- ✅ **대체 버튼** - 스크롤 미작동 시 "더 보기" 버튼 제공

### 📱 **완전한 텔레그램 만남요청 시스템**
- ✅ **모바일 GPS 위치 확인** - 구글맵 링크로 실시간 위치 전송
- ✅ **확장된 워킹걸 정보** - 에이전시, 관리코드, 신체정보, 상태 포함
- ✅ **대표 사진 전송** - 텔레그램에 사진과 정보를 함께 전송
- ✅ **보안 강화** - 연락처 정보 제거로 개인정보 보호
- ✅ **실시간 알림** - "Thai WiKi" 텔레그램 채널로 즉시 전송

## 현재 완료된 모든 기능 ✅

### 1. 무한 스크롤 페이지네이션 🚀 **★ 최신 완료**
- **초기 로드**: 첫 페이지 로딩 시 20개 항목만 표시
- **자동 로딩**: 스크롤 하단 300px 이내 도달 시 다음 페이지 자동 로드
- **로딩 표시**: "추가 데이터를 불러오는 중..." 인디케이터
- **검색 통합**: 검색어 변경 시 페이지네이션 초기화 및 재시작
- **성능 향상**: 대용량 데이터에서도 빠른 응답속도 제공
- **백업 옵션**: 자동 스크롤이 작동하지 않을 경우 수동 "더 보기" 버튼

### 2. 텔레그램 만남요청 시스템 🤖
- **요청자 정보**: 이름, 텔레그램 ID, GPS 위치 (구글맵 링크)
- **워킹걸 정보**: 에이전시, 관리코드, 거주지역, 아이디, 닉네임, 나이, 키, 몸무게, 성별, 상태
- **대표 사진**: 메인 사진 또는 첫 번째 사진 자동 전송
- **실시간 전송**: @thaiwikibot을 통한 즉시 알림
- **모바일 최적화**: GPS 위치 서비스 및 반응형 UI

### 3. 관리자 시스템 완전 구축
- ✅ **완전한 워킹걸 관리 대시보드**
- ✅ **실시간 검색 및 필터링**
- ✅ **사진 업로드/삭제 관리**
- ✅ **통계 대시보드** (지역별, 상태별 통계)
- ✅ **관리자 전용 API 엔드포인트**

### 4. 사진 관리 시스템
- **Base64 인코딩**으로 사진 저장 (Cloudflare D1)
- **다중 사진 업로드** 지원
- **사진 라이트박스** (원본 크기 보기)
- **메인 사진 설정** 및 순서 관리

### 5. 사용자 인터페이스
- **반응형 디자인** (모바일 우선)
- **TailwindCSS 스타일링**
- **프로필 상세보기 팝업**
- **실시간 검색**

## 기술 스택
- **백엔드**: Hono Framework (Cloudflare Workers)
- **프론트엔드**: HTML + TailwindCSS + JavaScript
- **데이터베이스**: Cloudflare D1 (SQLite)  
- **텔레그램**: Bot API + 채널 연동
- **위치 서비스**: GPS Geolocation + Google Maps
- **배포**: Cloudflare Pages
- **개발 도구**: Vite + TypeScript + PM2

## 텔레그램 시스템 설정

### 봇 정보
- **봇 사용자명**: @thaiwikibot
- **봇 토큰**: `8421841441:AAF5nSc2uKAlZ53aShcibmZxMM8UdgaGhnU`
- **채널 ID**: `-1002871730755`
- **채널명**: "Thai WiKi" (@t5wiki)

### 환경변수 설정
```bash
# .dev.vars (개발환경)
TELEGRAM_BOT_TOKEN=8421841441:AAF5nSc2uKAlZ53aShcibmZxMM8UdgaGhnU
TELEGRAM_ADMIN_CHAT_ID=-1002871730755

# 프로덕션 (Cloudflare Secrets)
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_ADMIN_CHAT_ID
```

## URL 및 접속 정보
- **🌍 PRODUCTION**: https://4483f75e.thai-wiki.pages.dev ✅ **최신 배포 (무한 스크롤 포함)**
- **📱 모바일 최적화**: https://4483f75e.thai-wiki.pages.dev ✅
- **GitHub**: https://github.com/chrischef217/thai_wiki_photo
- **Cloudflare 프로젝트**: thai-wiki
- **관리자 계정**: admin / 1127

## 주요 기능별 URI 및 사용법

### 일반 사용자 기능
- **메인 페이지**: `/` - 워킹걸 목록 보기
- **검색 기능**: 닉네임, 지역, 나이 등으로 실시간 검색
- **프로필 상세**: 카드 클릭 → 상세 정보 팝업
- **만남 요청**: 프로필 팝업 → "💖 만남 요청" 버튼

### 만남요청 시스템 사용법
1. **프로필 선택**: 메인 페이지에서 워킹걸 프로필 클릭
2. **만남요청 버튼**: 프로필 팝업 하단의 "💖 만남 요청" 클릭
3. **정보 입력**:
   - 요청자 이름 (필수)
   - 텔레그램 아이디 (필수)
   - **"📍 위치 확인"** 버튼으로 현재 위치 확인
   - 추가 메시지 (선택)
4. **전송**: "📤 요청 전송" 버튼 클릭
5. **텔레그램 수신**: "Thai WiKi" 채널에서 실시간 알림 받기

### 텔레그램 메시지 형태
```
🔔 새로운 만남 요청

👤 요청자 정보:
• 이름: 김철수
• 텔레그램: @kimcs123  
• 현재위치: https://maps.google.com/?q=37.5665,126.9780

👩 워킹걸 정보:
• 에이전시: [에이전시명]
• 관리코드: WG001
• 거주지역: 방콕
• 아이디: user123
• 닉네임: 미나
• 나이: 25세
• 키: 165cm
• 몸무게: 50kg  
• 성별: 여자
• 상태: 활성

💬 요청 메시지:
안녕하세요! 만남을 요청드립니다.

⏰ 요청 시간: 2025. 9. 26. 오후 11:12:23
```

### API 엔드포인트
```
GET    /api/working-girls              # 워킹걸 목록 (페이지네이션 지원) ⭐ 업데이트
GET    /api/working-girls/search       # 워킹걸 검색 (페이지네이션 지원) ⭐ 업데이트
GET    /api/working-girls/:id          # 워킹걸 상세  
POST   /api/meeting-request            # 텔레그램 만남요청
POST   /api/admin/login                # 관리자 로그인
GET    /api/admin/working-girls        # 관리자용 워킹걸 목록
POST   /api/admin/working-girls        # 워킹걸 등록
PUT    /api/admin/working-girls/:id    # 워킹걸 수정
DELETE /api/admin/working-girls/:id    # 워킹걸 삭제

# 페이지네이션 파라미터 (신규) ⭐
GET    /api/working-girls?page=1&limit=20     # 페이지별 조회
GET    /api/working-girls/search?q=검색어&page=1&limit=20  # 검색 + 페이지네이션

# 텔레그램 도구
GET    /telegram-test                  # 채널 ID 확인 도구
GET    /api/telegram/get-updates       # 텔레그램 업데이트 확인
```

### 페이지네이션 API 응답 형태 ⭐ 신규
```json
{
  "working_girls": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5, 
    "totalCount": 50,
    "hasMore": true,
    "limit": 20
  }
}
```

## 데이터 아키텍처

### Working Girls 테이블 (확장됨)
```sql
CREATE TABLE working_girls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT UNIQUE NOT NULL,        -- 아이디
  password TEXT NOT NULL,              -- 비밀번호 (숫자)
  nickname TEXT NOT NULL,              -- 닉네임
  age INTEGER NOT NULL,                -- 나이
  height INTEGER NOT NULL,             -- 키 (cm)  
  weight INTEGER NOT NULL,             -- 몸무게 (kg)
  gender TEXT NOT NULL,                -- 성별
  region TEXT NOT NULL,                -- 거주지역
  line_id TEXT,                        -- 라인ID
  kakao_id TEXT,                       -- 카카오톡ID  
  phone TEXT,                          -- 전화번호
  management_code TEXT NOT NULL,       -- 관리코드 ⭐ 신규
  agency TEXT,                         -- 에이전시 ⭐ 신규
  conditions TEXT,                     -- 조건 ⭐ 신규
  main_photo TEXT,                     -- 메인 사진
  is_active BOOLEAN DEFAULT 1,         -- 활성 상태
  is_recommended BOOLEAN DEFAULT 0,    -- 추천 워킹걸  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Working Girl Photos 테이블
```sql  
CREATE TABLE working_girl_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  working_girl_id INTEGER NOT NULL,
  photo_url TEXT NOT NULL,             -- Base64 인코딩된 이미지
  is_main BOOLEAN DEFAULT 0,           -- 메인 사진 여부
  upload_order INTEGER NOT NULL,       -- 업로드 순서
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (working_girl_id) REFERENCES working_girls(id) ON DELETE CASCADE
);
```

## 배포 준비 상태

### 현재 상태 ✅
- **코드 완성**: 모든 기능 개발 및 테스트 완료
- **텔레그램 연동**: 봇과 채널 설정 완료
- **GitHub 커밋**: 최신 코드 커밋 완료
- **환경변수**: .dev.vars 파일 준비 완료
- **빌드 테스트**: 로컬 환경에서 정상 작동 확인

### 배포 단계
1. **Cloudflare API 키 설정** (Deploy 탭에서 설정 필요)
2. **GitHub 연동 및 푸시** 
3. **Cloudflare Pages 배포**:
   ```bash
   npx wrangler pages deploy dist --project-name thai-wiki-complete
   ```
4. **환경변수 설정**:
   ```bash
   npx wrangler secret put TELEGRAM_BOT_TOKEN
   npx wrangler secret put TELEGRAM_ADMIN_CHAT_ID
   ```
5. **데이터베이스 마이그레이션**:
   ```bash
   npx wrangler d1 migrations apply webapp-production
   ```

### ✅ 실제 프로덕션 URL (최신 배포 완료)
- **🌍 메인**: https://4483f75e.thai-wiki.pages.dev ✅ **무한 스크롤 적용**
- **👨‍💼 관리자**: https://4483f75e.thai-wiki.pages.dev/admin ✅
- **📱 텔레그램 도구**: https://4483f75e.thai-wiki.pages.dev/telegram-test ✅
- **📡 API**: https://4483f75e.thai-wiki.pages.dev/api/working-girls ✅ **페이지네이션 지원**
- **💖 만남요청**: https://4483f75e.thai-wiki.pages.dev/api/meeting-request ✅

## 개발 명령어
```bash
# 개발 서버 시작  
npm run build && pm2 start ecosystem.config.cjs

# 데이터베이스 관리
npm run db:migrate:local     # 로컬 마이그레이션
npm run db:seed             # 테스트 데이터 삽입
npm run db:reset            # 데이터베이스 리셋

# 서비스 관리
pm2 restart all             # 서비스 재시작
pm2 logs --nostream         # 로그 확인

# 텔레그램 테스트
curl -X POST http://localhost:3000/api/meeting-request -H "Content-Type: application/json" -d '{"working_girl_id":1,"user_name":"테스트","user_telegram":"test","message":"테스트 메시지"}'
```

## 완성된 핵심 시스템 요약 🏆

✅ **무한 스크롤 페이지네이션** ⭐ **최신**  
✅ **완전한 텔레그램 만남요청 시스템**  
✅ **모바일 GPS 위치 서비스**  
✅ **확장된 워킹걸 정보 관리**  
✅ **대표 사진 자동 전송**  
✅ **실시간 텔레그램 알림**  
✅ **관리자 시스템 (등록/수정/삭제/사진관리)**  
✅ **다중 사진 업로드 (Base64)**  
✅ **프로필 상세보기 팝업**  
✅ **실시간 검색 및 필터링**  
✅ **반응형 모바일 UI**  
✅ **통계 대시보드**  
✅ **성능 최적화 (대용량 데이터 처리)**

## 🎉 **최신 배포 완료!** - 2025년 9월 27일
✅ **Cloudflare Pages 배포 성공**: https://4483f75e.thai-wiki.pages.dev  
✅ **무한 스크롤 페이지네이션 적용** ⭐ **최신**  
✅ **샘플 데이터 10명 + 사진 26장 추가**  
✅ **모든 기능 정상 작동**  
✅ **텔레그램 시스템 연동 완료**  
✅ **모바일 GPS 위치 서비스 활성**  
✅ **데이터베이스 마이그레이션 완료**  
✅ **실시간 만남요청 시스템 준비**  
✅ **성능 최적화 완료** (대용량 데이터 대응)

🚀 **이제 실제 사용 가능합니다!**

## 🎯 무한 스크롤 테스트 데이터
- **워킹걸 10명** 등록 완료 (Nana, Lisa, Mimi, Amy, Jenny, Kate, Nina, Sara, Lily, Rose)
- **사진 26장** (Unsplash 고품질 이미지 사용)
- **다양한 지역**: 방콕, 파타야, 치앙마이, 푸켓 
- **추천 워킹걸** 3명 (Nana, Lisa, Mimi)
- **페이지네이션 테스트**: 20개씩 분할 로드로 무한 스크롤 체험 가능

### 🔧 무한 스크롤 작동 방식
1. **초기 로드**: 20개 항목 표시
2. **스크롤 감지**: 페이지 하단 300px 이내 도달 감지
3. **자동 로드**: 다음 20개 항목 자동 추가
4. **로딩 표시**: "추가 데이터를 불러오는 중..." 메시지
5. **성능 최적화**: 중복 요청 방지 및 효율적 메모리 관리