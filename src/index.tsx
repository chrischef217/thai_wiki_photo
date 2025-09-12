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
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
    <body class="bg-gray-50">
        <!-- 상단바 -->
        <header class="bg-gradient-to-r from-thai-blue to-thai-red text-white shadow-lg">
            <div class="container mx-auto px-4 py-3 flex justify-between items-center">
                <!-- 사이트 로고 -->
                <div class="flex items-center space-x-3">
                    <i class="fas fa-globe-asia text-2xl"></i>
                    <h1 class="text-2xl font-bold">타이위키</h1>
                    <span class="text-sm bg-white/20 px-2 py-1 rounded">Thai Wiki</span>
                </div>

                <!-- 활동상태 버튼 (로그인 시에만 표시) -->
                <div id="activity-status" class="hidden items-center space-x-2">
                    <span class="text-sm">활동상태:</span>
                    <button id="status-toggle" class="bg-green-500 hover:bg-green-600 px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200">
                        ON
                    </button>
                </div>

                <!-- 햄버거 메뉴 -->
                <button id="menu-toggle" class="text-2xl hover:text-gray-200 transition-colors duration-200">
                    <i class="fas fa-bars"></i>
                </button>
            </div>
        </header>

        <!-- 사이드 메뉴 -->
        <div id="side-menu" class="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform translate-x-full transition-transform duration-300 z-50">
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-gray-800">메뉴</h3>
                    <button id="menu-close" class="text-2xl text-gray-600 hover:text-gray-800">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <nav class="space-y-4">
                    <a href="#" onclick="showWorkingGirlLogin()" class="block p-3 bg-thai-red text-white rounded-lg hover:bg-red-600 transition-colors duration-200">
                        <i class="fas fa-user mr-2"></i>워킹걸 로그인
                    </a>
                    <a href="#" onclick="showAdminLogin()" class="block p-3 bg-thai-blue text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                        <i class="fas fa-cog mr-2"></i>관리자 로그인
                    </a>
                </nav>
            </div>
        </div>

        <!-- 메뉴 오버레이 -->
        <div id="menu-overlay" class="fixed inset-0 bg-black/50 hidden z-40"></div>

        <!-- 광고 배너 -->
        <div class="bg-white shadow-sm border-b">
            <div class="container mx-auto px-4 py-4">
                <div id="ad-banner" class="h-24 bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg overflow-hidden relative">
                    <div id="ad-slider" class="flex transition-transform duration-500 ease-in-out h-full">
                        <!-- 광고 이미지들이 동적으로 로드됩니다 -->
                        <div class="min-w-full h-full bg-gradient-to-r from-pink-200 to-purple-200 flex items-center justify-center">
                            <p class="text-gray-600"><i class="fas fa-ad mr-2"></i>광고 배너 영역</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 검색 섹션 -->
        <div class="bg-white shadow-sm">
            <div class="container mx-auto px-4 py-6">
                <div class="max-w-2xl mx-auto">
                    <h2 class="text-xl font-bold text-gray-800 mb-4 text-center">
                        <i class="fas fa-search mr-2 text-thai-red"></i>워킹걸 검색
                    </h2>
                    <div class="relative">
                        <input 
                            type="text" 
                            id="search-input"
                            placeholder="닉네임, 지역, 나이 등으로 검색하세요..."
                            class="w-full p-4 pr-12 border-2 border-gray-300 rounded-full focus:border-thai-red focus:outline-none text-lg"
                        >
                        <button onclick="searchWorkingGirls()" class="absolute right-2 top-1/2 transform -translate-y-1/2 bg-thai-red text-white p-2 rounded-full hover:bg-red-600 transition-colors duration-200">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 워킹걸 리스트 -->
        <div class="container mx-auto px-4 py-8">
            <div id="working-girls-list" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <!-- 워킹걸 카드들이 동적으로 로드됩니다 -->
            </div>
            
            <!-- 로딩 표시 -->
            <div id="loading" class="text-center py-8">
                <i class="fas fa-spinner fa-spin text-2xl text-gray-500"></i>
                <p class="text-gray-500 mt-2">데이터를 불러오는 중...</p>
            </div>

            <!-- 데이터 없음 표시 -->
            <div id="no-data" class="text-center py-8 hidden">
                <i class="fas fa-search text-4xl text-gray-400 mb-4"></i>
                <p class="text-gray-500 text-lg">검색 결과가 없습니다.</p>
            </div>
        </div>

        <!-- 모달 컨테이너 -->
        <div id="modal-container"></div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
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
      WHERE (
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
      code: formData.get('code'),
      is_active: formData.get('is_active') === 'true'
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
        line_id, kakao_id, phone, code, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userData.user_id, userData.password, userData.nickname, userData.age,
      userData.height, userData.weight, userData.gender, userData.region,
      userData.line_id, userData.kakao_id, userData.phone, userData.code,
      userData.is_active
    ).run()

    const workingGirlId = insertResult.meta.last_row_id

    // 사진 파일 처리 - Base64 인코딩으로 실제 파일 저장
    const photos = formData.getAll('photos')
    if (photos && photos.length > 0) {
      for (let i = 0; i < Math.min(photos.length, 10); i++) {
        const photo = photos[i] as File
        
        if (photo && photo.size > 0) {
          try {
            // 파일 크기 체크 (5MB)
            if (photo.size > 5 * 1024 * 1024) {
              console.warn(`Photo ${i} too large: ${photo.size} bytes`)
              continue
            }
            
            // MIME 타입 체크
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
            if (!allowedTypes.includes(photo.type)) {
              console.warn(`Photo ${i} invalid type: ${photo.type}`)
              continue
            }
            
            // Base64 변환 (Web API 사용 - 더 안전함)
            const arrayBuffer = await photo.arrayBuffer()
            const bytes = new Uint8Array(arrayBuffer)
            
            // 바이너리를 Base64로 안전하게 변환
            let binary = '';
            const len = bytes.byteLength;
            for (let j = 0; j < len; j++) {
              binary += String.fromCharCode(bytes[j]);
            }
            const base64 = btoa(binary)
            const photoUrl = `data:${photo.type};base64,${base64}`
            const isMain = i === 0
            
            await env.DB.prepare(`
              INSERT INTO working_girl_photos (working_girl_id, photo_url, is_main, upload_order)
              VALUES (?, ?, ?, ?)
            `).bind(workingGirlId, photoUrl, isMain, i + 1).run()

            if (isMain) {
              await env.DB.prepare(`
                UPDATE working_girls SET main_photo = ? WHERE id = ?
              `).bind(photoUrl, workingGirlId).run()
            }
            
            console.log(`Photo ${i} processed successfully: ${photo.size} bytes`)
          } catch (photoError) {
            console.error(`Error processing photo ${i}:`, photoError)
          }
        }
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
// 워킹걸 프로필 조회 API 추가
app.get('/api/working-girl/profile', async (c) => {
  const { env } = c
  
  try {
    // 세션에서 사용자 정보 가져오기
    const sessionToken = c.req.header('Authorization')?.replace('Bearer ', '') ||
                        c.req.query('session_token')
    
    if (!sessionToken) {
      return c.json({ success: false, message: '로그인이 필요합니다.' }, 401)
    }
    
    // 세션 검증
    const session = await env.DB.prepare(`
      SELECT s.user_id, s.user_type FROM sessions s 
      WHERE s.session_token = ? AND s.expires_at > CURRENT_TIMESTAMP AND s.user_type = 'working_girl'
    `).bind(sessionToken).first()
    
    if (!session) {
      return c.json({ success: false, message: '유효하지 않은 세션입니다.' }, 401)
    }
    
    // 워킹걸 정보 조회
    const workingGirl = await env.DB.prepare(`
      SELECT id, user_id, nickname, age, height, weight, gender, region, 
             line_id, kakao_id, phone, code, main_photo, is_active, is_recommended
      FROM working_girls WHERE id = ?
    `).bind(session.user_id).first()
    
    if (!workingGirl) {
      return c.json({ success: false, message: '사용자를 찾을 수 없습니다.' }, 404)
    }
    
    // 사진들 조회
    const photos = await env.DB.prepare(`
      SELECT id, photo_url, is_main, upload_order
      FROM working_girl_photos 
      WHERE working_girl_id = ?
      ORDER BY upload_order ASC
    `).bind(session.user_id).all()
    
    return c.json({
      success: true,
      profile: {
        ...workingGirl,
        photos: photos.results || []
      }
    })
    
  } catch (error) {
    console.error('Get profile error:', error)
    return c.json({ success: false, message: '프로필 조회에 실패했습니다.' }, 500)
  }
})

// 워킹걸 프로필 업데이트 API 추가
app.post('/api/working-girl/update-profile', async (c) => {
  const { env } = c

  try {
    // 세션에서 사용자 정보 가져오기
    const sessionToken = c.req.header('Authorization')?.replace('Bearer ', '')
    
    if (!sessionToken) {
      return c.json({ success: false, message: '로그인이 필요합니다.' }, 401)
    }
    
    // 세션 검증
    const session = await env.DB.prepare(`
      SELECT s.user_id FROM sessions s 
      WHERE s.session_token = ? AND s.expires_at > CURRENT_TIMESTAMP AND s.user_type = 'working_girl'
    `).bind(sessionToken).first()
    
    if (!session) {
      return c.json({ success: false, message: '유효하지 않은 세션입니다.' }, 401)
    }

    const formData = await c.req.formData()
    const workingGirlId = session.user_id

    // 기본 정보 업데이트
    const userData = {
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

    // 워킹걸 기본 정보 업데이트
    await env.DB.prepare(`
      UPDATE working_girls SET
        nickname = ?, age = ?, height = ?, weight = ?, gender = ?, region = ?,
        line_id = ?, kakao_id = ?, phone = ?, code = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      userData.nickname, userData.age, userData.height, userData.weight,
      userData.gender, userData.region, userData.line_id, userData.kakao_id,
      userData.phone, userData.code, workingGirlId
    ).run()

    // 새 사진들이 업로드된 경우에만 기존 사진들 삭제 후 처리
    const photos = formData.getAll('photos')
    if (photos && photos.length > 0) {
      await env.DB.prepare(`
        DELETE FROM working_girl_photos WHERE working_girl_id = ?
      `).bind(workingGirlId).run()

      // 새 사진들 처리 - Base64 인코딩
      for (let i = 0; i < Math.min(photos.length, 10); i++) {
        const photo = photos[i] as File
        
        if (photo && photo.size > 0) {
          try {
            // 파일 크기 체크 (5MB)
            if (photo.size > 5 * 1024 * 1024) {
              console.warn(`Photo ${i} too large: ${photo.size} bytes`)
              continue
            }
            
            // MIME 타입 체크
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
            if (!allowedTypes.includes(photo.type)) {
              console.warn(`Photo ${i} invalid type: ${photo.type}`)
              continue
            }
            
            // Base64 변환 (Web API 사용 - 더 안전함)
            const arrayBuffer = await photo.arrayBuffer()
            const bytes = new Uint8Array(arrayBuffer)
            
            // 바이너리를 Base64로 안전하게 변환
            let binary = '';
            const len = bytes.byteLength;
            for (let j = 0; j < len; j++) {
              binary += String.fromCharCode(bytes[j]);
            }
            const base64 = btoa(binary)
            const photoUrl = `data:${photo.type};base64,${base64}`
            const isMain = i === 0
            
            await env.DB.prepare(`
              INSERT INTO working_girl_photos (working_girl_id, photo_url, is_main, upload_order)
              VALUES (?, ?, ?, ?)
            `).bind(workingGirlId, photoUrl, isMain, i + 1).run()

            if (isMain) {
              await env.DB.prepare(`
                UPDATE working_girls SET main_photo = ? WHERE id = ?
              `).bind(photoUrl, workingGirlId).run()
            }
            
            console.log(`Profile photo ${i} updated successfully: ${photo.size} bytes`)
          } catch (photoError) {
            console.error(`Error updating photo ${i}:`, photoError)
          }
        }
      }
    }

    return c.json({ success: true, message: '프로필이 업데이트되었습니다.' })
  } catch (error) {
    console.error('Profile update error:', error)
    return c.json({ success: false, message: '프로필 업데이트에 실패했습니다.' }, 500)
  }
})

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

              <!-- 광고 관리 섹션 -->
              <div class="bg-white rounded-lg shadow-md p-6 mt-8">
                  <h2 class="text-xl font-bold mb-4">광고 관리</h2>
                  
                  <!-- 광고 업로드 -->
                  <div class="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                      <input type="file" id="ad-upload" accept="image/*" class="mb-2">
                      <button onclick="uploadAdvertisement()" 
                              class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
                          <i class="fas fa-upload mr-2"></i>광고 업로드
                      </button>
                  </div>

                  <!-- 현재 광고 리스트 -->
                  <div id="advertisements-list">
                      <!-- 동적으로 로드됩니다 -->
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

export default app
