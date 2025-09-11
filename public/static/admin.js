// 관리자 페이지 JavaScript

let allWorkingGirls = [];
let allAdvertisements = [];

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    loadWorkingGirlsForAdmin();
    loadAdvertisementsForAdmin();
    setupAdminEventListeners();
});

// 이벤트 리스너 설정
function setupAdminEventListeners() {
    const searchInput = document.getElementById('admin-search');
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            adminSearch();
        }
    });
}

// 워킹걸 데이터 로드 (관리자용)
function loadWorkingGirlsForAdmin(searchQuery = '') {
    const url = searchQuery ? `/api/admin/working-girls/search?q=${encodeURIComponent(searchQuery)}` : '/api/admin/working-girls';

    // API 엔드포인트가 없으므로 임시로 일반 API 사용
    axios.get('/api/working-girls')
        .then(response => {
            allWorkingGirls = response.data.working_girls || [];
            
            // 검색 필터링
            let filteredGirls = allWorkingGirls;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                filteredGirls = allWorkingGirls.filter(girl => 
                    girl.nickname.toLowerCase().includes(query) ||
                    girl.user_id.toLowerCase().includes(query) ||
                    girl.region.toLowerCase().includes(query) ||
                    girl.gender.toLowerCase().includes(query) ||
                    (girl.code && girl.code.toLowerCase().includes(query)) ||
                    girl.age.toString().includes(query)
                );
            }
            
            displayWorkingGirlsTable(filteredGirls);
        })
        .catch(error => {
            console.error('Failed to load working girls for admin:', error);
            showAdminNotification('데이터를 불러오는데 실패했습니다.', 'error');
        });
}

