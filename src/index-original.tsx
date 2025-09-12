import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import type { Bindings } from './types'

const app = new Hono<{ Bindings: Bindings }>()

// CORS 설정
app.use('/api/*', cors())

// 정적 파일 서빙
app.use('/static/*', serveStatic({ root: './public' }))

// 메인 페이지
app.get('/', async (c) => {
  const { env } = c

  // 데이터베이스 테이블 초기화 (로컬 개발용)
  if (env.DB) {
    try {
      // 워킹걸 테이블 생성
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS working_girls (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          nickname TEXT NOT NULL,
          age INTEGER NOT NULL,
          height INTEGER NOT NULL,
          weight INTEGER NOT NULL,
          gender TEXT NOT NULL,
          region TEXT NOT NULL,
          line_id TEXT,
          kakao_id TEXT,
          phone TEXT,
          code TEXT,
          main_photo TEXT,
          is_active BOOLEAN DEFAULT 1,
          is_recommended BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run()

      // 워킹걸 사진 테이블 생성
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS working_girl_photos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          working_girl_id INTEGER NOT NULL,
          photo_url TEXT NOT NULL,
          is_main BOOLEAN DEFAULT 0,
          upload_order INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (working_girl_id) REFERENCES working_girls(id) ON DELETE CASCADE
        )
      `).run()

      // 관리자 테이블 생성
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS admins (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run()

      // 광고 테이블 생성
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS advertisements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          image_url TEXT NOT NULL,
          title TEXT,
          display_order INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run()

      // 세션 테이블 생성
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_token TEXT UNIQUE NOT NULL,
          user_type TEXT NOT NULL,
          user_id INTEGER NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run()

      // 기본 관리자 데이터 삽입
      await env.DB.prepare(`
        INSERT OR IGNORE INTO admins (username, password) VALUES ('admin', '1127')
      `).run()

      // 테스트 데이터 삽입
      await env.DB.prepare(`
        INSERT OR IGNORE INTO working_girls (
          user_id, password, nickname, age, height, weight, gender, region, 
          line_id, kakao_id, phone, code, main_photo, is_active, is_recommended
        ) VALUES 
          ('user001', '1234', '나나', 25, 165, 50, '여자', '방콕', 'line_nana', 'kakao_nana', '0901234567', 'VIP001', '/static/photos/nana_main.jpg', 1, 1),
          ('user002', '2345', '미미', 23, 160, 48, '레이디보이', '파타야', 'line_mimi', 'kakao_mimi', '0902345678', '', '/static/photos/mimi_main.jpg', 1, 0),
          ('user003', '3456', '소피아', 28, 168, 52, '트랜스젠더', '치앙마이', 'line_sophia', 'kakao_sophia', '0903456789', 'GOLD003', '/static/photos/sophia_main.jpg', 0, 0),
          ('user004', '4567', '리사', 26, 162, 49, '여자', '푸켓', 'line_lisa', 'kakao_lisa', '0904567890', '', '/static/photos/lisa_main.jpg', 1, 1)
      `).run()

      // 테스트 사진 데이터 삽입
      await env.DB.prepare(`
        INSERT OR IGNORE INTO working_girl_photos (working_girl_id, photo_url, is_main, upload_order) VALUES 
          (1, '/static/photos/nana_main.jpg', 1, 1),
          (1, '/static/photos/nana_2.jpg', 0, 2),
          (1, '/static/photos/nana_3.jpg', 0, 3),
          (2, '/static/photos/mimi_main.jpg', 1, 1),
          (2, '/static/photos/mimi_2.jpg', 0, 2),
          (3, '/static/photos/sophia_main.jpg', 1, 1),
          (4, '/static/photos/lisa_main.jpg', 1, 1),
          (4, '/static/photos/lisa_2.jpg', 0, 2)
      `).run()

      // 테스트 광고 데이터 삽입
      await env.DB.prepare(`
        INSERT OR IGNORE INTO advertisements (image_url, title, display_order, is_active) VALUES 
          ('/static/ads/ad1.jpg', '광고1', 1, 1),
          ('/static/ads/ad2.jpg', '광고2', 2, 1),
          ('/static/ads/ad3.jpg', '광고3', 3, 1)
      `).run()

    } catch (error) {
      console.log('Database initialization error:', error)
    }
  }

  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <title>타이위키 (Thai Wiki) - 태국 워킹걸 정보</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  thai: {
                    red: '#ED1C24',
                    blue: '#241E7E',
                    white: '#FFFFFF'
                  }
                }
              }
            }
          }
        </script>
        <link href="/static/style.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50 min-h-screen">
        <!-- 모바일 상단바 -->
        <header class="bg-gradient-to-r from-thai-blue to-thai-red text-white shadow-lg sticky top-0 z-30">
            <div class="px-3 py-2 sm:px-4 sm:py-3 flex justify-between items-center">
                <!-- 모바일 최적화 로고 -->
                <div class="flex items-center space-x-1 sm:space-x-3">
                    <i class="fas fa-globe-asia text-lg sm:text-2xl"></i>
                    <h1 class="text-lg sm:text-2xl font-bold">타이위키</h1>
                    <span class="text-xs sm:text-sm bg-white/20 px-1 py-0.5 sm:px-2 sm:py-1 rounded hidden xs:block">Thai Wiki</span>
                </div>

                <!-- 활동상태 버튼 (모바일 최적화) -->
                <div id="activity-status" class="hidden items-center space-x-1 sm:space-x-2">
                    <span class="text-xs sm:text-sm hidden sm:block">활동상태:</span>
                    <button id="status-toggle" class="bg-green-500 hover:bg-green-600 px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium transition-colors duration-200">
                        ON
                    </button>
                </div>

                <!-- 햄버거 메뉴 -->
                <button id="menu-toggle" class="text-xl sm:text-2xl hover:text-gray-200 transition-colors duration-200 p-1">
                    <i class="fas fa-bars"></i>
                </button>
            </div>
        </header>

        <!-- 모바일 최적화 사이드 메뉴 -->
        <div id="side-menu" class="fixed top-0 right-0 h-full w-4/5 max-w-sm bg-white shadow-2xl transform translate-x-full transition-transform duration-300 z-50">
            <div class="p-4 sm:p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-lg sm:text-xl font-bold text-gray-800">메뉴</h3>
                    <button id="menu-close" class="text-xl sm:text-2xl text-gray-600 hover:text-gray-800 p-1">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <nav class="space-y-3 sm:space-y-4">
                    <a href="#" onclick="showWorkingGirlLogin()" class="block p-3 sm:p-4 bg-thai-red text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-center">
                        <i class="fas fa-user mr-2"></i>워킹걸 로그인
                    </a>
                    <a href="#" onclick="showAdminLogin()" class="block p-3 sm:p-4 bg-thai-blue text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-center">
                        <i class="fas fa-cog mr-2"></i>관리자 로그인
                    </a>
                </nav>
            </div>
        </div>

        <!-- 메뉴 오버레이 -->
        <div id="menu-overlay" class="fixed inset-0 bg-black/50 hidden z-40" onclick="closeSideMenu()"></div>

        <!-- 모바일 최적화 광고 배너 -->
        <div class="bg-white shadow-sm border-b">
            <div class="px-3 py-3 sm:px-4 sm:py-4">
                <div id="ad-banner" class="h-20 sm:h-24 md:h-28 bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg overflow-hidden relative">
                    <div id="ad-slider" class="flex transition-transform duration-500 ease-in-out h-full">
                        <!-- 광고 이미지들이 동적으로 로드됩니다 -->
                        <div class="min-w-full h-full bg-gradient-to-r from-pink-200 to-purple-200 flex items-center justify-center">
                            <p class="text-gray-600 text-xs sm:text-sm text-center px-2">
                                <i class="fas fa-ad mr-2"></i>광고 배너 영역
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 모바일 최적화 검색 섹션 -->
        <div class="bg-white shadow-sm">
            <div class="px-3 py-4 sm:px-4 sm:py-6">
                <div class="max-w-2xl mx-auto">
                    <h2 class="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 text-center">
                        <i class="fas fa-search mr-2 text-thai-red"></i>워킹걸 검색
                    </h2>
                    <div class="relative">
                        <input 
                            type="text" 
                            id="search-input"
                            placeholder="닉네임, 지역, 나이 등으로 검색하세요..."
                            class="w-full p-3 sm:p-4 pr-10 sm:pr-12 border-2 border-gray-300 rounded-full focus:border-thai-red focus:outline-none text-sm sm:text-lg"
                        >
                        <button onclick="searchWorkingGirls()" class="absolute right-2 top-1/2 transform -translate-y-1/2 bg-thai-red text-white p-2 rounded-full hover:bg-red-600 transition-colors duration-200">
                            <i class="fas fa-search text-sm sm:text-base"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>



        <!-- 모바일 최적화 워킹걸 리스트 -->
        <div class="px-3 py-4 sm:px-4 sm:py-8">
            <div id="working-girls-list" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 lg:gap-6">
                <!-- 워킹걸 카드들이 동적으로 로드됩니다 -->
            </div>
            
            <!-- 로딩 표시 -->
            <div id="loading" class="text-center py-8">
                <i class="fas fa-spinner fa-spin text-xl sm:text-2xl text-gray-500"></i>
                <p class="text-gray-500 mt-2 text-sm sm:text-base">데이터를 불러오는 중...</p>
            </div>

            <!-- 데이터 없음 표시 -->
            <div id="no-data" class="text-center py-8 hidden">
                <i class="fas fa-search text-2xl sm:text-4xl text-gray-400 mb-4"></i>
                <p class="text-gray-500 text-sm sm:text-lg">검색 결과가 없습니다.</p>
            </div>
        </div>

        <!-- 모바일 최적화 모달 컨테이너 -->
        <div id="modal-container"></div>

        <!-- 모바일 터치 최적화 스크립트 -->
        <script>
            // 터치 이벤트 최적화
            document.addEventListener('touchstart', function() {}, {passive: true});
            
            // 모바일 뷰포트 높이 조정
            function setVH() {
                let vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', vh + 'px');
            }
            window.addEventListener('resize', setVH);
            setVH();
        </script>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
        
        <!-- 사진 표시 문제 해결을 위한 테스트 스크립트 -->
        <script>
        // 페이지 로드 후 즉시 실행되는 테스트
        setTimeout(() => {
            console.log('=== 사진 표시 디버깅 시작 ===');
            
            // API 응답 직접 테스트 (강제 새로고침)
            fetch('/api/v2/profiles?_=' + Date.now() + '&t=' + new Date().getTime(), {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            })
                .then(response => response.json())
                .then(data => {
                    console.log('직접 API 호출 결과:', data);
                    
                    if (data.working_girls && data.working_girls.length > 0) {
                        data.working_girls.forEach((girl, index) => {
                            console.log(\`프로필 \${index + 1}: \${girl.nickname}\`);
                            console.log('- photos 배열:', girl.photos);
                            
                            if (girl.photos && girl.photos.length > 0) {
                                const mainPhoto = girl.photos.find(photo => photo.is_main == 1);
                                console.log('- 메인 사진 객체:', mainPhoto);
                                
                                if (mainPhoto) {
                                    console.log('- 메인 사진 URL (처음 50자):', mainPhoto.photo_url.substring(0, 50));
                                }
                            }
                        });
                        
                        // 실제 이미지 태그들 확인
                        setTimeout(() => {
                            const images = document.querySelectorAll('.working-girl-card img');
                            console.log(\`페이지의 이미지 태그 수: \${images.length}\`);
                            
                            images.forEach((img, index) => {
                                console.log(\`이미지 \${index + 1}:\`);
                                console.log('- src:', img.src);
                                console.log('- alt:', img.alt);
                                console.log('- naturalWidth:', img.naturalWidth);
                                console.log('- naturalHeight:', img.naturalHeight);
                            });
                        }, 2000);
                    }
                })
                .catch(error => {
                    console.error('직접 API 호출 실패:', error);
                });
        }, 3000);
        </script>
    </body>
    </html>
  `)
})

// API 라우트들

// 워킹걸 리스트 조회
app.get('/api/working-girls', async (c) => {
  const { env } = c

  try {
    const result = await env.DB.prepare(`
      SELECT 
        wg.*,
        GROUP_CONCAT(
          JSON_OBJECT('id', wp.id, 'photo_url', wp.photo_url, 'is_main', wp.is_main, 'upload_order', wp.upload_order)
        ) as photos
      FROM working_girls wg
      LEFT JOIN working_girl_photos wp ON wg.id = wp.working_girl_id
      WHERE wg.is_active = 1
      GROUP BY wg.id
      ORDER BY wg.is_recommended DESC, wg.created_at DESC
    `).all()

    const workingGirls = result.results.map(girl => ({
      ...girl,
      photos: girl.photos ? JSON.parse(`[${girl.photos}]`) : []
    }))

    // 캐시 방지 헤더 설정
    c.header('Cache-Control', 'no-cache, no-store, must-revalidate')
    c.header('Pragma', 'no-cache')
    c.header('Expires', '0')
    
    return c.json({ success: true, working_girls: workingGirls })
  } catch (error) {
    console.error('Database error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// 워킹걸 검색
app.get('/api/working-girls/search', async (c) => {
  const { env } = c
  const query = c.req.query('q') || ''

  try {
    const searchPattern = `%${query}%`
    const result = await env.DB.prepare(`
      SELECT 
        wg.*,
        GROUP_CONCAT(
          JSON_OBJECT('id', wp.id, 'photo_url', wp.photo_url, 'is_main', wp.is_main, 'upload_order', wp.upload_order)
        ) as photos
      FROM working_girls wg
      LEFT JOIN working_girl_photos wp ON wg.id = wp.working_girl_id
      WHERE wg.is_active = true AND (
        wg.nickname LIKE ? OR
        wg.region LIKE ? OR
        wg.gender LIKE ? OR
        wg.code LIKE ? OR
        CAST(wg.age AS TEXT) LIKE ?
      )
      GROUP BY wg.id
      ORDER BY wg.is_recommended DESC, wg.created_at DESC
    `).bind(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern).all()

    const workingGirls = result.results.map(girl => ({
      ...girl,
      photos: girl.photos ? JSON.parse(`[${girl.photos}]`) : []
    }))

    return c.json({ success: true, working_girls: workingGirls })
  } catch (error) {
    console.error('Database error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// 워킹걸 상세 조회
app.get('/api/working-girls/:id', async (c) => {
  const { env } = c
  const workingGirlId = c.req.param('id')

  try {
    const girlResult = await env.DB.prepare(`
      SELECT * FROM working_girls WHERE id = ?
    `).bind(workingGirlId).first()

    if (!girlResult) {
      return c.json({ success: false, error: 'Working girl not found' }, 404)
    }

    const photosResult = await env.DB.prepare(`
      SELECT * FROM working_girl_photos WHERE working_girl_id = ? ORDER BY upload_order ASC
    `).bind(workingGirlId).all()

    return c.json({
      ...girlResult,
      photos: photosResult.results || []
    })
  } catch (error) {
    console.error('Database error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// 광고 조회
app.get('/api/advertisements', async (c) => {
  const { env } = c

  try {
    const result = await env.DB.prepare(`
      SELECT * FROM advertisements WHERE is_active = 1 ORDER BY display_order ASC, created_at DESC
    `).all()

    return c.json({ success: true, advertisements: result.results || [] })
  } catch (error) {
    console.error('Database error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// 워킹걸 회원가입
app.post('/api/auth/working-girl/register', async (c) => {
  const { env } = c

  try {
    const formData = await c.req.formData()
    
    const userData = {
      user_id: formData.get('user_id'),
      password: formData.get('password'),
      nickname: formData.get('nickname'),
      age: parseInt(formData.get('age')),
      height: parseInt(formData.get('height')),
      weight: parseInt(formData.get('weight')),
      gender: formData.get('gender'),
      region: formData.get('region'),
      line_id: formData.get('line_id'),
      kakao_id: formData.get('kakao_id'),
      phone: formData.get('phone'),
      code: formData.get('code')
    }

    // 아이디 중복 체크
    const existingUser = await env.DB.prepare(`
      SELECT id FROM working_girls WHERE user_id = ?
    `).bind(userData.user_id).first()

    if (existingUser) {
      return c.json({ success: false, message: '이미 사용중인 아이디입니다.' }, 400)
    }

    // 워킹걸 데이터 삽입
    const insertResult = await env.DB.prepare(`
      INSERT INTO working_girls (
        user_id, password, nickname, age, height, weight, gender, region,
        line_id, kakao_id, phone, code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userData.user_id, userData.password, userData.nickname, userData.age,
      userData.height, userData.weight, userData.gender, userData.region,
      userData.line_id, userData.kakao_id, userData.phone, userData.code
    ).run()

    const workingGirlId = insertResult.meta.last_row_id

    // 사진 파일 처리 - Base64 인코딩으로 저장
    const photos = formData.getAll('photos')
    console.log('=== 회원가입 사진 업로드 디버깅 시작 ===')
    console.log('photos 배열 길이:', photos.length)
    console.log('photos 배열:', photos.map((p, i) => `${i}: ${p instanceof File ? `File(${p.name}, ${p.size}bytes, ${p.type})` : `Not File: ${p}`}`))
    
    if (photos.length > 0) {
      console.log('사진 업로드 조건 만족, 처리 시작')
      
      // 새 사진 저장
      let processedCount = 0
      let mainPhotoUrl = null
      
      for (let i = 0; i < Math.min(photos.length, 10); i++) {
        const photo = photos[i] as File
        console.log(`사진 ${i + 1} 처리 중: ${photo.name}, 크기: ${photo.size}bytes, 타입: ${photo.type}`)
        
        // 빈 파일이나 잘못된 파일 건너뛰기
        if (!photo || !(photo instanceof File) || photo.size === 0) {
          console.log(`사진 ${i + 1} 빈 파일이거나 잘못된 파일로 건너뜀`)
          continue
        }
        
        if (photo.size > 5 * 1024 * 1024) { // 5MB 제한
          console.log(`사진 ${i + 1} 크기 초과로 건너뜀`)
          continue
        }
        
        try {
          // 파일을 Base64로 인코딩하여 저장
          console.log(`사진 ${i + 1} Base64 인코딩 시작`)
          const arrayBuffer = await photo.arrayBuffer()
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
          const mimeType = photo.type || 'image/jpeg'
          const photoUrl = `data:${mimeType};base64,${base64}`
          console.log(`사진 ${i + 1} Base64 생성 완료, 길이: ${base64.length}`)
          
          const isMain = i === 0
          if (isMain) {
            mainPhotoUrl = photoUrl
          }
          
          const insertResult = await env.DB.prepare(`
            INSERT INTO working_girl_photos (working_girl_id, photo_url, is_main, upload_order)
            VALUES (?, ?, ?, ?)
          `).bind(workingGirlId, photoUrl, isMain ? 1 : 0, i + 1).run()
          console.log(`사진 ${i + 1} 데이터베이스 저장 완료:`, insertResult)
          processedCount++
        } catch (error) {
          console.error(`사진 ${i + 1} 처리 오류:`, error)
          // 에러가 발생해도 다음 사진 처리 계속
        }
      }
      
      // 메인 사진이 있으면 working_girls 테이블도 업데이트
      if (mainPhotoUrl) {
        await env.DB.prepare(`
          UPDATE working_girls SET main_photo = ? WHERE id = ?
        `).bind(mainPhotoUrl, workingGirlId).run()
        console.log('메인 사진 업데이트 완료:', mainPhotoUrl.substring(0, 50) + '...')
      }
      
      console.log(`총 ${processedCount}개 사진 처리 완료`)
    } else {
      console.log('사진 업로드 조건 불만족:')
      console.log('- photos.length:', photos.length)
      if (photos.length > 0) {
        console.log('- photos[0] instanceof File:', photos[0] instanceof File)
        console.log('- photos[0].size:', photos[0] instanceof File ? photos[0].size : 'N/A')
      }
    }

    return c.json({ success: true, message: '회원가입이 완료되었습니다.' })
  } catch (error) {
    console.error('Registration error:', error)
    return c.json({ success: false, message: '회원가입에 실패했습니다.' }, 500)
  }
})

// 워킹걸 로그인
app.post('/api/auth/working-girl/login', async (c) => {
  const { env } = c
  const { user_id, password } = await c.req.json()

  try {
    const user = await env.DB.prepare(`
      SELECT * FROM working_girls WHERE user_id = ? AND password = ?
    `).bind(user_id, password).first()

    if (!user) {
      return c.json({ success: false, message: '아이디 또는 비밀번호가 잘못되었습니다.' }, 401)
    }

    // 세션 토큰 생성
    const sessionToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24시간

    await env.DB.prepare(`
      INSERT INTO sessions (session_token, user_type, user_id, expires_at)
      VALUES (?, 'working_girl', ?, ?)
    `).bind(sessionToken, user.id, expiresAt.toISOString()).run()

    return c.json({
      success: true,
      session_token: sessionToken,
      user: user
    })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ success: false, message: '로그인에 실패했습니다.' }, 500)
  }
})

// 워킹걸 프로필 조회 - 완전히 새로운 로직
app.get('/api/working-girl/profile', async (c) => {
  const { env } = c
  const sessionToken = c.req.header('Authorization')?.replace('Bearer ', '') || 
                      c.req.query('session_token')

  console.log('=== 프로필 조회 API 시작 ===')
  console.log('세션 토큰:', sessionToken ? '있음' : '없음')

  if (!sessionToken) {
    return c.json({ success: false, message: '인증이 필요합니다.' }, 401)
  }

  try {
    // 세션 검증
    const session = await env.DB.prepare(`
      SELECT * FROM sessions 
      WHERE session_token = ? AND user_type = 'working_girl' AND expires_at > datetime('now')
    `).bind(sessionToken).first()
    
    console.log('세션 검증 결과:', session ? `사용자 ID: ${session.user_id}` : '없음')

    if (!session) {
      return c.json({ success: false, message: '유효하지 않은 세션입니다.' }, 401)
    }

    // 워킹걸 정보와 사진 정보를 한 번에 조회
    const user = await env.DB.prepare(`
      SELECT * FROM working_girls WHERE id = ?
    `).bind(session.user_id).first()

    const photosResult = await env.DB.prepare(`
      SELECT id, working_girl_id, photo_url, is_main, upload_order, created_at
      FROM working_girl_photos 
      WHERE working_girl_id = ? 
      ORDER BY upload_order ASC
    `).bind(session.user_id).all()

    const photos = photosResult.results || []
    console.log(`사진 조회 결과: ${photos.length}개 발견`)
    
    // 사진이 있다면 첫 번째 사진 정보 로깅
    if (photos.length > 0) {
      console.log('첫 번째 사진 정보:', {
        id: photos[0].id,
        is_main: photos[0].is_main,
        upload_order: photos[0].upload_order,
        photo_url_length: photos[0].photo_url ? photos[0].photo_url.length : 0
      })
    }

    const responseData = {
      success: true,
      id: user.id,
      user_id: user.user_id,
      password: user.password,
      nickname: user.nickname,
      age: user.age,
      height: user.height,
      weight: user.weight,
      gender: user.gender,
      region: user.region,
      line_id: user.line_id,
      kakao_id: user.kakao_id,
      phone: user.phone,
      code: user.code,
      main_photo: user.main_photo,
      is_active: user.is_active,
      is_recommended: user.is_recommended,
      created_at: user.created_at,
      updated_at: user.updated_at,
      photos: photos
    }

    console.log('=== 프로필 조회 API 완료 ===')
    return c.json(responseData)

  } catch (error) {
    console.error('Profile fetch error:', error)
    return c.json({ success: false, message: '프로필을 불러오는데 실패했습니다.' }, 500)
  }
})

// 워킹걸 프로필 수정
app.post('/api/working-girl/profile/update', async (c) => {
  const { env } = c
  const formData = await c.req.formData()
  
  const sessionToken = formData.get('session_token')
  
  if (!sessionToken) {
    return c.json({ success: false, message: '인증이 필요합니다.' }, 401)
  }

  try {
    // 세션 검증
    const session = await env.DB.prepare(`
      SELECT * FROM sessions 
      WHERE session_token = ? AND user_type = 'working_girl' AND expires_at > datetime('now')
    `).bind(sessionToken).first()

    if (!session) {
      return c.json({ success: false, message: '유효하지 않은 세션입니다.' }, 401)
    }

    // 업데이트할 데이터 수집
    const updateData = {
      is_active: formData.get('is_active') === 'true',
      password: formData.get('password'),
      nickname: formData.get('nickname'),
      age: parseInt(formData.get('age')),
      height: parseInt(formData.get('height')),
      weight: parseInt(formData.get('weight')),
      gender: formData.get('gender'),
      region: formData.get('region'),
      line_id: formData.get('line_id'),
      kakao_id: formData.get('kakao_id'),
      phone: formData.get('phone'),
      code: formData.get('code')
    }

    // 워킹걸 정보 업데이트
    await env.DB.prepare(`
      UPDATE working_girls SET 
        is_active = ?, password = ?, nickname = ?, age = ?, height = ?, weight = ?,
        gender = ?, region = ?, line_id = ?, kakao_id = ?, phone = ?, code = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      updateData.is_active, updateData.password, updateData.nickname, 
      updateData.age, updateData.height, updateData.weight,
      updateData.gender, updateData.region, updateData.line_id, 
      updateData.kakao_id, updateData.phone, updateData.code,
      session.user_id
    ).run()

    // 새로운 사진이 업로드된 경우 - 안전한 처리 로직
    const photos = formData.getAll('photos')
    console.log('=== 프로필 수정 사진 업로드 시작 ===')
    console.log('photos 배열 길이:', photos.length)
    console.log('photos 배열:', photos.map((p, i) => `${i}: ${p instanceof File ? `File(${p.name}, ${p.size}bytes, ${p.type})` : `Not File: ${p}`}`))
    
    // 업로드할 유효한 사진 파일들을 먼저 확인하고 처리
    const validPhotos = []
    let hasValidPhotos = false
    
    for (let i = 0; i < Math.min(photos.length, 10); i++) {
      const photo = photos[i] as File
      console.log(`사진 ${i + 1} 검증 중: ${photo?.name || 'unknown'}, 크기: ${photo?.size || 0}bytes`)
      
      // 유효한 파일인지 확인
      if (photo && photo instanceof File && photo.size > 0 && photo.size <= 5 * 1024 * 1024) {
        try {
          // Base64 인코딩 먼저 수행
          console.log(`사진 ${i + 1} Base64 인코딩 시작`)
          const arrayBuffer = await photo.arrayBuffer()
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
          const mimeType = photo.type || 'image/jpeg'
          const photoUrl = `data:${mimeType};base64,${base64}`
          
          validPhotos.push({
            photoUrl,
            isMain: i === 0,
            uploadOrder: i + 1
          })
          hasValidPhotos = true
          console.log(`사진 ${i + 1} 인코딩 성공, 길이: ${base64.length}`)
        } catch (error) {
          console.error(`사진 ${i + 1} 인코딩 실패:`, error)
        }
      } else {
        console.log(`사진 ${i + 1} 유효하지 않음 - 건너뜀`)
      }
    }
    
    // 유효한 사진이 있을 때만 데이터베이스 업데이트
    if (hasValidPhotos && validPhotos.length > 0) {
      console.log(`총 ${validPhotos.length}개 유효한 사진 발견, 데이터베이스 업데이트 시작`)
      
      try {
        // 1. 기존 사진 삭제
        const deleteResult = await env.DB.prepare(`
          DELETE FROM working_girl_photos WHERE working_girl_id = ?
        `).bind(session.user_id).run()
        console.log('기존 사진 삭제 결과:', deleteResult.changes, '개 삭제됨')
        
        // 2. 새 사진들을 순차적으로 저장
        let mainPhotoUrl = null
        for (let i = 0; i < validPhotos.length; i++) {
          const validPhoto = validPhotos[i]
          
          const insertResult = await env.DB.prepare(`
            INSERT INTO working_girl_photos (working_girl_id, photo_url, is_main, upload_order)
            VALUES (?, ?, ?, ?)
          `).bind(session.user_id, validPhoto.photoUrl, validPhoto.isMain ? 1 : 0, validPhoto.uploadOrder).run()
          
          console.log(`사진 ${i + 1} 저장 완료: ID ${insertResult.meta?.last_row_id}`)
          
          if (validPhoto.isMain) {
            mainPhotoUrl = validPhoto.photoUrl
          }
        }
        
        // 3. 메인 사진 업데이트 (첫 번째 사진)
        if (mainPhotoUrl) {
          await env.DB.prepare(`
            UPDATE working_girls SET main_photo = ? WHERE id = ?
          `).bind(mainPhotoUrl, session.user_id).run()
          console.log('메인 사진 업데이트 완료')
        }
        
        console.log(`=== 사진 업로드 완료: 총 ${validPhotos.length}개 처리됨 ===`)
        
      } catch (dbError) {
        console.error('데이터베이스 사진 저장 중 오류:', dbError)
        // 실패 시에도 프로필 수정은 성공으로 처리 (기본 정보는 이미 저장됨)
      }
    } else {
      console.log('=== 유효한 사진이 없음 - 사진 업데이트 건너뜀 ===')
    }

    // 업데이트된 사용자 정보와 사진 정보 반환
    const updatedUser = await env.DB.prepare(`
      SELECT * FROM working_girls WHERE id = ?
    `).bind(session.user_id).first()

    const updatedPhotos = await env.DB.prepare(`
      SELECT * FROM working_girl_photos 
      WHERE working_girl_id = ? 
      ORDER BY upload_order ASC
    `).bind(session.user_id).all()

    return c.json({
      success: true,
      message: '프로필이 성공적으로 수정되었습니다.',
      user: {
        ...updatedUser,
        photos: updatedPhotos.results || []
      }
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return c.json({ success: false, message: '프로필 수정에 실패했습니다.' }, 500)
  }
})

// 관리자 로그인
app.post('/api/auth/admin/login', async (c) => {
  const { env } = c
  const { username, password } = await c.req.json()

  try {
    const admin = await env.DB.prepare(`
      SELECT * FROM admins WHERE username = ? AND password = ?
    `).bind(username, password).first()

    if (!admin) {
      return c.json({ success: false, message: '관리자 정보가 잘못되었습니다.' }, 401)
    }

    // 세션 토큰 생성
    const sessionToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24시간

    await env.DB.prepare(`
      INSERT INTO sessions (session_token, user_type, user_id, expires_at)
      VALUES (?, 'admin', ?, ?)
    `).bind(sessionToken, admin.id, expiresAt.toISOString()).run()

    return c.json({
      success: true,
      session_token: sessionToken,
      user: admin
    })
  } catch (error) {
    console.error('Admin login error:', error)
    return c.json({ success: false, message: '로그인에 실패했습니다.' }, 500)
  }
})

// 세션 검증
app.post('/api/auth/verify-session', async (c) => {
  const { env } = c
  const { session_token } = await c.req.json()

  try {
    const session = await env.DB.prepare(`
      SELECT * FROM sessions WHERE session_token = ? AND expires_at > datetime('now')
    `).bind(session_token).first()

    if (!session) {
      return c.json({ success: false, message: '세션이 만료되었습니다.' }, 401)
    }

    let user
    if (session.user_type === 'working_girl') {
      user = await env.DB.prepare(`
        SELECT * FROM working_girls WHERE id = ?
      `).bind(session.user_id).first()
    } else if (session.user_type === 'admin') {
      user = await env.DB.prepare(`
        SELECT * FROM admins WHERE id = ?
      `).bind(session.user_id).first()
    }

    return c.json({
      success: true,
      user: user,
      user_type: session.user_type
    })
  } catch (error) {
    console.error('Session verification error:', error)
    return c.json({ success: false, message: '세션 검증에 실패했습니다.' }, 500)
  }
})

// 워킹걸 활동상태 토글
app.post('/api/working-girl/toggle-status', async (c) => {
  const { env } = c
  // TODO: 세션 검증 미들웨어 추가 필요
  const { is_active } = await c.req.json()

  try {
    // 임시로 첫 번째 워킹걸의 상태를 변경 (실제로는 세션에서 user_id를 가져와야 함)
    const result = await env.DB.prepare(`
      UPDATE working_girls SET is_active = ? WHERE id = 1
    `).bind(is_active).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Status toggle error:', error)
    return c.json({ success: false, message: '상태 변경에 실패했습니다.' }, 500)
  }
})

// 로그아웃
app.post('/api/auth/logout', async (c) => {
  const { env } = c
  const { session_token } = await c.req.json()

  try {
    await env.DB.prepare(`
      DELETE FROM sessions WHERE session_token = ?
    `).bind(session_token).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return c.json({ success: false, message: '로그아웃에 실패했습니다.' }, 500)
  }
})

// 관리자 페이지
app.get('/admin', async (c) => {
  const { env } = c

  // TODO: 관리자 세션 검증 추가 필요

  try {
    // 대시보드 통계 조회
    const stats = await Promise.all([
      env.DB.prepare(`SELECT COUNT(*) as count FROM working_girls`).first(),
      env.DB.prepare(`SELECT COUNT(*) as count FROM working_girls WHERE is_active = 1`).first(),
      env.DB.prepare(`SELECT COUNT(*) as count FROM working_girls WHERE is_recommended = 1`).first(),
      env.DB.prepare(`SELECT COUNT(*) as count FROM working_girls WHERE region = '방콕'`).first(),
      env.DB.prepare(`SELECT COUNT(*) as count FROM working_girls WHERE region = '파타야'`).first(),
      env.DB.prepare(`SELECT COUNT(*) as count FROM working_girls WHERE region = '치앙마이'`).first(),
      env.DB.prepare(`SELECT COUNT(*) as count FROM working_girls WHERE region = '푸켓'`).first()
    ])

    return c.html(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>타이위키 관리자</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
          <link href="/static/style.css" rel="stylesheet">
      </head>
      <body class="bg-gray-50">
          <!-- 관리자 헤더 -->
          <header class="bg-thai-blue text-white shadow-lg">
              <div class="container mx-auto px-4 py-3 flex justify-between items-center">
                  <h1 class="text-2xl font-bold">
                      <i class="fas fa-cog mr-2"></i>타이위키 관리자
                  </h1>
                  <div class="flex space-x-4">
                      <a href="/" class="hover:text-gray-200">
                          <i class="fas fa-home mr-1"></i>메인으로
                      </a>
                      <button onclick="adminLogout()" class="hover:text-gray-200">
                          <i class="fas fa-sign-out-alt mr-1"></i>로그아웃
                      </button>
                  </div>
              </div>
          </header>

          <div class="container mx-auto px-4 py-8">
              <!-- 대시보드 통계 -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                  <div class="bg-white p-6 rounded-lg shadow-md text-center">
                      <i class="fas fa-users text-3xl text-blue-500 mb-2"></i>
                      <h3 class="text-xl font-bold">${stats[0].count}</h3>
                      <p class="text-gray-600">총 워킹걸 수</p>
                  </div>
                  <div class="bg-white p-6 rounded-lg shadow-md text-center">
                      <i class="fas fa-user-check text-3xl text-green-500 mb-2"></i>
                      <h3 class="text-xl font-bold">${stats[1].count}</h3>
                      <p class="text-gray-600">활성 워킹걸</p>
                  </div>
                  <div class="bg-white p-6 rounded-lg shadow-md text-center">
                      <i class="fas fa-star text-3xl text-yellow-500 mb-2"></i>
                      <h3 class="text-xl font-bold">${stats[2].count}</h3>
                      <p class="text-gray-600">추천 워킹걸</p>
                  </div>
                  <div class="bg-white p-6 rounded-lg shadow-md text-center">
                      <i class="fas fa-map-marker-alt text-3xl text-red-500 mb-2"></i>
                      <h3 class="text-xl font-bold">${stats[3].count + stats[4].count + stats[5].count + stats[6].count}</h3>
                      <p class="text-gray-600">전체 지역</p>
                  </div>
              </div>

              <!-- 지역별 통계 -->
              <div class="bg-white rounded-lg shadow-md p-6 mb-8">
                  <h2 class="text-xl font-bold mb-4">지역별 워킹걸 수</h2>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div class="text-center p-4 bg-blue-50 rounded">
                          <h3 class="font-bold text-lg">${stats[3].count}</h3>
                          <p>방콕</p>
                      </div>
                      <div class="text-center p-4 bg-green-50 rounded">
                          <h3 class="font-bold text-lg">${stats[4].count}</h3>
                          <p>파타야</p>
                      </div>
                      <div class="text-center p-4 bg-yellow-50 rounded">
                          <h3 class="font-bold text-lg">${stats[5].count}</h3>
                          <p>치앙마이</p>
                      </div>
                      <div class="text-center p-4 bg-red-50 rounded">
                          <h3 class="font-bold text-lg">${stats[6].count}</h3>
                          <p>푸켓</p>
                      </div>
                  </div>
              </div>

              <!-- 검색 기능 -->
              <div class="bg-white rounded-lg shadow-md p-6 mb-8">
                  <h2 class="text-xl font-bold mb-4">워킹걸 검색</h2>
                  <div class="flex space-x-4">
                      <input type="text" id="admin-search" placeholder="닉네임, 아이디, 지역 등으로 검색..." 
                             class="flex-1 p-3 border border-gray-300 rounded-lg focus:border-thai-blue focus:outline-none">
                      <button onclick="adminSearch()" 
                              class="bg-thai-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
                          <i class="fas fa-search mr-2"></i>검색
                      </button>
                  </div>
              </div>

              <!-- 워킹걸 관리 테이블 -->
              <div class="bg-white rounded-lg shadow-md overflow-hidden">
                  <div class="p-6 border-b">
                      <h2 class="text-xl font-bold">워킹걸 관리</h2>
                  </div>
                  <div class="overflow-x-auto">
                      <table class="w-full">
                          <thead class="bg-gray-50">
                              <tr>
                                  <th class="px-4 py-3 text-left">코드</th>
                                  <th class="px-4 py-3 text-left">추천</th>
                                  <th class="px-4 py-3 text-left">거주지역</th>
                                  <th class="px-4 py-3 text-left">아이디</th>
                                  <th class="px-4 py-3 text-left">닉네임</th>
                                  <th class="px-4 py-3 text-left">나이</th>
                                  <th class="px-4 py-3 text-left">키</th>
                                  <th class="px-4 py-3 text-left">몸무게</th>
                                  <th class="px-4 py-3 text-left">성별</th>
                                  <th class="px-4 py-3 text-left">관리</th>
                              </tr>
                          </thead>
                          <tbody id="working-girls-table">
                              <!-- 동적으로 로드됩니다 -->
                          </tbody>
                      </table>
                  </div>
              </div>

              <!-- 모바일 최적화 광고 관리 섹션 -->
              <div class="bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-6 mt-4 sm:mt-8">
                  <h2 class="text-lg sm:text-xl font-bold mb-3 sm:mb-4">광고 관리</h2>
                  
                  <!-- 광고 이미지 사이즈 가이드라인 -->
                  <div class="bg-blue-50 border-l-4 border-blue-400 p-3 sm:p-4 mb-4 sm:mb-6">
                      <div class="flex">
                          <div class="flex-shrink-0">
                              <i class="fas fa-info-circle text-blue-400 text-lg"></i>
                          </div>
                          <div class="ml-3">
                              <h3 class="text-sm font-medium text-blue-800">광고 이미지 사이즈 가이드라인</h3>
                              <div class="mt-2 text-sm text-blue-700">
                                  <ul class="list-disc list-inside space-y-1">
                                      <li><strong>모바일 최적화:</strong> 350×120px (가로×세로)</li>
                                      <li><strong>데스크톱 최적화:</strong> 1200×120px (가로×세로)</li>
                                      <li><strong>권장 형식:</strong> JPG, PNG (파일크기 500KB 이하)</li>
                                      <li><strong>비율 유지:</strong> 가로 세로 비율 10:3 (예: 1000×300px)</li>
                                      <li><strong>텍스트:</strong> 이미지 내 텍스트는 크고 명확하게</li>
                                  </ul>
                              </div>
                              <div class="mt-3">
                                  <p class="text-xs text-blue-600">
                                      <i class="fas fa-lightbulb mr-1"></i>
                                      <strong>팁:</strong> 반응형 디자인을 위해 중요한 내용은 이미지 중앙에 배치하세요.
                                  </p>
                              </div>
                          </div>
                      </div>
                  </div>

                  <!-- 광고 업로드 -->
                  <div class="mb-4 sm:mb-6 p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-lg">
                      <div class="text-center">
                          <i class="fas fa-cloud-upload-alt text-3xl sm:text-4xl text-gray-400 mb-3"></i>
                          <div class="mb-3">
                              <label for="ad-upload" class="cursor-pointer">
                                  <span class="text-sm sm:text-base text-gray-600">이미지를 선택하거나 드래그하여 업로드</span>
                              </label>
                              <input type="file" id="ad-upload" accept="image/jpeg,image/png,image/webp" class="hidden" onchange="previewAdImage(this)">
                          </div>
                          
                          <!-- 이미지 미리보기 -->
                          <div id="ad-preview" class="hidden mb-4">
                              <img id="ad-preview-img" class="max-w-full h-20 sm:h-24 object-contain mx-auto rounded border">
                              <p id="ad-preview-info" class="text-xs sm:text-sm text-gray-500 mt-2"></p>
                          </div>

                          <div class="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
                              <button onclick="document.getElementById('ad-upload').click()" 
                                      class="bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded text-sm sm:text-base">
                                  <i class="fas fa-folder-open mr-2"></i>파일 선택
                              </button>
                              <button onclick="uploadAdvertisement()" 
                                      class="bg-green-500 hover:bg-green-600 text-white px-3 sm:px-4 py-2 rounded text-sm sm:text-base" disabled id="upload-btn">
                                  <i class="fas fa-upload mr-2"></i>광고 업로드
                              </button>
                          </div>
                      </div>
                  </div>

                  <!-- 현재 광고 리스트 -->
                  <div>
                      <h3 class="text-base sm:text-lg font-medium mb-3 text-gray-800">
                          <i class="fas fa-list mr-2 text-gray-600"></i>현재 광고 목록
                      </h3>
                      <div id="advertisements-list" class="space-y-3">
                          <!-- 동적으로 로드됩니다 -->
                      </div>
                  </div>
              </div>
          </div>

          <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
          <script src="/static/admin.js"></script>
      </body>
      </html>
    `)
  } catch (error) {
    console.error('Admin page error:', error)
    return c.text('Internal Server Error', 500)
  }
})

// 완전히 새로운 메인 페이지 프로필 API - 단순하고 확실한 방식
app.get('/api/v2/profiles', async (c) => {
  const { env } = c

  console.log('=== 메인 페이지 프로필 API 시작 ===')

  try {
    // 1단계: 모든 활성 워킹걸 조회
    const workingGirlsResult = await env.DB.prepare(`
      SELECT * FROM working_girls 
      WHERE is_active = 1 
      ORDER BY is_recommended DESC, created_at DESC
    `).all()

    const workingGirls = workingGirlsResult.results || []
    console.log(`활성 워킹걸 ${workingGirls.length}명 조회됨`)

    // 2단계: 각 워킹걸별로 사진 조회
    const enrichedWorkingGirls = []
    
    for (const girl of workingGirls) {
      const photosResult = await env.DB.prepare(`
        SELECT id, working_girl_id, photo_url, is_main, upload_order, created_at
        FROM working_girl_photos 
        WHERE working_girl_id = ? 
        ORDER BY upload_order ASC
      `).bind(girl.id).all()

      const photos = photosResult.results || []
      
      console.log(`워킹걸 ${girl.nickname} (ID: ${girl.id}): ${photos.length}개 사진`)
      
      // 사진이 있는 경우 첫 번째 사진 정보 로깅
      if (photos.length > 0) {
        console.log(`  - 첫 번째 사진: is_main=${photos[0].is_main}, order=${photos[0].upload_order}`)
      }

      enrichedWorkingGirls.push({
        ...girl,
        photos: photos
      })
    }

    // 3단계: 강력한 캐시 방지 헤더 설정
    c.header('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
    c.header('Pragma', 'no-cache')
    c.header('Expires', '0')
    c.header('Last-Modified', new Date().toUTCString())
    c.header('ETag', `v3-${Date.now()}`)

    console.log('=== 메인 페이지 프로필 API 완료 ===')
    
    return c.json({ 
      success: true, 
      working_girls: enrichedWorkingGirls,
      timestamp: new Date().toISOString(),
      total_count: enrichedWorkingGirls.length
    })
    
  } catch (error) {
    console.error('메인 페이지 API 오류:', error)
    return c.json({ success: false, error: '서버 오류가 발생했습니다.' }, 500)
  }
})

// 데이터베이스 완전 정리 API (개발용)
app.post('/api/cleanup-photos', async (c) => {
  const { env } = c
  
  try {
    // 모든 사진 데이터 삭제
    await env.DB.prepare(`DELETE FROM working_girl_photos`).run()
    
    return c.json({ success: true, message: '모든 사진 데이터가 삭제되었습니다.' })
  } catch (error) {
    console.error('Photo cleanup error:', error)
    return c.json({ success: false, message: '데이터 정리에 실패했습니다.' }, 500)
  }
})

// 테스트 데이터 생성 API (개발용) 
app.post('/api/reset-test-data', async (c) => {
  const { env } = c
  
  try {
    console.log('사진 데이터 초기화 시작...')
    
    // 1. 모든 사진 데이터 완전 삭제
    const deleteResult = await env.DB.prepare(`DELETE FROM working_girl_photos`).run()
    console.log('삭제 결과:', deleteResult)
    console.log('삭제된 레코드 수:', deleteResult?.changes || deleteResult?.meta?.changes || 'unknown')
    
    // 2. 잠시 대기 (트랜잭션 완료 보장)
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // 3. 확인: 모든 데이터가 삭제되었는지 체크 및 강제 삭제
    let checkResult = await env.DB.prepare(`SELECT COUNT(*) as count FROM working_girl_photos`).first()
    console.log('1차 삭제 후 남은 레코드 수:', checkResult?.count || 'unknown')
    
    // 데이터가 남아있으면 강제로 다시 삭제
    if ((checkResult?.count || 0) > 0) {
      console.log('잔여 데이터 발견, 강제 삭제 실행...')
      await env.DB.prepare(`DELETE FROM working_girl_photos WHERE 1=1`).run()
      await env.DB.prepare(`VACUUM`).run() // SQLite 최적화
      
      checkResult = await env.DB.prepare(`SELECT COUNT(*) as count FROM working_girl_photos`).first()
      console.log('2차 삭제 후 남은 레코드 수:', checkResult?.count || 'unknown')
    }
    
    // 4. 새로운 Base64 테스트 이미지 생성
    const redImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABjSURBVBiVpY+xDQAwCANfbmj2H5k9OqRVShURER+zXQxERMzd3d3d3d3d3d3d3d3d3d3dxcwkxfY4M3PnlvG5iZmZmRERERER+7+6agAAAP//AAAAAP//wBwbhc7+1QAAAAABJRU5ErkJggg=='
    const blueImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABjSURBVBiVpY+xDQAwCANfbmj2H5k9OqRVShURER+zXQxERMzd3d3d3d3d3d3d3d3d3d3dxcwkxfY4M3PnlvG5iZmZmRERERER+7+6agAAAP//AAAAAP//wA4bgQ7+1QAAAAABJRU5ErkJggg=='
    const greenImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABjSUlERUhERERAAAAA3d3d3d3d3d3d3d3d3d3dxcwkxfY4M3PnlvG5iZmZmRERERER+7+6agAAAP//AAAAAP//wJABgQ7+1QAAAAABJRU5ErkJggg=='
    
    // 5. 개별적으로 삽입하고 각각 확인
    console.log('새 데이터 삽입 시작...')
    
    // 나나(id=1) 빨간색 이미지
    const insert1 = await env.DB.prepare(`
      INSERT INTO working_girl_photos (working_girl_id, photo_url, is_main, upload_order)
      VALUES (1, ?, 1, 1)
    `).bind(redImageBase64).run()
    console.log('나나 이미지 삽입:', insert1.success)
    
    // 리사(id=4) 파란색 이미지  
    const insert2 = await env.DB.prepare(`
      INSERT INTO working_girl_photos (working_girl_id, photo_url, is_main, upload_order)
      VALUES (4, ?, 1, 1)
    `).bind(blueImageBase64).run()
    console.log('리사 이미지 삽입:', insert2.success)
    
    // 미미(id=2) 초록색 이미지
    const insert3 = await env.DB.prepare(`
      INSERT INTO working_girl_photos (working_girl_id, photo_url, is_main, upload_order)
      VALUES (2, ?, 1, 1)
    `).bind(greenImageBase64).run()
    console.log('미미 이미지 삽입:', insert3.success)
    
    // 6. 최종 확인
    const finalCheck = await env.DB.prepare(`SELECT COUNT(*) as count FROM working_girl_photos WHERE photo_url LIKE 'data:image%'`).first()
    console.log('새 Base64 이미지 레코드 수:', finalCheck?.count || 0)
    
    return c.json({ 
      success: true, 
      message: `Base64 테스트 데이터 ${finalCheck?.count || 0}개 생성 완료`,
      details: {
        deleted: deleteResult.changes,
        inserted: finalCheck?.count || 0
      }
    })
  } catch (error) {
    console.error('Test data creation error:', error)
    return c.json({ success: false, message: '테스트 데이터 생성에 실패했습니다.', error: error.message }, 500)
  }
})

// 사진 데이터 확인 API (개발용)
app.get('/api/debug/check-photos/:user_id', async (c) => {
  const { env } = c
  const userId = c.req.param('user_id')
  
  try {
    const photos = await env.DB.prepare(`
      SELECT id, working_girl_id, photo_url, is_main, upload_order, created_at
      FROM working_girl_photos 
      WHERE working_girl_id = ? 
      ORDER BY upload_order ASC
    `).bind(parseInt(userId)).all()
    
    const user = await env.DB.prepare(`
      SELECT id, user_id, nickname, main_photo
      FROM working_girls 
      WHERE id = ?
    `).bind(parseInt(userId)).first()
    
    return c.json({ 
      success: true, 
      user: user,
      photos: photos.results || [],
      photos_count: photos.results?.length || 0
    })
  } catch (error) {
    console.error('Check photos error:', error)
    return c.json({ success: false, message: '사진 확인 중 오류가 발생했습니다.', error: error.message }, 500)
  }
})

// 더미 사진 정리 API (개발용)
app.post('/api/debug/cleanup-dummy-photos', async (c) => {
  const { env } = c
  
  try {
    // 더미 URL 패턴으로 된 사진들 삭제
    const deleteResult = await env.DB.prepare(`
      DELETE FROM working_girl_photos 
      WHERE photo_url LIKE '/static/images/user_%' 
         OR photo_url LIKE '/static/photos/%'
    `).run()
    
    console.log('더미 사진 삭제 결과:', deleteResult)
    
    // working_girls 테이블의 main_photo도 더미 URL이면 NULL로 설정
    const updateMainPhotoResult = await env.DB.prepare(`
      UPDATE working_girls 
      SET main_photo = NULL 
      WHERE main_photo LIKE '/static/images/user_%' 
         OR main_photo LIKE '/static/photos/%'
    `).run()
    
    console.log('메인 사진 정리 결과:', updateMainPhotoResult)
    
    return c.json({ 
      success: true, 
      message: `더미 사진 ${deleteResult.changes}개 삭제됨`,
      deleted_photos: deleteResult.changes,
      updated_main_photos: updateMainPhotoResult.changes
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    return c.json({ success: false, message: '정리 중 오류가 발생했습니다.', error: error.message }, 500)
  }
})

export default app
