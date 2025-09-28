// 타이위키 메인 JavaScript

// 전역 변수
let currentUser = null;
let currentUserType = null; // 'working_girl' | 'admin'
let currentAd = 0;
let workingGirlsData = [];
let advertisementsData = [];

// 무한 스크롤 페이지네이션 변수
let currentPage = 1;
let currentLimit = 20;
let isLoading = false;
let hasMoreData = true;
let currentSearchQuery = '';
let isScrollListenerActive = false;

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

// 워킹걸 데이터 로드 (무한 스크롤 지원)
function loadWorkingGirls(searchQuery = '', resetData = true) {
    console.log('🔍 loadWorkingGirls 호출:', { searchQuery, resetData, currentPage, isLoading, hasMoreData });
    
    // 이미 로딩 중이거나 더 이상 데이터가 없으면 중단
    if (isLoading || (!resetData && !hasMoreData)) {
        console.log('로딩 중단:', { isLoading, hasMoreData, resetData });
        return;
    }
    
    // 새 검색이거나 초기 로드인 경우 상태 초기화
    if (resetData) {
        currentPage = 1;
        hasMoreData = true;
        currentSearchQuery = searchQuery;
        workingGirlsData = [];
        
        // 스크롤 리스너 제거 후 재등록
        removeScrollListener();
    }
    
    isLoading = true;
    
    const loading = document.getElementById('loading');
    const noData = document.getElementById('no-data');
    const workingGirlsList = document.getElementById('working-girls-list');

    // 첫 페이지 로딩시에만 로딩 인디케이터 표시
    if (resetData) {
        loading.classList.remove('hidden');
        noData.classList.add('hidden');
    }

    // URL 구성 - 페이지네이션 파라미터 포함
    const baseUrl = searchQuery ? '/api/working-girls/search' : '/api/working-girls';
    const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: currentLimit.toString()
    });
    
    if (searchQuery) {
        params.append('q', searchQuery);
    }
    
    const url = `${baseUrl}?${params.toString()}`;
    console.log('🌐 API 요청 URL:', url, '| currentPage:', currentPage, '| resetData:', resetData);

    axios.get(url)
        .then(response => {
            console.log('API 응답:', response.data);
            
            const newWorkingGirls = response.data.working_girls || [];
            const pagination = response.data.pagination || {};
            
            // 데이터 병합 또는 교체
            if (resetData) {
                workingGirlsData = newWorkingGirls;
            } else {
                workingGirlsData = [...workingGirlsData, ...newWorkingGirls];
            }
            
            // 페이지네이션 상태 업데이트
            hasMoreData = pagination.hasMore !== undefined ? pagination.hasMore : newWorkingGirls.length === currentLimit;
            
            // UI 업데이트
            displayWorkingGirls(workingGirlsData, resetData);
            
            // 성공적인 로딩 후 페이지 번호 증가
            currentPage++;
            
            console.log('📊 데이터 로드 완료:', {
                totalItems: workingGirlsData.length,
                newItems: newWorkingGirls.length,
                hasMoreData,
                nextPage: currentPage
            });
            
            // 스크롤 리스너 등록 (첫 로드 후)
            if (resetData) {
                addScrollListener();
                hideScrollLoading();
                hideLoadMoreButton();
            } else {
                hideScrollLoading();
                hideLoadMoreButton();
                
                // 더 많은 데이터가 있으면 로드 모어 버튼 표시
                if (hasMoreData) {
                    showLoadMoreButton();
                }
            }
        })
        .catch(error => {
            console.error('Failed to load working girls:', error);
            showNotification('데이터를 불러오는데 실패했습니다.', 'error');
        })
        .finally(() => {
            isLoading = false;
            hideScrollLoading();
            
            if (resetData) {
                loading.classList.add('hidden');
            }
        });
}

// 무한 스크롤 리스너 추가
function addScrollListener() {
    if (isScrollListenerActive) {
        console.log('스크롤 리스너 이미 활성화됨');
        return;
    }
    
    console.log('스크롤 리스너 추가');
    window.addEventListener('scroll', handleScroll);
    isScrollListenerActive = true;
}

// 스크롤 리스너 제거
function removeScrollListener() {
    if (!isScrollListenerActive) {
        return;
    }
    
    console.log('스크롤 리스너 제거');
    window.removeEventListener('scroll', handleScroll);
    isScrollListenerActive = false;
}

