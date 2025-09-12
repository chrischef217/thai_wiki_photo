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
        const mainPhoto = girl.main_photo || '/static/images/default-avatar.jpg';
        const recommendedBadge = girl.is_recommended ? 
            '<div class="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold recommended-badge"><i class="fas fa-star mr-1"></i>추천</div>' : '';
        
        return `
            <div class="working-girl-card bg-white rounded-lg shadow-md overflow-hidden" onclick="showWorkingGirlDetail(${girl.id})">
                <div class="relative">
                    <img src="${mainPhoto}" alt="${girl.nickname}" class="w-full h-48 object-cover" onerror="this.src='/static/images/default-avatar.jpg'">
                    ${recommendedBadge}
                    ${!girl.is_active ? '<div class="absolute top-2 right-2 bg-gray-500 text-white px-2 py-1 rounded text-xs">비활성</div>' : ''}
                </div>
                <div class="p-4">
                    <h3 class="font-bold text-lg text-gray-800 mb-2">${girl.nickname}</h3>
                    <div class="space-y-1 text-sm text-gray-600">
                        <p><i class="fas fa-venus mr-2 text-pink-500"></i>${girl.gender}</p>
                        <p><i class="fas fa-map-marker-alt mr-2 text-red-500"></i>${girl.region}</p>
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
    const photosHTML = girl.photos && girl.photos.length > 0 ? 
        girl.photos.map(photo => `
            <img src="${photo.photo_url}" alt="${girl.nickname}" class="w-full h-48 object-cover rounded-lg" onerror="this.src='/static/images/default-avatar.jpg'">
        `).join('') : 
        `<img src="/static/images/default-avatar.jpg" alt="${girl.nickname}" class="w-full h-48 object-cover rounded-lg">`;

    const modalHTML = `
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-overlay p-4" onclick="closeModal(event)">
            <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto modal-content" onclick="event.stopPropagation()">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">${girl.nickname}</h2>
                        <button onclick="closeModal()" class="text-gray-600 hover:text-gray-800 text-2xl">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <!-- 사진들 -->
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        ${photosHTML}
                    </div>

                    <!-- 기본 정보 -->
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">나이</label>
                            <p class="mt-1 text-lg">${girl.age}세</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">성별</label>
                            <p class="mt-1 text-lg">${girl.gender}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">키</label>
                            <p class="mt-1 text-lg">${girl.height}cm</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">몸무게</label>
                            <p class="mt-1 text-lg">${girl.weight}kg</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">거주 지역</label>
                            <p class="mt-1 text-lg">${girl.region}</p>
                        </div>
                        ${girl.code ? `
                        <div>
                            <label class="block text-sm font-medium text-gray-700">코드</label>
                            <p class="mt-1 text-lg font-bold text-thai-red">${girl.code}</p>
                        </div>
                        ` : ''}
                    </div>

                    <!-- 연락처 정보 -->
                    ${girl.phone ? `
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700">전화번호</label>
                        <p class="mt-1 text-lg">${girl.phone}</p>
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
                localStorage.setItem('thaiwiki_session', response.data.session_token);
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
                                <label class="block text-sm font-medium text-gray-700 mb-2">비밀번호 * (숫자만)</label>
                                <input type="password" id="edit-password" value="${user.password}" required pattern="[0-9]+" 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
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

// 워킹걸 프로필 업데이트
async function updateWorkingGirlProfile(event) {
    event.preventDefault();
    
    try {
        // 세션 토큰 확인
        const sessionData = localStorage.getItem('thaiwiki_session');
        if (!sessionData) {
            showNotification('로그인이 필요합니다.', 'error');
            return;
        }
        
        const { session_token } = JSON.parse(sessionData);
        
        // 폼 데이터 수집
        const formData = new FormData();
        formData.append('session_token', session_token);
        formData.append('is_active', document.querySelector('input[name="is_active"]:checked').value === 'true');
        formData.append('password', document.getElementById('edit-password').value);
        formData.append('nickname', document.getElementById('edit-nickname').value);
        formData.append('age', document.getElementById('edit-age').value);
        formData.append('height', document.getElementById('edit-height').value);
        formData.append('weight', document.getElementById('edit-weight').value);
        formData.append('gender', document.getElementById('edit-gender').value);
        formData.append('region', document.getElementById('edit-region').value);
        formData.append('line_id', document.getElementById('edit-line-id').value);
        formData.append('kakao_id', document.getElementById('edit-kakao-id').value);
        formData.append('phone', document.getElementById('edit-phone').value);
        formData.append('code', document.getElementById('edit-code').value);
        
        // 사진 파일 추가 (새로 선택된 사진이 있는 경우)
        const photoFiles = document.getElementById('edit-photos').files;
        if (photoFiles.length > 0) {
            for (let i = 0; i < photoFiles.length && i < 10; i++) {
                formData.append('photos', photoFiles[i]);
            }
        }
        
        // API 호출
        const response = await axios.post('/api/working-girl/update-profile', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        
        if (response.data.success) {
            showNotification('프로필이 성공적으로 업데이트되었습니다.', 'success');
            
            // 현재 사용자 정보 업데이트
            currentUser = response.data.user;
            
            closeModal();
            
            // 활동상태 표시 업데이트
            updateActivityStatusDisplay();
            
            // 프로필 목록 새로고침 (메인 페이지에 있다면)
            if (typeof loadWorkingGirls === 'function') {
                loadWorkingGirls();
            }
        } else {
            showNotification(response.data.message || '업데이트에 실패했습니다.', 'error');
        }
        
    } catch (error) {
        console.error('Profile update error:', error);
        if (error.response && error.response.data && error.response.data.message) {
            showNotification(error.response.data.message, 'error');
        } else {
            showNotification('프로필 업데이트 중 오류가 발생했습니다.', 'error');
        }
    }
}