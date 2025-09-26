// 타이위키 메인 JavaScript

// 전역 변수
let currentUser = null;
let currentUserType = null; // 'working_girl' | 'admin'
let currentAd = 0;
let workingGirlsData = [];
let advertisementsData = [];

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// 앱 초기화
function initializeApp() {
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

    // 활동상태 토글 (삭제됨)
    // const statusToggle = document.getElementById('status-toggle');
    // statusToggle.addEventListener('click', toggleActivityStatus);

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
                    
                    if (currentUserType === 'working_girl') {
                        showActivityStatus(userData.is_active);
                    }
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
    const loading = document.getElementById('loading');
    const noData = document.getElementById('no-data');
    const workingGirlsList = document.getElementById('working-girls-list');

    loading.classList.remove('hidden');
    noData.classList.add('hidden');

    const url = searchQuery ? `/api/working-girls/search?q=${encodeURIComponent(searchQuery)}` : '/api/working-girls';

    axios.get(url)
        .then(response => {
            workingGirlsData = response.data.working_girls || [];
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

// 워킹걸 리스트 표시
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
        // 실제 업로드된 사진 중 첫 번째 사진 또는 메인 사진 찾기
        let mainPhoto = '/static/images/default-avatar.jpg';
        
        if (girl.photos && girl.photos.length > 0) {
            // is_main이 1인 사진 찾기
            const mainPhotoObj = girl.photos.find(photo => photo.is_main === 1);
            if (mainPhotoObj && mainPhotoObj.photo_url) {
                mainPhoto = mainPhotoObj.photo_url;
            } else {
                // is_main이 없으면 첫 번째 사진 사용
                const firstPhoto = girl.photos[0];
                if (firstPhoto && firstPhoto.photo_url) {
                    mainPhoto = firstPhoto.photo_url;
                }
            }
        } else if (girl.main_photo) {
            // 기존 main_photo 필드가 있으면 사용 (호환성)
            mainPhoto = girl.main_photo;
        }
        
        const recommendedBadge = girl.is_recommended ? 
            '<div class="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold recommended-badge"><i class="fas fa-star mr-1"></i>추천</div>' : '';
        
        return `
            <div class="working-girl-card bg-white rounded-lg shadow-md overflow-hidden" onclick="showWorkingGirlDetail(${girl.id})">
                <div class="relative">
                    <div class="w-full aspect-square bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center relative">
                        <img src="${mainPhoto}" alt="${girl.nickname}" class="w-full h-full object-cover" 
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                             onload="this.nextElementSibling.style.display='none';">
                        <div class="absolute inset-0 flex flex-col items-center justify-center text-gray-600 font-medium" style="display: none;">
                            <i class="fas fa-user text-4xl mb-2"></i>
                            <div>${girl.nickname}</div>
                        </div>
                    </div>
                    ${recommendedBadge}
                    ${!girl.is_active ? '<div class="absolute top-2 right-2 bg-gray-500 text-white px-2 py-1 rounded text-xs">비활성</div>' : ''}
                </div>
                <div class="p-4">
                    <h3 class="font-bold text-lg text-gray-800 mb-2">${girl.nickname}</h3>
                    <div class="space-y-1 text-sm text-gray-600">
                        <p><i class="fas fa-venus mr-2 text-pink-500"></i>${girl.gender}</p>
                        <p><i class="fas fa-map-marker-alt mr-2 text-red-500"></i>${girl.region}</p>
                        ${girl.age ? `<p><i class="fas fa-birthday-cake mr-2 text-blue-500"></i>${girl.age}세</p>` : ''}
                        ${girl.height && girl.weight ? `<p><i class="fas fa-ruler-vertical mr-2 text-green-500"></i>${girl.height}cm / ${girl.weight}kg</p>` : 
                          girl.height ? `<p><i class="fas fa-ruler-vertical mr-2 text-green-500"></i>${girl.height}cm</p>` : 
                          girl.weight ? `<p><i class="fas fa-weight mr-2 text-green-500"></i>${girl.weight}kg</p>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    workingGirlsList.innerHTML = cardsHTML;
}

// 워킹걸 검색
function searchWorkingGirls() {
    const searchInput = document.getElementById('search-input');
    const searchQuery = searchInput.value.trim();
    
    loadWorkingGirls(searchQuery);
}

// 워킹걸 상세 정보 표시
function showWorkingGirlDetail(workingGirlId) {
    axios.get(`/api/working-girls/${workingGirlId}`)
        .then(response => {
            const girl = response.data;
            showWorkingGirlModal(girl);
        })
        .catch(error => {
            console.error('Failed to load working girl detail:', error);
            showNotification('상세 정보를 불러오는데 실패했습니다.', 'error');
        });
}

// 워킹걸 상세 모달 표시
function showWorkingGirlModal(girl) {
    console.log('워킹걸 상세 데이터:', girl);
    console.log('사진 데이터:', girl.photos);
    
    // 실제로 유효한 사진만 필터링 (Base64 데이터와 URL 모두 지원)
    const validPhotos = girl.photos ? girl.photos.filter(photo => 
        photo && photo.photo_url && photo.photo_url.trim() !== '' && 
        (photo.photo_url.startsWith('data:') || photo.photo_url.startsWith('http') || photo.photo_url.startsWith('/static/'))
    ) : [];
    
    console.log('유효한 사진 개수:', validPhotos.length);
    
    let photosHTML = '';
    
    if (validPhotos.length > 0) {
        // 실제 등록된 사진만 표시 - 클릭 가능하도록 수정
        photosHTML = validPhotos.map((photo, index) => {
            const safePhotoUrl = photo.photo_url.replace(/'/g, "\\'");
            return `
            <div class="aspect-square bg-gradient-to-br from-pink-200 to-purple-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity" onclick="window.openPhotoLightbox('${safePhotoUrl}', '${girl.nickname}')">
                <img src="${photo.photo_url}" alt="${girl.nickname}" class="w-full h-full object-cover">
            </div>
        `;
        }).join('');
    } else {
        // 등록된 사진이 없는 경우에만 기본 표시
        photosHTML = `
            <div class="aspect-square bg-gradient-to-br from-pink-200 to-purple-200 rounded-lg flex flex-col items-center justify-center text-gray-600 font-medium">
                <i class="fas fa-user text-4xl mb-2"></i>
                <div>${girl.nickname}</div>
                <div class="text-sm mt-1">등록된 사진 없음</div>
            </div>
        `;
    }

    const modalHTML = `
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-overlay p-4" onclick="closeModal(event)">
            <div class="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto modal-content" onclick="event.stopPropagation()">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">${girl.nickname}</h2>
                        <button onclick="closeModal()" class="text-gray-600 hover:text-gray-800 text-2xl">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <!-- 사진들 -->
                    ${validPhotos.length > 0 ? `
                    <div class="mb-4">
                        <h3 class="text-lg font-semibold text-gray-800 mb-3">사진 (${validPhotos.length}장)</h3>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                            ${photosHTML}
                        </div>
                    </div>
                    ` : `
                    <div class="mb-6 flex justify-center">
                        ${photosHTML}
                    </div>
                    `}

                    <!-- 기본 정보 -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h4 class="font-semibold text-gray-800 mb-3">기본 정보</h4>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-gray-600">아이디:</span>
                                    <span class="font-medium">${girl.user_id || '미입력'}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">닉네임:</span>
                                    <span class="font-medium">${girl.nickname || '미입력'}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">나이:</span>
                                    <span class="font-medium">${girl.age ? girl.age + '세' : '미입력'}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">성별:</span>
                                    <span class="font-medium">${girl.gender || '미입력'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h4 class="font-semibold text-gray-800 mb-3">신체 정보</h4>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-gray-600">키:</span>
                                    <span class="font-medium">${girl.height ? girl.height + 'cm' : '미입력'}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">몸무게:</span>
                                    <span class="font-medium">${girl.weight ? girl.weight + 'kg' : '미입력'}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">지역:</span>
                                    <span class="font-medium">${girl.region || '미입력'}</span>
                                </div>
                                ${girl.is_recommended ? `
                                <div class="flex justify-between">
                                    <span class="text-gray-600">추천:</span>
                                    <span class="font-medium text-yellow-600">
                                        <i class="fas fa-star"></i> 추천 워킹걸
                                    </span>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>

                    <!-- 활동 상태 정보 -->
                    <div class="mb-6">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h4 class="font-semibold text-gray-800 mb-3">상태 정보</h4>
                            <div class="flex items-center justify-between">
                                <span class="text-gray-600">활동 상태:</span>
                                <span class="px-3 py-1 rounded-full text-sm font-medium ${
                                    girl.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }">
                                    ${girl.is_active ? '활성' : '비활성'}
                                </span>
                            </div>
                        </div>
                    </div>

                    ${girl.conditions && girl.conditions.trim() !== '' ? `
                    <!-- 조건 정보 -->
                    <div class="mb-6">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h4 class="font-semibold text-gray-800 mb-3">조건</h4>
                            <div class="text-gray-700 whitespace-pre-line">${girl.conditions}</div>
                        </div>
                    </div>
                    ` : ''}

                    <!-- 만남 요청 버튼 -->
                    <div class="mt-6 text-center">
                        <button onclick="requestMeeting(${girl.id})" class="bg-thai-red hover:bg-red-600 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors duration-200">
                            <i class="fas fa-heart mr-2"></i>만남 요청
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-container').innerHTML = modalHTML;
}

// 만남 요청 (준비만 해두고 나중에 링크 연결)
function requestMeeting(workingGirlId) {
    // 향후 만남 요청 링크로 이동할 준비
    showNotification('만남 요청 기능은 준비 중입니다.', 'info');
}

// 모달 닫기
function closeModal(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('modal-container').innerHTML = '';
}

// 워킹걸 로그인 모달 표시
function showWorkingGirlLogin() {
    closeSideMenu();
    
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
                        <!-- 활동상태 -->
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">활동상태</label>
                            <div class="flex space-x-4">
                                <label class="flex items-center">
                                    <input type="radio" name="is_active" value="true" checked class="mr-2">
                                    <span>ON</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="radio" name="is_active" value="false" class="mr-2">
                                    <span>OFF</span>
                                </label>
                            </div>
                        </div>

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
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">라인 아이디</label>
                                <input type="text" id="reg-line-id" 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">카카오톡 아이디</label>
                                <input type="text" id="reg-kakao-id" 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">전화번호</label>
                                <input type="tel" id="reg-phone" 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">코드</label>
                                <input type="text" id="reg-code" 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                            </div>
                        </div>

                        <!-- 조건 입력 -->
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">조건</label>
                            <textarea id="reg-conditions" rows="4" 
                                      class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none resize-vertical"
                                      placeholder="서비스 조건을 입력해주세요..."></textarea>
                        </div>

                        <!-- 사진 업로드 -->
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 mb-2">사진 업로드 (최대 10장)</label>
                            <input type="file" id="reg-photos" multiple accept="image/*" 
                                   class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                            <p class="text-sm text-gray-500 mt-1">첫 번째 사진이 메인 사진으로 설정됩니다.</p>
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
                // 세션 데이터를 올바른 JSON 형태로 저장
                const sessionData = {
                    session_token: response.data.session_token,
                    user_type: 'working_girl'
                };
                localStorage.setItem('thaiwiki_session', JSON.stringify(sessionData));
                console.log('Session saved:', sessionData);
                currentUser = response.data.user;
                currentUserType = 'working_girl';
                
                showActivityStatus(response.data.user.is_active);
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
    
    const formData = new FormData();
    
    // 기본 정보
    const isActiveElement = document.querySelector('input[name="is_active"]:checked');
    const isActive = isActiveElement ? isActiveElement.value === 'true' : true; // 기본값: true
    formData.append('is_active', isActive);
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
    formData.append('conditions', document.getElementById('reg-conditions').value);
    
    // 사진 파일들
    const photoFiles = document.getElementById('reg-photos').files;
    if (photoFiles.length > 10) {
        showNotification('사진은 최대 10장까지 업로드 가능합니다.', 'warning');
        return;
    }
    
    // 디버깅: 파일 정보 확인
    console.log('Selected files count:', photoFiles.length);
    for (let i = 0; i < photoFiles.length; i++) {
        console.log('File', i, ':', {
            name: photoFiles[i].name,
            size: photoFiles[i].size,
            type: photoFiles[i].type
        });
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
                                
                                showActivityStatus(loginResponse.data.user.is_active);
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
                // 관리자 세션 데이터 저장
                const sessionData = {
                    session_token: response.data.session_token,
                    user_type: 'admin'
                };
                localStorage.setItem('thaiwiki_session', JSON.stringify(sessionData));
                console.log('Admin session saved:', sessionData);
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
    const sessionData = localStorage.getItem('thaiwiki_session');
    let sessionToken;
    
    try {
        const session = JSON.parse(sessionData);
        sessionToken = session.session_token;
        console.log('프로필 로드용 세션 토큰:', sessionToken);
    } catch (e) {
        console.error('세션 파싱 실패:', e);
        showNotification('세션 오류. 다시 로그인해주세요.', 'error');
        return;
    }
    
    axios.get('/api/working-girl/profile', {
        headers: {
            'Authorization': `Bearer ${sessionToken}`
        }
    })
        .then(response => {
            if (response.data.success) {
                const user = response.data.profile;
                showWorkingGirlEditModal(user);
            } else {
                showNotification(response.data.message || '프로필 정보를 불러올 수 없습니다.', 'error');
            }
        })
        .catch(error => {
            console.error('Failed to load profile:', error);
            showNotification('프로필 정보를 불러오는데 실패했습니다.', 'error');
        });
}

// 워킹걸 프로필 수정 모달 HTML
function showWorkingGirlEditModal(user) {
    console.log('프로필 수정 모달 - 사용자 데이터:', user);
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
                        <!-- 활동상태 -->
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">활동상태</label>
                            <div class="flex space-x-4">
                                <label class="flex items-center">
                                    <input type="radio" name="is_active" value="true" ${user.is_active ? 'checked' : ''} class="mr-2">
                                    <span>ON</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="radio" name="is_active" value="false" ${!user.is_active ? 'checked' : ''} class="mr-2">
                                    <span>OFF</span>
                                </label>
                            </div>
                        </div>

                        <!-- 기존 폼과 동일하되 값이 채워진 상태 -->
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">아이디 (변경불가)</label>
                                <input type="text" value="${user.user_id}" disabled 
                                       class="w-full p-3 border border-gray-300 rounded-lg bg-gray-100">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">새 비밀번호 (숫자만, 변경할 때만 입력)</label>
                                <input type="password" id="edit-password" placeholder="새 비밀번호를 입력하세요 (숫자만)" pattern="[0-9]+" 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                                <p class="text-sm text-gray-500 mt-1">비밀번호를 변경하지 않으려면 빈 칸으로 두세요.</p>
                            </div>
                        </div>

                        <!-- 기본 정보 -->
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">닉네임 *</label>
                                <input type="text" id="edit-nickname" value="${user.nickname || ''}" required 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">나이 *</label>
                                <input type="number" id="edit-age" value="${user.age || ''}" required min="18" max="60" 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">키 (cm) *</label>
                                <input type="number" id="edit-height" value="${user.height || ''}" required min="140" max="200" 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">몸무게 (kg) *</label>
                                <input type="number" id="edit-weight" value="${user.weight || ''}" required min="35" max="120" 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">성별 *</label>
                                <select id="edit-gender" required 
                                        class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                                    <option value="">선택하세요</option>
                                    <option value="여자" ${user.gender === '여자' ? 'selected' : ''}>여자</option>
                                    <option value="트랜스젠더" ${user.gender === '트랜스젠더' ? 'selected' : ''}>트랜스젠더</option>
                                    <option value="레이디보이" ${user.gender === '레이디보이' ? 'selected' : ''}>레이디보이</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">거주 지역 *</label>
                                <select id="edit-region" required 
                                        class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                                    <option value="">선택하세요</option>
                                    <option value="방콕" ${user.region === '방콕' ? 'selected' : ''}>방콕</option>
                                    <option value="파타야" ${user.region === '파타야' ? 'selected' : ''}>파타야</option>
                                    <option value="치앙마이" ${user.region === '치앙마이' ? 'selected' : ''}>치앙마이</option>
                                    <option value="푸켓" ${user.region === '푸켓' ? 'selected' : ''}>푸켓</option>
                                </select>
                            </div>
                        </div>

                        <!-- 연락처 정보 -->
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">라인 아이디</label>
                                <input type="text" id="edit-line-id" value="${user.line_id || ''}" 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">카카오톡 아이디</label>
                                <input type="text" id="edit-kakao-id" value="${user.kakao_id || ''}" 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">전화번호</label>
                                <input type="tel" id="edit-phone" value="${user.phone || ''}" 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">코드</label>
                                <input type="text" id="edit-code" value="${user.code || ''}" 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                            </div>
                        </div>

                        <!-- 조건 입력 -->
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">조건</label>
                            <textarea id="edit-conditions" rows="4" 
                                      class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none resize-vertical"
                                      placeholder="서비스 조건을 입력해주세요...">${user.conditions || ''}</textarea>
                        </div>

                        <!-- 사진 업로드 -->
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 mb-2">사진 업로드 (최대 10장)</label>
                            <input type="file" id="edit-photos" multiple accept="image/*" 
                                   class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                            <p class="text-sm text-gray-500 mt-1">새 사진을 선택하면 기존 사진을 대체합니다. 첫 번째 사진이 메인 사진으로 설정됩니다.</p>
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
    const adsHTML = advertisementsData.map((ad, index) => {
        const imgElement = `<img src="${ad.image_url}" alt="${ad.title || '광고'}" class="h-full w-auto object-contain" onerror="this.style.display='none'">`;
        
        if (ad.link_url && ad.link_url.trim()) {
            // 링크가 있는 경우 클릭 가능한 요소로 래핑
            return `
                <div class="min-w-full h-full flex items-center justify-center ad-slide">
                    <a href="${ad.link_url}" target="_blank" rel="noopener noreferrer" class="h-full flex items-center justify-center cursor-pointer" title="광고 페이지로 이동">
                        ${imgElement}
                    </a>
                </div>
            `;
        } else {
            // 링크가 없는 경우 일반 이미지
            return `
                <div class="min-w-full h-full flex items-center justify-center ad-slide">
                    ${imgElement}
                </div>
            `;
        }
    }).join('');
    
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
                
                // 활동상태 숨기기
                document.getElementById('activity-status').classList.add('hidden');
                
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

// 워킹걸 프로필 업데이트 - 완전히 새로운 접근
async function updateWorkingGirlProfile(event) {
    event.preventDefault();
    
    console.log('=== 프로필 업데이트 시작 ===');
    
    try {
        // 1. 세션 확인 (간단하게)
        const sessionData = localStorage.getItem('thaiwiki_session');
        if (!sessionData) {
            showNotification('로그인이 필요합니다.', 'error');
            return;
        }
        
        let sessionInfo;
        try {
            sessionInfo = JSON.parse(sessionData);
        } catch (e) {
            console.log('세션 파싱 실패, localStorage 정리 후 다시 로그인 필요');
            localStorage.removeItem('thaiwiki_session');
            showNotification('세션 오류. 다시 로그인해주세요.', 'error');
            return;
        }
        
        console.log('세션 정보:', sessionInfo);
        
        // 2. 사진 파일 체크 후 FormData 또는 JSON 사용
        const photoFiles = document.getElementById('edit-photos').files;
        let requestData, contentType;
        
        if (photoFiles.length > 0) {
            // 사진이 있는 경우: FormData 사용
            console.log('사진 업로드 포함:', photoFiles.length + '개 파일');
            requestData = new FormData();
            requestData.append('session_token', sessionInfo.session_token);
            requestData.append('is_active', document.querySelector('input[name="is_active"]:checked').value);
            requestData.append('nickname', document.getElementById('edit-nickname').value);
            requestData.append('age', document.getElementById('edit-age').value);
            requestData.append('height', document.getElementById('edit-height').value);
            requestData.append('weight', document.getElementById('edit-weight').value);
            requestData.append('gender', document.getElementById('edit-gender').value);
            requestData.append('region', document.getElementById('edit-region').value);
            requestData.append('line_id', document.getElementById('edit-line-id').value || '');
            requestData.append('kakao_id', document.getElementById('edit-kakao-id').value || '');
            requestData.append('phone', document.getElementById('edit-phone').value || '');
            requestData.append('code', document.getElementById('edit-code').value || '');
            requestData.append('conditions', document.getElementById('edit-conditions').value || '');
            
            const newPassword = document.getElementById('edit-password').value;
            if (newPassword && newPassword.trim() !== '') {
                requestData.append('password', newPassword);
            }
            
            // 사진 파일들 추가
            for (let i = 0; i < photoFiles.length && i < 10; i++) {
                requestData.append('photos', photoFiles[i]);
            }
            
            contentType = null; // FormData는 Content-Type을 브라우저가 자동 설정
        } else {
            // 사진이 없는 경우: JSON 사용
            console.log('사진 업로드 없음 - JSON 전송');
            requestData = {
                session_token: sessionInfo.session_token,
                is_active: document.querySelector('input[name="is_active"]:checked').value === 'true',
                nickname: document.getElementById('edit-nickname').value,
                age: parseInt(document.getElementById('edit-age').value),
                height: parseInt(document.getElementById('edit-height').value),
                weight: parseInt(document.getElementById('edit-weight').value),
                gender: document.getElementById('edit-gender').value,
                region: document.getElementById('edit-region').value,
                line_id: document.getElementById('edit-line-id').value || '',
                kakao_id: document.getElementById('edit-kakao-id').value || '',
                phone: document.getElementById('edit-phone').value || '',
                code: document.getElementById('edit-code').value || '',
                conditions: document.getElementById('edit-conditions').value || ''
            };
            
            const newPassword = document.getElementById('edit-password').value;
            if (newPassword && newPassword.trim() !== '') {
                requestData.password = newPassword;
            }
            
            contentType = 'application/json';
            requestData = JSON.stringify(requestData);
        }
        
        console.log('전송 방식:', contentType ? 'JSON' : 'FormData');
        
        // 3. 요청 전송
        const fetchOptions = {
            method: 'POST',
            body: requestData
        };
        
        if (contentType) {
            fetchOptions.headers = { 'Content-Type': contentType };
        }
        
        console.log('API 요청 시작...');
        const response = await fetch('/api/working-girl/update-profile', fetchOptions);
        
        console.log('응답 상태:', response.status);
        
        const responseText = await response.text();
        console.log('응답 텍스트:', responseText);
        
        const result = JSON.parse(responseText);
        console.log('파싱된 결과:', result);
        
        // 4. 결과 처리
        if (result.success) {
            showNotification('프로필이 업데이트되었습니다!', 'success');
            closeModal();
            if (typeof loadWorkingGirls === 'function') {
                loadWorkingGirls();
            }
        } else {
            showNotification(result.message || '업데이트 실패', 'error');
        }
        
    } catch (error) {
        console.error('프로필 업데이트 에러:', error);
        showNotification('프로필 업데이트 중 오류가 발생했습니다: ' + error.message, 'error');
    }
}

// 사진 라이트박스 기능
function showPhotoLightbox(photoUrl, nickname) {
    const lightboxHTML = `
        <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] photo-lightbox" onclick="closePhotoLightbox(event)">
            <div class="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center" onclick="event.stopPropagation()">
                <img src="${photoUrl}" alt="${nickname}" class="max-w-full max-h-full object-contain rounded-lg shadow-2xl">
                <button onclick="closePhotoLightbox()" class="absolute top-4 right-4 text-white bg-black/50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70 transition-colors">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', lightboxHTML);
    document.body.style.overflow = 'hidden'; // 배경 스크롤 방지
}

function closePhotoLightbox(event) {
    if (event && event.target !== event.currentTarget) return;
    
    const lightbox = document.querySelector('.photo-lightbox');
    if (lightbox) {
        lightbox.remove();
        document.body.style.overflow = ''; // 스크롤 복원
    }
}

// 전역 함수로 라이트박스 열기
window.openPhotoLightbox = function(photoUrl, nickname) {
    console.log('라이트박스 열기:', photoUrl, nickname);
    showPhotoLightbox(photoUrl, nickname);
};