// 스크롤 이벤트 처리
function handleScroll() {
    // 로딩 중이거나 더 이상 데이터가 없으면 중단
    if (isLoading || !hasMoreData) {
        return;
    }
    
    // 페이지 하단에서 300px 이내에 도달하면 다음 페이지 로드
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    const scrollThreshold = 300; // 300px 전에 미리 로드
    
    if (scrollTop + windowHeight >= documentHeight - scrollThreshold) {
        console.log('📜 스크롤 하단 도달 - 다음 페이지 로드 | 현재 페이지:', currentPage, '| 더 많은 데이터:', hasMoreData);
        showScrollLoading(); // 스크롤 로딩 인디케이터 표시
        loadWorkingGirls(currentSearchQuery, false); // resetData = false로 추가 로드
    }
}

// 로딩 인디케이터 표시 (스크롤 로딩용)
function showScrollLoading() {
    const workingGirlsList = document.getElementById('working-girls-list');
    
    // 이미 로딩 인디케이터가 있으면 중복 방지
    if (document.getElementById('scroll-loading')) {
        return;
    }
    
    const loadingHTML = `
        <div id="scroll-loading" class="col-span-full flex justify-center items-center py-8">
            <div class="flex items-center space-x-2 text-gray-600">
                <i class="fas fa-spinner fa-spin"></i>
                <span>추가 데이터를 불러오는 중...</span>
            </div>
        </div>
    `;
    
    workingGirlsList.insertAdjacentHTML('beforeend', loadingHTML);
}

// 로딩 인디케이터 제거
function hideScrollLoading() {
    const scrollLoading = document.getElementById('scroll-loading');
    if (scrollLoading) {
        scrollLoading.remove();
    }
}

// "Load More" 버튼 표시 (스크롤이 작동하지 않을 때를 위한 대비책)
function showLoadMoreButton() {
    const workingGirlsList = document.getElementById('working-girls-list');
    
    // 이미 버튼이 있으면 중복 방지
    if (document.getElementById('load-more-btn')) {
        return;
    }
    
    if (hasMoreData && !isLoading) {
        const buttonHTML = `
            <div id="load-more-btn" class="col-span-full flex justify-center mt-8">
                <button onclick="loadMoreWorkingGirls()" class="bg-thai-red hover:bg-red-600 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200">
                    <i class="fas fa-plus mr-2"></i>더 보기
                </button>
            </div>
        `;
        workingGirlsList.insertAdjacentHTML('beforeend', buttonHTML);
    }
}

// "Load More" 버튼 제거
function hideLoadMoreButton() {
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.remove();
    }
}

// 수동으로 더 보기 (버튼 클릭용)
function loadMoreWorkingGirls() {
    if (hasMoreData && !isLoading) {
        hideLoadMoreButton();
        loadWorkingGirls(currentSearchQuery, false);
    }
}