// 워킹걸 테이블 표시
function displayWorkingGirlsTable(workingGirls) {
    const tableBody = document.getElementById('working-girls-table');
    
    if (workingGirls.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="10" class="px-4 py-8 text-center text-gray-500">
                    데이터가 없습니다.
                </td>
            </tr>
        `;
        return;
    }

    const rowsHTML = workingGirls.map(girl => `
        <tr class="border-b hover:bg-gray-50" onclick="editWorkingGirl(${girl.id})">
            <td class="px-4 py-3">${girl.code || '없음'}</td>
            <td class="px-4 py-3">
                <button onclick="event.stopPropagation(); toggleRecommended(${girl.id}, ${!girl.is_recommended})" 
                        class="text-2xl ${girl.is_recommended ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-500">
                    ${girl.is_recommended ? '★' : '☆'}
                </button>
            </td>
            <td class="px-4 py-3">${girl.region}</td>
            <td class="px-4 py-3">${girl.user_id}</td>
            <td class="px-4 py-3">${girl.nickname}</td>
            <td class="px-4 py-3">${girl.age}</td>
            <td class="px-4 py-3">${girl.height}cm</td>
            <td class="px-4 py-3">${girl.weight}kg</td>
            <td class="px-4 py-3">${girl.gender}</td>
            <td class="px-4 py-3">
                <button onclick="event.stopPropagation(); editWorkingGirl(${girl.id})" 
                        class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm mr-2">
                    수정
                </button>
                <button onclick="event.stopPropagation(); deleteWorkingGirl(${girl.id})" 
                        class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                    삭제
                </button>
            </td>
        </tr>
    `).join('');

    tableBody.innerHTML = rowsHTML;
}

// 관리자 검색
function adminSearch() {
    const searchInput = document.getElementById('admin-search');
    const searchQuery = searchInput.value.trim();
    loadWorkingGirlsForAdmin(searchQuery);
}

// 추천 워킹걸 토글
function toggleRecommended(workingGirlId, newStatus) {
    axios.post('/api/admin/working-girl/toggle-recommended', {
        working_girl_id: workingGirlId,
        is_recommended: newStatus
    })
        .then(response => {
            if (response.data.success) {
                loadWorkingGirlsForAdmin(); // 테이블 새로고침
                showAdminNotification(
                    newStatus ? '추천 워킹걸로 설정되었습니다.' : '추천이 해제되었습니다.',
                    'success'
                );
            }
        })
        .catch(error => {
            console.error('Toggle recommended error:', error);
            showAdminNotification('추천 설정 변경에 실패했습니다.', 'error');
        });
}

// 워킹걸 수정 모달
function editWorkingGirl(workingGirlId) {
    const girl = allWorkingGirls.find(g => g.id === workingGirlId);
    if (!girl) return;

    const modalHTML = `
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onclick="closeAdminModal(event)">
            <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">워킹걸 정보 수정</h2>
                        <button onclick="closeAdminModal()" class="text-gray-600 hover:text-gray-800 text-2xl">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <form onsubmit="updateWorkingGirlByAdmin(event, ${girl.id})">
                        <!-- 활동상태 -->
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">활동상태</label>
                            <div class="flex space-x-4">
                                <label class="flex items-center">
                                    <input type="radio" name="is_active" value="true" ${girl.is_active ? 'checked' : ''} class="mr-2">
                                    <span>ON</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="radio" name="is_active" value="false" ${!girl.is_active ? 'checked' : ''} class="mr-2">
                                    <span>OFF</span>
                                </label>
                            </div>
                        </div>

                        <!-- 추천 워킹걸 -->
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">추천 워킹걸</label>
                            <div class="flex space-x-4">
                                <label class="flex items-center">
                                    <input type="radio" name="is_recommended" value="true" ${girl.is_recommended ? 'checked' : ''} class="mr-2">
                                    <span>추천</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="radio" name="is_recommended" value="false" ${!girl.is_recommended ? 'checked' : ''} class="mr-2">
                                    <span>일반</span>
                                </label>
                            </div>
                        </div>

                        <!-- 기본 정보 -->
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">아이디</label>
                                <input type="text" value="${girl.user_id}" disabled 
                                       class="w-full p-3 border border-gray-300 rounded-lg bg-gray-100">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
                                <input type="password" id="edit-password" value="${girl.password}" required 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-blue focus:outline-none">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">닉네임</label>
                                <input type="text" id="edit-nickname" value="${girl.nickname}" required 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-blue focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">나이</label>
                                <input type="number" id="edit-age" value="${girl.age}" required min="18" max="60" 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-blue focus:outline-none">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">키 (cm)</label>
                                <input type="number" id="edit-height" value="${girl.height}" required min="140" max="200" 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-blue focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">몸무게 (kg)</label>
                                <input type="number" id="edit-weight" value="${girl.weight}" required min="35" max="120" 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-blue focus:outline-none">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">성별</label>
                                <select id="edit-gender" required 
                                        class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-blue focus:outline-none">
                                    <option value="여자" ${girl.gender === '여자' ? 'selected' : ''}>여자</option>
                                    <option value="트랜스젠더" ${girl.gender === '트랜스젠더' ? 'selected' : ''}>트랜스젠더</option>
                                    <option value="레이디보이" ${girl.gender === '레이디보이' ? 'selected' : ''}>레이디보이</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">거주 지역</label>
                                <select id="edit-region" required 
                                        class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-blue focus:outline-none">
                                    <option value="방콕" ${girl.region === '방콕' ? 'selected' : ''}>방콕</option>
                                    <option value="파타야" ${girl.region === '파타야' ? 'selected' : ''}>파타야</option>
                                    <option value="치앙마이" ${girl.region === '치앙마이' ? 'selected' : ''}>치앙마이</option>
                                    <option value="푸켓" ${girl.region === '푸켓' ? 'selected' : ''}>푸켓</option>
                                </select>
                            </div>
                        </div>

                        <!-- 연락처 정보 -->
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">라인 아이디</label>
                                <input type="text" id="edit-line-id" value="${girl.line_id || ''}" 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-blue focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">카카오톡 아이디</label>
                                <input type="text" id="edit-kakao-id" value="${girl.kakao_id || ''}" 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-blue focus:outline-none">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">전화번호</label>
                                <input type="tel" id="edit-phone" value="${girl.phone || ''}" 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-blue focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">코드</label>
                                <input type="text" id="edit-code" value="${girl.code || ''}" 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:border-thai-blue focus:outline-none">
                            </div>
                        </div>

                        <div class="flex space-x-4">
                            <button type="submit" 
                                    class="flex-1 bg-thai-blue hover:bg-blue-700 text-white p-3 rounded-lg font-medium">
                                수정 완료
                            </button>
                            <button type="button" onclick="closeAdminModal()" 
                                    class="flex-1 bg-gray-500 hover:bg-gray-600 text-white p-3 rounded-lg font-medium">
                                취소
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// 관리자에 의한 워킹걸 정보 업데이트
function updateWorkingGirlByAdmin(event, workingGirlId) {
    event.preventDefault();

    const formData = {
        working_girl_id: workingGirlId,
        is_active: document.querySelector('input[name="is_active"]:checked').value === 'true',
        is_recommended: document.querySelector('input[name="is_recommended"]:checked').value === 'true',
        password: document.getElementById('edit-password').value,
        nickname: document.getElementById('edit-nickname').value,
        age: parseInt(document.getElementById('edit-age').value),
        height: parseInt(document.getElementById('edit-height').value),
        weight: parseInt(document.getElementById('edit-weight').value),
        gender: document.getElementById('edit-gender').value,
        region: document.getElementById('edit-region').value,
        line_id: document.getElementById('edit-line-id').value,
        kakao_id: document.getElementById('edit-kakao-id').value,
        phone: document.getElementById('edit-phone').value,
        code: document.getElementById('edit-code').value
    };

    axios.post('/api/admin/working-girl/update', formData)
        .then(response => {
            if (response.data.success) {
                closeAdminModal();
                loadWorkingGirlsForAdmin(); // 테이블 새로고침
                showAdminNotification('정보가 수정되었습니다.', 'success');
            }
        })
        .catch(error => {
            console.error('Update error:', error);
            showAdminNotification('정보 수정에 실패했습니다.', 'error');
        });
}

// 워킹걸 삭제
function deleteWorkingGirl(workingGirlId) {
    const girl = allWorkingGirls.find(g => g.id === workingGirlId);
    if (!girl) return;

    if (!confirm(`'${girl.nickname}' 워킹걸을 정말 삭제하시겠습니까?`)) {
        return;
    }

    axios.delete(`/api/admin/working-girl/${workingGirlId}`)
        .then(response => {
            if (response.data.success) {
                loadWorkingGirlsForAdmin(); // 테이블 새로고침
                showAdminNotification('워킹걸이 삭제되었습니다.', 'success');
            }
        })
        .catch(error => {
            console.error('Delete error:', error);
            showAdminNotification('삭제에 실패했습니다.', 'error');
        });
}

// 광고 데이터 로드 (관리자용)
function loadAdvertisementsForAdmin() {
    axios.get('/api/advertisements')
        .then(response => {
            allAdvertisements = response.data.advertisements || [];
            displayAdvertisementsList();
        })
        .catch(error => {
            console.error('Failed to load advertisements:', error);
            showAdminNotification('광고 데이터를 불러오는데 실패했습니다.', 'error');
        });
}

// 광고 리스트 표시 (모바일 최적화)
function displayAdvertisementsList() {
    const adsList = document.getElementById('advertisements-list');
    
    if (allAdvertisements.length === 0) {
        adsList.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-images text-4xl text-gray-300 mb-3"></i>
                <p class="text-gray-500">등록된 광고가 없습니다.</p>
                <p class="text-sm text-gray-400 mt-1">첫 번째 광고를 업로드해보세요!</p>
            </div>
        `;
        return;
    }

    const adsHTML = allAdvertisements.map((ad, index) => `
        <div class="bg-gray-50 border rounded-lg p-3 sm:p-4 transition-all hover:shadow-md">
            <!-- 모바일 최적화 레이아웃 -->
            <div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <!-- 광고 이미지 및 기본 정보 -->
                <div class="flex items-start gap-3 flex-1">
                    <div class="flex-shrink-0">
                        <img src="${ad.image_url}" alt="${ad.title || '광고'}" 
                             class="w-16 h-12 sm:w-20 sm:h-15 object-cover rounded border bg-white" 
                             onerror="this.src='data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"80\" height=\"60\" viewBox=\"0 0 80 60\"><rect width=\"80\" height=\"60\" fill=\"%23f3f4f6\"/><text x=\"40\" y=\"35\" text-anchor=\"middle\" fill=\"%236b7280\" font-size=\"10\">이미지 없음</text></svg>'">
                    </div>
                    <div class="flex-1 min-w-0">
                        <h3 class="font-medium text-sm sm:text-base text-gray-800 truncate">
                            ${ad.title || `광고 #${index + 1}`}
                        </h3>
                        <div class="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                            <span class="bg-gray-200 px-2 py-0.5 rounded">순서: ${ad.display_order}</span>
                            <span class="px-2 py-0.5 rounded ${ad.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                                ${ad.is_active ? '✅ 활성' : '❌ 비활성'}
                            </span>
                        </div>
                        <p class="text-xs text-gray-400 mt-1">
                            등록일: ${new Date(ad.created_at).toLocaleDateString('ko-KR')}
                        </p>
                    </div>
                </div>
                
                <!-- 액션 버튼들 -->
                <div class="flex gap-2 sm:flex-col sm:gap-1">
                    <button onclick="toggleAdvertisement(${ad.id}, ${!ad.is_active})" 
                            class="flex-1 sm:flex-none px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${ad.is_active ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'} text-white min-h-[32px]">
                        ${ad.is_active ? '비활성화' : '활성화'}
                    </button>
                    <button onclick="previewAdvertisement('${ad.image_url}', '${ad.title || `광고 #${index + 1}`}')" 
                            class="flex-1 sm:flex-none px-3 py-1.5 rounded text-xs sm:text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white min-h-[32px]">
                        미리보기
                    </button>
                    <button onclick="deleteAdvertisement(${ad.id}, '${ad.title || `광고 #${index + 1}`}')" 
                            class="flex-1 sm:flex-none px-3 py-1.5 rounded text-xs sm:text-sm font-medium bg-red-500 hover:bg-red-600 text-white min-h-[32px]">
                        삭제
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    adsList.innerHTML = adsHTML;
}

// 광고 미리보기 모달
function previewAdvertisement(imageUrl, title) {
    const previewHTML = `
        <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onclick="closeAdPreview(event)">
            <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
                <div class="p-4 sm:p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg sm:text-xl font-bold text-gray-800">${title} - 미리보기</h3>
                        <button onclick="closeAdPreview()" class="text-gray-600 hover:text-gray-800 text-xl sm:text-2xl p-1">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="space-y-4">
                        <!-- 모바일 버전 미리보기 -->
                        <div>
                            <h4 class="font-medium text-gray-700 mb-2">📱 모바일 버전 (350×120px 권장)</h4>
                            <div class="bg-gray-100 p-3 rounded-lg">
                                <div class="bg-white rounded-lg overflow-hidden" style="height: 80px;">
                                    <img src="${imageUrl}" alt="${title}" class="w-full h-full object-cover">
                                </div>
                            </div>
                        </div>
                        
                        <!-- 데스크톱 버전 미리보기 -->
                        <div>
                            <h4 class="font-medium text-gray-700 mb-2">🖥️ 데스크톱 버전 (1200×120px 권장)</h4>
                            <div class="bg-gray-100 p-4 rounded-lg">
                                <div class="bg-white rounded-lg overflow-hidden" style="height: 100px;">
                                    <img src="${imageUrl}" alt="${title}" class="w-full h-full object-cover">
                                </div>
                            </div>
                        </div>
                        
                        <!-- 원본 이미지 -->
                        <div>
                            <h4 class="font-medium text-gray-700 mb-2">🖼️ 원본 이미지</h4>
                            <div class="bg-gray-100 p-2 rounded-lg">
                                <img src="${imageUrl}" alt="${title}" class="w-full h-auto object-contain max-h-96 mx-auto">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', previewHTML);
}

function closeAdPreview(event) {
    if (event && event.target !== event.currentTarget) return;
    const preview = document.querySelector('.fixed.inset-0.bg-black\\/80');
    if (preview) {
        preview.remove();
    }
}

// 광고 이미지 미리보기 및 검증
function previewAdImage(input) {
    const file = input.files[0];
    const preview = document.getElementById('ad-preview');
    const previewImg = document.getElementById('ad-preview-img');
    const previewInfo = document.getElementById('ad-preview-info');
    const uploadBtn = document.getElementById('upload-btn');

    if (!file) {
        preview.classList.add('hidden');
        uploadBtn.disabled = true;
        return;
    }

    // 파일 타입 검증
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
        showAdminNotification('지원되는 이미지 형식: JPG, PNG, WebP', 'warning');
        input.value = '';
        preview.classList.add('hidden');
        uploadBtn.disabled = true;
        return;
    }

    // 파일 크기 검증 (500KB = 512000 bytes)
    if (file.size > 512000) {
        showAdminNotification('파일 크기는 500KB 이하로 업로드해주세요.', 'warning');
        input.value = '';
        preview.classList.add('hidden');
        uploadBtn.disabled = true;
        return;
    }

    // 이미지 로드 및 크기 검증
    const img = new Image();
    img.onload = function() {
        const width = this.naturalWidth;
        const height = this.naturalHeight;
        const ratio = width / height;

        // 권장 비율 체크 (10:3 = 3.33, ±0.5 허용)
        const idealRatio = 10 / 3; // 3.33
        const isGoodRatio = Math.abs(ratio - idealRatio) <= 0.5;

        // 권장 사이즈 체크
        const isMobileOptimal = (width === 350 && height === 120);
        const isDesktopOptimal = (width === 1200 && height === 120);
        const isGoodSize = width >= 350 && height >= 100;

        let sizeInfo = `크기: ${width}×${height}px, 비율: ${ratio.toFixed(2)}:1`;
        let warningMsg = '';

        if (isMobileOptimal) {
            sizeInfo += ' ✅ 모바일 최적화';
        } else if (isDesktopOptimal) {
            sizeInfo += ' ✅ 데스크톱 최적화';
        } else if (isGoodRatio && isGoodSize) {
            sizeInfo += ' ✅ 권장 비율';
        } else {
            if (!isGoodRatio) {
                warningMsg += '권장 비율 10:3이 아닙니다. ';
            }
            if (!isGoodSize) {
                warningMsg += '최소 크기 350×100px 이상 권장. ';
            }
        }

        // 미리보기 표시
        previewImg.src = URL.createObjectURL(file);
        previewInfo.innerHTML = `
            <div class="text-left">
                <p class="font-medium">${sizeInfo}</p>
                <p class="text-gray-600">파일크기: ${(file.size / 1024).toFixed(1)}KB</p>
                ${warningMsg ? `<p class="text-yellow-600 mt-1">⚠️ ${warningMsg}</p>` : ''}
            </div>
        `;
        
        preview.classList.remove('hidden');
        uploadBtn.disabled = false;

        if (warningMsg) {
            showAdminNotification(`업로드 가능하지만 권장사항: ${warningMsg}`, 'warning');
        }
    };

    img.onerror = function() {
        showAdminNotification('유효하지 않은 이미지 파일입니다.', 'error');
        input.value = '';
        preview.classList.add('hidden');
        uploadBtn.disabled = true;
    };

    img.src = URL.createObjectURL(file);
}

// 광고 업로드
function uploadAdvertisement() {
    const fileInput = document.getElementById('ad-upload');
    const file = fileInput.files[0];

    if (!file) {
        showAdminNotification('파일을 선택해주세요.', 'warning');
        return;
    }

    const uploadBtn = document.getElementById('upload-btn');
    const originalText = uploadBtn.innerHTML;
    
    // 업로드 상태 표시
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>업로드 중...';

    const formData = new FormData();
    formData.append('advertisement', file);

    axios.post('/api/admin/advertisement/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
        .then(response => {
            if (response.data.success) {
                // 업로드 성공 시 리셋
                fileInput.value = '';
                document.getElementById('ad-preview').classList.add('hidden');
                uploadBtn.disabled = true;
                uploadBtn.innerHTML = originalText;
                
                loadAdvertisementsForAdmin(); // 광고 리스트 새로고침
                showAdminNotification('광고가 성공적으로 업로드되었습니다!', 'success');
            }
        })
        .catch(error => {
            console.error('Advertisement upload error:', error);
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = originalText;
            showAdminNotification('광고 업로드에 실패했습니다. 다시 시도해주세요.', 'error');
        });
}

// 광고 활성/비활성 토글
function toggleAdvertisement(adId, newStatus) {
    axios.post('/api/admin/advertisement/toggle', {
        advertisement_id: adId,
        is_active: newStatus
    })
        .then(response => {
            if (response.data.success) {
                loadAdvertisementsForAdmin(); // 광고 리스트 새로고침
                showAdminNotification(
                    newStatus ? '광고가 활성화되었습니다.' : '광고가 비활성화되었습니다.',
                    'success'
                );
            }
        })
        .catch(error => {
            console.error('Toggle advertisement error:', error);
            showAdminNotification('광고 상태 변경에 실패했습니다.', 'error');
        });
}

// 광고 삭제
function deleteAdvertisement(adId, adTitle) {
    const title = adTitle || '이 광고';
    
    if (!confirm(`'${title}'를 정말 삭제하시겠습니까?\n\n삭제된 광고는 복구할 수 없습니다.`)) {
        return;
    }

    // 삭제 진행 표시
    const deleteBtn = event.target;
    const originalText = deleteBtn.innerHTML;
    deleteBtn.disabled = true;
    deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    axios.delete(`/api/admin/advertisement/${adId}`)
        .then(response => {
            if (response.data.success) {
                loadAdvertisementsForAdmin(); // 광고 리스트 새로고침
                showAdminNotification(`'${title}'가 삭제되었습니다.`, 'success');
            }
        })
        .catch(error => {
            console.error('Delete advertisement error:', error);
            deleteBtn.disabled = false;
            deleteBtn.innerHTML = originalText;
            showAdminNotification(`'${title}' 삭제에 실패했습니다.`, 'error');
        });
}

// 관리자 로그아웃
function adminLogout() {
    const sessionToken = localStorage.getItem('thaiwiki_session');
    
    if (sessionToken) {
        axios.post('/api/auth/logout', { session_token: sessionToken })
            .then(() => {
                localStorage.removeItem('thaiwiki_session');
                showAdminNotification('로그아웃되었습니다.', 'success');
                
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            })
            .catch(error => {
                console.error('Logout error:', error);
                localStorage.removeItem('thaiwiki_session');
                window.location.href = '/';
            });
    } else {
        window.location.href = '/';
    }
}

// 관리자 모달 닫기
function closeAdminModal(event) {
    if (event && event.target !== event.currentTarget) return;
    
    const modals = document.querySelectorAll('.fixed.inset-0');
    modals.forEach(modal => modal.remove());
}

// 관리자 알림 메시지
function showAdminNotification(message, type = 'info') {
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