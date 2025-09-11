// 타이위키 메인 JavaScript

// 전역 변수
let currentUser = null;
let currentUserType = null; // 'working_girl' | 'admin'
let currentAd = 0;
let workingGirlsData = [];
let advertisementsData = [];

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - initializing app');
    initializeApp();
});

// 앱 초기화
function initializeApp() {
    console.log('Initializing app...');
    setupEventListeners();
    loadWorkingGirls();
    loadAdvertisements();
    checkLoginStatus();
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 햄버거 메뉴
    const menuToggle = document.getElementById('menu-toggle');
    const menuClose = document.getElementById('menu-close');
    const sideMenu = document.getElementById('side-menu');
    const menuOverlay = document.getElementById('menu-overlay');

    menuToggle.addEventListener('click', openSideMenu);
    menuClose.addEventListener('click', closeSideMenu);
    menuOverlay.addEventListener('click', closeSideMenu);

    // 활동상태 토글
    const statusToggle = document.getElementById('status-toggle');
    statusToggle.addEventListener('click', toggleActivityStatus);

    // 검색
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchWorkingGirls();
        }
    });
}

// 사이드 메뉴 열기
function openSideMenu() {
    const sideMenu = document.getElementById('side-menu');
    const menuOverlay = document.getElementById('menu-overlay');
    
    sideMenu.classList.remove('translate-x-full');
    menuOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// 사이드 메뉴 닫기
function closeSideMenu() {
    const sideMenu = document.getElementById('side-menu');
    const menuOverlay = document.getElementById('menu-overlay');
    
    sideMenu.classList.add('translate-x-full');
    menuOverlay.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// 활동상태 토글
function toggleActivityStatus() {
    if (!currentUser || currentUserType !== 'working_girl') {
        showNotification('로그인이 필요합니다.', 'warning');
        return;
    }

    const statusButton = document.getElementById('status-toggle');
    const isCurrentlyOn = statusButton.textContent === 'ON';
    const newStatus = !isCurrentlyOn;

    // API 호출
    axios.post('/api/working-girl/toggle-status', { is_active: newStatus })
        .then(response => {
            if (response.data.success) {
                updateStatusButton(newStatus);
                showNotification(
                    newStatus ? '활동상태가 ON으로 변경되었습니다.' : '활동상태가 OFF로 변경되었습니다.',
                    'success'
                );
            }
        })
        .catch(error => {
            console.error('Status toggle error:', error);
            showNotification('상태 변경에 실패했습니다.', 'error');
        });
}

// 활동상태 버튼 업데이트
function updateStatusButton(isActive) {
    const statusButton = document.getElementById('status-toggle');
    
    if (isActive) {
        statusButton.textContent = 'ON';
        statusButton.className = 'bg-green-500 hover:bg-green-600 px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 status-on';
    } else {
        statusButton.textContent = 'OFF';
        statusButton.className = 'bg-red-500 hover:bg-red-600 px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 status-off';
    }
}

// 로그인 상태 확인
function checkLoginStatus() {
    const sessionToken = localStorage.getItem('thaiwiki_session');
    
    if (sessionToken) {
        axios.post('/api/auth/verify-session', { session_token: sessionToken })
            .then(response => {
                if (response.data.success) {
                    const userData = response.data.user;
                    currentUser = userData;
                    currentUserType = response.data.user_type;
                    
                    // 로그인 상태 확인됨
                }
            })
            .catch(error => {
                localStorage.removeItem('thaiwiki_session');
            });
    }
}

// 활동상태 표시
function showActivityStatus(isActive) {
    const activityStatus = document.getElementById('activity-status');
    activityStatus.classList.remove('hidden');
    activityStatus.classList.add('flex');
    
    updateStatusButton(isActive);
}

// 워킹걸 데이터 로드
function loadWorkingGirls(searchQuery = '') {
    console.log('loadWorkingGirls called with searchQuery:', searchQuery);
    
    const loading = document.getElementById('loading');
    const noData = document.getElementById('no-data');
    const workingGirlsList = document.getElementById('working-girls-list');

    loading.classList.remove('hidden');
    noData.classList.add('hidden');

    const cacheBuster = '_=' + Date.now();
    const url = searchQuery ? 
        `/api/working-girls/search?q=${encodeURIComponent(searchQuery)}&${cacheBuster}` : 
        `/api/v2/profiles?${cacheBuster}&t=${new Date().getTime()}`;
    console.log('Making API request to:', url);

    axios.get(url, {
        headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
    })
        .then(response => {
            console.log('API response received:', response.data);
            workingGirlsData = response.data.working_girls || [];
            console.log('Working girls data:', workingGirlsData);
            displayWorkingGirls(workingGirlsData);
        })
        .catch(error => {
            console.error('Failed to load working girls:', error);
            showNotification('데이터를 불러오는데 실패했습니다.', 'error');
        })
        .finally(() => {
            loading.classList.add('hidden');
        });
}

// 워킹걸 리스트 표시 (모바일 최적화)
function displayWorkingGirls(workingGirls) {
    const workingGirlsList = document.getElementById('working-girls-list');
    const noData = document.getElementById('no-data');

    if (workingGirls.length === 0) {
        workingGirlsList.innerHTML = '';
        noData.classList.remove('hidden');
        return;
    }

    noData.classList.add('hidden');

    const cardsHTML = workingGirls.map(girl => {
        // 완전히 새로운 사진 표시 로직 - 단순하고 확실하게
        let mainPhoto = '/static/images/default-avatar.svg';
        
        console.log(`=== ${girl.nickname} 사진 처리 시작 ===`);
        console.log('- photos 배열:', girl.photos);
        console.log('- main_photo 필드:', girl.main_photo ? 'EXISTS' : 'NULL');
        
        // 우선순위 1: main_photo 필드 (가장 최근 업데이트)
        if (girl.main_photo && girl.main_photo.startsWith('data:image')) {
            mainPhoto = girl.main_photo;
            console.log('✓ main_photo 필드 사용');
        }
        // 우선순위 2: photos 배열에서 메인 사진
        else if (girl.photos && Array.isArray(girl.photos) && girl.photos.length > 0) {
            // is_main이 1인 사진 찾기
            const mainPhotoObj = girl.photos.find(photo => 
                photo && photo.photo_url && photo.is_main == 1
            );
            
            if (mainPhotoObj) {
                mainPhoto = mainPhotoObj.photo_url;
                console.log('✓ photos 배열의 메인 사진 사용');
            } else if (girl.photos[0] && girl.photos[0].photo_url) {
                mainPhoto = girl.photos[0].photo_url;
                console.log('✓ photos 배열의 첫 번째 사진 사용');
            }
        }
        // 우선순위 3: 레거시 main_photo 필드
        else if (girl.main_photo) {
            mainPhoto = girl.main_photo;
            console.log('✓ 레거시 main_photo 필드 사용');
        }
        
        console.log(`최종 선택된 사진: ${mainPhoto === '/static/images/default-avatar.svg' ? 'DEFAULT' : 'CUSTOM'}`);
        const recommendedBadge = girl.is_recommended ? 
            '<div class="absolute top-1 left-1 sm:top-2 sm:left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-1 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-bold recommended-badge"><i class="fas fa-star mr-1"></i><span class="hidden sm:inline">추천</span></div>' : '';
        
        return `
            <div class="working-girl-card bg-white rounded-lg shadow-md overflow-hidden" onclick="showWorkingGirlDetail(${girl.id})" data-id="${girl.id}">
                <div class="relative">
                    <img src="${mainPhoto}" alt="${girl.nickname}" class="w-full h-32 sm:h-40 md:h-48 object-cover" onerror="this.src='/static/images/default-avatar.svg'" loading="lazy">
                    ${recommendedBadge}
                    ${!girl.is_active ? '<div class="absolute top-1 right-1 sm:top-2 sm:right-2 bg-gray-500 text-white px-1 py-0.5 sm:px-2 sm:py-1 rounded text-xs">비활성</div>' : ''}
                </div>
                <div class="p-2 sm:p-3 md:p-4 card-content">
                    <h3 class="font-bold text-sm sm:text-base md:text-lg text-gray-800 mb-1 sm:mb-2 truncate">${girl.nickname}</h3>
                    <div class="space-y-0.5 sm:space-y-1 text-xs sm:text-sm text-gray-600">
                        <p class="flex items-center">
                            <i class="fas fa-venus mr-1 sm:mr-2 text-pink-500 text-xs"></i>
                            <span class="truncate">${girl.gender}</span>
                        </p>
                        <p class="flex items-center">
                            <i class="fas fa-map-marker-alt mr-1 sm:mr-2 text-red-500 text-xs"></i>
                            <span class="truncate">${girl.region}</span>
                        </p>
                        ${girl.age ? `<p class="flex items-center">
                            <i class="fas fa-birthday-cake mr-1 sm:mr-2 text-blue-500 text-xs"></i>
                            <span>${girl.age}세</span>
                        </p>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    workingGirlsList.innerHTML = cardsHTML;
    
    // 모바일 터치 이벤트 최적화
    addTouchOptimization();
}

// 모바일 터치 이벤트 최적화
function addTouchOptimization() {
    const cards = document.querySelectorAll('.working-girl-card');
    cards.forEach(card => {
        // 터치 시작
        card.addEventListener('touchstart', function(e) {
            this.style.transform = 'scale(0.98)';
        }, {passive: true});
        
        // 터치 종료
        card.addEventListener('touchend', function(e) {
            this.style.transform = '';
        }, {passive: true});
        
        // 터치 취소
        card.addEventListener('touchcancel', function(e) {
            this.style.transform = '';
        }, {passive: true});
    });
}

// 워킹걸 검색
function searchWorkingGirls() {
    const searchInput = document.getElementById('search-input');
    const searchQuery = searchInput.value.trim();
    
    loadWorkingGirls(searchQuery);
}

// 워킹걸 상세 정보 표시
function showWorkingGirlDetail(workingGirlId) {
    axios.get(`/api/working-girls/${workingGirlId}?_=${Date.now()}`, {
        headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
    })
        .then(response => {
            const girl = response.data;
            showWorkingGirlModal(girl);
        })
        .catch(error => {
            console.error('Failed to load working girl detail:', error);
            showNotification('상세 정보를 불러오는데 실패했습니다.', 'error');
        });
}

// 워킹걸 상세 모달 표시 (모바일 최적화)
function showWorkingGirlModal(girl) {
    const photosHTML = girl.photos && girl.photos.length > 0 ? 
        girl.photos.map((photo, index) => `
            <img src="${photo.photo_url}" alt="${girl.nickname} ${index + 1}" 
                 class="w-full h-32 sm:h-40 md:h-48 object-cover rounded-lg cursor-pointer" 
                 onerror="this.src='/static/images/default-avatar.svg'"
                 onclick="showPhotoModal('${photo.photo_url}', '${girl.nickname}', ${index})"
                 loading="lazy">
        `).join('') : 
        `<img src="/static/images/default-avatar.svg" alt="${girl.nickname}" class="w-full h-32 sm:h-40 md:h-48 object-cover rounded-lg">`;

    const modalHTML = `
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-overlay p-2 sm:p-4" onclick="closeModal(event)">
            <div class="bg-white rounded-lg w-full max-w-2xl max-h-[95vh] overflow-y-auto modal-content" onclick="event.stopPropagation()">
                <div class="p-3 sm:p-4 md:p-6">
                    <!-- 모바일 최적화 헤더 -->
                    <div class="flex justify-between items-center mb-3 sm:mb-4">
                        <h2 class="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 truncate pr-2">${girl.nickname}</h2>
                        <button onclick="closeModal()" class="text-gray-600 hover:text-gray-800 text-xl sm:text-2xl p-1 min-w-[44px] min-h-[44px] flex items-center justify-center">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <!-- 모바일 최적화 사진 그리드 -->
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
                        ${photosHTML}
                    </div>

                    <!-- 모바일 최적화 기본 정보 -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <div class="bg-gray-50 p-2 sm:p-3 rounded-lg">
                            <label class="block text-xs sm:text-sm font-medium text-gray-700">나이</label>
                            <p class="mt-1 text-sm sm:text-base md:text-lg font-semibold">${girl.age}세</p>
                        </div>
                        <div class="bg-gray-50 p-2 sm:p-3 rounded-lg">
                            <label class="block text-xs sm:text-sm font-medium text-gray-700">성별</label>
                            <p class="mt-1 text-sm sm:text-base md:text-lg font-semibold">${girl.gender}</p>
                        </div>
                        <div class="bg-gray-50 p-2 sm:p-3 rounded-lg">
                            <label class="block text-xs sm:text-sm font-medium text-gray-700">키</label>
                            <p class="mt-1 text-sm sm:text-base md:text-lg font-semibold">${girl.height}cm</p>
                        </div>
                        <div class="bg-gray-50 p-2 sm:p-3 rounded-lg">
                            <label class="block text-xs sm:text-sm font-medium text-gray-700">몸무게</label>
                            <p class="mt-1 text-sm sm:text-base md:text-lg font-semibold">${girl.weight}kg</p>
                        </div>
                        <div class="bg-gray-50 p-2 sm:p-3 rounded-lg">
                            <label class="block text-xs sm:text-sm font-medium text-gray-700">거주 지역</label>
                            <p class="mt-1 text-sm sm:text-base md:text-lg font-semibold">${girl.region}</p>
                        </div>
                        ${girl.code ? `
                        <div class="bg-yellow-50 p-2 sm:p-3 rounded-lg">
                            <label class="block text-xs sm:text-sm font-medium text-gray-700">코드</label>
                            <p class="mt-1 text-sm sm:text-base md:text-lg font-bold text-thai-red">${girl.code}</p>
                        </div>
                        ` : ''}
                    </div>

                    <!-- 연락처 정보 (모바일 최적화) -->
                    ${girl.phone ? `
                    <div class="mb-4 sm:mb-6 bg-blue-50 p-3 rounded-lg">
                        <label class="block text-xs sm:text-sm font-medium text-gray-700">전화번호</label>
                        <p class="mt-1 text-sm sm:text-base md:text-lg font-semibold">
                            <a href="tel:${girl.phone}" class="text-blue-600 hover:text-blue-800">
                                <i class="fas fa-phone mr-2"></i>${girl.phone}
                            </a>
                        </p>
                    </div>
                    ` : ''}

                    <!-- 모바일 최적화 만남 요청 버튼 -->
                    <div class="mt-4 sm:mt-6 text-center">
                        <button onclick="requestMeeting(${girl.id})" class="w-full sm:w-auto bg-thai-red hover:bg-red-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-medium transition-colors duration-200 min-h-[48px]">
                            <i class="fas fa-heart mr-2"></i>만남 요청
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-container').innerHTML = modalHTML;
    
    // 모바일에서 스크롤 방지
    document.body.style.overflow = 'hidden';
}

// 사진 확대 모달 (모바일 최적화)
function showPhotoModal(photoUrl, nickname, index) {
    const photoModalHTML = `
        <div class="fixed inset-0 bg-black/90 flex items-center justify-center z-60 p-2" onclick="closePhotoModal(event)">
            <div class="relative max-w-full max-h-full">
                <img src="${photoUrl}" alt="${nickname}" class="max-w-full max-h-full object-contain rounded-lg" onclick="event.stopPropagation()">
                <button onclick="closePhotoModal()" class="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 min-w-[44px] min-h-[44px]">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', photoModalHTML);
}

function closePhotoModal(event) {
    if (event && event.target !== event.currentTarget) return;
    const photoModal = document.querySelector('.fixed.inset-0.bg-black\\/90');
    if (photoModal) {
        photoModal.remove();
    }
}

// 만남 요청 (준비만 해두고 나중에 링크 연결)
function requestMeeting(workingGirlId) {
    // 향후 만남 요청 링크로 이동할 준비
    showNotification('만남 요청 기능은 준비 중입니다.', 'info');
}

// 모달 닫기 (모바일 최적화)
function closeModal(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('modal-container').innerHTML = '';
    
    // 모바일에서 스크롤 복원
    document.body.style.overflow = 'auto';
}

// 워킹걸 로그인 모달 표시
function showWorkingGirlLogin() {
    closeSideMenu();
    
    // 이미 로그인되어 있으면 바로 프로필 수정 페이지로 이동
    const sessionToken = localStorage.getItem('thaiwiki_session');
    if (sessionToken && currentUser && currentUserType === 'working_girl') {
        // 프로필 수정 페이지를 바로 표시
        showWorkingGirlEdit();
        return;
    }
    
    const modalHTML = `
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-overlay p-4" onclick="closeModal(event)">
            <div class="bg-white rounded-lg max-w-md w-full modal-content" onclick="event.stopPropagation()">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">워킹걸 로그인</h2>
                        <button onclick="closeModal()" class="text-gray-600 hover:text-gray-800 text-2xl">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <form onsubmit="loginWorkingGirl(event)">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">아이디</label>
                            <input type="text" id="wg-login-id" required 
                                   class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                        </div>
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
                            <input type="password" id="wg-login-password" required 
                                   class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                        </div>
                        <button type="submit" 
                                class="w-full bg-thai-red hover:bg-red-600 text-white p-3 rounded-lg font-medium transition-colors duration-200 mb-4">
                            로그인
                        </button>
                    </form>

                    <div class="text-center">
                        <button onclick="showWorkingGirlRegister()" 
                                class="text-thai-red hover:text-red-600 font-medium">
                            회원가입하기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-container').innerHTML = modalHTML;
}

// 워킹걸 회원가입 모달 표시
function showWorkingGirlRegister() {
    const modalHTML = `
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-overlay p-4" onclick="closeModal(event)">
            <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto modal-content" onclick="event.stopPropagation()">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">워킹걸 회원가입</h2>
                        <button onclick="closeModal()" class="text-gray-600 hover:text-gray-800 text-2xl">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <form onsubmit="registerWorkingGirl(event)">
                        <!-- 기본 정보 -->
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">아이디 *</label>
                                <input type="text" id="reg-user-id" required 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">비밀번호 * (숫자만)</label>
                                <input type="password" id="reg-password" required pattern="[0-9]+" 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">닉네임 *</label>
                                <input type="text" id="reg-nickname" required 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">나이 *</label>
                                <input type="number" id="reg-age" required min="18" max="60" 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">키 (cm) *</label>
                                <input type="number" id="reg-height" required min="140" max="200" 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">몸무게 (kg) *</label>
                                <input type="number" id="reg-weight" required min="35" max="120" 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">성별 *</label>
                                <select id="reg-gender" required 
                                        class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                                    <option value="">선택하세요</option>
                                    <option value="여자">여자</option>
                                    <option value="트랜스젠더">트랜스젠더</option>
                                    <option value="레이디보이">레이디보이</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">거주 지역 *</label>
                                <select id="reg-region" required 
                                        class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                                    <option value="">선택하세요</option>
                                    <option value="방콕">방콕</option>
                                    <option value="파타야">파타야</option>
                                    <option value="치앙마이">치앙마이</option>
                                    <option value="푸켓">푸켓</option>
                                </select>
                            </div>
                        </div>

                        <!-- 연락처 정보 -->
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-3">연락처 정보 *</label>
                            <p class="text-sm text-gray-500 mb-3">라인 아이디 또는 카카오톡 아이디 중 하나는 반드시 입력해주세요.</p>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">라인 아이디</label>
                                    <input type="text" id="reg-line-id" 
                                           class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none"
                                           placeholder="라인 아이디 입력">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">카카오톡 아이디</label>
                                    <input type="text" id="reg-kakao-id" 
                                           class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none"
                                           placeholder="카카오톡 아이디 입력">
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">전화번호 * (숫자만)</label>
                                <input type="tel" id="reg-phone" required 
                                       pattern="[0-9]+" title="숫자만 입력 가능합니다"
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none"
                                       placeholder="01012345678">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">코드</label>
                                <input type="text" id="reg-code" 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                            </div>
                        </div>

                        <!-- 사진 업로드 -->
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 mb-2">사진 업로드 (최대 10장)</label>
                            <input type="file" id="reg-photos" multiple accept="image/*" 
                                   onchange="previewRegisterPhotos(this)"
                                   class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                            <p class="text-sm text-gray-500 mt-1">첫 번째 사진이 메인 사진으로 설정됩니다.</p>
                            
                            <!-- 사진 미리보기 영역 -->
                            <div id="reg-photo-preview" class="mt-4 hidden">
                                <label class="block text-sm font-medium text-gray-700 mb-2">업로드할 사진 미리보기</label>
                                <div id="reg-preview-container" class="grid grid-cols-3 gap-2"></div>
                            </div>
                        </div>

                        <button type="submit" 
                                class="w-full bg-thai-red hover:bg-red-600 text-white p-3 rounded-lg font-medium transition-colors duration-200">
                            회원가입
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-container').innerHTML = modalHTML;
}

// 관리자 로그인 모달 표시
function showAdminLogin() {
    closeSideMenu();
    
    const modalHTML = `
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-overlay p-4" onclick="closeModal(event)">
            <div class="bg-white rounded-lg max-w-md w-full modal-content" onclick="event.stopPropagation()">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">관리자 로그인</h2>
                        <button onclick="closeModal()" class="text-gray-600 hover:text-gray-800 text-2xl">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <form onsubmit="loginAdmin(event)">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">아이디</label>
                            <input type="text" id="admin-login-id" value="admin" required 
                                   class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                        </div>
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
                            <input type="password" id="admin-login-password" required 
                                   class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                        </div>
                        <button type="submit" 
                                class="w-full bg-thai-blue hover:bg-blue-700 text-white p-3 rounded-lg font-medium transition-colors duration-200 mb-4">
                            관리자 로그인
                        </button>
                    </form>

                    <div class="text-center">
                        <button onclick="showChangeAdminPassword()" 
                                class="text-thai-blue hover:text-blue-600 font-medium text-sm">
                            관리자 비밀번호 변경
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-container').innerHTML = modalHTML;
}

// 워킹걸 로그인 처리
function loginWorkingGirl(event) {
    event.preventDefault();
    
    const userId = document.getElementById('wg-login-id').value;
    const password = document.getElementById('wg-login-password').value;

    axios.post('/api/auth/working-girl/login', { user_id: userId, password })
        .then(response => {
            if (response.data.success) {
                localStorage.setItem('thaiwiki_session', response.data.session_token);
                currentUser = response.data.user;
                currentUserType = 'working_girl';
                
                closeModal();
                showNotification('로그인되었습니다!', 'success');
                
                // 프로필 수정 페이지로 이동
                setTimeout(() => {
                    showWorkingGirlEdit();
                }, 1000);
            }
        })
        .catch(error => {
            console.error('Login error:', error);
            showNotification('로그인에 실패했습니다. 아이디와 비밀번호를 확인하세요.', 'error');
        });
}

// 워킹걸 회원가입 처리
function registerWorkingGirl(event) {
    event.preventDefault();
    
    // 연락처 유효성 검사
    const lineId = document.getElementById('reg-line-id').value.trim();
    const kakaoId = document.getElementById('reg-kakao-id').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    
    if (!lineId && !kakaoId) {
        showNotification('라인 아이디 또는 카카오톡 아이디 중 하나는 반드시 입력해주세요.', 'warning');
        return;
    }
    
    if (!phone) {
        showNotification('전화번호는 필수 입력 항목입니다.', 'warning');
        return;
    }
    
    if (!/^[0-9]+$/.test(phone)) {
        showNotification('전화번호는 숫자만 입력 가능합니다.', 'warning');
        return;
    }
    
    const formData = new FormData();
    
    // 기본 정보
    formData.append('user_id', document.getElementById('reg-user-id').value);
    formData.append('password', document.getElementById('reg-password').value);
    formData.append('nickname', document.getElementById('reg-nickname').value);
    formData.append('age', document.getElementById('reg-age').value);
    formData.append('height', document.getElementById('reg-height').value);
    formData.append('weight', document.getElementById('reg-weight').value);
    formData.append('gender', document.getElementById('reg-gender').value);
    formData.append('region', document.getElementById('reg-region').value);
    
    // 연락처 정보
    formData.append('line_id', document.getElementById('reg-line-id').value);
    formData.append('kakao_id', document.getElementById('reg-kakao-id').value);
    formData.append('phone', document.getElementById('reg-phone').value);
    formData.append('code', document.getElementById('reg-code').value);
    
    // 사진 파일들
    const photoFiles = document.getElementById('reg-photos').files;
    if (photoFiles.length > 10) {
        showNotification('사진은 최대 10장까지 업로드 가능합니다.', 'warning');
        return;
    }
    
    for (let i = 0; i < photoFiles.length; i++) {
        formData.append('photos', photoFiles[i]);
    }

    axios.post('/api/auth/working-girl/register', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
        .then(response => {
            if (response.data.success) {
                closeModal();
                showNotification('회원가입이 완료되었습니다!', 'success');
                
                // 자동 로그인 처리
                setTimeout(() => {
                    const userId = document.getElementById('reg-user-id').value;
                    const password = document.getElementById('reg-password').value;
                    
                    axios.post('/api/auth/working-girl/login', { user_id: userId, password })
                        .then(loginResponse => {
                            if (loginResponse.data.success) {
                                localStorage.setItem('thaiwiki_session', loginResponse.data.session_token);
                                currentUser = loginResponse.data.user;
                                currentUserType = 'working_girl';
                                
                                loadWorkingGirls(); // 리스트 새로고침
                            }
                        });
                }, 1000);
            }
        })
        .catch(error => {
            console.error('Registration error:', error);
            const message = error.response?.data?.message || '회원가입에 실패했습니다.';
            showNotification(message, 'error');
        });
}

// 관리자 로그인 처리
function loginAdmin(event) {
    event.preventDefault();
    
    const username = document.getElementById('admin-login-id').value;
    const password = document.getElementById('admin-login-password').value;

    axios.post('/api/auth/admin/login', { username, password })
        .then(response => {
            if (response.data.success) {
                localStorage.setItem('thaiwiki_session', response.data.session_token);
                currentUser = response.data.user;
                currentUserType = 'admin';
                
                closeModal();
                showNotification('관리자 로그인되었습니다!', 'success');
                
                // 관리자 페이지로 이동
                setTimeout(() => {
                    window.location.href = '/admin';
                }, 1000);
            }
        })
        .catch(error => {
            console.error('Admin login error:', error);
            showNotification('관리자 로그인에 실패했습니다.', 'error');
        });
}

// 워킹걸 프로필 수정 모달 표시
function showWorkingGirlEdit() {
    if (!currentUser || currentUserType !== 'working_girl') {
        showNotification('로그인이 필요합니다.', 'warning');
        return;
    }

    // 현재 사용자 정보를 가져와서 폼에 채우기
    const sessionToken = localStorage.getItem('thaiwiki_session');
    axios.get('/api/working-girl/profile', {
        params: { session_token: sessionToken }
    })
        .then(response => {
            const user = response.data;
            showWorkingGirlEditModal(user);
        })
        .catch(error => {
            console.error('Failed to load profile:', error);
            showNotification('프로필 정보를 불러오는데 실패했습니다.', 'error');
        });
}

// 워킹걸 프로필 수정 모달 HTML
function showWorkingGirlEditModal(user) {
    const modalHTML = `
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-overlay p-4" onclick="closeModal(event)">
            <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto modal-content" onclick="event.stopPropagation()">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">프로필 수정</h2>
                        <button onclick="closeModal()" class="text-gray-600 hover:text-gray-800 text-2xl">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <form onsubmit="updateWorkingGirlProfile(event)">
                        <!-- 활동상태 토글 스위치 -->
                        <div class="mb-6 bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
                            <div class="flex items-center justify-between">
                                <div>
                                    <label class="block text-lg font-semibold text-gray-800 mb-2">활동상태</label>
                                    <p class="text-sm text-gray-600">메인 페이지에서 프로필 노출 여부를 설정합니다</p>
                                </div>
                                <div class="flex items-center space-x-4">
                                    <span class="text-sm font-medium text-gray-500 activity-status-text">OFF</span>
                                    <div class="relative">
                                        <input type="checkbox" id="activity-toggle" class="sr-only" 
                                               onchange="toggleActivityStatus(this)">
                                        <label for="activity-toggle" 
                                               class="flex items-center cursor-pointer">
                                            <div class="relative">
                                                <div class="block bg-gray-300 w-14 h-8 rounded-full shadow-inner toggle-bg"></div>
                                                <div class="absolute left-1 top-1 bg-white w-6 h-6 rounded-full shadow 
                                                           transform transition-transform duration-300 ease-in-out toggle-dot"></div>
                                            </div>
                                        </label>
                                    </div>
                                    <span class="text-sm font-medium text-green-500 activity-status-text hidden">ON</span>
                                </div>
                            </div>
                            
                            <div class="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                                <div class="flex items-center space-x-2 status-indicator">
                                    <div class="w-3 h-3 rounded-full bg-red-400 animate-pulse status-dot"></div>
                                    <span class="text-sm font-medium text-red-600 status-text">비활성 - 프로필이 숨겨집니다</span>
                                </div>
                            </div>
                        </div>
                        
                        <style>
                            .toggle-bg.active {
                                background: linear-gradient(135deg, #10B981, #059669);
                            }
                            .toggle-dot.active {
                                transform: translateX(24px);
                            }
                            .status-dot.active {
                                background-color: #10B981;
                            }
                            .activity-status-text.active {
                                color: #10B981;
                                font-weight: 600;
                            }
                        </style>

                        <!-- 기본 정보 -->
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">아이디 (변경불가)</label>
                                <input type="text" value="${user.user_id}" disabled 
                                       class="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">비밀번호 * (숫자만)</label>
                                <input type="password" id="edit-password" value="${user.password}" required pattern="[0-9]+" 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">닉네임 *</label>
                                <input type="text" id="edit-nickname" value="${user.nickname}" required 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">나이 *</label>
                                <input type="number" id="edit-age" value="${user.age}" required min="18" max="60" 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">키 * (cm)</label>
                                <input type="number" id="edit-height" value="${user.height}" required min="140" max="190" 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">몸무게 * (kg)</label>
                                <input type="number" id="edit-weight" value="${user.weight}" required min="35" max="80" 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">성별 *</label>
                                <select id="edit-gender" required 
                                        class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                                    <option value="여자" ${user.gender === '여자' ? 'selected' : ''}>여자</option>
                                    <option value="트랜스젠더" ${user.gender === '트랜스젠더' ? 'selected' : ''}>트랜스젠더</option>
                                    <option value="레이디보이" ${user.gender === '레이디보이' ? 'selected' : ''}>레이디보이</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">지역 *</label>
                                <select id="edit-region" required 
                                        class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                                    <option value="방콕" ${user.region === '방콕' ? 'selected' : ''}>방콕</option>
                                    <option value="파타야" ${user.region === '파타야' ? 'selected' : ''}>파타야</option>
                                    <option value="치앙마이" ${user.region === '치앙마이' ? 'selected' : ''}>치앙마이</option>
                                    <option value="푸켓" ${user.region === '푸켓' ? 'selected' : ''}>푸켓</option>
                                </select>
                            </div>
                        </div>

                        <!-- 연락처 정보 -->
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-3">연락처 정보 *</label>
                            <p class="text-sm text-gray-500 mb-3">라인 아이디 또는 카카오톡 아이디 중 하나는 반드시 입력해주세요.</p>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">라인 아이디</label>
                                    <input type="text" id="edit-line-id" value="${user.line_id || ''}" 
                                           class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none"
                                           placeholder="라인 아이디 입력">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">카카오톡 아이디</label>
                                    <input type="text" id="edit-kakao-id" value="${user.kakao_id || ''}" 
                                           class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none"
                                           placeholder="카카오톡 아이디 입력">
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">전화번호 * (숫자만)</label>
                                <input type="tel" id="edit-phone" value="${user.phone || ''}" required 
                                       pattern="[0-9]+" title="숫자만 입력 가능합니다"
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none"
                                       placeholder="01012345678">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">코드</label>
                                <input type="text" id="edit-code" value="${user.code || ''}" 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                            </div>
                        </div>

                        <!-- 사진 수정 -->
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 mb-2">사진 수정 (최대 10장)</label>
                            <input type="file" id="edit-photos" multiple accept="image/*" 
                                   onchange="previewPhotos(this)"
                                   class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                            <p class="text-sm text-gray-500 mt-1">새로운 사진을 선택하면 기존 사진을 대체합니다. 첫 번째 사진이 메인 사진으로 설정됩니다.</p>
                            
                            <!-- 사진 미리보기 영역 -->
                            <div id="photo-preview" class="mt-4 hidden">
                                <label class="block text-sm font-medium text-gray-700 mb-2">업로드할 사진 미리보기</label>
                                <div id="preview-container" class="grid grid-cols-3 gap-2"></div>
                            </div>
                        </div>

                        <!-- 현재 사진 미리보기 -->
                        <div class="mb-6" id="current-photos-preview">
                            <label class="block text-sm font-medium text-gray-700 mb-2">현재 사진</label>
                            <div class="grid grid-cols-3 gap-2">
                                ${user.photos && user.photos.length > 0 ? user.photos.map((photo, index) => `
                                    <div class="relative">
                                        <img src="${photo.photo_url}" alt="사진 ${index + 1}" class="w-full h-20 object-cover rounded-lg">
                                        ${photo.is_main ? '<span class="absolute top-1 left-1 bg-thai-red text-white text-xs px-1 rounded">메인</span>' : ''}
                                    </div>
                                `).join('') : '<p class="text-gray-500 text-sm">업로드된 사진이 없습니다.</p>'}
                            </div>
                        </div>

                        <div class="flex space-x-4">
                            <button type="submit" 
                                    class="flex-1 bg-thai-red hover:bg-red-600 text-white p-3 rounded-lg font-medium transition-colors duration-200">
                                수정완료
                            </button>
                            <button type="button" onclick="logoutUser()" 
                                    class="flex-1 bg-gray-500 hover:bg-gray-600 text-white p-3 rounded-lg font-medium transition-colors duration-200">
                                로그아웃
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-container').innerHTML = modalHTML;
    
    // 모달이 생성된 후 활동상태 값 설정
    setTimeout(() => {
        const onRadio = document.getElementById('is_active_on');
        const offRadio = document.getElementById('is_active_off');
        
        if (onRadio && offRadio) {
            // 다양한 형태의 활성화 값 확인
            const isActive = user.is_active;
            
            if (isActive === true || isActive === 1 || isActive === '1' || isActive === 'true') {
                onRadio.checked = true;
                console.log('활동상태 ON으로 설정됨');
            } else {
                offRadio.checked = true;
                console.log('활동상태 OFF로 설정됨');
            }
            
            console.log('사용자 활동상태 값:', isActive, '타입:', typeof isActive);
        }
    }, 100);
    
    // 토글 스위치 초기 상태 설정
    setTimeout(() => {
        const toggle = document.getElementById('activity-toggle');
        const toggleBg = document.querySelector('.toggle-bg');
        const toggleDot = document.querySelector('.toggle-dot');
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        const statusTexts = document.querySelectorAll('.activity-status-text');
        
        if (toggle && user.is_active) {
            const isActive = user.is_active === true || user.is_active === 1 || user.is_active === '1' || user.is_active === 'true';
            
            toggle.checked = isActive;
            updateToggleUI(isActive);
        }
    }, 150);
}

// 토글 스위치 상태 변경 함수
function toggleActivityStatus(toggle) {
    updateToggleUI(toggle.checked);
}

// 토글 UI 업데이트 함수
function updateToggleUI(isActive) {
    const toggleBg = document.querySelector('.toggle-bg');
    const toggleDot = document.querySelector('.toggle-dot');
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    const statusTexts = document.querySelectorAll('.activity-status-text');
    
    if (isActive) {
        toggleBg.classList.add('active');
        toggleDot.classList.add('active');
        statusDot.classList.add('active');
        
        statusText.textContent = '활성 - 프로필이 노출됩니다';
        statusText.className = 'text-sm font-medium text-green-600 status-text';
        
        // ON/OFF 텍스트 전환
        statusTexts[0].style.display = 'none'; // OFF 숨기기
        statusTexts[1].style.display = 'block'; // ON 보이기
        statusTexts[1].classList.add('active');
    } else {
        toggleBg.classList.remove('active');
        toggleDot.classList.remove('active');
        statusDot.classList.remove('active');
        
        statusText.textContent = '비활성 - 프로필이 숨겨집니다';
        statusText.className = 'text-sm font-medium text-red-600 status-text';
        
        // ON/OFF 텍스트 전환
        statusTexts[0].style.display = 'block'; // OFF 보이기
        statusTexts[1].style.display = 'none'; // ON 숨기기
        statusTexts[1].classList.remove('active');
    }
}

// 사진 미리보기 함수
function previewPhotos(input) {
    const previewArea = document.getElementById('photo-preview');
    const previewContainer = document.getElementById('preview-container');
    
    if (input.files && input.files.length > 0) {
        previewArea.classList.remove('hidden');
        previewContainer.innerHTML = '';
        
        // 최대 10장까지만 처리
        const filesToProcess = Math.min(input.files.length, 10);
        
        for (let i = 0; i < filesToProcess; i++) {
            const file = input.files[i];
            
            // 파일 크기 체크 (5MB)
            if (file.size > 5 * 1024 * 1024) {
                showNotification(`${file.name}은 5MB를 초과하여 제외됩니다.`, 'warning');
                continue;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewDiv = document.createElement('div');
                previewDiv.className = 'relative group';
                
                previewDiv.innerHTML = `
                    <img src="${e.target.result}" alt="미리보기 ${i + 1}" 
                         class="w-full h-20 object-cover rounded-lg border border-gray-300">
                    <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 
                                transition-opacity duration-200 rounded-lg flex items-center justify-center">
                        <span class="text-white text-xs font-medium">
                            ${i === 0 ? '메인 사진' : `사진 ${i + 1}`}
                        </span>
                    </div>
                    ${i === 0 ? '<span class="absolute top-1 left-1 bg-thai-red text-white text-xs px-1 rounded">메인</span>' : ''}
                `;
                
                previewContainer.appendChild(previewDiv);
            };
            reader.readAsDataURL(file);
        }
        
        if (filesToProcess > 10) {
            showNotification('사진은 최대 10장까지만 업로드됩니다.', 'warning');
        }
    } else {
        previewArea.classList.add('hidden');
    }
}

// 회원가입 사진 미리보기 함수
function previewRegisterPhotos(input) {
    const previewArea = document.getElementById('reg-photo-preview');
    const previewContainer = document.getElementById('reg-preview-container');
    
    if (input.files && input.files.length > 0) {
        previewArea.classList.remove('hidden');
        previewContainer.innerHTML = '';
        
        // 최대 10장까지만 처리
        const filesToProcess = Math.min(input.files.length, 10);
        
        for (let i = 0; i < filesToProcess; i++) {
            const file = input.files[i];
            
            // 파일 크기 체크 (5MB)
            if (file.size > 5 * 1024 * 1024) {
                showNotification(`${file.name}은 5MB를 초과하여 제외됩니다.`, 'warning');
                continue;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewDiv = document.createElement('div');
                previewDiv.className = 'relative group';
                
                previewDiv.innerHTML = `
                    <img src="${e.target.result}" alt="미리보기 ${i + 1}" 
                         class="w-full h-20 object-cover rounded-lg border border-gray-300">
                    <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 
                                transition-opacity duration-200 rounded-lg flex items-center justify-center">
                        <span class="text-white text-xs font-medium">
                            ${i === 0 ? '메인 사진' : `사진 ${i + 1}`}
                        </span>
                    </div>
                    ${i === 0 ? '<span class="absolute top-1 left-1 bg-thai-red text-white text-xs px-1 rounded">메인</span>' : ''}
                `;
                
                previewContainer.appendChild(previewDiv);
            };
            reader.readAsDataURL(file);
        }
        
        if (filesToProcess > 10) {
            showNotification('사진은 최대 10장까지만 업로드됩니다.', 'warning');
        }
    } else {
        previewArea.classList.add('hidden');
    }
}

// 워킹걸 프로필 수정 처리
function updateWorkingGirlProfile(event) {
    event.preventDefault();
    
    const sessionToken = localStorage.getItem('thaiwiki_session');
    if (!sessionToken) {
        showNotification('로그인이 필요합니다.', 'warning');
        return;
    }
    
    // 연락처 유효성 검사
    const lineId = document.getElementById('edit-line-id').value.trim();
    const kakaoId = document.getElementById('edit-kakao-id').value.trim();
    const phone = document.getElementById('edit-phone').value.trim();
    
    if (!lineId && !kakaoId) {
        showNotification('라인 아이디 또는 카카오톡 아이디 중 하나는 반드시 입력해주세요.', 'warning');
        return;
    }
    
    if (!phone) {
        showNotification('전화번호는 필수 입력 항목입니다.', 'warning');
        return;
    }
    
    if (!/^[0-9]+$/.test(phone)) {
        showNotification('전화번호는 숫자만 입력 가능합니다.', 'warning');
        return;
    }
    
    const formData = new FormData();
    
    // 기본 정보 (토글 스위치에서 활동상태 가져오기)
    const activityToggle = document.getElementById('activity-toggle');
    formData.append('is_active', activityToggle.checked);
    formData.append('password', document.getElementById('edit-password').value);
    formData.append('nickname', document.getElementById('edit-nickname').value);
    formData.append('age', document.getElementById('edit-age').value);
    formData.append('height', document.getElementById('edit-height').value);
    formData.append('weight', document.getElementById('edit-weight').value);
    formData.append('gender', document.getElementById('edit-gender').value);
    formData.append('region', document.getElementById('edit-region').value);
    
    // 연락처 정보
    formData.append('line_id', document.getElementById('edit-line-id').value);
    formData.append('kakao_id', document.getElementById('edit-kakao-id').value);
    formData.append('phone', document.getElementById('edit-phone').value);
    formData.append('code', document.getElementById('edit-code').value);
    
    // 세션 토큰
    formData.append('session_token', sessionToken);
    
    // 새로운 사진 파일들 (선택사항)
    const photoFiles = document.getElementById('edit-photos').files;
    if (photoFiles.length > 10) {
        showNotification('사진은 최대 10장까지 업로드 가능합니다.', 'warning');
        return;
    }
    
    for (let i = 0; i < photoFiles.length; i++) {
        formData.append('photos', photoFiles[i]);
    }

    axios.post('/api/working-girl/profile/update', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
        .then(response => {
            if (response.data.success) {
                closeModal();
                showNotification('프로필이 성공적으로 수정되었습니다!', 'success');
                
                // 현재 사용자 정보 업데이트
                currentUser = { ...currentUser, ...response.data.user };
                
                // 활동상태가 변경되었을 경우 워킹걸 리스트 새로고침
                // 사진이 업로드된 경우 강제 새로고침
                if (photoFiles.length > 0) {
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    loadWorkingGirls();
                }
            }
        })
        .catch(error => {
            console.error('Profile update error:', error);
            const message = error.response?.data?.message || '프로필 수정에 실패했습니다.';
            showNotification(message, 'error');
        });
}

// 광고 데이터 로드
function loadAdvertisements() {
    axios.get('/api/advertisements')
        .then(response => {
            advertisementsData = response.data.advertisements || [];
            setupAdSlider();
        })
        .catch(error => {
            console.error('Failed to load advertisements:', error);
        });
}

// 광고 슬라이더 설정
function setupAdSlider() {
    if (advertisementsData.length === 0) return;

    const adSlider = document.getElementById('ad-slider');
    
    // 광고 HTML 생성
    const adsHTML = advertisementsData.map(ad => `
        <div class="min-w-full h-full flex items-center justify-center ad-slide">
            <img src="${ad.image_url}" alt="${ad.title || '광고'}" class="h-full w-auto object-contain" onerror="this.style.display='none'">
        </div>
    `).join('');
    
    adSlider.innerHTML = adsHTML;

    // 자동 슬라이드 시작
    if (advertisementsData.length > 1) {
        setInterval(() => {
            currentAd = (currentAd + 1) % advertisementsData.length;
            adSlider.style.transform = `translateX(-${currentAd * 100}%)`;
        }, 3000); // 3초마다 변경
    }
}

// 로그아웃
function logoutUser() {
    const sessionToken = localStorage.getItem('thaiwiki_session');
    
    if (sessionToken) {
        axios.post('/api/auth/logout', { session_token: sessionToken })
            .then(() => {
                localStorage.removeItem('thaiwiki_session');
                currentUser = null;
                currentUserType = null;
                
                // 로그아웃 처리
                
                closeModal();
                showNotification('로그아웃되었습니다.', 'success');
                
                // 메인 페이지로 이동
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            })
            .catch(error => {
                console.error('Logout error:', error);
                // 로컬에서라도 로그아웃 처리
                localStorage.removeItem('thaiwiki_session');
                location.reload();
            });
    }
}

// 알림 메시지 표시
function showNotification(message, type = 'info') {
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };

    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300`;
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // 5초 후 자동 제거
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}