// 워킹걸 리스트 표시 (무한 스크롤 지원)
function displayWorkingGirls(workingGirls, resetContent = true) {
    const workingGirlsList = document.getElementById('working-girls-list');
    const noData = document.getElementById('no-data');

    if (workingGirls.length === 0 && resetContent) {
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
        
        // VIP 뱃지 (왕관 스타일)
        const vipBadge = girl.is_vip ? 
            '<div class="absolute top-2 left-2 bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 text-black px-3 py-1 rounded-lg text-xs font-bold vip-badge shadow-xl border-2 border-yellow-300 z-10 transform hover:scale-105 transition-transform"><span class="text-yellow-900">👑</span> <span class="text-yellow-900 font-extrabold">VIP</span></div>' : '';
        
        // 추천 뱃지 (VIP가 없을 때만 표시)
        const recommendedBadge = !girl.is_vip && girl.is_recommended ? 
            '<div class="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full text-xs font-bold recommended-badge shadow-lg"><i class="fas fa-star mr-1"></i>추천</div>' : '';
        
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
                    ${vipBadge}
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

    // 내용 교체 또는 추가
    if (resetContent) {
        workingGirlsList.innerHTML = cardsHTML;
    } else {
        workingGirlsList.insertAdjacentHTML('beforeend', cardsHTML);
    }
}

// 워킹걸 검색
function searchWorkingGirls() {
    const searchInput = document.getElementById('search-input');
    const searchQuery = searchInput.value.trim();
    
    console.log('검색 실행:', searchQuery);
    loadWorkingGirls(searchQuery, true); // resetData = true로 새로운 검색 시작
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

// 만남 요청 - 텔레그램 전송
function requestMeeting(workingGirlId) {
    // 텔레그램 정보 입력 모달 표시
    const modalHTML = `
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-[55] modal-overlay" onclick="closeMeetingModal(event)">
            <div class="bg-white rounded-lg max-w-md w-full mx-4 modal-content" onclick="event.stopPropagation()">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold text-gray-800">만남 요청</h3>
                        <button onclick="closeMeetingModal()" class="text-gray-600 hover:text-gray-800 text-2xl">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <form onsubmit="submitMeetingRequest(event, ${workingGirlId})">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">요청자 이름 *</label>
                            <input type="text" id="meeting-user-name" required 
                                   placeholder="예: 김철수"
                                   class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                        </div>
                        
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">텔레그램 아이디 *</label>
                            <input type="text" id="meeting-telegram" required 
                                   placeholder="예: @username 또는 username"
                                   class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none">
                            <p class="text-sm text-gray-500 mt-1">@ 기호는 입력하지 않으셔도 됩니다.</p>
                        </div>
                        
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">현재 위치 *</label>
                            <div class="flex space-x-2">
                                <button type="button" onclick="getCurrentLocation()" 
                                        class="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg font-medium transition-colors duration-200">
                                    <i class="fas fa-map-marker-alt mr-2"></i>위치 확인
                                </button>
                                <div id="location-status" class="flex-2 p-2 text-sm text-gray-600">
                                    위치를 확인해주세요
                                </div>
                            </div>
                            <input type="hidden" id="user-location" value="" required>
                        </div>
                        
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">추가 메시지 (선택)</label>
                            <textarea id="meeting-message" rows="3" 
                                      placeholder="간단한 인사나 요청 사항을 입력해주세요..."
                                      class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-red focus:outline-none resize-vertical"></textarea>
                        </div>
                        
                        <!-- 중요 안내 문구 -->
                        <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div class="flex items-start space-x-2">
                                <i class="fas fa-info-circle text-blue-500 mt-0.5"></i>
                                <div class="text-sm text-blue-700">
                                    <strong>중요 안내:</strong><br>
                                    만남 요청은 텔레그램으로 전송되오니, 반드시 텔레그램을 사용해 주셔야 합니다. 요청을 보내신 후 담당자가 내용을 확인하여 고객님께 텔레그램으로 메시지를 보내드리겠습니다.
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex space-x-3">
                            <button type="button" onclick="closeMeetingModal()" 
                                    class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors duration-200">
                                취소
                            </button>
                            <button type="submit" 
                                    class="flex-1 bg-thai-red hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-colors duration-200">
                                <i class="fas fa-paper-plane mr-2"></i>요청 전송
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // 기존 모달 컨테이너에 추가
    const existingModal = document.getElementById('modal-container');
    existingModal.insertAdjacentHTML('beforeend', modalHTML);
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
                                    <option value="여성">여성</option>
                                    <option value="레이디보이">레이디보이</option>
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
                                    <option value="여성" ${user.gender === '여성' ? 'selected' : ''}>여성</option>
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

// 광고 데이터 로드 (향상된 버전)
function loadAdvertisements() {
    axios.get('/api/advertisements')
        .then(response => {
            advertisementsData = response.data.advertisements || [];
            adSettings = response.data.settings || {};
            setupAdSlider();
        })
        .catch(error => {
            console.error('Failed to load advertisements:', error);
        });
}

// 광고 슬라이더 설정 (터치 기능 포함)
let adAutoSlideInterval = null;
let adSettings = {};
let touchStartX = 0;
let touchEndX = 0;
let isSwiping = false;

function setupAdSlider() {
    if (advertisementsData.length === 0) return;

    const adSlider = document.getElementById('ad-slider');
    const adBanner = document.getElementById('ad-banner');
    
    // 광고 HTML 생성 (개별 스크롤 시간 지원)
    const adsHTML = advertisementsData.map((ad, index) => {
        const imgElement = `<img src="${ad.image_url}" alt="${ad.title || '광고'}" class="h-full w-auto object-contain" onerror="this.style.display='none'">`;
        
        if (ad.link_url && ad.link_url.trim()) {
            // 링크가 있는 경우 클릭 가능한 요소로 래핑
            return `
                <div class="min-w-full h-full flex items-center justify-center ad-slide" data-scroll-interval="${ad.scroll_interval || 3000}">
                    <a href="${ad.link_url}" target="_blank" rel="noopener noreferrer" class="h-full flex items-center justify-center cursor-pointer" title="광고 페이지로 이동">
                        ${imgElement}
                    </a>
                </div>
            `;
        } else {
            // 링크가 없는 경우 일반 이미지
            return `
                <div class="min-w-full h-full flex items-center justify-center ad-slide" data-scroll-interval="${ad.scroll_interval || 3000}">
                    ${imgElement}
                </div>
            `;
        }
    }).join('');
    
    adSlider.innerHTML = adsHTML;

    // 터치 이벤트 리스너 추가
    if (advertisementsData.length > 1) {
        addTouchListeners(adBanner);
        startAutoSlide();
    }
}

// 터치 이벤트 리스너 추가 (스와이프 기능)
function addTouchListeners(element) {
    // 터치 시작
    element.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        isSwiping = true;
        pauseAutoSlide(); // 터치 시작 시 자동 스크롤 일시정지
    }, { passive: true });

    // 터치 이동
    element.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        e.preventDefault(); // 페이지 스크롤 방지
    }, { passive: false });

    // 터치 끝
    element.addEventListener('touchend', (e) => {
        if (!isSwiping) return;
        
        touchEndX = e.changedTouches[0].screenX;
        handleSwipeGesture();
        isSwiping = false;
        
        // 터치 후 1초 후에 자동 스크롤 재시작
        setTimeout(() => {
            startAutoSlide();
        }, 1000);
    }, { passive: true });

    // 마우스 이벤트 (데스크톱 지원)
    element.addEventListener('mousedown', (e) => {
        touchStartX = e.screenX;
        isSwiping = true;
        pauseAutoSlide();
    });

    element.addEventListener('mouseup', (e) => {
        if (!isSwiping) return;
        
        touchEndX = e.screenX;
        handleSwipeGesture();
        isSwiping = false;
        
        setTimeout(() => {
            startAutoSlide();
        }, 1000);
    });
}

// 스와이프 제스처 처리
function handleSwipeGesture() {
    const swipeDistance = touchEndX - touchStartX;
    const minSwipeDistance = 50; // 최소 스와이프 거리 (픽셀)
    
    if (Math.abs(swipeDistance) < minSwipeDistance) return;
    
    if (swipeDistance > 0) {
        // 오른쪽으로 스와이프 - 이전 광고
        goToPrevAd();
    } else {
        // 왼쪽으로 스와이프 - 다음 광고
        goToNextAd();
    }
}

// 이전 광고로 이동
function goToPrevAd() {
    if (advertisementsData.length <= 1) return;
    
    currentAd = (currentAd - 1 + advertisementsData.length) % advertisementsData.length;
    updateAdSlider();
}

// 다음 광고로 이동
function goToNextAd() {
    if (advertisementsData.length <= 1) return;
    
    currentAd = (currentAd + 1) % advertisementsData.length;
    updateAdSlider();
}

// 광고 슬라이더 업데이트
function updateAdSlider() {
    const adSlider = document.getElementById('ad-slider');
    if (adSlider) {
        adSlider.style.transform = `translateX(-${currentAd * 100}%)`;
        adSlider.style.transition = 'transform 0.3s ease-in-out';
    }
}

// 자동 슬라이드 시작 (개별 스크롤 시간 지원)
function startAutoSlide() {
    if (advertisementsData.length <= 1) return;
    
    pauseAutoSlide(); // 기존 타이머 정리
    
    // 현재 광고의 스크롤 시간 가져오기
    const currentAdData = advertisementsData[currentAd];
    const scrollInterval = currentAdData?.scroll_interval || 
                          parseInt(adSettings.default_scroll_interval) || 
                          3000;
    
    adAutoSlideInterval = setTimeout(() => {
        goToNextAd();
        startAutoSlide(); // 다음 광고를 위해 재귀 호출
    }, scrollInterval);
}

// 자동 슬라이드 일시정지
function pauseAutoSlide() {
    if (adAutoSlideInterval) {
        clearTimeout(adAutoSlideInterval);
        adAutoSlideInterval = null;
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

// 만남 요청 모달 닫기
function closeMeetingModal(event) {
    if (event && event.target !== event.currentTarget) return;
    
    // z-index가 55인 만남 요청 모달만 찾아서 제거
    const meetingModal = document.querySelector('.modal-overlay[style*="z-index: 55"], .z-\\[55\\]');
    if (meetingModal) {
        meetingModal.remove();
    }
}

// 현재 위치 확인 함수
async function getCurrentLocation() {
    const locationStatus = document.getElementById('location-status');
    const locationInput = document.getElementById('user-location');
    
    if (!navigator.geolocation) {
        locationStatus.innerHTML = '<span class="text-red-500">위치 서비스를 지원하지 않습니다</span>';
        return;
    }
    
    locationStatus.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>위치 확인 중...';
    
    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                { 
                    enableHighAccuracy: true, 
                    timeout: 10000, 
                    maximumAge: 300000 
                }
            );
        });
        
        const { latitude, longitude } = position.coords;
        const googleMapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
        
        // 역지오코딩으로 주소 확인 (선택사항)
        try {
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=ko`);
            const locationData = await response.json();
            const address = locationData.locality || locationData.city || '주소 확인 불가';
            
            locationStatus.innerHTML = `<span class="text-green-600"><i class="fas fa-check mr-1"></i>${address}</span>`;
        } catch (e) {
            locationStatus.innerHTML = `<span class="text-green-600"><i class="fas fa-check mr-1"></i>위치 확인됨</span>`;
        }
        
        locationInput.value = googleMapsUrl;
        
    } catch (error) {
        console.error('위치 확인 오류:', error);
        let errorMessage = '위치 확인 실패';
        
        if (error.code === 1) {
            errorMessage = '위치 접근이 거부되었습니다';
        } else if (error.code === 2) {
            errorMessage = '위치를 확인할 수 없습니다';
        } else if (error.code === 3) {
            errorMessage = '위치 확인 시간 초과';
        }
        
        locationStatus.innerHTML = `<span class="text-red-500"><i class="fas fa-exclamation-triangle mr-1"></i>${errorMessage}</span>`;
    }
}

