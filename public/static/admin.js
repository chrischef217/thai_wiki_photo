// 관리자 페이지 JavaScript
let currentWorkingGirls = [];
let selectedPhotosToDelete = new Set();

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function() {
    loadWorkingGirlsList();
    loadAdvertisementsList();
    setupEventListeners();
});

// 이벤트 리스너 설정
function setupEventListeners() {
    // 워킹걸 폼 제출 이벤트
    document.getElementById('workingGirlForm').addEventListener('submit', handleWorkingGirlSubmit);
    
    // 검색 기능
    document.getElementById('admin-search').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            adminSearch();
        }
    });
}

// 워킹걸 목록 로드
async function loadWorkingGirlsList(search = '') {
    try {
        const response = await axios.get('/api/admin/working-girls', {
            params: { search }
        });
        
        if (response.data.success) {
            currentWorkingGirls = response.data.workingGirls;
            displayWorkingGirlsList();
        } else {
            alert('목록을 불러오는데 실패했습니다: ' + response.data.message);
        }
    } catch (error) {
        console.error('워킹걸 목록 로드 오류:', error);
        alert('목록을 불러오는 중 오류가 발생했습니다.');
    }
}

// 워킹걸 목록 표시
function displayWorkingGirlsList() {
    const tableBody = document.getElementById('working-girls-table');
    
    if (currentWorkingGirls.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="13" class="px-4 py-8 text-center text-gray-500">
                    등록된 워킹걸이 없습니다.
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = currentWorkingGirls.map(girl => `
        <tr class="border-b hover:bg-gray-50">
            <td class="px-4 py-3">${girl.agency || '-'}</td>
            <td class="px-4 py-3">${girl.management_code || girl.code || '-'}</td>
            <td class="px-4 py-3">
                ${girl.is_recommended ? '<span class="text-yellow-500"><i class="fas fa-star"></i></span>' : '-'}
            </td>
            <td class="px-4 py-3">${girl.region || '-'}</td>
            <td class="px-4 py-3">${girl.user_id || '-'}</td>
            <td class="px-4 py-3">${girl.nickname}</td>
            <td class="px-4 py-3">${girl.age || '-'}</td>
            <td class="px-4 py-3">${girl.height ? girl.height + 'cm' : '-'}</td>
            <td class="px-4 py-3">${girl.weight ? girl.weight + 'kg' : '-'}</td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 text-xs rounded-full ${
                    girl.gender === '여자' ? 'bg-pink-100 text-pink-800' :
                    girl.gender === '남자' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                }">
                    ${girl.gender || '미입력'}
                </span>
            </td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 text-xs rounded-full ${
                    girl.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }">
                    ${girl.is_active ? '활성' : '비활성'}
                </span>
            </td>
            <td class="px-4 py-3">
                <div class="flex space-x-2">
                    ${girl.phone ? `<a href="tel:${girl.phone}" class="text-green-600 hover:text-green-800" title="전화걸기"><i class="fas fa-phone"></i></a>` : ''}
                    ${girl.line_id ? `<a href="https://line.me/ti/p/~${girl.line_id}" target="_blank" class="text-green-500 hover:text-green-700" title="라인 연결"><i class="fab fa-line"></i></a>` : ''}
                    ${girl.kakao_id ? `<a href="https://open.kakao.com/o/${girl.kakao_id}" target="_blank" class="text-yellow-500 hover:text-yellow-700" title="카카오톡 연결"><i class="fas fa-comment"></i></a>` : ''}
                </div>
            </td>
            <td class="px-4 py-3">
                <div class="flex space-x-2">
                    <button onclick="editWorkingGirl(${girl.id})" 
                            class="text-blue-600 hover:text-blue-800" title="수정">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteWorkingGirl(${girl.id})" 
                            class="text-red-600 hover:text-red-800" title="삭제">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button onclick="viewWorkingGirlPhotos(${girl.id})" 
                            class="text-green-600 hover:text-green-800" title="사진보기">
                        <i class="fas fa-images"></i>
                        <span class="text-xs">${girl.photo_count || 0}</span>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// 검색 기능
function adminSearch() {
    const search = document.getElementById('admin-search').value.trim();
    loadWorkingGirlsList(search);
}

// 새 워킹걸 등록 모달 표시
function showAddWorkingGirlModal() {
    resetWorkingGirlForm();
    document.getElementById('modalTitle').textContent = '새 워킹걸 등록';
    document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save mr-2"></i>등록';
    document.getElementById('existingPhotosSection').classList.add('hidden');
    document.getElementById('workingGirlModal').classList.remove('hidden');
}

// 워킹걸 수정 모달 표시
async function editWorkingGirl(workingGirlId) {
    try {
        const response = await axios.get(`/api/admin/working-girls/${workingGirlId}`);
        
        if (response.data.success) {
            const { workingGirl, photos } = response.data;
            
            // 폼에 기존 데이터 설정
            document.getElementById('editingWorkingGirlId').value = workingGirl.id;
            document.getElementById('wg_username').value = workingGirl.user_id || '';
            document.getElementById('wg_nickname').value = workingGirl.nickname || '';
            document.getElementById('wg_management_code').value = workingGirl.management_code || '';
            document.getElementById('wg_agency').value = workingGirl.agency || '';
            document.getElementById('wg_age').value = workingGirl.age || '';
            document.getElementById('wg_height').value = workingGirl.height || '';
            document.getElementById('wg_weight').value = workingGirl.weight || '';
            
            // 성별 매핑 (DB → 폼)
            const genderReverseMap = {'여자': 'female', '남자': 'male', '트랜스젠더': 'trans'};
            document.getElementById('wg_gender').value = genderReverseMap[workingGirl.gender] || 'female';
            
            document.getElementById('wg_region').value = workingGirl.region || '';
            document.getElementById('wg_phone').value = workingGirl.phone || '';
            document.getElementById('wg_line_id').value = workingGirl.line_id || '';
            document.getElementById('wg_wechat_id').value = workingGirl.kakao_id || '';
            document.getElementById('wg_conditions').value = workingGirl.conditions || '';
            document.getElementById('wg_is_recommended').checked = workingGirl.is_recommended;
            document.getElementById('wg_is_active').checked = workingGirl.is_active;
            
            // 기존 사진 표시
            displayExistingPhotos(photos);
            
            // 모달 설정
            document.getElementById('modalTitle').textContent = '워킹걸 정보 수정';
            document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save mr-2"></i>수정';
            document.getElementById('existingPhotosSection').classList.remove('hidden');
            document.getElementById('workingGirlModal').classList.remove('hidden');
        } else {
            alert('워킹걸 정보를 불러오는데 실패했습니다: ' + response.data.message);
        }
    } catch (error) {
        console.error('워킹걸 정보 로드 오류:', error);
        alert('워킹걸 정보를 불러오는 중 오류가 발생했습니다.');
    }
}

// 기존 사진 표시
function displayExistingPhotos(photos) {
    const container = document.getElementById('existingPhotosList');
    selectedPhotosToDelete.clear();
    
    // 실제로 유효한 사진만 필터링 (Base64 데이터와 URL 모두 지원)
    const validPhotos = photos.filter(photo => 
        photo && photo.photo_url && photo.photo_url.trim() !== '' && 
        (photo.photo_url.startsWith('data:') || photo.photo_url.startsWith('http'))
    );
    
    if (validPhotos.length === 0) {
        container.innerHTML = '<p class="text-gray-500 col-span-full text-center">등록된 사진이 없습니다.</p>';
        return;
    }
    
    container.innerHTML = validPhotos.map(photo => `
        <div class="relative group" data-photo-id="${photo.id}">
            <img src="${photo.photo_url}" 
                 alt="워킹걸 사진" 
                 class="w-full h-24 object-cover rounded border cursor-pointer"
                 onclick="showPhotoLightbox('${photo.photo_url.replace(/'/g, '\\\'').replace(/"/g, '&quot;')}')">
            <button type="button" 
                    onclick="togglePhotoForDeletion(${photo.id})"
                    class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs opacity-70 hover:opacity-100 transition-opacity">
                <i class="fas fa-times"></i>
            </button>
            <div class="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                #${photo.upload_order}
            </div>
        </div>
    `).join('');
}

// 사진 삭제 토글
function togglePhotoForDeletion(photoId) {
    const photoElement = document.querySelector(`[data-photo-id="${photoId}"]`);
    
    if (selectedPhotosToDelete.has(photoId)) {
        selectedPhotosToDelete.delete(photoId);
        photoElement.classList.remove('opacity-50', 'border-red-500');
        photoElement.classList.add('border-gray-300');
    } else {
        selectedPhotosToDelete.add(photoId);
        photoElement.classList.add('opacity-50', 'border-red-500');
        photoElement.classList.remove('border-gray-300');
    }
}

// 새 사진 미리보기
function previewNewPhotos(input) {
    const container = document.getElementById('newPhotosPreview');
    container.innerHTML = '';
    
    if (input.files.length === 0) return;
    
    // 파일 필터링 및 검증
    const validFiles = Array.from(input.files).filter((file, index) => {
        // 이미지 파일 체크
        if (!file.type.startsWith('image/')) {
            alert(`파일 ${index + 1}: 이미지 파일만 업로드 가능합니다.`);
            return false;
        }
        
        // 파일 크기 체크 (5MB 제한)
        if (file.size > 5 * 1024 * 1024) {
            alert(`파일 ${index + 1}: 파일 크기가 너무 큽니다. (최대 5MB)`);
            return false;
        }
        
        return true;
    });
    
    // 유효한 파일들만 미리보기 생성
    validFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const div = document.createElement('div');
            div.className = 'relative group';
            div.innerHTML = `
                <img src="${e.target.result}" 
                     alt="새 사진 ${index + 1}" 
                     class="w-full h-24 object-cover rounded border cursor-pointer"
                     onclick="showPhotoLightbox('${e.target.result.replace(/'/g, '\\\'').replace(/"/g, '&quot;')}')">
                <button type="button" 
                        onclick="removeNewPhoto(${index})"
                        class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs opacity-70 hover:opacity-100 transition-opacity">
                    <i class="fas fa-times"></i>
                </button>
                <div class="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                    새 #${index + 1} (${(file.size / 1024 / 1024).toFixed(1)}MB)
                </div>
            `;
            container.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
    
    // 유효하지 않은 파일이 있다면 input을 재설정
    if (validFiles.length !== input.files.length) {
        const dt = new DataTransfer();
        validFiles.forEach(file => dt.items.add(file));
        input.files = dt.files;
    }
}

// 새 사진 제거
function removeNewPhoto(index) {
    const input = document.getElementById('photoFiles');
    const dt = new DataTransfer();
    
    Array.from(input.files).forEach((file, i) => {
        if (i !== index) {
            dt.items.add(file);
        }
    });
    
    input.files = dt.files;
    previewNewPhotos(input);
}

// 사진 라이트박스 표시
function showPhotoLightbox(imageSrc) {
    const lightbox = document.createElement('div');
    lightbox.className = 'fixed inset-0 bg-black bg-opacity-90 z-[60] flex items-center justify-center';
    lightbox.innerHTML = `
        <div class="relative max-w-4xl max-h-full p-4">
            <button onclick="this.parentElement.parentElement.remove()" 
                    class="absolute top-2 right-2 text-white text-2xl hover:text-gray-300 z-10">
                <i class="fas fa-times"></i>
            </button>
            <img src="${imageSrc}" 
                 alt="사진 확대보기" 
                 class="max-w-full max-h-full object-contain">
        </div>
    `;
    
    // 배경 클릭 시 닫기
    lightbox.addEventListener('click', function(e) {
        if (e.target === lightbox) {
            lightbox.remove();
        }
    });
    
    document.body.appendChild(lightbox);
}

// 워킹걸 폼 제출 처리
async function handleWorkingGirlSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData();
    const editingId = document.getElementById('editingWorkingGirlId').value;
    
    // 기본 정보 추가
    const fields = ['username', 'nickname', 'management_code', 'agency', 'age', 'height', 'weight', 'gender', 'region', 'phone', 'line_id', 'wechat_id', 'conditions'];
    fields.forEach(field => {
        const element = document.getElementById(`wg_${field}`);
        if (element) {
            formData.append(field, element.value);
        }
    });
    
    // 체크박스 처리
    formData.append('is_recommended', document.getElementById('wg_is_recommended').checked);
    formData.append('is_active', document.getElementById('wg_is_active').checked);
    
    // 새 사진 파일 추가
    const photoFiles = document.getElementById('photoFiles').files;
    Array.from(photoFiles).forEach((file, index) => {
        if (editingId) {
            formData.append(`new_photo_${index}`, file);
        } else {
            formData.append(`photo_${index}`, file);
        }
    });
    
    // 삭제할 사진 ID 추가 (수정 모드일 때만)
    if (editingId && selectedPhotosToDelete.size > 0) {
        formData.append('delete_photo_ids', Array.from(selectedPhotosToDelete).join(','));
    }
    
    try {
        let response;
        if (editingId) {
            // 수정 요청
            response = await axios.put(`/api/admin/working-girls/${editingId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        } else {
            // 등록 요청
            response = await axios.post('/api/admin/working-girls', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        }
        
        if (response.data.success) {
            alert(response.data.message);
            closeWorkingGirlModal();
            loadWorkingGirlsList(); // 목록 새로고침
        } else {
            alert('오류: ' + response.data.message);
        }
    } catch (error) {
        console.error('워킹걸 저장 오류:', error);
        alert('저장 중 오류가 발생했습니다.');
    }
}

