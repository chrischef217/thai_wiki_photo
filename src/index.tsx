import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import type { Bindings } from './types'

const app = new Hono<{ Bindings: Bindings }>()

// CORS 설정
app.use('/api/*', cors())

// 정적 파일 서빙
app.use('/static/*', serveStatic({ root: './public' }))

// 데이터베이스 초기화 API (모든 샘플 데이터 삭제)
app.get('/clean-database', async (c) => {
  const { env } = c
  
  if (!env.DB) {
    return c.text('데이터베이스 연결 실패', 500)
  }
  
  try {
    let output = '<h1>🧹 데이터베이스 정리</h1>'
    
    // 1. 워킹걸 데이터 삭제
    const workingGirlsResult = await env.DB.prepare(`DELETE FROM working_girls`).run()
    output += `<p>🗑️ 워킹걸 데이터 삭제: ${workingGirlsResult.changes}건</p>`
    
    // 2. 워킹걸 사진 데이터 삭제
    const photosResult = await env.DB.prepare(`DELETE FROM working_girl_photos`).run()
    output += `<p>🖼️ 사진 데이터 삭제: ${photosResult.changes}건</p>`
    
    // 3. 광고 데이터 삭제
    const adsResult = await env.DB.prepare(`DELETE FROM advertisements`).run()
    output += `<p>📢 광고 데이터 삭제: ${adsResult.changes}건</p>`
    
    // 4. 세션 데이터 삭제 (로그인 세션 정리)
    const sessionsResult = await env.DB.prepare(`DELETE FROM sessions`).run()
    output += `<p>🔐 세션 데이터 삭제: ${sessionsResult.changes}건</p>`
    
    // 5. 테이블 상태 확인
    const workingGirlsCount = await env.DB.prepare(`SELECT COUNT(*) as count FROM working_girls`).first()
    const photosCount = await env.DB.prepare(`SELECT COUNT(*) as count FROM working_girl_photos`).first()
    const adsCount = await env.DB.prepare(`SELECT COUNT(*) as count FROM advertisements`).first()
    const adminsCount = await env.DB.prepare(`SELECT COUNT(*) as count FROM admins`).first()
    
    output += '<br><h2>📊 정리 후 상태</h2>'
    output += `<p>워킹걸: ${workingGirlsCount.count}건</p>`
    output += `<p>사진: ${photosCount.count}건</p>`
    output += `<p>광고: ${adsCount.count}건</p>`
    output += `<p>관리자: ${adminsCount.count}건 (유지됨)</p>`
    
    output += '<br><p style="color: green; font-weight: bold;">✅ 모든 샘플 데이터가 성공적으로 삭제되었습니다!</p>'
    output += '<p>이제 깨끗한 상태에서 실제 데이터를 입력할 수 있습니다.</p>'
    output += '<br><p><a href="/">메인으로 돌아가기</a> | <a href="/admin">관리자 페이지</a></p>'
    
    return c.html(output)
    
  } catch (error) {
    return c.text(`데이터 삭제 에러: ${error.message}`, 500)
  }
})

// 관리자 계정 디버깅 및 수정 API
app.get('/setup-admin', async (c) => {
  const { env } = c
  
  if (!env.DB) {
    return c.text('데이터베이스 연결 실패', 500)
  }
  
  try {
    let output = '<h1>관리자 계정 디버깅</h1>'
    
    // 1. 관리자 테이블 생성
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run()
    output += '<p>✅ 관리자 테이블 생성 완료</p>'
    
    // 2. 기존 관리자 계정 조회
    const existingAdmins = await env.DB.prepare(`
      SELECT id, username, password, email, is_active, created_at FROM admins
    `).all()
    output += `<p>📋 기존 관리자 계정들: <br><pre>${JSON.stringify(existingAdmins.results, null, 2)}</pre></p>`
    
    // 3. 기존 관리자 삭제
    await env.DB.prepare(`DELETE FROM admins`).run()
    output += '<p>🗑️ 기존 관리자 계정 모두 삭제</p>'
    
    // 4. 여러 비밀번호로 관리자 계정 생성
    const passwords = ['1127', 'admin', '123456', 'password']
    for (let i = 0; i < passwords.length; i++) {
      const username = i === 0 ? 'admin' : `admin${i+1}`
      const password = passwords[i]
      
      await env.DB.prepare(`
        INSERT INTO admins (username, password, email, is_active) 
        VALUES (?, ?, ?, 1)
      `).bind(username, password, `${username}@thai-wiki.com`).run()
      
      output += `<p>➕ 생성: ${username} / ${password}</p>`
    }
    
    // 5. 생성된 계정 확인
    const newAdmins = await env.DB.prepare(`
      SELECT id, username, password, email, is_active, created_at FROM admins
    `).all()
    output += `<p>✅ 생성된 관리자 계정들: <br><pre>${JSON.stringify(newAdmins.results, null, 2)}</pre></p>`
    
    // 6. 로그인 테스트
    output += '<h2>🧪 로그인 테스트</h2>'
    for (const admin of newAdmins.results) {
      try {
        const testLogin = await env.DB.prepare(`
          SELECT id, username, email, is_active, created_at 
          FROM admins WHERE username = ? AND password = ?
        `).bind(admin.username, admin.password).first()
        
        if (testLogin) {
          output += `<p style="color: green;">✅ ${admin.username}/${admin.password} - 로그인 성공</p>`
        } else {
          output += `<p style="color: red;">❌ ${admin.username}/${admin.password} - 로그인 실패</p>`
        }
      } catch (error) {
        output += `<p style="color: red;">💥 ${admin.username}/${admin.password} - 에러: ${error.message}</p>`
      }
    }
    
    output += '<br><p><a href="/">메인으로 돌아가기</a></p>'
    
    return c.html(output)
    
  } catch (error) {
    return c.text(`전체 에러: ${error.message}`, 500)
  }
})

// 디버깅 페이지
app.get('/debug', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head><title>Debug</title></head>
    <body>
      <h1>Debug Page</h1>
      <div id="result">Loading...</div>
      <script>
        console.log('Debug script loaded');
        document.getElementById('result').innerHTML = 'JavaScript working!';
        
        fetch('/api/working-girls')
          .then(res => res.json())
          .then(data => {
            console.log('API data:', data);
            document.getElementById('result').innerHTML = 
              'API works! Found ' + (data.working_girls ? data.working_girls.length : 0) + ' working girls';
          })
          .catch(err => {
            console.error('API error:', err);
            document.getElementById('result').innerHTML = 'API error: ' + err.message;
          });
      </script>
    </body>
    </html>
  `)
})

// 메인 페이지
app.get('/', async (c) => {
  const { env } = c
  const timestamp = Date.now()

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
          management_code TEXT NOT NULL,
          agency TEXT,
          conditions TEXT,
          main_photo TEXT,
          is_active BOOLEAN DEFAULT 1,
          is_recommended BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run()

      // 기존 테이블에 새 컬럼 추가 (이미 테이블이 존재하는 경우)
      try {
        await env.DB.prepare(`ALTER TABLE working_girls ADD COLUMN management_code TEXT`).run()
      } catch (e) {
        // 컬럼이 이미 존재하는 경우 무시
      }
      
      try {
        await env.DB.prepare(`ALTER TABLE working_girls ADD COLUMN agency TEXT`).run()
      } catch (e) {
        // 컬럼이 이미 존재하는 경우 무시
      }
      
      try {
        await env.DB.prepare(`ALTER TABLE working_girls ADD COLUMN fee TEXT`).run()
      } catch (e) {
        // 컬럼이 이미 존재하는 경우 무시
      }
      
      // 기존 code 컬럼 데이터를 management_code로 복사 (한 번만 실행)
      try {
        await env.DB.prepare(`UPDATE working_girls SET management_code = code WHERE management_code IS NULL AND code IS NOT NULL`).run()
      } catch (e) {
        // 에러 무시
      }

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
          email TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run()
      
      // 기존 관리자 테이블에 누락된 컬럼 추가
      try {
        await env.DB.prepare(`ALTER TABLE admins ADD COLUMN email TEXT`).run()
      } catch (e) {
        // 컬럼이 이미 존재하는 경우 무시
      }
      
      try {
        await env.DB.prepare(`ALTER TABLE admins ADD COLUMN is_active BOOLEAN DEFAULT 1`).run()
      } catch (e) {
        // 컬럼이 이미 존재하는 경우 무시
      }
      
      try {
        await env.DB.prepare(`ALTER TABLE admins ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`).run()
      } catch (e) {
        // 컬럼이 이미 존재하는 경우 무시
      }

      // 광고 테이블 생성
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS advertisements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          image_url TEXT NOT NULL,
          title TEXT,
          link_url TEXT,
          display_order INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run()

      // 기존 테이블에 link_url 컬럼 추가 (이미 테이블이 존재하는 경우)
      try {
        await env.DB.prepare(`ALTER TABLE advertisements ADD COLUMN link_url TEXT`).run()
      } catch (e) {
        // 컬럼이 이미 존재하는 경우 무시
      }

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
        INSERT OR IGNORE INTO admins (username, password, email, is_active) 
        VALUES ('admin', '1127', 'admin@thai-wiki.com', 1)
      `).run()

      // 테스트 데이터 삽입 제거됨 - 운영 환경에서는 테스트 데이터를 자동 생성하지 않음

      // 테스트 광고 데이터는 제거 (파일이 없어서 404 오류 발생)

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

