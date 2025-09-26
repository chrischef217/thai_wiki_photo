import { Hono } from 'hono'
import { handle } from 'hono/vercel'

// 기존 Hono 앱을 가져오기 위한 코드
const app = new Hono().basePath('/api')

// CORS 설정
app.use('*', async (c, next) => {
  await next()
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
})

// 간단한 메모리 저장소 (실제로는 데이터베이스를 사용해야 함)
let users = [
  {
    id: 1,
    nickname: "떠기",
    age: 22,
    height: "155cm",
    weight: "55kg",
    region: "방콕",
    code: "aaa222",
    conditions: "1.dsfsdf\n2.sdfdsf",
    photos: [
      { photo_url: "data:image/jpeg;base64,/9j..." }
    ]
  }
]

// API 라우트들
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>타이위키 (Thai Wiki) - 태국 워킹걸 정보</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100">
        <div class="min-h-screen">
            <!-- 헤더 -->
            <header class="bg-thai-red text-white p-4 shadow-lg">
                <div class="container mx-auto">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center space-x-2">
                            <i class="fas fa-globe-asia text-2xl"></i>
                            <h1 class="text-2xl font-bold">타이위키</h1>
                        </div>
                        <nav class="flex space-x-4">
                            <button onclick="showRegisterModal()" class="bg-white text-thai-red px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200">
                                <i class="fas fa-user-plus mr-2"></i>워킹걸 등록
                            </button>
                        </nav>
                    </div>
                </div>
            </header>

            <!-- 메인 컨텐츠 -->
            <main class="container mx-auto px-4 py-8">
                <div class="text-center mb-8">
                    <h2 class="text-3xl font-bold text-gray-800 mb-4">등록된 워킹걸 목록</h2>
                    <p class="text-gray-600">프로필을 클릭하면 상세 정보를 볼 수 있습니다</p>
                </div>

                <!-- 로딩 메시지 -->
                <div id="loading" class="text-center py-8">
                    <i class="fas fa-spinner fa-spin text-3xl text-thai-red mb-4"></i>
                    <p class="text-gray-600">데이터를 불러오는 중...</p>
                </div>

                <!-- 워킹걸 목록 -->
                <div id="working-girls-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- 동적으로 생성됨 -->
                </div>

                <!-- 등록된 워킹걸이 없을 때 -->
                <div id="empty-state" class="text-center py-12 hidden">
                    <i class="fas fa-users text-6xl text-gray-400 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-600 mb-2">등록된 워킹걸이 없습니다</h3>
                    <p class="text-gray-500 mb-6">첫 번째 워킹걸을 등록해보세요!</p>
                    <button onclick="showRegisterModal()" class="bg-thai-red text-white px-6 py-3 rounded-lg font-medium hover:bg-red-600 transition-colors duration-200">
                        <i class="fas fa-plus mr-2"></i>워킹걸 등록하기
                    </button>
                </div>
            </main>

            <!-- 모달 컨테이너 -->
            <div id="modal-container"></div>

            <!-- 알림 컨테이너 -->
            <div id="notification-container" class="fixed top-4 right-4 z-50"></div>
        </div>

        <style>
            .thai-red { background-color: #DC2626; }
            .bg-thai-red { background-color: #DC2626; }
            .text-thai-red { color: #DC2626; }
        </style>

        <script>
        // 기본 API 설정
        const API_BASE = '/api';

        // 워킹걸 목록 로드
        async function loadWorkingGirls() {
            try {
                document.getElementById('loading').style.display = 'block';
                
                const response = await fetch(API_BASE + '/working-girls');
                const data = await response.json();
                
                document.getElementById('loading').style.display = 'none';
                
                if (data.success && data.data.length > 0) {
                    displayWorkingGirls(data.data);
                    document.getElementById('empty-state').style.display = 'none';
                } else {
                    document.getElementById('working-girls-list').innerHTML = '';
                    document.getElementById('empty-state').style.display = 'block';
                }
            } catch (error) {
                console.error('워킹걸 목록 로드 실패:', error);
                document.getElementById('loading').style.display = 'none';
                document.getElementById('empty-state').style.display = 'block';
            }
        }

        // 워킹걸 목록 표시
        function displayWorkingGirls(workingGirls) {
            const container = document.getElementById('working-girls-list');
            container.innerHTML = workingGirls.map(girl => {
                const mainPhoto = girl.photos && girl.photos.length > 0 
                    ? girl.photos[0].photo_url 
                    : null;
                
                return \`
                    <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer working-girl-item" onclick="showWorkingGirlModal(\${JSON.stringify(girl).replace(/"/g, '&quot;')})">
                        <div class="aspect-square bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center">
                            \${mainPhoto 
                                ? \`<img src="\${mainPhoto}" alt="\${girl.nickname}" class="w-full h-full object-cover">\`
                                : \`<div class="text-center text-gray-600">
                                    <i class="fas fa-user text-4xl mb-2"></i>
                                    <div class="font-medium">\${girl.nickname}</div>
                                    <div class="text-sm">사진 없음</div>
                                  </div>\`
                            }
                        </div>
                        <div class="p-4">
                            <h3 class="font-bold text-lg text-gray-800 mb-2">\${girl.nickname}</h3>
                            <div class="space-y-1 text-sm text-gray-600">
                                <div><span class="font-medium">나이:</span> \${girl.age}세</div>
                                <div><span class="font-medium">키/몸무게:</span> \${girl.height}cm / \${girl.weight}kg</div>
                                <div><span class="font-medium">지역:</span> \${girl.region}</div>
                                <div><span class="font-medium text-thai-red">코드:</span> <span class="font-bold text-thai-red">\${girl.code}</span></div>
                            </div>
                        </div>
                    </div>
                \`;
            }).join('');
        }

        // 워킹걸 상세보기 모달
        function showWorkingGirlModal(girl) {
            const validPhotos = girl.photos ? girl.photos.filter(photo => 
                photo && photo.photo_url && photo.photo_url.trim() !== ''
            ) : [];
            
            let photosHTML = '';
            
            if (validPhotos.length > 0) {
                photosHTML = validPhotos.map((photo, index) => {
                    const safePhotoUrl = photo.photo_url.replace(/'/g, "\\\\'");
                    return \`
                    <div class="aspect-square bg-gradient-to-br from-pink-200 to-purple-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity" onclick="window.openPhotoLightbox('\${safePhotoUrl}', '\${girl.nickname}')">
                        <img src="\${photo.photo_url}" alt="\${girl.nickname}" class="w-full h-full object-cover">
                    </div>
                \`;
                }).join('');
            } else {
                photosHTML = \`
                    <div class="aspect-square bg-gradient-to-br from-pink-200 to-purple-200 rounded-lg flex flex-col items-center justify-center text-gray-600 font-medium">
                        <i class="fas fa-user text-4xl mb-2"></i>
                        <div>\${girl.nickname}</div>
                        <div class="text-sm mt-1">등록된 사진 없음</div>
                    </div>
                \`;
            }

            const modalHTML = \`
                <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-overlay p-4" onclick="closeModal(event)">
                    <div class="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto modal-content" onclick="event.stopPropagation()">
                        <div class="p-6">
                            <div class="flex justify-between items-center mb-4">
                                <h2 class="text-2xl font-bold text-gray-800">\${girl.nickname}</h2>
                                <button onclick="closeModal()" class="text-gray-600 hover:text-gray-800 text-2xl">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>

                            \${validPhotos.length > 0 ? \`
                            <div class="mb-4">
                                <h3 class="text-lg font-semibold text-gray-800 mb-3">사진 (\${validPhotos.length}장)</h3>
                                <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                                    \${photosHTML}
                                </div>
                            </div>
                            \` : ''}

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">나이</label>
                                    <div class="bg-gray-50 p-3 rounded-lg text-gray-800">\${girl.age}세</div>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">성별</label>
                                    <div class="bg-gray-50 p-3 rounded-lg text-gray-800">여자</div>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">키</label>
                                    <div class="bg-gray-50 p-3 rounded-lg text-gray-800">\${girl.height}cm</div>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">몸무게</label>
                                    <div class="bg-gray-50 p-3 rounded-lg text-gray-800">\${girl.weight}kg</div>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">거주 지역</label>
                                    <div class="bg-gray-50 p-3 rounded-lg text-gray-800">\${girl.region}</div>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">코드</label>
                                    <div class="bg-gray-50 p-3 rounded-lg text-thai-red font-bold">\${girl.code}</div>
                                </div>
                            </div>

                            \${girl.conditions ? \`
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-gray-700 mb-2">조건</label>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <p class="text-gray-800 whitespace-pre-wrap">\${girl.conditions}</p>
                                </div>
                            </div>
                            \` : ''}

                            <div class="mt-6 text-center">
                                <button onclick="requestMeeting(\${girl.id})" class="bg-thai-red hover:bg-red-600 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors duration-200">
                                    <i class="fas fa-heart mr-2"></i>만남 요청
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            \`;

            document.getElementById('modal-container').innerHTML = modalHTML;
        }

        // 사진 라이트박스
        function showPhotoLightbox(photoUrl, nickname) {
            const lightboxHTML = \`
                <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] photo-lightbox" onclick="closePhotoLightbox(event)">
                    <div class="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center" onclick="event.stopPropagation()">
                        <img src="\${photoUrl}" alt="\${nickname}" class="max-w-full max-h-full object-contain rounded-lg shadow-2xl">
                        <button onclick="closePhotoLightbox()" class="absolute top-4 right-4 text-white bg-black/50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70 transition-colors">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                </div>
            \`;
            
            document.body.insertAdjacentHTML('beforeend', lightboxHTML);
            document.body.style.overflow = 'hidden';
        }

        function closePhotoLightbox(event) {
            if (event && event.target !== event.currentTarget) return;
            
            const lightbox = document.querySelector('.photo-lightbox');
            if (lightbox) {
                lightbox.remove();
                document.body.style.overflow = '';
            }
        }

        window.openPhotoLightbox = function(photoUrl, nickname) {
            showPhotoLightbox(photoUrl, nickname);
        };

        function closeModal(event) {
            if (event && event.target !== event.currentTarget) return;
            document.getElementById('modal-container').innerHTML = '';
        }

        function showRegisterModal() {
            alert('등록 기능은 개발 중입니다.');
        }

        function requestMeeting(id) {
            alert('만남 요청 기능은 개발 중입니다.');
        }

        // 페이지 로드시 워킹걸 목록 로드
        document.addEventListener('DOMContentLoaded', loadWorkingGirls);
        </script>
    </body>
    </html>
  `)
})

// 워킹걸 목록 API
app.get('/working-girls', (c) => {
  return c.json({
    success: true,
    data: users
  })
})

// Vercel용 핸들러 내보내기
export default handle(app)