// 워킹걸 삭제
async function deleteWorkingGirl(workingGirlId) {
    if (!confirm('정말로 이 워킹걸을 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.')) {
        return;
    }
    
    try {
        const response = await axios.delete(`/api/admin/working-girls/${workingGirlId}`);
        
        if (response.data.success) {
            alert(response.data.message);
            loadWorkingGirlsList(); // 목록 새로고침
        } else {
            alert('삭제 실패: ' + response.data.message);
        }
    } catch (error) {
        console.error('워킹걸 삭제 오류:', error);
        alert('삭제 중 오류가 발생했습니다.');
    }
}

// 워킹걸 사진 보기
async function viewWorkingGirlPhotos(workingGirlId) {
    try {
        const response = await axios.get(`/api/admin/working-girls/${workingGirlId}`);
        
        if (response.data.success) {
            const { workingGirl, photos } = response.data;
            
            if (photos.length === 0) {
                alert(`${workingGirl.nickname}님의 등록된 사진이 없습니다.`);
                return;
            }
            
            // 사진 갤러리 모달 생성
            const galleryModal = document.createElement('div');
            galleryModal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
            galleryModal.innerHTML = `
                <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
                    <div class="p-6 border-b flex justify-between items-center">
                        <h3 class="text-xl font-bold">${workingGirl.nickname}님의 사진 (${photos.length}장)</h3>
                        <button onclick="this.closest('.fixed').remove()" 
                                class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    <div class="p-6">
                        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            ${photos.filter(photo => 
                                photo && photo.photo_url && photo.photo_url.trim() !== '' && 
                                (photo.photo_url.startsWith('data:') || photo.photo_url.startsWith('http'))
                            ).map(photo => `
                                <div class="relative">
                                    <img src="${photo.photo_url}" 
                                         alt="워킹걸 사진" 
                                         class="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80"
                                         onclick="showPhotoLightbox('${photo.photo_url.replace(/'/g, '\\\'').replace(/"/g, '&quot;')}')">
                                    <div class="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                                        #${photo.upload_order}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(galleryModal);
            
            // 배경 클릭 시 닫기
            galleryModal.addEventListener('click', function(e) {
                if (e.target === galleryModal) {
                    galleryModal.remove();
                }
            });
        } else {
            alert('사진을 불러오는데 실패했습니다: ' + response.data.message);
        }
    } catch (error) {
        console.error('사진 로드 오류:', error);
        alert('사진을 불러오는 중 오류가 발생했습니다.');
    }
}