// 만남 요청 전송
async function submitMeetingRequest(event, workingGirlId) {
    event.preventDefault();
    
    try {
        // 입력값 가져오기
        const userName = document.getElementById('meeting-user-name').value.trim();
        const userTelegram = document.getElementById('meeting-telegram').value.trim().replace('@', ''); // @ 제거
        const message = document.getElementById('meeting-message').value.trim();
        const userLocation = document.getElementById('user-location').value.trim();
        
        if (!userName || !userTelegram) {
            showNotification('이름과 텔레그램 아이디는 필수입니다.', 'warning');
            return;
        }
        
        if (!userLocation) {
            showNotification('현재 위치 확인이 필요합니다. 위치 확인 버튼을 클릭해주세요.', 'warning');
            return;
        }
        
        // 로딩 상태 표시
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>전송 중...';
        submitBtn.disabled = true;
        
        console.log('만남 요청 데이터:', {
            working_girl_id: workingGirlId,
            user_name: userName,
            user_telegram: userTelegram,
            user_location: userLocation,
            message: message
        });
        
        // API 호출
        const response = await axios.post('/api/meeting-request', {
            working_girl_id: workingGirlId,
            user_name: userName,
            user_telegram: userTelegram,
            user_location: userLocation,
            message: message
        });
        
        if (response.data.success) {
            showNotification('만남 요청이 전송되었습니다! 관리자가 확인 후 연락드립니다.', 'success');
            closeMeetingModal();
        } else {
            showNotification(response.data.message || '요청 전송에 실패했습니다.', 'error');
        }
        
    } catch (error) {
        console.error('만남 요청 전송 오류:', error);
        const errorMessage = error.response?.data?.message || '네트워크 오류가 발생했습니다.';
        showNotification(errorMessage, 'error');
    } finally {
        // 버튼 상태 복원
        const submitBtn = event.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
}