// 워킹걸 리스트 조회 (최적화된 버전)
app.get('/api/working-girls', async (c) => {
  const { env } = c

  try {
    console.log('Main page working girls request received')
    
    if (!env.DB) {
      console.error('Database connection not available')
      return c.json({ success: false, error: '데이터베이스 연결 오류' }, 500)
    }

    // 페이지네이션 파라미터
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '20')
    const offset = (page - 1) * limit
    
    console.log('Pagination params - page:', page, 'limit:', limit, 'offset:', offset)
    
    // 워킹걸 기본 정보 조회 (VIP -> 추천 -> 일반 순서로 정렬)
    const girlsResult = await env.DB.prepare(`
      SELECT id, user_id, nickname, age, height, weight, gender, region, 
             line_id, kakao_id, phone, management_code, agency, fee, 
             main_photo, is_active, is_recommended, is_vip, created_at, updated_at
      FROM working_girls 
      WHERE is_active = 1
      ORDER BY is_vip DESC, is_recommended DESC, created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all()
    
    console.log('Working girls query completed, count:', girlsResult?.results?.length || 0)

    const workingGirlsData = girlsResult.results || []
    
    if (workingGirlsData.length === 0) {
      return c.json({ success: true, working_girls: [] })
    }

    // 모든 워킹걸의 사진을 한 번에 조회 (성능 최적화)
    const workingGirlIds = workingGirlsData.map(girl => girl.id)
    const placeholders = workingGirlIds.map(() => '?').join(',')
    
    const photosResult = await env.DB.prepare(`
      SELECT working_girl_id, id, photo_url, is_main, upload_order 
      FROM working_girl_photos 
      WHERE working_girl_id IN (${placeholders})
      ORDER BY working_girl_id, upload_order ASC
    `).bind(...workingGirlIds).all()
    
    console.log('Photos query completed, count:', photosResult?.results?.length || 0)

    // 사진들을 working_girl_id별로 그룹화
    const photosMap = {}
    for (const photo of (photosResult.results || [])) {
      if (!photosMap[photo.working_girl_id]) {
        photosMap[photo.working_girl_id] = []
      }
      photosMap[photo.working_girl_id].push({
        id: photo.id,
        photo_url: photo.photo_url,
        is_main: photo.is_main,
        upload_order: photo.upload_order
      })
    }

    // 최종 데이터 조합
    const workingGirls = workingGirlsData.map(girl => ({
      ...girl,
      photos: photosMap[girl.id] || []
    }))
    
    console.log(`Returning ${workingGirls.length} working girls to main page (page ${page})`)

    return c.json({ 
      success: true, 
      working_girls: workingGirls,
      pagination: {
        page: page,
        limit: limit,
        count: workingGirls.length,
        hasMore: workingGirls.length === limit
      }
    })
  } catch (error) {
    console.error('Main page database error:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    })
    return c.json({ success: false, error: `데이터베이스 오류: ${error.message}` }, 500)
  }
})

// 워킹걸 검색 (최적화된 버전)
app.get('/api/working-girls/search', async (c) => {
  const { env } = c
  const query = c.req.query('q') || ''

  try {
    console.log('Search request received, query:', query)
    
    if (!env.DB) {
      return c.json({ success: false, error: '데이터베이스 연결 오류' }, 500)
    }

    // 페이지네이션 파라미터
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '20')
    const offset = (page - 1) * limit
    
    const searchPattern = `%${query}%`
    const girlsResult = await env.DB.prepare(`
      SELECT id, user_id, nickname, age, height, weight, gender, region, 
             line_id, kakao_id, phone, management_code, agency, fee, 
             main_photo, is_active, is_recommended, is_vip, created_at, updated_at
      FROM working_girls 
      WHERE is_active = 1 AND (
        nickname LIKE ? OR
        region LIKE ? OR
        gender LIKE ? OR
        management_code LIKE ? OR
        CAST(age AS TEXT) LIKE ?
      )
      ORDER BY is_vip DESC, is_recommended DESC, created_at DESC
      LIMIT ? OFFSET ?
    `).bind(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, limit, offset).all()
    
    console.log('Search query completed, count:', girlsResult?.results?.length || 0)

    const workingGirlsData = girlsResult.results || []
    
    if (workingGirlsData.length === 0) {
      return c.json({ success: true, working_girls: [] })
    }

    // 모든 검색 결과의 사진을 한 번에 조회
    const workingGirlIds = workingGirlsData.map(girl => girl.id)
    const placeholders = workingGirlIds.map(() => '?').join(',')
    
    const photosResult = await env.DB.prepare(`
      SELECT working_girl_id, id, photo_url, is_main, upload_order 
      FROM working_girl_photos 
      WHERE working_girl_id IN (${placeholders})
      ORDER BY working_girl_id, upload_order ASC
    `).bind(...workingGirlIds).all()

    // 사진들을 working_girl_id별로 그룹화
    const photosMap = {}
    for (const photo of (photosResult.results || [])) {
      if (!photosMap[photo.working_girl_id]) {
        photosMap[photo.working_girl_id] = []
      }
      photosMap[photo.working_girl_id].push({
        id: photo.id,
        photo_url: photo.photo_url,
        is_main: photo.is_main,
        upload_order: photo.upload_order
      })
    }

    // 최종 데이터 조합
    const workingGirls = workingGirlsData.map(girl => ({
      ...girl,
      photos: photosMap[girl.id] || []
    }))
    
    console.log(`Returning ${workingGirls.length} search results (page ${page})`)

    return c.json({ 
      success: true, 
      working_girls: workingGirls,
      pagination: {
        page: page,
        limit: limit,
        count: workingGirls.length,
        hasMore: workingGirls.length === limit
      }
    })
  } catch (error) {
    console.error('Search database error:', error)
    return c.json({ success: false, error: `검색 오류: ${error.message}` }, 500)
  }
})

// 워킹걸 상세 조회
app.get('/api/working-girls/:id', async (c) => {
  const { env } = c
  const workingGirlId = c.req.param('id')

  try {
    const girlResult = await env.DB.prepare(`
      SELECT id, user_id, nickname, age, height, weight, gender, region, 
             line_id, kakao_id, phone, management_code, agency, 
             main_photo, is_active, is_recommended, is_vip, created_at, updated_at
      FROM working_girls WHERE id = ?
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
      management_code: formData.get('management_code'),
      conditions: formData.get('conditions'),
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
        line_id, kakao_id, phone, management_code, conditions, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userData.user_id, userData.password, userData.nickname, userData.age,
      userData.height, userData.weight, userData.gender, userData.region,
      userData.line_id, userData.kakao_id, userData.phone, userData.management_code,
      userData.conditions, userData.is_active
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
            
            // Base64 변환 - 완전히 안전한 방식으로 처리
            const arrayBuffer = await photo.arrayBuffer()
            const bytes = new Uint8Array(arrayBuffer)
            
            // 바이너리 데이터를 문자열로 안전하게 변환
            let binaryString = ''
            
            // 작은 청크 단위로 안전하게 처리 (스택 오버플로우 방지)
            for (let k = 0; k < bytes.length; k += 1024) {
              const chunk = bytes.subarray(k, Math.min(k + 1024, bytes.length))
              let chunkString = ''
              for (let i = 0; i < chunk.length; i++) {
                chunkString += String.fromCharCode(chunk[i])
              }
              binaryString += chunkString
            }
            
            // 전체 바이너리 문자열을 Base64로 변환
            const base64 = btoa(binaryString)
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
      SELECT id, user_id, nickname, age, height, weight, gender, region, 
             line_id, kakao_id, phone, management_code, agency, 
             main_photo, is_active, is_recommended, is_vip, created_at, updated_at
      FROM working_girls WHERE user_id = ? AND password = ?
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
      SELECT id, username, email, is_active, created_at 
      FROM admins WHERE username = ? AND password = ?
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
        SELECT id, user_id, nickname, age, height, weight, gender, region, 
               line_id, kakao_id, phone, management_code, agency, conditions, 
               main_photo, is_active, is_recommended, is_vip, created_at, updated_at
        FROM working_girls WHERE id = ?
      `).bind(session.user_id).first()
    } else if (session.user_type === 'admin') {
      user = await env.DB.prepare(`
        SELECT id, username, email, is_active, created_at
        FROM admins WHERE id = ?
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
             line_id, kakao_id, phone, management_code, conditions, main_photo, is_active, is_recommended, is_vip
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
    console.log('Profile update request received')
    const contentType = c.req.header('content-type') || ''
    console.log('Request Content-Type:', contentType)
    
    let sessionToken, userData, photos = []
    
    if (contentType.includes('application/json')) {
      // JSON 요청 처리
      console.log('Processing JSON request')
      const jsonData = await c.req.json()
      console.log('JSON data:', jsonData)
      
      sessionToken = jsonData.session_token
      userData = {
        nickname: jsonData.nickname,
        age: jsonData.age,
        height: jsonData.height,
        weight: jsonData.weight,
        gender: jsonData.gender,
        region: jsonData.region,
        line_id: jsonData.line_id,
        kakao_id: jsonData.kakao_id,
        phone: jsonData.phone,
        management_code: jsonData.management_code,
        conditions: jsonData.conditions,
        is_active: jsonData.is_active
      }
      
      if (jsonData.password) {
        userData.password = jsonData.password
      }
    } else {
      // FormData 요청 처리 (사진 업로드용)
      console.log('Processing FormData request')
      const formData = await c.req.formData()
      console.log('FormData keys:', Array.from(formData.keys()))
      
      sessionToken = formData.get('session_token')
      userData = {
        nickname: formData.get('nickname'),
        age: parseInt(formData.get('age')),
        height: parseInt(formData.get('height')),
        weight: parseInt(formData.get('weight')),
        gender: formData.get('gender'),
        region: formData.get('region'),
        line_id: formData.get('line_id'),
        kakao_id: formData.get('kakao_id'),
        phone: formData.get('phone'),
        management_code: formData.get('management_code'),
        conditions: formData.get('conditions'),
        is_active: formData.get('is_active') === 'true'
      }
      
      const newPassword = formData.get('password')
      if (newPassword && newPassword.trim() !== '') {
        userData.password = newPassword
      }
      
      // 사진 파일 처리
      photos = formData.getAll('photos')
    }
    
    console.log('Session token:', sessionToken ? 'exists' : 'missing')
    console.log('User data:', userData)
    
    if (!sessionToken) {
      console.log('No session token provided')
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

    const workingGirlId = session.user_id

    // 비밀번호가 제공된 경우 비밀번호도 업데이트
    const newPassword = userData.password
    let updateQuery, updateParams
    
    if (newPassword && newPassword.trim() !== '') {
      // 비밀번호 포함 업데이트
      updateQuery = `
        UPDATE working_girls SET
          nickname = ?, age = ?, height = ?, weight = ?, gender = ?, region = ?,
          line_id = ?, kakao_id = ?, phone = ?, management_code = ?, conditions = ?, password = ?, is_active = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      updateParams = [
        userData.nickname, userData.age, userData.height, userData.weight,
        userData.gender, userData.region, userData.line_id, userData.kakao_id,
        userData.phone, userData.management_code, userData.conditions, newPassword, userData.is_active, workingGirlId
      ]
    } else {
      // 비밀번호 제외 업데이트
      updateQuery = `
        UPDATE working_girls SET
          nickname = ?, age = ?, height = ?, weight = ?, gender = ?, region = ?,
          line_id = ?, kakao_id = ?, phone = ?, management_code = ?, conditions = ?, is_active = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      updateParams = [
        userData.nickname, userData.age, userData.height, userData.weight,
        userData.gender, userData.region, userData.line_id, userData.kakao_id,
        userData.phone, userData.management_code, userData.conditions, userData.is_active, workingGirlId
      ]
    }

    // 워킹걸 기본 정보 업데이트 실행
    await env.DB.prepare(updateQuery).bind(...updateParams).run()

    // 새 사진들이 업로드된 경우에만 기존 사진들 삭제 후 처리
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
            
            // Base64 변환 - 완전히 안전한 방식으로 처리
            const arrayBuffer = await photo.arrayBuffer()
            const bytes = new Uint8Array(arrayBuffer)
            
            // 바이너리 데이터를 문자열로 안전하게 변환
            let binaryString = ''
            
            // 작은 청크 단위로 안전하게 처리 (스택 오버플로우 방지)
            for (let k = 0; k < bytes.length; k += 1024) {
              const chunk = bytes.subarray(k, Math.min(k + 1024, bytes.length))
              let chunkString = ''
              for (let i = 0; i < chunk.length; i++) {
                chunkString += String.fromCharCode(chunk[i])
              }
              binaryString += chunkString
            }
            
            // 전체 바이너리 문자열을 Base64로 변환
            const base64 = btoa(binaryString)
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

    console.log('Profile update completed successfully')
    return c.json({ success: true, message: '프로필이 업데이트되었습니다.' })
  } catch (error) {
    console.error('Profile update error:', error)
    console.error('Error stack:', error.stack)
    console.error('Error message:', error.message)
    return c.json({ success: false, message: '프로필 업데이트에 실패했습니다.', error: error.message }, 500)
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

// 관리자 로그인 페이지
app.get('/admin/login', async (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>관리자 로그인 - 타이위키</title>
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
    </head>
    <body class="bg-gray-50 min-h-screen flex items-center justify-center">
        <div class="max-w-md w-full space-y-8">
            <div>
                <div class="mx-auto h-12 w-12 bg-thai-red rounded-full flex items-center justify-center">
                    <i class="fas fa-user-shield text-white"></i>
                </div>
                <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">관리자 로그인</h2>
                <p class="mt-2 text-center text-sm text-gray-600">타이위키 관리 시스템</p>
            </div>
            <form class="mt-8 space-y-6" onsubmit="handleAdminLogin(event)">
                <div class="rounded-md shadow-sm -space-y-px">
                    <div>
                        <input type="text" name="username" id="username" required 
                               class="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-thai-red focus:border-thai-red focus:z-10 sm:text-sm" 
                               placeholder="관리자 아이디">
                    </div>
                    <div>
                        <input type="password" name="password" id="password" required 
                               class="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-thai-red focus:border-thai-red focus:z-10 sm:text-sm" 
                               placeholder="비밀번호">
                    </div>
                </div>

                <div>
                    <button type="submit" 
                            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-thai-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-thai-red">
                        <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                            <i class="fas fa-lock group-hover:text-red-200 text-red-300"></i>
                        </span>
                        로그인
                    </button>
                </div>
            </form>
            
            <div id="login-message" class="text-center text-sm hidden"></div>
        </div>

        <script>
            async function handleAdminLogin(event) {
                event.preventDefault();
                
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                const messageDiv = document.getElementById('login-message');
                
                try {
                    const response = await fetch('/api/auth/admin/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ username, password })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        localStorage.setItem('admin_session_token', data.session_token);
                        localStorage.setItem('admin_user', JSON.stringify(data.user));
                        messageDiv.className = 'text-center text-sm text-green-600';
                        messageDiv.textContent = '로그인 성공! 관리자 페이지로 이동합니다...';
                        messageDiv.classList.remove('hidden');
                        
                        setTimeout(() => {
                            window.location.href = '/admin';
                        }, 1000);
                    } else {
                        messageDiv.className = 'text-center text-sm text-red-600';
                        messageDiv.textContent = data.message || '로그인에 실패했습니다.';
                        messageDiv.classList.remove('hidden');
                    }
                } catch (error) {
                    console.error('Login error:', error);
                    messageDiv.className = 'text-center text-sm text-red-600';
                    messageDiv.textContent = '로그인 중 오류가 발생했습니다.';
                    messageDiv.classList.remove('hidden');
                }
            }
        </script>
    </body>
    </html>
  `)
})

// 관리자 페이지
app.get('/admin', async (c) => {
  const { env } = c

  // TODO: 관리자 세션 검증 추가 필요

  try {
    // 대시보드 통계 조회 (간소화)
    let stats = [
      { count: 0 }, { count: 0 }, { count: 0 }, 
      { count: 0 }, { count: 0 }, { count: 0 }, { count: 0 }
    ];

    try {
      stats = await Promise.all([
        env.DB.prepare(`SELECT COUNT(*) as count FROM working_girls`).first(),
        env.DB.prepare(`SELECT COUNT(*) as count FROM working_girls WHERE is_active = 1`).first(),
        env.DB.prepare(`SELECT COUNT(*) as count FROM working_girls WHERE is_vip = 1`).first(),
        env.DB.prepare(`SELECT COUNT(*) as count FROM working_girls WHERE is_recommended = 1`).first(),
        env.DB.prepare(`SELECT COUNT(*) as count FROM working_girls WHERE region = '방콕'`).first(),
        env.DB.prepare(`SELECT COUNT(*) as count FROM working_girls WHERE region = '파타야'`).first(),
        env.DB.prepare(`SELECT COUNT(*) as count FROM working_girls WHERE region = '치앙마이'`).first(),
        env.DB.prepare(`SELECT COUNT(*) as count FROM working_girls WHERE region = '푸켓'`).first()
      ]);
    } catch (error) {
      console.error('Stats query error:', error);
      // 기본값 사용
    }

    return c.html(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>타이위키 관리자</title>
          <script src="https://cdn.tailwindcss.com"></script>
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
                      <i class="fas fa-crown text-3xl text-yellow-500 mb-2"></i>
                      <h3 class="text-xl font-bold">${stats[2].count}</h3>
                      <p class="text-gray-600">VIP 워킹걸</p>
                  </div>
                  <div class="bg-white p-6 rounded-lg shadow-md text-center">
                      <i class="fas fa-star text-3xl text-blue-500 mb-2"></i>
                      <h3 class="text-xl font-bold">${stats[3].count}</h3>
                      <p class="text-gray-600">추천 워킹걸</p>
                  </div>
                  <div class="bg-white p-6 rounded-lg shadow-md text-center">
                      <i class="fas fa-map-marker-alt text-3xl text-red-500 mb-2"></i>
                      <h3 class="text-xl font-bold">${stats[4].count + stats[5].count + stats[6].count + stats[7].count}</h3>
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
                              class="bg-thai-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center shadow-lg border-2 border-white" style="background-color: #241E7E !important;">
                          <span class="mr-2 text-lg">🔍</span><span class="text-lg font-bold">검색</span>
                      </button>
                  </div>
              </div>

              <!-- 워킹걸 관리 테이블 -->
              <div class="bg-white rounded-lg shadow-md overflow-hidden">
                  <div class="p-6 border-b flex justify-between items-center">
                      <h2 class="text-xl font-bold">워킹걸 관리</h2>
                      <button onclick="showAddWorkingGirlModal()" 
                              class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">
                          <i class="fas fa-plus mr-2"></i>새 워킹걸 등록
                      </button>
                  </div>
                  <div class="overflow-x-auto">
                      <table class="w-full">
                          <thead class="bg-gray-50">
                              <tr>
                                  <th class="px-4 py-3 text-left">에이전시</th>
                                  <th class="px-4 py-3 text-left">관리코드</th>
                                  <th class="px-4 py-3 text-left">VIP</th>
                                  <th class="px-4 py-3 text-left">추천</th>
                                  <th class="px-4 py-3 text-left">거주지역</th>
                                  <th class="px-4 py-3 text-left">아이디</th>
                                  <th class="px-4 py-3 text-left">닉네임</th>
                                  <th class="px-4 py-3 text-left">나이</th>
                                  <th class="px-4 py-3 text-left">키</th>
                                  <th class="px-4 py-3 text-left">몸무게</th>
                                  <th class="px-4 py-3 text-left">성별</th>
                                  <th class="px-4 py-3 text-left">상태</th>
                                  <th class="px-4 py-3 text-left">연락처</th>
                                  <th class="px-4 py-3 text-left">관리</th>
                              </tr>
                          </thead>
                          <tbody id="working-girls-table">
                              <!-- 동적으로 로드됩니다 -->
                          </tbody>
                      </table>
                  </div>
              </div>

              <!-- 워킹걸 등록/수정 모달 -->
              <div id="workingGirlModal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50">
                  <div class="flex items-center justify-center min-h-screen p-4">
                      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
                          <div class="p-6 border-b">
                              <div class="flex justify-between items-center">
                                  <h3 id="modalTitle" class="text-xl font-bold">새 워킹걸 등록</h3>
                                  <button onclick="closeWorkingGirlModal()" class="text-gray-500 hover:text-gray-700">
                                      <i class="fas fa-times text-xl"></i>
                                  </button>
                              </div>
                          </div>
                          
                          <form id="workingGirlForm" class="p-6 space-y-6">
                              <input type="hidden" id="editingWorkingGirlId" value="">
                              
                              <!-- 기본 정보 섹션 -->
                              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                      <label class="block text-sm font-medium mb-2">아이디 *</label>
                                      <input type="text" id="wg_username" name="username" required
                                             class="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
                                  </div>
                                  <div>
                                      <label class="block text-sm font-medium mb-2">닉네임 *</label>
                                      <input type="text" id="wg_nickname" name="nickname" required
                                             class="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
                                  </div>

                                  <div>
                                      <label class="block text-sm font-medium mb-2">관리코드 *</label>
                                      <input type="text" id="wg_management_code" name="management_code" required placeholder="VIP001, GOLD003 등"
                                             class="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
                                  </div>
                                  <div>
                                      <label class="block text-sm font-medium mb-2">에이전시</label>
                                      <input type="text" id="wg_agency" name="agency" placeholder="에이전시명을 입력하세요"
                                             class="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
                                  </div>
                                  <div>
                                      <label class="block text-sm font-medium mb-2">나이</label>
                                      <input type="number" id="wg_age" name="age" min="18" max="60"
                                             class="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
                                  </div>
                                  <div>
                                      <label class="block text-sm font-medium mb-2">성별</label>
                                      <select id="wg_gender" name="gender"
                                              class="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
                                          <option value="female">여성</option>
                                          <option value="male">레이디보이</option>
                                          <option value="trans">트랜스젠더</option>
                                      </select>
                                  </div>
                                  <div>
                                      <label class="block text-sm font-medium mb-2">키 (cm)</label>
                                      <input type="number" id="wg_height" name="height" min="140" max="200"
                                             class="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
                                  </div>
                                  <div>
                                      <label class="block text-sm font-medium mb-2">몸무게 (kg)</label>
                                      <input type="number" id="wg_weight" name="weight" min="40" max="120"
                                             class="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
                                  </div>
                                  <div>
                                      <label class="block text-sm font-medium mb-2">지역 *</label>
                                      <select id="wg_region" name="region" required
                                              class="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
                                          <option value="">지역 선택</option>
                                          <option value="방콕">방콕</option>
                                          <option value="파타야">파타야</option>
                                          <option value="치앙마이">치앙마이</option>
                                          <option value="푸켓">푸켓</option>
                                          <option value="기타">기타</option>
                                      </select>
                                  </div>
                              </div>

                              <!-- 연락처 정보 섹션 -->
                              <div class="border-t pt-6">
                                  <h4 class="text-lg font-medium mb-4">연락처 정보</h4>
                                  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                                      <div>
                                          <label class="block text-sm font-medium mb-2">전화번호</label>
                                          <input type="text" id="wg_phone" name="phone"
                                                 class="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
                                      </div>
                                      <div>
                                          <label class="block text-sm font-medium mb-2">라인 ID</label>
                                          <input type="text" id="wg_line_id" name="line_id"
                                                 class="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
                                      </div>
                                      <div>
                                          <label class="block text-sm font-medium mb-2">카카오톡 ID</label>
                                          <input type="text" id="wg_wechat_id" name="wechat_id"
                                                 class="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
                                      </div>
                                  </div>
                              </div>

                              <!-- 조건 섹션 -->
                              <div class="border-t pt-6">
                                  <h4 class="text-lg font-medium mb-4">조건</h4>
                                  <div class="mb-4">
                                      <label class="block text-sm font-medium mb-2">워킹걸 페이</label>
                                      <textarea id="wg_fee" name="fee" rows="3"
                                                class="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-vertical"
                                                placeholder="워킹걸 페이 정보를 입력해주세요..."></textarea>
                                  </div>
                                  <div>
                                      <label class="block text-sm font-medium mb-2">서비스 조건</label>
                                      <textarea id="wg_conditions" name="conditions" rows="4"
                                                class="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-vertical"
                                                placeholder="서비스 조건을 입력해주세요..."></textarea>
                                  </div>
                              </div>

                              <!-- 설정 섹션 -->
                              <div class="border-t pt-6">
                                  <h4 class="text-lg font-medium mb-4">설정</h4>
                                  
                                  <!-- 등급 선택 (라디오 버튼) -->
                                  <div class="mb-4">
                                      <h5 class="text-md font-medium mb-2">등급 선택</h5>
                                      <div class="flex space-x-4">
                                          <label class="flex items-center space-x-2 cursor-pointer">
                                              <input type="radio" id="wg_grade_normal" name="grade" value="normal" checked
                                                     class="w-4 h-4 text-gray-600 border-gray-300 focus:ring-gray-500">
                                              <span class="text-gray-700 font-medium">📝 일반</span>
                                          </label>
                                          <label class="flex items-center space-x-2 cursor-pointer">
                                              <input type="radio" id="wg_grade_recommended" name="grade" value="recommended"
                                                     class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500">
                                              <span class="text-blue-600 font-medium">⭐ 추천</span>
                                          </label>
                                          <label class="flex items-center space-x-2 cursor-pointer">
                                              <input type="radio" id="wg_grade_vip" name="grade" value="vip"
                                                     class="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500">
                                              <span class="text-yellow-600 font-medium">👑 VIP</span>
                                          </label>
                                      </div>
                                  </div>
                                  
                                  <!-- 활성 상태 -->
                                  <div>
                                      <label class="flex items-center space-x-2 cursor-pointer">
                                          <input type="checkbox" id="wg_is_active" name="is_active" checked
                                                 class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500">
                                          <span class="text-green-600 font-medium">활성 상태</span>
                                      </label>
                                  </div>
                              </div>

                              <!-- 사진 관리 섹션 -->
                              <div class="border-t pt-6">
                                  <h4 class="text-lg font-medium mb-4">사진 관리</h4>
                                  
                                  <!-- 기존 사진 (수정 모드에서만 표시) -->
                                  <div id="existingPhotosSection" class="hidden mb-6">
                                      <h5 class="text-md font-medium mb-3">기존 사진</h5>
                                      <div id="existingPhotosList" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                          <!-- 기존 사진들이 여기에 표시됩니다 -->
                                      </div>
                                  </div>
                                  
                                  <!-- 새 사진 업로드 -->
                                  <div>
                                      <h5 class="text-md font-medium mb-3">새 사진 추가</h5>
                                      <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                          <input type="file" id="photoFiles" multiple accept="image/*" 
                                                 class="hidden" onchange="previewNewPhotos(this)">
                                          <button type="button" onclick="document.getElementById('photoFiles').click()"
                                                  class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg">
                                              <i class="fas fa-camera mr-2"></i>사진 선택 (여러장 가능)
                                          </button>
                                          <p class="text-sm text-gray-500 mt-2">JPG, PNG 파일만 업로드 가능 (최대 5MB)</p>
                                      </div>
                                      
                                      <!-- 새 사진 미리보기 -->
                                      <div id="newPhotosPreview" class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                          <!-- 새 사진 미리보기가 여기에 표시됩니다 -->
                                      </div>
                                  </div>
                              </div>

                              <!-- 버튼 섹션 -->
                              <div class="border-t pt-6 flex justify-end space-x-4">
                                  <button type="button" onclick="closeWorkingGirlModal()"
                                          class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                      취소
                                  </button>
                                  <button type="submit" id="submitBtn"
                                          class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                                      <i class="fas fa-save mr-2"></i>저장
                                  </button>
                              </div>
                          </form>
                      </div>
                  </div>
              </div>

              <!-- 광고 관리 섹션 -->
              <div class="bg-white rounded-lg shadow-md p-6 mt-8">
                  <h2 class="text-xl font-bold mb-4">광고 관리</h2>
                  
                  <!-- 광고 전역 설정 -->
                  <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h3 class="text-lg font-semibold mb-3">📋 광고 전역 설정</h3>
                      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                              <label class="block text-sm font-medium mb-2">기본 스크롤 간격 (초)</label>
                              <input type="number" id="default-scroll-interval" min="1" max="60" value="3" 
                                     class="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
                          </div>
                          <div>
                              <label class="block text-sm font-medium mb-2">최대 우선순위</label>
                              <input type="number" id="max-priority" min="1" max="100" value="10" 
                                     class="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
                          </div>
                          <div>
                              <label class="block text-sm font-medium mb-2">최적 배너 크기</label>
                              <input type="text" id="optimal-banner-size" value="1200x300px" readonly
                                     class="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">
                          </div>
                      </div>
                      <button onclick="updateAdSettings()" 
                              class="mt-3 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                          <i class="fas fa-save mr-2"></i>설정 저장
                      </button>
                  </div>
                  
                  <!-- 광고 업로드 -->
                  <div class="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                      <h3 class="text-lg font-semibold mb-3">📢 새 광고 업로드</h3>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                              <label class="block text-sm font-medium mb-2">광고 제목 (선택사항)</label>
                              <input type="text" id="ad-title" placeholder="광고 제목을 입력하세요" 
                                     class="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
                          </div>
                          <div>
                              <label class="block text-sm font-medium mb-2">링크 URL (선택사항)</label>
                              <input type="url" id="ad-link" placeholder="https://example.com" 
                                     class="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
                              <p class="text-xs text-gray-500 mt-1">광고 클릭 시 이동할 페이지 주소</p>
                          </div>
                      </div>
                      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div>
                              <label class="block text-sm font-medium mb-2">우선순위 (1-10)</label>
                              <input type="number" id="ad-priority" min="1" max="10" value="5" 
                                     class="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
                          </div>
                          <div>
                              <label class="block text-sm font-medium mb-2">스크롤 시간 (초)</label>
                              <input type="number" id="ad-scroll-time" min="1" max="60" value="3" 
                                     class="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
                          </div>
                          <div>
                              <label class="block text-sm font-medium mb-2">광고 기간</label>
                              <select id="ad-duration" 
                                      class="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
                                  <option value="">기간 제한 없음</option>
                                  <option value="2주일">2주일</option>
                                  <option value="1달">1달</option>
                                  <option value="1년">1년</option>
                              </select>
                          </div>
                      </div>
                      <div class="mb-3">
                          <label class="block text-sm font-medium mb-2">
                              광고 이미지 * 
                              <span class="text-blue-600 font-medium ml-2">
                                  (최적 크기: <span id="optimal-size-display">1200x300px</span>)
                              </span>
                          </label>
                          <input type="file" id="ad-upload" accept="image/*" 
                                 class="w-full p-2 border border-gray-300 rounded-lg">
                          <p class="text-xs text-gray-500 mt-1">최대 10MB, 이미지 파일만 업로드 가능</p>
                      </div>
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
          <script src="/static/admin-photo-v2.js"></script>
      </body>
      </html>
    `)
  } catch (error) {
    console.error('Admin page error:', error)
    return c.text('Internal Server Error', 500)
  }
})

// 데이터베이스 연결 테스트 API
app.get('/api/test/db', async (c) => {
  const { env } = c
  
  try {
    if (!env.DB) {
      return c.json({ success: false, message: '데이터베이스 연결 없음' })
    }
    
    // 간단한 쿼리 테스트
    const result = await env.DB.prepare('SELECT COUNT(*) as count FROM working_girls').first()
    
    return c.json({ 
      success: true, 
      message: '데이터베이스 연결 성공',
      count: result?.count || 0
    })
    
  } catch (error) {
    return c.json({ 
      success: false, 
      message: `데이터베이스 오류: ${error.message}`
    })
  }
})

// 단일 사진 업로드 API
app.post('/api/admin/upload-single-photo', async (c) => {
  const { env } = c
  
  try {
    const formData = await c.req.formData()
    const workingGirlId = formData.get('working_girl_id')?.toString()
    const photoFile = formData.get('photo') as File
    const uploadOrder = parseInt(formData.get('upload_order')?.toString() || '1')
    const isMain = formData.get('is_main') === '1'
    
    if (!workingGirlId || !photoFile) {
      return c.json({ success: false, message: '필수 정보가 누락되었습니다.' }, 400)
    }
    
    // 워킹걸 존재 확인
    const workingGirl = await env.DB.prepare(`SELECT id FROM working_girls WHERE id = ?`).bind(workingGirlId).first()
    if (!workingGirl) {
      return c.json({ success: false, message: '워킹걸을 찾을 수 없습니다.' }, 404)
    }
    
    // 파일 크기 체크 (3MB)
    if (photoFile.size > 3 * 1024 * 1024) {
      return c.json({ success: false, message: '사진 크기가 너무 큽니다. (최대 3MB)' }, 400)
    }
    
    // MIME 타입 체크
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    if (!allowedTypes.includes(photoFile.type)) {
      return c.json({ success: false, message: '지원하지 않는 이미지 형식입니다.' }, 400)
    }
    
    // Base64 변환
    const arrayBuffer = await photoFile.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    
    let binaryString = ''
    for (let k = 0; k < bytes.length; k += 1024) {
      const chunk = bytes.subarray(k, Math.min(k + 1024, bytes.length))
      let chunkString = ''
      for (let i = 0; i < chunk.length; i++) {
        chunkString += String.fromCharCode(chunk[i])
      }
      binaryString += chunkString
    }
    
    const base64 = btoa(binaryString)
    const photoUrl = `data:${photoFile.type};base64,${base64}`
    
    // 사진 저장
    const result = await env.DB.prepare(`
      INSERT INTO working_girl_photos (working_girl_id, photo_url, is_main, upload_order)
      VALUES (?, ?, ?, ?)
    `).bind(workingGirlId, photoUrl, isMain ? 1 : 0, uploadOrder).run()
    
    // 메인 사진이면 working_girls 테이블 업데이트
    if (isMain) {
      await env.DB.prepare(`UPDATE working_girls SET main_photo = ? WHERE id = ?`)
        .bind(photoUrl, workingGirlId).run()
    }
    
    return c.json({ 
      success: true, 
      message: '사진이 성공적으로 업로드되었습니다.',
      photoId: result.meta.last_row_id
    })
    
  } catch (error) {
    console.error('Single photo upload error:', error)
    return c.json({ success: false, message: '사진 업로드 중 오류가 발생했습니다.' }, 500)
  }
})

// 관리자용 워킹걸 등록 API
app.post('/api/admin/working-girls', async (c) => {
  const { env } = c
  
  try {
    console.log('Admin registration request received')
    const formData = await c.req.formData()
    
    // FormData 내용 디버깅
    console.log('FormData keys:', Array.from(formData.keys()))
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File(${value.name}, ${value.size} bytes)`)
      } else {
        console.log(`${key}: ${value}`)
      }
    }
    
    // 필수 필드 검증
    const user_id = formData.get('username')?.toString()?.trim()
    const nickname = formData.get('nickname')?.toString()?.trim()
    const region = formData.get('region')?.toString()?.trim()
    const management_code = formData.get('management_code')?.toString()?.trim()
    const password = formData.get('password')?.toString()?.trim() || '1234'
    
    if (!user_id || !nickname || !region || !management_code) {
      console.log('Missing required fields:', { user_id, nickname, region, management_code })
      return c.json({ 
        success: false, 
        message: `필수 정보가 누락되었습니다. 아이디: ${user_id || '없음'}, 닉네임: ${nickname || '없음'}, 지역: ${region || '없음'}, 관리코드: ${management_code || '없음'}` 
      }, 400)
    }

    // 관리코드 중복 체크
    const existingCode = await env.DB.prepare(`SELECT id FROM working_girls WHERE management_code = ?`).bind(management_code).first()
    if (existingCode) {
      return c.json({ success: false, message: '이미 존재하는 관리코드입니다.' }, 400)
    }

    // 중복 아이디 체크
    const existingUser = await env.DB.prepare(`SELECT id FROM working_girls WHERE user_id = ?`).bind(user_id).first()
    if (existingUser) {
      return c.json({ success: false, message: '이미 존재하는 아이디입니다.' }, 400)
    }

    // 성별 변환
    const genderMap = {
      'female': '여자',
      'male': '레이디보이', 
      'trans': '트랜스젠더'
    }
    const gender = genderMap[formData.get('gender')?.toString() || 'female'] || '여자'
    
    // VIP/추천 상호 배타성 검증
    const isVip = formData.get('is_vip') === 'true'
    const isRecommended = formData.get('is_recommended') === 'true'
    
    // VIP와 추천이 동시에 선택된 경우 VIP 우선, 추천은 false로 설정
    const finalIsVip = isVip
    const finalIsRecommended = isVip ? false : isRecommended

    // 워킹걸 데이터 삽입
    const result = await env.DB.prepare(`
      INSERT INTO working_girls (
        user_id, password, nickname, age, height, weight, gender, region,
        phone, line_id, kakao_id, management_code, agency, fee, is_vip, is_recommended, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user_id,
      password,
      nickname,
      parseInt(formData.get('age')?.toString() || '0'),
      parseInt(formData.get('height')?.toString() || '0'),
      parseInt(formData.get('weight')?.toString() || '0'),
      gender,
      region,
      formData.get('phone')?.toString() || '',
      formData.get('line_id')?.toString() || '',
      formData.get('wechat_id')?.toString() || '', // kakao_id로 저장
      management_code,
      formData.get('agency')?.toString() || '',
      formData.get('fee')?.toString() || '',
      finalIsVip ? 1 : 0,
      finalIsRecommended ? 1 : 0,
      formData.get('is_active') !== 'false' ? 1 : 0
    ).run()

    const workingGirlId = result.meta.last_row_id

    return c.json({ 
      success: true, 
      message: '워킹걸이 성공적으로 등록되었습니다.',
      workingGirl: { id: workingGirlId }
    })
    
  } catch (error) {
    console.error('Working girl registration error:', error)
    return c.json({ success: false, message: '등록 중 오류가 발생했습니다.' }, 500)
  }
})

// 관리자용 워킹걸 수정 API
app.put('/api/admin/working-girls/:id', async (c) => {
  const { env } = c
  const workingGirlId = c.req.param('id')
  
  console.log(`🎯 워킹걸 수정 요청 - ID: ${workingGirlId}`)
  
  try {
    const formData = await c.req.formData()
    
    // 받은 FormData 로깅
    console.log('🔍 서버에서 받은 FormData:')
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}: ${value} (타입: ${typeof value})`)
    }
    
    // 워킹걸 존재 확인
    const existingGirl = await env.DB.prepare(`
      SELECT id, user_id, nickname, age, height, weight, gender, region, 
             line_id, kakao_id, phone, management_code, agency, 
             main_photo, is_active, is_recommended, is_vip, created_at, updated_at
      FROM working_girls WHERE id = ?
    `).bind(workingGirlId).first()
    if (!existingGirl) {
      return c.json({ success: false, message: '존재하지 않는 워킹걸입니다.' }, 404)
    }

    console.log('📋 기존 워킹걸 정보:', {
      id: existingGirl.id,
      nickname: existingGirl.nickname,
      is_vip: existingGirl.is_vip,
      is_recommended: existingGirl.is_recommended
    })

    // 아이디 중복 체크 (현재 사용자 제외)
    const user_id = formData.get('username')?.toString()
    if (user_id && user_id !== existingGirl.user_id) {
      const duplicateUser = await env.DB.prepare(`SELECT id FROM working_girls WHERE user_id = ? AND id != ?`).bind(user_id, workingGirlId).first()
      if (duplicateUser) {
        return c.json({ success: false, message: '이미 존재하는 아이디입니다.' }, 400)
      }
    }

    // 성별 변환
    const genderMap = {
      'female': '여자',
      'male': '레이디보이', 
      'trans': '트랜스젠더'
    }
    const gender = genderMap[formData.get('gender')?.toString() || 'female'] || existingGirl.gender
    
    // VIP/추천 상호 배타성 검증
    // 체크박스는 브라우저에서 'on' 또는 JavaScript에서 'true'로 전송될 수 있음
    const vipRawValue = formData.get('is_vip')
    const recommendedRawValue = formData.get('is_recommended')
    
    const isVip = vipRawValue === 'true' || vipRawValue === 'on' || vipRawValue === true
    const isRecommended = recommendedRawValue === 'true' || recommendedRawValue === 'on' || recommendedRawValue === true
    
    console.log('🎯 VIP/추천 값 파싱:', {
      is_vip_raw: formData.get('is_vip'),
      is_recommended_raw: formData.get('is_recommended'),
      isVip_parsed: isVip,
      isRecommended_parsed: isRecommended
    })
    
    // VIP와 추천이 동시에 선택된 경우 VIP 우선, 추천은 false로 설정
    const finalIsVip = isVip
    const finalIsRecommended = isVip ? false : isRecommended
    
    console.log('✨ 최종 VIP/추천 값:', {
      finalIsVip,
      finalIsRecommended
    })

    // 관리코드 필수 검증 및 중복 확인
    const management_code = formData.get('management_code')?.toString()
    if (!management_code) {
      return c.json({ success: false, message: '관리코드는 필수입니다.' }, 400)
    }

    // 관리코드 중복 체크 (자기 자신 제외)
    const existingCode = await env.DB.prepare(`SELECT id FROM working_girls WHERE management_code = ? AND id != ?`).bind(management_code, workingGirlId).first()
    if (existingCode) {
      return c.json({ success: false, message: '이미 존재하는 관리코드입니다.' }, 400)
    }

    // 워킹걸 정보 업데이트
    await env.DB.prepare(`
      UPDATE working_girls SET
        user_id = ?, nickname = ?, age = ?, height = ?, weight = ?,
        gender = ?, region = ?, phone = ?, line_id = ?, kakao_id = ?, management_code = ?, agency = ?, fee = ?,
        is_vip = ?, is_recommended = ?, is_active = ?
      WHERE id = ?
    `).bind(
      user_id || existingGirl.user_id,
      formData.get('nickname')?.toString() || existingGirl.nickname,
      parseInt(formData.get('age')?.toString() || existingGirl.age?.toString() || '0'),
      parseInt(formData.get('height')?.toString() || existingGirl.height?.toString() || '0'),
      parseInt(formData.get('weight')?.toString() || existingGirl.weight?.toString() || '0'),
      gender,
      formData.get('region')?.toString() || existingGirl.region,
      formData.get('phone')?.toString() || existingGirl.phone || '',
      formData.get('line_id')?.toString() || existingGirl.line_id || '',
      formData.get('wechat_id')?.toString() || existingGirl.kakao_id || '',
      management_code,
      formData.get('agency')?.toString() || existingGirl.agency || '',
      formData.get('fee')?.toString() || existingGirl.fee || '',
      finalIsVip ? 1 : 0,
      finalIsRecommended ? 1 : 0,
      formData.get('is_active') !== 'false' ? 1 : 0,
      workingGirlId
    ).run()

    // 새 사진 추가 처리
    const newPhotos = []
    let photoIndex = 0
    
    while (formData.get(`new_photo_${photoIndex}`)) {
      const photoFile = formData.get(`new_photo_${photoIndex}`) as File
      if (photoFile && photoFile.size > 0) {
        try {
          // 파일 크기 제한 (5MB)
          if (photoFile.size > 5 * 1024 * 1024) {
            console.error(`Photo ${photoIndex} too large: ${photoFile.size} bytes`);
            photoIndex++
            continue;
          }

          const buffer = await photoFile.arrayBuffer()
          
          // 완전히 안전한 Base64 인코딩 방식
          const uint8Array = new Uint8Array(buffer)
          
          // 바이너리 데이터를 문자열로 안전하게 변환
          let binaryString = ''
          
          // 작은 청크 단위로 안전하게 처리 (스택 오버플로우 방지)
          for (let i = 0; i < uint8Array.length; i += 1024) {
            const chunk = uint8Array.subarray(i, Math.min(i + 1024, uint8Array.length))
            let chunkString = ''
            for (let j = 0; j < chunk.length; j++) {
              chunkString += String.fromCharCode(chunk[j])
            }
            binaryString += chunkString
          }
          
          // 전체 바이너리 문자열을 Base64로 변환
          const base64 = btoa(binaryString)
          
          const mimeType = photoFile.type
          const dataUrl = `data:${mimeType};base64,${base64}`
          
          // 다음 upload_order 계산
          const lastOrder = await env.DB.prepare(`
            SELECT MAX(upload_order) as max_order FROM working_girl_photos WHERE working_girl_id = ?
          `).bind(workingGirlId).first()
          const nextOrder = (lastOrder?.max_order || 0) + 1
          
          await env.DB.prepare(`
            INSERT INTO working_girl_photos (working_girl_id, photo_url, is_main, upload_order)
            VALUES (?, ?, ?, ?)
          `).bind(workingGirlId, dataUrl, 0, nextOrder).run()
          
          newPhotos.push({ order: nextOrder, url: dataUrl })
        } catch (photoError) {
          console.error(`Error processing photo ${photoIndex}:`, photoError)
        }
      }
      photoIndex++
    }

    // 삭제할 사진 처리
    const deletePhotoIds = formData.get('delete_photo_ids')?.toString()
    if (deletePhotoIds) {
      const photoIdsToDelete = deletePhotoIds.split(',').filter(id => id.trim())
      for (const photoId of photoIdsToDelete) {
        await env.DB.prepare(`DELETE FROM working_girl_photos WHERE id = ? AND working_girl_id = ?`)
          .bind(photoId.trim(), workingGirlId).run()
      }
    }

    // 메인 사진 설정 처리
    const mainPhotoId = formData.get('main_photo_id')?.toString()
    if (mainPhotoId) {
      // 기존 메인 사진을 일반 사진으로 변경
      await env.DB.prepare(`UPDATE working_girl_photos SET is_main = 0 WHERE working_girl_id = ?`)
        .bind(workingGirlId).run()
      
      // 새로운 메인 사진 설정
      await env.DB.prepare(`UPDATE working_girl_photos SET is_main = 1 WHERE id = ? AND working_girl_id = ?`)
        .bind(mainPhotoId, workingGirlId).run()
      
      // working_girls 테이블의 main_photo도 업데이트
      const newMainPhoto = await env.DB.prepare(`SELECT photo_url FROM working_girl_photos WHERE id = ?`)
        .bind(mainPhotoId).first()
      
      if (newMainPhoto) {
        await env.DB.prepare(`UPDATE working_girls SET main_photo = ? WHERE id = ?`)
          .bind(newMainPhoto.photo_url, workingGirlId).run()
      }
    }

    return c.json({ 
      success: true, 
      message: '워킹걸 정보가 성공적으로 수정되었습니다.',
      newPhotos
    })
    
  } catch (error) {
    console.error('Working girl update error:', error)
    return c.json({ success: false, message: '수정 중 오류가 발생했습니다.' }, 500)
  }
})

// 관리자용 워킹걸 삭제 API
app.delete('/api/admin/working-girls/:id', async (c) => {
  const { env } = c
  const workingGirlId = c.req.param('id')
  
  try {
    // 워킹걸 존재 확인
    const existingGirl = await env.DB.prepare(`
      SELECT id, user_id FROM working_girls WHERE id = ?
    `).bind(workingGirlId).first()
    if (!existingGirl) {
      return c.json({ success: false, message: '존재하지 않는 워킹걸입니다.' }, 404)
    }

    // 관련 사진 먼저 삭제
    await env.DB.prepare(`DELETE FROM working_girl_photos WHERE working_girl_id = ?`).bind(workingGirlId).run()
    
    // 워킹걸 정보 삭제
    await env.DB.prepare(`DELETE FROM working_girls WHERE id = ?`).bind(workingGirlId).run()

    return c.json({ 
      success: true, 
      message: '워킹걸이 성공적으로 삭제되었습니다.'
    })
    
  } catch (error) {
    console.error('Working girl deletion error:', error)
    return c.json({ success: false, message: '삭제 중 오류가 발생했습니다.' }, 500)
  }
})

// 관리자용 워킹걸 목록 조회 API (간소화된 버전)
app.get('/api/admin/working-girls', async (c) => {
  const { env } = c
  
  try {
    console.log('Admin working girls list request received')
    
    // 데이터베이스 연결 확인
    if (!env.DB) {
      console.error('Database connection not available')
      return c.json({ success: false, message: '데이터베이스 연결 오류' }, 500)
    }
    
    const search = c.req.query('search') || ''
    console.log('Search query:', search)
    
    // 워킹걸 기본 정보 조회
    let query = `
      SELECT id, user_id, nickname, age, height, weight, gender, region, 
             line_id, kakao_id, phone, management_code, agency, 
             main_photo, is_active, is_recommended, is_vip, created_at, updated_at
      FROM working_girls
    `
    let params = []
    
    if (search) {
      query += ` WHERE (user_id LIKE ? OR nickname LIKE ? OR region LIKE ? OR management_code LIKE ?)`
      params = [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`]
    }
    
    query += ` ORDER BY is_vip DESC, is_recommended DESC, created_at DESC LIMIT 100` // 최대 100개로 제한
    console.log('Executing query:', query)
    
    const workingGirls = await env.DB.prepare(query).bind(...params).all()
    console.log('Query completed, results:', workingGirls?.results?.length || 0)
    
    // 사진 개수를 배치로 조회 (성능 최적화)
    const workingGirlIds = (workingGirls.results || []).map(girl => girl.id)
    
    let photoCountsMap = {}
    if (workingGirlIds.length > 0) {
      try {
        // 한 번의 쿼리로 모든 사진 개수를 가져오기
        const placeholders = workingGirlIds.map(() => '?').join(',')
        const photoCountsQuery = `
          SELECT working_girl_id, COUNT(*) as count 
          FROM working_girl_photos 
          WHERE working_girl_id IN (${placeholders})
          GROUP BY working_girl_id
        `
        
        const photoCounts = await env.DB.prepare(photoCountsQuery).bind(...workingGirlIds).all()
        
        // Map으로 변환
        for (const row of (photoCounts.results || [])) {
          photoCountsMap[row.working_girl_id] = row.count
        }
        
        console.log('Photo counts loaded for', Object.keys(photoCountsMap).length, 'working girls')
      } catch (photoError) {
        console.warn('Error loading photo counts:', photoError)
      }
    }
    
    // 사진 개수를 포함한 최종 목록 생성
    const workingGirlsList = (workingGirls.results || []).map(girl => ({
      ...girl,
      photo_count: photoCountsMap[girl.id] || 0
    }))
    
    console.log(`Returning ${workingGirlsList.length} working girls`)
    
    return c.json({ 
      success: true, 
      workingGirls: workingGirlsList
    })
    
  } catch (error) {
    console.error('Admin working girls list error:', error)
    return c.json({ 
      success: false, 
      message: `목록 조회 중 오류: ${error.message}`
    }, 500)
  }
})