// 워킹걸 모달 닫기
function closeWorkingGirlModal() {
    document.getElementById('workingGirlModal').classList.add('hidden');
    resetWorkingGirlForm();
}

// 워킹걸 폼 초기화
function resetWorkingGirlForm() {
    document.getElementById('workingGirlForm').reset();
    document.getElementById('editingWorkingGirlId').value = '';
    document.getElementById('newPhotosPreview').innerHTML = '';
    document.getElementById('existingPhotosList').innerHTML = '';
    selectedPhotosToDelete.clear();
    
    // 기본값 설정
    document.getElementById('wg_is_active').checked = true;
}

// 관리자 로그아웃
async function adminLogout() {
    if (!confirm('로그아웃 하시겠습니까?')) return;
    
    try {
        const response = await axios.post('/api/admin/logout');
        if (response.data.success) {
            alert('로그아웃 되었습니다.');
            window.location.href = '/';
        } else {
            alert('로그아웃에 실패했습니다.');
        }
    } catch (error) {
        console.error('로그아웃 오류:', error);
        alert('로그아웃 중 오류가 발생했습니다.');
    }
}

// 광고 관리 기능들
async function uploadAdvertisement() {
    const fileInput = document.getElementById('ad-upload');
    const titleInput = document.getElementById('ad-title');
    const linkInput = document.getElementById('ad-link');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('업로드할 광고 이미지를 선택해주세요.');
        return;
    }

    // 파일 크기 검증 (10MB)
    if (file.size > 10 * 1024 * 1024) {
        alert('파일 크기가 너무 큽니다. (최대 10MB)');
        return;
    }

    // 이미지 파일 검증
    if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
    }

    // URL 유효성 검증 (입력된 경우만)
    const linkUrl = linkInput ? linkInput.value.trim() : '';
    if (linkUrl && !isValidUrl(linkUrl)) {
        alert('올바른 URL 형식을 입력해주세요. (예: https://example.com)');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('advertisement', file);
        formData.append('title', titleInput ? titleInput.value : '');
        formData.append('link_url', linkUrl);

        const response = await axios.post('/api/admin/advertisements', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data.success) {
            alert(response.data.message);
            fileInput.value = '';
            if (titleInput) titleInput.value = '';
            if (linkInput) linkInput.value = '';
            loadAdvertisementsList(); // 광고 목록 새로고침
        } else {
            alert('업로드 실패: ' + response.data.message);
        }
    } catch (error) {
        console.error('광고 업로드 오류:', error);
        alert('업로드 중 오류가 발생했습니다.');
    }
}

