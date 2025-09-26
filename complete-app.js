// 완전한 Thai Wiki JavaScript (로컬 스토리지 버전)

// 로컬 스토리지 키
const STORAGE_KEYS = {
    WORKING_GIRLS: 'thai_wiki_working_girls',
    CURRENT_USER: 'thai_wiki_current_user',
    USER_SESSIONS: 'thai_wiki_sessions'
};

// 전역 변수
let currentUser = null;
let workingGirlsData = [];

// 앱 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    loadWorkingGirlsFromStorage();
    loadCurrentUser();
    setupEventListeners();
    displayWorkingGirls();
    updateUIForUser();
}

// 로컬 스토리지에서 데이터 로드
function loadWorkingGirlsFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEYS.WORKING_GIRLS);
    if (stored) {
        workingGirlsData = JSON.parse(stored);
    } else {
        // 초기 테스트 데이터
        workingGirlsData = [
            {
                id: 1,
                nickname: "떠기",
                age: 22,
                height: 155,
                weight: 55,
                region: "방콕",
                code: "aaa222",
                conditions: "1.dsfsdf\n2.sdfdsf",
                user_id: "ddogi",
                password: "1234",
                photos: [
                    { photo_url: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=" }
                ]
            }
        ];
        saveWorkingGirlsToStorage();
    }
}

// 로컬 스토리지에 데이터 저장
function saveWorkingGirlsToStorage() {
    localStorage.setItem(STORAGE_KEYS.WORKING_GIRLS, JSON.stringify(workingGirlsData));
}

// 현재 사용자 로드
function loadCurrentUser() {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (stored) {
        currentUser = JSON.parse(stored);
    }
}

// 현재 사용자 저장
function saveCurrentUser(user) {
    currentUser = user;
    if (user) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 검색
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchWorkingGirls();
            }
        });
    }
}

// UI 업데이트
function updateUIForUser() {
    const registerBtn = document.getElementById('register-btn');
    const loginSection = document.getElementById('login-section');
    
    if (currentUser) {
        // 로그인된 상태
        if (registerBtn) {
            registerBtn.innerHTML = '<i class="fas fa-edit mr-2"></i>프로필 수정';
            registerBtn.onclick = () => showEditModal(currentUser);
        }
        if (loginSection) {
            loginSection.innerHTML = `
                <span class="mr-4">안녕하세요, ${currentUser.nickname}님</span>
                <button onclick="logout()" class="bg-red-500 text-white px-3 py-1 rounded">로그아웃</button>
            `;
        }
    }
}