// 관리자용 워킹걸 상세 정보 조회 API (사진 포함)
app.get('/api/admin/working-girls/:id', async (c) => {
  const { env } = c
  const workingGirlId = c.req.param('id')
  
  try {
    // 워킹걸 기본 정보 (패스워드 제외)
    const workingGirl = await env.DB.prepare(`
      SELECT id, user_id, nickname, age, height, weight, gender, region, 
             line_id, kakao_id, phone, management_code, agency, fee, 
             main_photo, is_active, is_recommended, is_vip, created_at, updated_at
      FROM working_girls WHERE id = ?
    `).bind(workingGirlId).first()
    if (!workingGirl) {
      return c.json({ success: false, message: '존재하지 않는 워킹걸입니다.' }, 404)
    }

    // 사진 정보
    const photos = await env.DB.prepare(`
      SELECT * FROM working_girl_photos WHERE working_girl_id = ? ORDER BY upload_order ASC
    `).bind(workingGirlId).all()

    return c.json({ 
      success: true, 
      workingGirl,
      photos: photos.results || []
    })
    
  } catch (error) {
    console.error('Admin working girl detail error:', error)
    return c.json({ success: false, message: '상세 정보 조회 중 오류가 발생했습니다.' }, 500)
  }
})

// 광고 업로드 API (우선순위 중복 방지 포함)
app.post('/api/admin/advertisements', async (c) => {
  const { env } = c
  
  try {
    const formData = await c.req.formData()
    const adFile = formData.get('advertisement') as File
    const title = formData.get('title')?.toString() || ''
    const linkUrl = formData.get('link_url')?.toString() || ''
    let displayOrder = parseInt(formData.get('display_order')?.toString() || '1')
    const scrollInterval = parseInt(formData.get('scroll_interval')?.toString() || '3000')
    const duration = formData.get('duration')?.toString() || ''
    
    if (!adFile || adFile.size === 0) {
      return c.json({ success: false, message: '광고 이미지를 선택해주세요.' }, 400)
    }

    // 파일 크기 제한 (10MB)
    if (adFile.size > 10 * 1024 * 1024) {
      return c.json({ success: false, message: '파일 크기가 너무 큽니다. (최대 10MB)' }, 400)
    }

    // 이미지 파일 형식 확인
    if (!adFile.type.startsWith('image/')) {
      return c.json({ success: false, message: '이미지 파일만 업로드 가능합니다.' }, 400)
    }

    // 사용할 우선순위 결정 (중복 방지)
    displayOrder = await getAvailablePriority(env.DB, displayOrder)

    const buffer = await adFile.arrayBuffer()
    
    // Base64 인코딩 (사진 업로드와 동일한 방식)
    const uint8Array = new Uint8Array(buffer)
    let binaryString = ''
    
    for (let i = 0; i < uint8Array.length; i += 1024) {
      const chunk = uint8Array.subarray(i, Math.min(i + 1024, uint8Array.length))
      let chunkString = ''
      for (let j = 0; j < chunk.length; j++) {
        chunkString += String.fromCharCode(chunk[j])
      }
      binaryString += chunkString
    }
    
    const base64 = btoa(binaryString)
    const mimeType = adFile.type
    const dataUrl = `data:${mimeType};base64,${base64}`

    // 만료일 처리
    let expiresAt = null
    if (duration && ['2주일', '1달', '1년'].includes(duration)) {
      const now = new Date()
      if (duration === '2주일') {
        now.setDate(now.getDate() + 14)
      } else if (duration === '1달') {
        now.setMonth(now.getMonth() + 1)
      } else if (duration === '1년') {
        now.setFullYear(now.getFullYear() + 1)
      }
      expiresAt = now.toISOString()
    }

    // 지정된 우선순위에 기존 광고가 있으면 뒤로 밀기
    await shiftAdvertisementPriorities(env.DB, displayOrder)

    // 광고 데이터 삽입 (향상된 필드 포함)
    const result = await env.DB.prepare(`
      INSERT INTO advertisements (image_url, title, link_url, display_order, scroll_interval, expires_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).bind(dataUrl, title, linkUrl, displayOrder, scrollInterval, expiresAt).run()

    // 전체 우선순위 재정렬
    await reorderAdvertisementPriorities(env.DB)

    return c.json({ 
      success: true, 
      message: '광고가 성공적으로 업로드되었습니다.',
      advertisementId: result.meta.last_row_id
    })

  } catch (error) {
    console.error('Advertisement upload error:', error)
    return c.json({ success: false, message: '광고 업로드 중 오류가 발생했습니다.' }, 500)
  }
})

// 사용 가능한 우선순위 찾기
async function getAvailablePriority(db, requestedPriority) {
  try {
    const existingAd = await db.prepare(`
      SELECT id FROM advertisements WHERE display_order = ?
    `).bind(requestedPriority).first()
    
    if (!existingAd) {
      return requestedPriority // 요청한 우선순위가 비어있으면 그대로 사용
    }
    
    // 다음 사용 가능한 우선순위 찾기
    const maxOrder = await db.prepare(`
      SELECT MAX(display_order) as max_order FROM advertisements
    `).first()
    
    return (maxOrder?.max_order || 0) + 1
    
  } catch (error) {
    console.error('Get available priority error:', error)
    return requestedPriority
  }
}

// 광고 우선순위 뒤로 밀기
async function shiftAdvertisementPriorities(db, fromPriority) {
  try {
    // 지정된 우선순위부터 뒤의 모든 광고들을 1씩 뒤로 밀기
    await db.prepare(`
      UPDATE advertisements 
      SET display_order = display_order + 1 
      WHERE display_order >= ?
    `).bind(fromPriority).run()
    
  } catch (error) {
    console.error('Shift advertisement priorities error:', error)
  }
}

// 관리자용 광고 목록 조회 API (우선순위 정렬 및 재배열 포함)
app.get('/api/admin/advertisements', async (c) => {
  const { env } = c
  
  try {
    // 만료된 광고 자동 비활성화
    await env.DB.prepare(`
      UPDATE advertisements 
      SET is_active = 0 
      WHERE expires_at IS NOT NULL AND expires_at <= datetime('now')
    `).run()
    
    // 우선순위 중복 제거 및 재정렬
    await reorderAdvertisementPriorities(env.DB)
    
    const ads = await env.DB.prepare(`
      SELECT *, 
        CASE 
          WHEN expires_at IS NOT NULL AND expires_at <= datetime('now') THEN 1
          ELSE 0
        END as is_expired
      FROM advertisements 
      ORDER BY display_order ASC, created_at DESC
    `).all()

    // 광고 설정도 함께 조회
    const settings = await env.DB.prepare(`
      SELECT setting_key, setting_value 
      FROM advertisement_settings
    `).all()
    
    const settingsObj = {}
    if (settings.results) {
      settings.results.forEach(setting => {
        settingsObj[setting.setting_key] = setting.setting_value
      })
    }

    return c.json({ 
      success: true, 
      advertisements: ads.results || [],
      settings: settingsObj
    })
    
  } catch (error) {
    console.error('Advertisement list error:', error)
    return c.json({ success: false, message: '광고 목록 조회 중 오류가 발생했습니다.' }, 500)
  }
})

// 광고 우선순위 재정렬 함수 (완전한 순차 정렬)
async function reorderAdvertisementPriorities(db) {
  try {
    // 모든 광고를 현재 우선순위 순으로 가져오기 (음수 포함하여 정렬)
    const ads = await db.prepare(`
      SELECT id, display_order 
      FROM advertisements 
      ORDER BY display_order ASC, created_at ASC
    `).all()
    
    if (!ads.results || ads.results.length === 0) {
      console.log('재정렬할 광고가 없습니다.')
      return
    }
    
    console.log(`총 ${ads.results.length}개 광고 우선순위 재정렬 시작`)
    
    // 모든 광고를 임시 우선순위로 설정하여 충돌 방지
    for (let i = 0; i < ads.results.length; i++) {
      const tempPriority = -(i + 1000) // 큰 음수로 설정하여 충돌 완전 방지
      await db.prepare(`
        UPDATE advertisements 
        SET display_order = ? 
        WHERE id = ?
      `).bind(tempPriority, ads.results[i].id).run()
    }
    
    // 1부터 순차적으로 우선순위 재할당
    for (let i = 0; i < ads.results.length; i++) {
      const newPriority = i + 1
      await db.prepare(`
        UPDATE advertisements 
        SET display_order = ? 
        WHERE id = ?
      `).bind(newPriority, ads.results[i].id).run()
      
      console.log(`광고 ID ${ads.results[i].id}: 우선순위 ${newPriority} 할당`)
    }
    
    console.log(`광고 우선순위 재정렬 완료: ${ads.results.length}개 광고가 1부터 ${ads.results.length}까지 순차 정렬됨`)
    
  } catch (error) {
    console.error('Advertisement priority reorder error:', error)
    throw error
  }
}

// 메인 페이지용 활성 광고 목록 조회 API (우선순위 정렬 포함)
app.get('/api/advertisements', async (c) => {
  const { env } = c
  
  try {
    // 만료된 광고 자동 비활성화
    await env.DB.prepare(`
      UPDATE advertisements 
      SET is_active = 0 
      WHERE expires_at IS NOT NULL AND expires_at <= datetime('now')
    `).run()
    
    // 우선순위 재정렬 (메인 페이지에서도 정확한 순서 보장)
    await reorderAdvertisementPriorities(env.DB)
    
    const activeAds = await env.DB.prepare(`
      SELECT id, image_url, title, link_url, display_order, scroll_interval
      FROM advertisements 
      WHERE is_active = 1 AND (expires_at IS NULL OR expires_at > datetime('now'))
      ORDER BY display_order ASC, created_at ASC
    `).all()

    // 광고 설정 조회
    const settings = await env.DB.prepare(`
      SELECT setting_key, setting_value 
      FROM advertisement_settings
    `).all()
    
    const settingsObj = {}
    if (settings.results) {
      settings.results.forEach(setting => {
        settingsObj[setting.setting_key] = setting.setting_value
      })
    }

    return c.json({ 
      success: true, 
      advertisements: activeAds.results || [],
      settings: settingsObj
    })
    
  } catch (error) {
    console.error('Active advertisements error:', error)
    return c.json({ success: false, message: '광고 조회 중 오류가 발생했습니다.' }, 500)
  }
})

// 광고 삭제 API
app.delete('/api/admin/advertisements/:id', async (c) => {
  const { env } = c
  const adId = c.req.param('id')
  
  try {
    const result = await env.DB.prepare(`
      DELETE FROM advertisements WHERE id = ?
    `).bind(adId).run()

    if (result.changes === 0) {
      return c.json({ success: false, message: '존재하지 않는 광고입니다.' }, 404)
    }

    return c.json({ 
      success: true, 
      message: '광고가 성공적으로 삭제되었습니다.'
    })
    
  } catch (error) {
    console.error('Advertisement deletion error:', error)
    return c.json({ success: false, message: '광고 삭제 중 오류가 발생했습니다.' }, 500)
  }
})

// 광고 정보 업데이트 API (우선순위 중복 방지 포함)
app.put('/api/admin/advertisements/:id', async (c) => {
  const { env } = c
  const adId = c.req.param('id')
  
  try {
    const { title, link_url, display_order, scroll_interval, expires_at, is_active } = await c.req.json()
    
    // 우선순위 변경이 요청된 경우 전체 재정렬 수행
    if (display_order !== undefined) {
      await handlePriorityChange(env.DB, adId, display_order)
    }
    
    // 만료일 처리 (기간 선택이 있는 경우 현재 시간에서 추가)
    let expiresAtValue = expires_at
    if (typeof expires_at === 'string' && ['2주일', '1달', '1년'].includes(expires_at)) {
      const now = new Date()
      if (expires_at === '2주일') {
        now.setDate(now.getDate() + 14)
      } else if (expires_at === '1달') {
        now.setMonth(now.getMonth() + 1)
      } else if (expires_at === '1년') {
        now.setFullYear(now.getFullYear() + 1)
      }
      expiresAtValue = now.toISOString()
    }
    
    // 우선순위 변경이 있었던 경우, 다른 필드도 함께 업데이트
    const result = await env.DB.prepare(`
      UPDATE advertisements 
      SET title = ?, link_url = ?, scroll_interval = ?, expires_at = ?, is_active = ?
      WHERE id = ?
    `).bind(
      title || '', 
      link_url || '', 
      scroll_interval || 3000, 
      expiresAtValue || null, 
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
      adId
    ).run()

    if (result.changes === 0) {
      return c.json({ success: false, message: '존재하지 않는 광고입니다.' }, 404)
    }

    return c.json({ 
      success: true, 
      message: '광고 정보가 성공적으로 업데이트되었습니다.'
    })
    
  } catch (error) {
    console.error('Advertisement update error:', error)
    return c.json({ success: false, message: '광고 정보 업데이트 중 오류가 발생했습니다.' }, 500)
  }
})

// 광고 우선순위 변경 처리 함수 (완전한 중복 방지 및 자동 재정렬)
async function handlePriorityChange(db, adId, newPriority) {
  try {
    // 현재 광고의 기존 우선순위 확인
    const currentAd = await db.prepare(`
      SELECT display_order FROM advertisements WHERE id = ?
    `).bind(adId).first()
    
    if (!currentAd) return
    
    const oldPriority = currentAd.display_order
    
    // 우선순위가 변경되지 않았으면 처리하지 않음
    if (oldPriority === newPriority) return
    
    // 임시로 해당 광고의 우선순위를 -1로 설정 (충돌 방지)
    await db.prepare(`
      UPDATE advertisements 
      SET display_order = -1 
      WHERE id = ?
    `).bind(adId).run()
    
    // 우선순위가 올라가는 경우 (newPriority < oldPriority)
    if (newPriority < oldPriority) {
      // newPriority 이상 oldPriority 미만인 모든 광고를 +1씩 이동
      await db.prepare(`
        UPDATE advertisements 
        SET display_order = display_order + 1 
        WHERE display_order >= ? AND display_order < ? AND id != ?
      `).bind(newPriority, oldPriority, adId).run()
    }
    // 우선순위가 내려가는 경우 (newPriority > oldPriority)  
    else {
      // oldPriority 초과 newPriority 이하인 모든 광고를 -1씩 이동
      await db.prepare(`
        UPDATE advertisements 
        SET display_order = display_order - 1 
        WHERE display_order > ? AND display_order <= ? AND id != ?
      `).bind(oldPriority, newPriority, adId).run()
    }
    
    // 해당 광고를 새로운 우선순위로 설정
    await db.prepare(`
      UPDATE advertisements 
      SET display_order = ? 
      WHERE id = ?
    `).bind(newPriority, adId).run()
    
    // 전체 우선순위를 1부터 순차적으로 정규화
    await reorderAdvertisementPriorities(db)
    
    console.log(`광고 ${adId}의 우선순위가 ${oldPriority}에서 ${newPriority}로 변경되고 전체 재정렬 완료`)
    
  } catch (error) {
    console.error('Priority change handling error:', error)
    throw error
  }
}

// 만남요청 텔레그램 전송 API
app.post('/api/meeting-request', async (c) => {
  const { env } = c
  
  try {
    const { 
      working_girl_id, 
      user_telegram, 
      user_name, 
      user_location,
      message 
    } = await c.req.json()

    // 워킹걸 정보 조회 (확장된 정보)
    const workingGirl = await env.DB.prepare(`
      SELECT user_id, nickname, age, height, weight, gender, region, 
             management_code, agency, is_active
      FROM working_girls WHERE id = ?
    `).bind(working_girl_id).first()

    if (!workingGirl) {
      return c.json({ success: false, message: '존재하지 않는 프로필입니다.' }, 404)
    }

    // 대표 사진 조회 (메인 사진 또는 첫 번째 사진)
    const mainPhoto = await env.DB.prepare(`
      SELECT photo_url FROM working_girl_photos 
      WHERE working_girl_id = ? 
      ORDER BY is_main DESC, upload_order ASC 
      LIMIT 1
    `).bind(working_girl_id).first()

    // 텔레그램 봇 토큰과 채널 ID (환경변수 또는 설정)
    const TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN || '여기에_봇_토큰_입력'
    const TELEGRAM_CHANNEL_ID = env.TELEGRAM_ADMIN_CHAT_ID || '여기에_채널_ID_입력'
    
    // 텔레그램 메시지 내용 구성
    const telegramMessage = `
🔔 **새로운 만남 요청**

👤 **요청자 정보:**
• 이름: ${user_name || '미입력'}
• 텔레그램: @${user_telegram}
${user_location ? `• 현재위치: ${user_location}` : ''}

👩 **워킹걸 정보:**
• 에이전시: ${workingGirl.agency || '미등록'}
• 관리코드: ${workingGirl.management_code || '없음'}
• 거주지역: ${workingGirl.region}
• 아이디: ${workingGirl.user_id}
• 닉네임: ${workingGirl.nickname}
• 나이: ${workingGirl.age}세
• 키: ${workingGirl.height}cm
• 몸무게: ${workingGirl.weight}kg
• 성별: ${workingGirl.gender}
• 상태: ${workingGirl.is_active ? '활성' : '비활성'}

💬 **요청 메시지:**
${message || '메시지 없음'}

⏰ **요청 시간:** ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
    `.trim()

    // 환경변수 확인
    if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === '여기에_봇_토큰_입력') {
      console.error('TELEGRAM_BOT_TOKEN not configured')
      return c.json({ 
        success: false, 
        message: '텔레그램 봇 설정이 필요합니다.' 
      }, 500)
    }
    
    if (!TELEGRAM_CHANNEL_ID || TELEGRAM_CHANNEL_ID === '여기에_채널_ID_입력') {
      console.error('TELEGRAM_ADMIN_CHAT_ID not configured')
      return c.json({ 
        success: false, 
        message: '텔레그램 채널 설정이 필요합니다.' 
      }, 500)
    }

    console.log('Sending message to Telegram:', { 
      chatId: TELEGRAM_CHANNEL_ID,
      messageLength: telegramMessage.length,
      hasPhoto: !!mainPhoto
    })

    let telegramResponse, responseData

    // 대표 사진이 있으면 사진과 함께 전송, 없으면 텍스트만 전송
    if (mainPhoto && mainPhoto.photo_url && mainPhoto.photo_url.startsWith('data:image/')) {
      // Base64 이미지를 바이너리로 변환 (파일 업로드용)
      const base64Data = mainPhoto.photo_url.split(',')[1]
      const imageBuffer = Buffer.from(base64Data, 'base64')
      
      // FormData를 사용해 이미지와 캡션 전송
      const formData = new FormData()
      formData.append('chat_id', TELEGRAM_CHANNEL_ID)
      formData.append('caption', telegramMessage)
      formData.append('parse_mode', 'Markdown')
      formData.append('photo', new Blob([imageBuffer], { type: 'image/jpeg' }), 'photo.jpg')
      
      telegramResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        body: formData
      })
    } else {
      // 사진이 없거나 Base64가 아닌 경우 텍스트만 전송
      telegramResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHANNEL_ID,
          text: telegramMessage,
          parse_mode: 'Markdown'
        })
      })
    }

    responseData = await telegramResponse.json()
    console.log('Telegram API response:', responseData)

    if (!telegramResponse.ok) {
      console.error('Telegram API error:', responseData)
      return c.json({ 
        success: false, 
        message: `텔레그램 전송 실패: ${responseData.description || '알 수 없는 오류'}` 
      }, 500)
    }

    // 만남요청 기록 저장 (옵션)
    try {
      await env.DB.prepare(`
        INSERT INTO meeting_requests (
          working_girl_id, user_telegram, user_name, message, created_at
        ) VALUES (?, ?, ?, ?, datetime('now'))
      `).bind(working_girl_id, user_telegram, user_name || '', message || '').run()
    } catch (dbError) {
      // 테이블이 없을 수 있으므로 에러 무시
      console.log('Meeting request log table not found, skipping...')
    }

    return c.json({ 
      success: true, 
      message: '만남 요청이 관리자에게 전송되었습니다!' 
    })

  } catch (error) {
    console.error('Meeting request error:', error)
    return c.json({ 
      success: false, 
      message: '만남 요청 전송 중 오류가 발생했습니다.' 
    }, 500)
  }
})

// 광고 활성화/비활성화 토글 API
app.put('/api/admin/advertisements/:id/toggle', async (c) => {
  const { env } = c
  const adId = c.req.param('id')
  
  try {
    const { is_active } = await c.req.json()
    
    const result = await env.DB.prepare(`
      UPDATE advertisements SET is_active = ? WHERE id = ?
    `).bind(is_active ? 1 : 0, adId).run()

    if (result.changes === 0) {
      return c.json({ success: false, message: '존재하지 않는 광고입니다.' }, 404)
    }

    return c.json({ 
      success: true, 
      message: `광고가 ${is_active ? '활성화' : '비활성화'}되었습니다.`
    })
    
  } catch (error) {
    console.error('Advertisement toggle error:', error)
    return c.json({ success: false, message: '광고 상태 변경 중 오류가 발생했습니다.' }, 500)
  }
})

// 테스트 광고 데이터 정리 API (개발용)
app.delete('/api/admin/advertisements/cleanup', async (c) => {
  const { env } = c
  
  try {
    // 파일 경로를 참조하는 광고들 삭제
    const result = await env.DB.prepare(`
      DELETE FROM advertisements 
      WHERE image_url LIKE '/static/ads/%' OR image_url NOT LIKE 'data:%'
    `).run()

    return c.json({ 
      success: true, 
      message: `${result.changes}개의 테스트 광고가 정리되었습니다.`
    })
    
  } catch (error) {
    console.error('Advertisement cleanup error:', error)
    return c.json({ success: false, message: '광고 정리 중 오류가 발생했습니다.' }, 500)
  }
})

// 광고 설정 조회 API
app.get('/api/admin/advertisement-settings', async (c) => {
  const { env } = c
  
  try {
    const settings = await env.DB.prepare(`
      SELECT setting_key, setting_value FROM advertisement_settings
    `).all()
    
    const settingsObj = {}
    if (settings.results) {
      settings.results.forEach(setting => {
        settingsObj[setting.setting_key] = setting.setting_value
      })
    }
    
    // 기본값 설정
    const defaultSettings = {
      default_scroll_interval: '3000',
      max_priority: '10',
      optimal_banner_size: '1200x300px'
    }
    
    // 설정이 없는 경우 기본값 사용
    Object.keys(defaultSettings).forEach(key => {
      if (!settingsObj[key]) {
        settingsObj[key] = defaultSettings[key]
      }
    })

    return c.json({ 
      success: true, 
      settings: settingsObj
    })
    
  } catch (error) {
    console.error('Advertisement settings get error:', error)
    return c.json({ success: false, message: '광고 설정 조회 중 오류가 발생했습니다.' }, 500)
  }
})

// 광고 설정 업데이트 API
app.put('/api/admin/advertisement-settings', async (c) => {
  const { env } = c
  
  try {
    const { settings } = await c.req.json()
    
    if (!settings || typeof settings !== 'object') {
      return c.json({ success: false, message: '설정 데이터가 올바르지 않습니다.' }, 400)
    }
    
    // 각 설정을 개별적으로 업데이트
    for (const [key, value] of Object.entries(settings)) {
      await env.DB.prepare(`
        INSERT OR REPLACE INTO advertisement_settings (setting_key, setting_value)
        VALUES (?, ?)
      `).bind(key, value.toString()).run()
    }

    return c.json({ 
      success: true, 
      message: '광고 설정이 성공적으로 업데이트되었습니다.'
    })
    
  } catch (error) {
    console.error('Advertisement settings update error:', error)
    return c.json({ success: false, message: '광고 설정 업데이트 중 오류가 발생했습니다.' }, 500)
  }
})

// 텔레그램 채널 ID 확인용 도구 API
app.get('/telegram-test', async (c) => {
  const { env } = c
  
  const botToken = env.TELEGRAM_BOT_TOKEN
  
  if (!botToken) {
    return c.html(`
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px;">
        <h1>🤖 텔레그램 봇 설정</h1>
        <div style="background: #f44336; color: white; padding: 15px; border-radius: 8px;">
          <strong>❌ 봇 토큰이 설정되지 않았습니다!</strong><br>
          <code>.dev.vars</code> 파일에 <code>TELEGRAM_BOT_TOKEN</code>을 추가해주세요.
        </div>
      </div>
    `)
  }
  
  return c.html(`
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px;">
      <h1>🤖 텔레그램 채널 ID 확인 도구</h1>
      
      <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3>📋 단계별 안내</h3>
        <ol>
          <li><strong>봇을 채널에 추가</strong>: 채널 → 관리자 → 봇을 관리자로 추가</li>
          <li><strong>채널에 메시지 전송</strong>: 아무 메시지나 전송 (예: "테스트")</li>
          <li><strong>아래 버튼 클릭</strong>해서 채널 ID 확인</li>
        </ol>
      </div>
      
      <button onclick="getChannelId()" style="background: #2196F3; color: white; padding: 15px 30px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">
        🔍 채널 ID 확인하기
      </button>
      
      <div id="result" style="margin-top: 20px;"></div>
      
      <script>
        async function getChannelId() {
          const resultDiv = document.getElementById('result');
          resultDiv.innerHTML = '<div style="background: #fff3cd; padding: 15px; border-radius: 8px;">⏳ 확인 중...</div>';
          
          try {
            const response = await fetch('/api/telegram/get-updates');
            const data = await response.json();
            
            if (data.success && data.updates.length > 0) {
              let channelsFound = [];
              
              data.updates.forEach(update => {
                if (update.channel_post || update.my_chat_member) {
                  const chat = update.channel_post?.chat || update.my_chat_member?.chat;
                  if (chat && chat.type === 'channel') {
                    channelsFound.push({
                      id: chat.id,
                      title: chat.title,
                      username: chat.username
                    });
                  }
                }
              });
              
              if (channelsFound.length > 0) {
                let html = '<div style="background: #d4edda; padding: 15px; border-radius: 8px;"><h3>✅ 채널 ID 발견!</h3>';
                
                channelsFound.forEach(channel => {
                  html += \`
                    <div style="background: white; padding: 10px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #28a745;">
                      <strong>채널명:</strong> \${channel.title}<br>
                      <strong>채널 ID:</strong> <code style="background: #f8f9fa; padding: 2px 5px; color: #e83e8c;">\${channel.id}</code><br>
                      \${channel.username ? \`<strong>사용자명:</strong> @\${channel.username}<br>\` : ''}
                      <small>이 ID를 .dev.vars 파일의 TELEGRAM_ADMIN_CHAT_ID에 설정하세요</small>
                    </div>
                  \`;
                });
                
                html += '</div>';
                resultDiv.innerHTML = html;
              } else {
                resultDiv.innerHTML = \`
                  <div style="background: #f8d7da; padding: 15px; border-radius: 8px;">
                    <strong>⚠️ 채널을 찾을 수 없습니다</strong><br>
                    1. 봇이 채널에 관리자로 추가되었는지 확인<br>
                    2. 채널에 최근 메시지가 있는지 확인<br>
                    3. 봇 토큰이 올바른지 확인
                  </div>
                \`;
              }
            } else {
              resultDiv.innerHTML = \`
                <div style="background: #f8d7da; padding: 15px; border-radius: 8px;">
                  <strong>❌ 업데이트를 가져올 수 없습니다</strong><br>
                  봇 토큰을 확인하거나 채널에 메시지를 전송해보세요.
                </div>
              \`;
            }
          } catch (error) {
            resultDiv.innerHTML = \`
              <div style="background: #f8d7da; padding: 15px; border-radius: 8px;">
                <strong>❌ 오류 발생:</strong> \${error.message}
              </div>
            \`;
          }
        }
      </script>
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 30px;">
        <h3>💡 문제 해결</h3>
        <p><strong>채널이 안 보인다면?</strong></p>
        <ul>
          <li>봇이 채널 관리자로 추가되었는지 확인</li>
          <li>채널에 봇 추가 후 아무 메시지나 전송</li>
          <li>채널이 아닌 그룹인지 확인 (그룹 ID는 다른 형태)</li>
        </ul>
      </div>
    </div>
  `)
})

// 텔레그램 getUpdates API 호출
app.get('/api/telegram/get-updates', async (c) => {
  const { env } = c
  
  const botToken = env.TELEGRAM_BOT_TOKEN
  
  if (!botToken) {
    return c.json({ success: false, message: '봇 토큰이 설정되지 않았습니다.' })
  }
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`)
    const data = await response.json()
    
    if (data.ok) {
      return c.json({ success: true, updates: data.result })
    } else {
      return c.json({ success: false, message: data.description })
    }
  } catch (error) {
    return c.json({ success: false, message: error.message })
  }
})

export default app