// URL 유효성 검증 함수
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;  
    }
}

// 광고 목록 로드
async function loadAdvertisementsList() {
    try {
        const response = await axios.get('/api/admin/advertisements');
        
        if (response.data.success) {
            displayAdvertisementsList(response.data.advertisements);
        } else {
            console.error('광고 목록 로드 실패:', response.data.message);
        }
    } catch (error) {
        console.error('광고 목록 로드 오류:', error);
    }
}

// 광고 목록 표시
function displayAdvertisementsList(advertisements) {
    const container = document.getElementById('advertisements-list');
    
    if (advertisements.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">등록된 광고가 없습니다.</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${advertisements.map(ad => `
                <div class="border rounded-lg p-4 ${ad.is_active ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}">
                    <img src="${ad.image_url}" 
                         alt="${ad.title || '광고 이미지'}" 
                         class="w-full h-32 object-cover rounded mb-3 cursor-pointer"
                         onclick="showPhotoLightbox('${ad.image_url.replace(/'/g, '\\\'').replace(/"/g, '&quot;')}')">
                    
                    <div class="mb-3">
                        <div class="flex justify-between items-start mb-2">
                            <div class="flex-1">
                                <p class="font-medium text-sm">${ad.title || '제목 없음'}</p>
                                <p class="text-xs text-gray-500">순서: ${ad.display_order}</p>
                            </div>
                            <span class="px-2 py-1 text-xs rounded-full ${
                                ad.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }">
                                ${ad.is_active ? '활성' : '비활성'}
                            </span>
                        </div>
                        ${ad.link_url ? `
                            <div class="text-xs text-blue-600 truncate" title="${ad.link_url}">
                                <i class="fas fa-link mr-1"></i>${ad.link_url}
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="flex flex-col space-y-2">
                        <div class="flex space-x-2">
                            <button onclick="editAdvertisement(${ad.id})" 
                                    class="flex-1 px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded">
                                <i class="fas fa-edit mr-1"></i>편집
                            </button>
                            <button onclick="toggleAdvertisement(${ad.id}, ${!ad.is_active})" 
                                    class="flex-1 px-3 py-1 text-xs rounded ${
                                        ad.is_active ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
                                    }">
                                ${ad.is_active ? '비활성화' : '활성화'}
                            </button>
                        </div>
                        <button onclick="deleteAdvertisement(${ad.id})" 
                                class="w-full px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded">
                            <i class="fas fa-trash mr-1"></i>삭제
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// 광고 활성화/비활성화 토글
async function toggleAdvertisement(adId, isActive) {
    try {
        const response = await axios.put(`/api/admin/advertisements/${adId}/toggle`, {
            is_active: isActive
        });
        
        if (response.data.success) {
            alert(response.data.message);
            loadAdvertisementsList(); // 목록 새로고침
        } else {
            alert('상태 변경 실패: ' + response.data.message);
        }
    } catch (error) {
        console.error('광고 상태 변경 오류:', error);
        alert('상태 변경 중 오류가 발생했습니다.');
    }
}

// 광고 편집
async function editAdvertisement(adId) {
    // 현재 광고 정보 가져오기
    const currentAds = await getCurrentAdvertisements();
    const ad = currentAds.find(a => a.id === adId);
    
    if (!ad) {
        alert('광고 정보를 찾을 수 없습니다.');
        return;
    }

    const title = prompt('광고 제목을 입력하세요:', ad.title || '');
    if (title === null) return; // 취소

    const linkUrl = prompt('링크 URL을 입력하세요 (선택사항):', ad.link_url || '');
    if (linkUrl === null) return; // 취소

    // URL 유효성 검증 (입력된 경우만)
    if (linkUrl.trim() && !isValidUrl(linkUrl.trim())) {
        alert('올바른 URL 형식을 입력해주세요. (예: https://example.com)');
        return;
    }

    try {
        const response = await axios.put(`/api/admin/advertisements/${adId}`, {
            title: title,
            link_url: linkUrl.trim()
        });
        
        if (response.data.success) {
            alert(response.data.message);
            loadAdvertisementsList(); // 목록 새로고침
        } else {
            alert('업데이트 실패: ' + response.data.message);
        }
    } catch (error) {
        console.error('광고 업데이트 오류:', error);
        alert('업데이트 중 오류가 발생했습니다.');
    }
}

// 현재 광고 목록 가져오기 (편집용)
async function getCurrentAdvertisements() {
    try {
        const response = await axios.get('/api/admin/advertisements');
        return response.data.success ? response.data.advertisements : [];
    } catch (error) {
        console.error('광고 목록 조회 오류:', error);
        return [];
    }
}

// 광고 삭제
async function deleteAdvertisement(adId) {
    if (!confirm('정말로 이 광고를 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        const response = await axios.delete(`/api/admin/advertisements/${adId}`);
        
        if (response.data.success) {
            alert(response.data.message);
            loadAdvertisementsList(); // 목록 새로고침
        } else {
            alert('삭제 실패: ' + response.data.message);
        }
    } catch (error) {
        console.error('광고 삭제 오류:', error);
        alert('삭제 중 오류가 발생했습니다.');
    }
}