// 워킹걸 목록 표시
function displayWorkingGirls() {
    const container = document.getElementById('working-girls-list');
    const loading = document.getElementById('loading');
    const emptyState = document.getElementById('empty-state');
    
    if (loading) loading.style.display = 'none';
    
    if (workingGirlsData.length === 0) {
        if (container) container.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    if (container) {
        container.innerHTML = workingGirlsData.map(girl => {
            const mainPhoto = girl.photos && girl.photos.length > 0 
                ? girl.photos[0].photo_url 
                : null;
            
            return `
                <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer working-girl-item" onclick="showWorkingGirlModal(${JSON.stringify(girl).replace(/"/g, '&quot;')})">
                    <div class="aspect-square bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center">
                        ${mainPhoto 
                            ? `<img src="${mainPhoto}" alt="${girl.nickname}" class="w-full h-full object-cover">`
                            : `<div class="text-center text-gray-600">
                                <i class="fas fa-user text-4xl mb-2"></i>
                                <div class="font-medium">${girl.nickname}</div>
                                <div class="text-sm">사진 없음</div>
                              </div>`
                        }
                    </div>
                    <div class="p-4">
                        <h3 class="font-bold text-lg text-gray-800 mb-2">${girl.nickname}</h3>
                        <div class="space-y-1 text-sm text-gray-600">
                            <div><span class="font-medium">나이:</span> ${girl.age}세</div>
                            <div><span class="font-medium">키/몸무게:</span> ${girl.height}cm / ${girl.weight}kg</div>
                            <div><span class="font-medium">지역:</span> ${girl.region}</div>
                            ${girl.code ? `<div><span class="font-medium text-thai-red">코드:</span> <span class="font-bold text-thai-red">${girl.code}</span></div>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// 워킹걸 등록 모달
function showRegisterModal() {
    const modalHTML = `
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-overlay p-4" onclick="closeModal(event)">
            <div class="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] overflow-y-auto modal-content" onclick="event.stopPropagation()">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-bold text-gray-800">워킹걸 등록</h2>
                        <button onclick="closeModal()" class="text-gray-600 hover:text-gray-800 text-2xl">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <form id="register-form" onsubmit="handleRegister(event)">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">닉네임 *</label>
                                <input type="text" name="nickname" required 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-thai-red">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">아이디 *</label>
                                <input type="text" name="user_id" required 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-thai-red">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">비밀번호 *</label>
                                <input type="password" name="password" required 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-thai-red">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">나이 *</label>
                                <input type="number" name="age" required min="18" max="50"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-thai-red">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">키 (cm) *</label>
                                <input type="number" name="height" required min="140" max="200"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-thai-red">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">몸무게 (kg) *</label>
                                <input type="number" name="weight" required min="35" max="100"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-thai-red">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">거주 지역 *</label>
                                <input type="text" name="region" required 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-thai-red">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">코드</label>
                                <input type="text" name="code" 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-thai-red">
                            </div>
                        </div>
                        
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">조건</label>
                            <textarea name="conditions" rows="4" 
                                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-thai-red"
                                      placeholder="조건을 입력하세요 (줄바꿈 가능)"></textarea>
                        </div>
                        
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 mb-2">사진 업로드 (최대 3장)</label>
                            <input type="file" name="photos" multiple accept="image/*" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-thai-red"
                                   onchange="previewPhotos(this)">
                            <div id="photo-preview" class="mt-2 flex gap-2"></div>
                        </div>
                        
                        <div class="flex gap-4">
                            <button type="button" onclick="closeModal()" 
                                    class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                취소
                            </button>
                            <button type="submit" 
                                    class="flex-1 px-4 py-2 bg-thai-red text-white rounded-lg hover:bg-red-600">
                                등록하기
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modal-container').innerHTML = modalHTML;
}

// 사진 미리보기
function previewPhotos(input) {
    const preview = document.getElementById('photo-preview');
    preview.innerHTML = '';
    
    if (input.files) {
        Array.from(input.files).slice(0, 3).forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.className = 'w-20 h-20 object-cover rounded border';
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    }
}

// 등록 처리
async function handleRegister(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const photos = [];
    
    // 사진 처리
    const photoFiles = formData.getAll('photos');
    for (let file of photoFiles) {
        if (file && file.size > 0) {
            const base64 = await fileToBase64(file);
            photos.push({ photo_url: base64 });
        }
    }
    
    const newGirl = {
        id: Date.now(),
        user_id: formData.get('user_id'),
        password: formData.get('password'),
        nickname: formData.get('nickname'),
        age: parseInt(formData.get('age')),
        height: parseInt(formData.get('height')),
        weight: parseInt(formData.get('weight')),
        region: formData.get('region'),
        code: formData.get('code'),
        conditions: formData.get('conditions'),
        photos: photos
    };
    
    // 아이디 중복 체크
    if (workingGirlsData.find(girl => girl.user_id === newGirl.user_id)) {
        showNotification('이미 사용중인 아이디입니다.', 'error');
        return;
    }
    
    workingGirlsData.push(newGirl);
    saveWorkingGirlsToStorage();
    
    // 자동 로그인
    saveCurrentUser(newGirl);
    
    closeModal();
    displayWorkingGirls();
    updateUIForUser();
    showNotification('등록이 완료되었습니다!', 'success');
}

// 파일을 Base64로 변환
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// 워킹걸 상세 모달
function showWorkingGirlModal(girl) {
    const validPhotos = girl.photos ? girl.photos.filter(photo => 
        photo && photo.photo_url && photo.photo_url.trim() !== ''
    ) : [];
    
    let photosHTML = '';
    
    if (validPhotos.length > 0) {
        photosHTML = validPhotos.map((photo, index) => {
            const safePhotoUrl = photo.photo_url.replace(/'/g, "\\'");
            return `
            <div class="aspect-square bg-gradient-to-br from-pink-200 to-purple-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity" onclick="window.openPhotoLightbox('${safePhotoUrl}', '${girl.nickname}')">
                <img src="${photo.photo_url}" alt="${girl.nickname}" class="w-full h-full object-cover">
            </div>
        `;
        }).join('');
    } else {
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

                    ${validPhotos.length > 0 ? `
                    <div class="mb-4">
                        <h3 class="text-lg font-semibold text-gray-800 mb-3">사진 (${validPhotos.length}장)</h3>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                            ${photosHTML}
                        </div>
                    </div>
                    ` : ''}

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">나이</label>
                            <div class="bg-gray-50 p-3 rounded-lg text-gray-800">${girl.age}세</div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">성별</label>
                            <div class="bg-gray-50 p-3 rounded-lg text-gray-800">여자</div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">키</label>
                            <div class="bg-gray-50 p-3 rounded-lg text-gray-800">${girl.height}cm</div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">몸무게</label>
                            <div class="bg-gray-50 p-3 rounded-lg text-gray-800">${girl.weight}kg</div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">거주 지역</label>
                            <div class="bg-gray-50 p-3 rounded-lg text-gray-800">${girl.region}</div>
                        </div>
                        ${girl.code ? `
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">코드</label>
                            <div class="bg-gray-50 p-3 rounded-lg text-thai-red font-bold">${girl.code}</div>
                        </div>
                        ` : ''}
                    </div>

                    ${girl.conditions ? `
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">조건</label>
                        <div class="bg-gray-50 p-3 rounded-lg">
                            <p class="text-gray-800 whitespace-pre-wrap">${girl.conditions}</p>
                        </div>
                    </div>
                    ` : ''}

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

// 사진 라이트박스
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

// 전역 함수 등록
window.openPhotoLightbox = function(photoUrl, nickname) {
    showPhotoLightbox(photoUrl, nickname);
};

// 기타 함수들
function closeModal(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('modal-container').innerHTML = '';
}

function logout() {
    saveCurrentUser(null);
    location.reload();
}

function searchWorkingGirls() {
    const query = document.getElementById('search-input').value.toLowerCase();
    if (!query) {
        displayWorkingGirls();
        return;
    }
    
    const filtered = workingGirlsData.filter(girl => 
        girl.nickname.toLowerCase().includes(query) ||
        girl.region.toLowerCase().includes(query) ||
        (girl.code && girl.code.toLowerCase().includes(query))
    );
    
    // 필터된 결과 표시 (임시로 전체 데이터 교체)
    const originalData = [...workingGirlsData];
    workingGirlsData = filtered;
    displayWorkingGirls();
    workingGirlsData = originalData;
}

function requestMeeting(id) {
    showNotification('만남 요청 기능은 개발 중입니다.', 'info');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg text-white ${
        type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' :
        'bg-blue-500'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// 전역 함수 등록
window.showRegisterModal = showRegisterModal;
window.showWorkingGirlModal = showWorkingGirlModal;
window.closeModal = closeModal;
window.handleRegister = handleRegister;
window.previewPhotos = previewPhotos;
window.logout = logout;
window.searchWorkingGirls = searchWorkingGirls;
window.requestMeeting = requestMeeting;