// 관리자 페이지 JavaScript
let currentWorkingGirls = [];
let selectedPhotosToDelete = new Set();

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== 관리자 페이지 초기화 시작 ===');
    try {
        loadWorkingGirlsList();
        loadAdvertisementsList();
        loadAdSettings();
        loadBackupsList(); // 백업 목록 로드 추가
        setupEventListeners();
        console.log('=== 관리자 페이지 초기화 완료 ===');
    } catch (error) {
        console.error('초기화 중 오류 발생:', error);
    }
});

// 전역 에러 핸들러
window.addEventListener('error', function(e) {
    console.error('전역 JavaScript 에러:', e);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('처리되지 않은 Promise 거부:', e);
});

// 이벤트 리스너 설정
function setupEventListeners() {
    console.log('setupEventListeners 호출됨');
    
    try {
        // 워킹걸 폼 제출 이벤트 - 더 강력하게 등록
        const form = document.getElementById('workingGirlForm');
        console.log('📝 폼 요소 찾기:', !!form);
        
        if (form) {
            // 기존 이벤트 리스너 제거 후 새로 추가
            form.removeEventListener('submit', handleWorkingGirlSubmit);
            form.addEventListener('submit', handleWorkingGirlSubmit);
            console.log('✅ 폼 제출 이벤트 리스너 추가 완료');
            
            // 추가: submit 버튼에도 직접 이벤트 추가 (이중 보장)
            const submitBtn = document.getElementById('submitBtn');
            if (submitBtn) {
                submitBtn.onclick = function(e) {
                    console.log('🖱️ 수정 버튼 직접 클릭됨');
                    e.preventDefault();
                    handleWorkingGirlSubmit(e);
                };
                console.log('✅ 제출 버튼 클릭 이벤트도 추가 완료');
            }
        } else {
            console.error('❌ workingGirlForm을 찾을 수 없습니다!');
        }
        
        // 검색 기능
        const searchInput = document.getElementById('admin-search');
        console.log('검색 입력 요소 찾기:', !!searchInput);
        if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    adminSearch();
                }
            });
        }
        
        // 라디오 버튼은 자동으로 상호 배타적이므로 추가 설정 불필요
        
        console.log('setupEventListeners 완료');
    } catch (error) {
        console.error('setupEventListeners 에러:', error);
    }
}

// VIP와 추천 워킹걸 체크박스를 상호 배타적으로 만드는 함수
function setupExclusiveCheckboxes() {
    // 여러 번 호출되어도 안전하도록 처리
    setTimeout(function() {
        const vipCheckbox = document.getElementById('wg_is_vip');
        const recommendedCheckbox = document.getElementById('wg_is_recommended');
        
        console.log('setupExclusiveCheckboxes 호출됨:', {
            vipExists: !!vipCheckbox,
            recommendedExists: !!recommendedCheckbox
        });
        
        if (vipCheckbox && recommendedCheckbox) {
            // 기존 이벤트 리스너 제거 (중복 방지)
            const newVipCheckbox = vipCheckbox.cloneNode(true);
            const newRecommendedCheckbox = recommendedCheckbox.cloneNode(true);
            
            vipCheckbox.parentNode.replaceChild(newVipCheckbox, vipCheckbox);
            recommendedCheckbox.parentNode.replaceChild(newRecommendedCheckbox, recommendedCheckbox);
            
            // 새로운 이벤트 리스너 추가
            newVipCheckbox.addEventListener('change', function() {
                console.log('🌟 VIP 체크박스 변경됨:', this.checked);
                if (this.checked) {
                    newRecommendedCheckbox.checked = false;
                    console.log('⭐ 추천 체크박스를 자동으로 해제했습니다.');
                }
            });
            
            newRecommendedCheckbox.addEventListener('change', function() {
                console.log('⭐ 추천 체크박스 변경됨:', this.checked);
                if (this.checked) {
                    newVipCheckbox.checked = false;
                    console.log('🌟 VIP 체크박스를 자동으로 해제했습니다.');
                }
            });
            
            console.log('✅ 체크박스 이벤트 리스너가 성공적으로 등록되었습니다.');
        } else {
            console.error('❌ 체크박스를 찾을 수 없습니다!');
        }
    }, 100); // 100ms 후에 실행하여 DOM이 완전히 로드되도록 함
}

// 워킹걸 목록 로드
async function loadWorkingGirlsList(search = '') {
    try {
        console.log('Loading working girls list with search:', search)
        
        const response = await axios.get('/api/admin/working-girls', {
            params: { search },
            timeout: 30000 // 30초 타임아웃
        });
        
        console.log('Working girls API response:', response)
        
        if (response.data.success) {
            currentWorkingGirls = response.data.workingGirls || [];
            console.log('Loaded working girls:', currentWorkingGirls)
            displayWorkingGirlsList();
        } else {
            console.error('API returned error:', response.data.message)
            alert('목록을 불러오는데 실패했습니다: ' + response.data.message);
        }
    } catch (error) {
        console.error('워킹걸 목록 로드 오류:', error);
        console.error('Error details:', {
            message: error.message,
            response: error.response,
            responseData: error.response?.data,
            status: error.response?.status
        })
        
        let errorMessage = '목록을 불러오는 중 오류가 발생했습니다.';
        if (error.response?.status === 500) {
            errorMessage = '서버 오류: ' + (error.response?.data?.message || '데이터베이스 오류');
        } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.message) {
            errorMessage += ' (' + error.message + ')';
        }
        
        alert(errorMessage);
    }
}

// 워킹걸 목록 표시
function displayWorkingGirlsList() {
    const tableBody = document.getElementById('working-girls-table');
    
    if (currentWorkingGirls.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="14" class="px-4 py-8 text-center text-gray-500">
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
                ${girl.is_vip ? '<span class="text-yellow-600" title="VIP 워킹걸">👑</span>' : '-'}
            </td>
            <td class="px-4 py-3">
                ${girl.is_recommended ? '<span class="text-orange-500" title="추천 워킹걸"><i class="fas fa-star"></i></span>' : '-'}
            </td>
            <td class="px-4 py-3">${girl.region || '-'}</td>
            <td class="px-4 py-3">${girl.user_id || '-'}</td>
            <td class="px-4 py-3">${girl.nickname}</td>
            <td class="px-4 py-3">${girl.age || '-'}</td>
            <td class="px-4 py-3">${girl.height ? girl.height + 'cm' : '-'}</td>
            <td class="px-4 py-3">${girl.weight ? girl.weight + 'kg' : '-'}</td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 text-xs rounded-full ${
                    girl.gender === '여성' ? 'bg-pink-100 text-pink-800' :
                    girl.gender === '레이디보이' ? 'bg-blue-100 text-blue-800' :
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
    
    // 신규 등록 시 기본 등급을 '일반'으로 설정
    const normalRadio = document.getElementById('wg_grade_normal');
    if (normalRadio) {
        normalRadio.checked = true;
    }
}

// 워킹걸 수정 모달 표시
async function editWorkingGirl(workingGirlId) {
    console.log(`=== editWorkingGirl(${workingGirlId}) 호출 시작 ===`);
    try {
        console.log('API 요청 시작:', `/api/admin/working-girls/${workingGirlId}`);
        const response = await axios.get(`/api/admin/working-girls/${workingGirlId}`);
        console.log('API 응답 받음:', response.data);
        
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
            
            // 성별 매핑 (DB → 폼) - 올바른 값으로 매핑
            const genderReverseMap = {'여자': 'female', '레이디보이': 'male', '트랜스젠더': 'trans'};
            document.getElementById('wg_gender').value = genderReverseMap[workingGirl.gender] || 'female';
            
            document.getElementById('wg_region').value = workingGirl.region || '';
            document.getElementById('wg_phone').value = workingGirl.phone || '';
            document.getElementById('wg_line_id').value = workingGirl.line_id || '';
            document.getElementById('wg_wechat_id').value = workingGirl.kakao_id || '';
            document.getElementById('wg_fee').value = workingGirl.fee || '';
            document.getElementById('wg_conditions').value = workingGirl.conditions || '';
            
            // 등급 라디오 버튼 설정
            const normalRadio = document.getElementById('wg_grade_normal');
            const recommendedRadio = document.getElementById('wg_grade_recommended');
            const vipRadio = document.getElementById('wg_grade_vip');
            const activeCheckbox = document.getElementById('wg_is_active');
            
            console.log('📋 수정 모달 등급 라디오 버튼 확인:', {
                normal요소존재: !!normalRadio,
                recommended요소존재: !!recommendedRadio,
                vip요소존재: !!vipRadio,
                active요소존재: !!activeCheckbox
            });
            
            if (!normalRadio || !recommendedRadio || !vipRadio || !activeCheckbox) {
                console.error('❌ 수정 모달의 등급 선택 요소를 찾을 수 없습니다!');
                alert('수정 폼 오류: 등급 선택 요소가 없습니다.');
                return;
            }
            
            // 데이터베이스 값에 따라 등급 라디오 버튼 설정
            const dbVipValue = workingGirl.is_vip;
            const dbRecommendedValue = workingGirl.is_recommended;
            const dbActiveValue = workingGirl.is_active;
            
            // 모든 라디오 버튼 초기화 (안전하게)
            if (normalRadio) normalRadio.checked = false;
            if (recommendedRadio) recommendedRadio.checked = false;
            if (vipRadio) vipRadio.checked = false;
            
            // DB 값에 따라 적절한 라디오 버튼 선택 (안전하게)
            if (dbVipValue === 1 || dbVipValue === true) {
                if (vipRadio) vipRadio.checked = true;
            } else if (dbRecommendedValue === 1 || dbRecommendedValue === true) {
                if (recommendedRadio) recommendedRadio.checked = true;
            } else {
                if (normalRadio) normalRadio.checked = true;  // 기본값은 일반
            }
            
            // 활성 상태 설정 (안전하게)
            if (activeCheckbox) {
                activeCheckbox.checked = (dbActiveValue !== 0 && dbActiveValue !== false);
            }
            
            console.log('🎯 워킹걸 데이터 로드 및 등급 설정:', {
                워킹걸ID: workingGirl.id,
                닉네임: workingGirl.nickname,
                DB_VIP값: dbVipValue,
                DB_추천값: dbRecommendedValue,
                DB_활성값: dbActiveValue,
                라디오_VIP선택됨: vipRadio ? vipRadio.checked : false,
                라디오_추천선택됨: recommendedRadio ? recommendedRadio.checked : false,
                라디오_일반선택됨: normalRadio ? normalRadio.checked : false,
                체크박스_활성설정됨: activeCheckbox ? activeCheckbox.checked : false
            });
            
            // 기존 사진 표시
            displayExistingPhotos(photos);
            
            // 모달 설정
            document.getElementById('modalTitle').textContent = '워킹걸 정보 수정';
            document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save mr-2"></i>수정';
            document.getElementById('existingPhotosSection').classList.remove('hidden');
            document.getElementById('workingGirlModal').classList.remove('hidden');
            
            // 라디오 버튼은 자동으로 상호 배타적이므로 추가 설정 불필요
            
            // ⚡ 핵심 수정: 모달이 열릴 때마다 폼 이벤트 리스너 재설정
            console.log('🔄 모달 열림 - 폼 이벤트 리스너 재설정');
            const modalForm = document.getElementById('workingGirlForm');
            const modalSubmitBtn = document.getElementById('submitBtn');
            
            if (modalForm) {
                // 기존 이벤트 제거 후 새로 등록
                modalForm.removeEventListener('submit', handleWorkingGirlSubmit);
                modalForm.addEventListener('submit', handleWorkingGirlSubmit);
                console.log('✅ 모달 폼 이벤트 리스너 재등록 완료');
            }
            
            if (modalSubmitBtn) {
                modalSubmitBtn.onclick = function(e) {
                    console.log('🖱️ 모달 수정 버튼 클릭됨');
                    e.preventDefault();
                    handleWorkingGirlSubmit(e);
                };
                console.log('✅ 모달 제출 버튼 이벤트 재등록 완료');
            }
            
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
                 class="w-full h-24 object-cover rounded border cursor-pointer ${photo.is_main ? 'border-4 border-yellow-400' : 'border-gray-300'}"
                 onclick="showPhotoLightbox('${photo.photo_url.replace(/'/g, '\\\'').replace(/"/g, '&quot;')}')">
            <button type="button" 
                    onclick="togglePhotoForDeletion(${photo.id})"
                    class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs opacity-70 hover:opacity-100 transition-opacity">
                <i class="fas fa-times"></i>
            </button>
            <button type="button" 
                    onclick="setMainPhoto(${photo.id})"
                    class="absolute top-1 left-1 ${photo.is_main ? 'bg-yellow-500' : 'bg-gray-500'} text-white rounded-full w-6 h-6 text-xs opacity-70 hover:opacity-100 transition-opacity"
                    title="${photo.is_main ? '메인 사진' : '메인으로 설정'}">
                <i class="fas fa-star"></i>
            </button>
            <div class="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                #${photo.upload_order} ${photo.is_main ? '★' : ''}
            </div>
        </div>
    `).join('');
}

// 메인 사진 설정
let selectedMainPhotoId = null;

function setMainPhoto(photoId) {
    // 이전 메인 사진 표시 제거
    const previousMain = document.querySelector('.border-yellow-400');
    if (previousMain) {
        previousMain.classList.remove('border-4', 'border-yellow-400');
        previousMain.classList.add('border-gray-300');
    }
    
    // 이전 메인 사진 버튼 색상 변경
    const previousMainBtn = document.querySelector('.bg-yellow-500');
    if (previousMainBtn) {
        previousMainBtn.classList.remove('bg-yellow-500');
        previousMainBtn.classList.add('bg-gray-500');
        previousMainBtn.title = '메인으로 설정';
    }
    
    // 새 메인 사진 설정
    const newMainPhoto = document.querySelector(`[data-photo-id="${photoId}"] img`);
    const newMainBtn = document.querySelector(`[data-photo-id="${photoId}"] button[onclick*="setMainPhoto"]`);
    
    if (newMainPhoto) {
        newMainPhoto.classList.remove('border-gray-300');
        newMainPhoto.classList.add('border-4', 'border-yellow-400');
    }
    
    if (newMainBtn) {
        newMainBtn.classList.remove('bg-gray-500');
        newMainBtn.classList.add('bg-yellow-500');
        newMainBtn.title = '메인 사진';
    }
    
    // 하단 순서 표시에도 별표 추가
    document.querySelectorAll('[data-photo-id] .absolute.bottom-1').forEach(div => {
        if (div.closest('[data-photo-id]').getAttribute('data-photo-id') == photoId) {
            const orderText = div.textContent.replace(' ★', '');
            div.textContent = orderText + ' ★';
        } else {
            div.textContent = div.textContent.replace(' ★', '');
        }
    });
    
    selectedMainPhotoId = photoId;
    console.log('Main photo set to:', photoId);
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
    console.log('🚀🚀🚀 handleWorkingGirlSubmit 함수 호출됨!');
    console.log('이벤트 객체:', e);
    
    e.preventDefault();
    
    const form = e.target || document.getElementById('workingGirlForm');
    const formData = new FormData();
    const editingId = document.getElementById('editingWorkingGirlId').value;
    
    console.log('📋 폼 제출 시작:', {
        form: !!form,
        editingId: editingId,
        이벤트타입: e.type
    });
    
    // 기본 정보 추가
    const fields = ['username', 'nickname', 'management_code', 'agency', 'age', 'height', 'weight', 'gender', 'region', 'phone', 'line_id', 'wechat_id', 'fee', 'conditions'];
    fields.forEach(field => {
        const element = document.getElementById(`wg_${field}`);
        if (element) {
            const value = element.value?.trim() || '';
            formData.append(field, value);
            console.log(`Field ${field}: ${value}`);
        } else {
            console.warn(`Field element not found: wg_${field}`);
        }
    });
    
    // 등급 라디오 버튼 처리
    console.log('🚀 폼 제출 시 등급 라디오 버튼 상태 확인 시작');
    
    // ❌ 완전 안전하게 등급 라디오 버튼 요소 찾기 (없어도 오류 안내기)
    let normalRadio, recommendedRadio, vipRadio, activeElement;
    
    try {
        normalRadio = document.querySelector('#wg_grade_normal');
        recommendedRadio = document.querySelector('#wg_grade_recommended');
        vipRadio = document.querySelector('#wg_grade_vip');
        activeElement = document.querySelector('#wg_is_active');
    } catch (error) {
        console.error('❌ 등급 요소 찾기 오류:', error);
        // 없어도 계속 진행
    }
    
    console.log('🔍 등급 라디오 버튼 요소 확인:', {
        normal_찾음: !!normalRadio,
        recommended_찾음: !!recommendedRadio,
        vip_찾음: !!vipRadio,
        active_찾음: !!activeElement
    });
    
    // ❌ 요소가 없어도 오류 내지 말고 기본값 사용
    
    // 라디오 버튼 직접 체크 - 기본적이고 확실한 방법
    let vipChecked = false;
    let recommendedChecked = false;
    
    // 안전하게 라디오 버튼 상태 확인
    if (vipRadio && vipRadio.checked) {
        vipChecked = true;
        recommendedChecked = false;
    } else if (recommendedRadio && recommendedRadio.checked) {
        vipChecked = false;
        recommendedChecked = true;
    } else {
        // normalRadio가 체크되어 있거나 아무것도 체크 안된 경우
        vipChecked = false;
        recommendedChecked = false;
    }
    
    // 활성 상태 체크
    const activeChecked = activeElement && activeElement.checked;
    
    console.log('🔄 등급 선택 상태 확인 (직접 체크):', {
        vipRadio존재: !!vipRadio,
        vipRadio체크: vipRadio ? vipRadio.checked : false,
        recommendedRadio존재: !!recommendedRadio,
        recommendedRadio체크: recommendedRadio ? recommendedRadio.checked : false,
        normalRadio존재: !!normalRadio,
        normalRadio체크: normalRadio ? normalRadio.checked : false,
        activeElement존재: !!activeElement,
        activeElement체크: activeElement ? activeElement.checked : false
    });
    
    // ❌ 오류 방지: 라디오 버튼이 없으면 기본값 사용
    if (!vipRadio || !recommendedRadio || !normalRadio) {
        console.error('❌ 등급 라디오 버튼 요소를 찾을 수 없습니다. 기본값 사용.');
        vipChecked = false;
        recommendedChecked = false;
    }
    
    console.log('🎯 최종 등급 및 활성 상태 결정:', {
        VIP최종: vipChecked,
        추천최종: recommendedChecked,
        활성최종: activeChecked
    });
    
    // 문자열로 변환해서 FormData에 추가
    const vipString = vipChecked ? 'true' : 'false';
    const recommendedString = recommendedChecked ? 'true' : 'false'; 
    const activeString = activeChecked ? 'true' : 'false';
    
    formData.append('is_vip', vipString);
    formData.append('is_recommended', recommendedString);
    formData.append('is_active', activeString);
    
    console.log('🚀 최종 FormData 전송 값:', {
        grade: gradeValue,
        is_vip: vipString,
        is_recommended: recommendedString,
        is_active: activeString
    });
    
    console.log('📤 FormData에 추가된 최종 값:', {
        is_vip: vipString,
        is_recommended: recommendedString,
        is_active: activeString
    });
    
    // FormData 내용 전체 확인
    console.log('📋 전체 FormData 내용:');
    for (const [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value}`);
    }
    
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
    
    // 메인 사진 ID 추가 (수정 모드일 때만)
    if (editingId && selectedMainPhotoId) {
        formData.append('main_photo_id', selectedMainPhotoId);
    }
    
    try {
        console.log('=== 폼 제출 시작 ===');
        console.log('편집 중인 워킹걸 ID:', editingId);
        console.log('체크박스 최종 상태:', {
            vip_checked: isVipChecked,
            recommended_checked: isRecommendedChecked,
            active_checked: isActiveChecked
        });
        
        console.log('FormData entries:');
        for (let pair of formData.entries()) {
            console.log(`  ${pair[0]}: ${pair[1]}`);
        }
        console.log('===================');
        
        let response;
        if (editingId) {
            // 수정 요청
            console.log('🚀 PUT 요청 시작:', `/api/admin/working-girls/${editingId}`);
            console.log('🚀 요청 데이터:', formData);
            
            // 실제로 전송되는 모든 데이터를 확실히 확인
            console.log('📋 최종 전송 데이터:');
            for (let [key, value] of formData.entries()) {
                console.log(`   ${key}: ${value} (타입: ${typeof value})`);
            }
            
            response = await axios.put(`/api/admin/working-girls/${editingId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            console.log('✅ PUT 응답 받음:', response);
        } else {
            // 등록 요청
            console.log('Sending POST request to: /api/admin/working-girls');
            response = await axios.post('/api/admin/working-girls', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        }
        
        console.log('Response:', response);
        console.log('Response data:', response.data);
        
        if (response.data.success) {
            alert(response.data.message);
            closeWorkingGirlModal();
            loadWorkingGirlsList(); // 목록 새로고침
        } else {
            alert('오류: ' + response.data.message);
        }
    } catch (error) {
        console.error('워킹걸 저장 오류:', error);
        console.error('Error details:', {
            message: error.message,
            response: error.response,
            responseData: error.response?.data,
            status: error.response?.status
        });
        
        const errorMessage = error.response?.data?.message || error.message || '알 수 없는 오류가 발생했습니다.';
        alert('저장 중 오류가 발생했습니다: ' + errorMessage);
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
    selectedMainPhotoId = null;
    
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

// 광고 설정 로드
async function loadAdSettings() {
    try {
        const response = await axios.get('/api/admin/advertisement-settings');
        
        if (response.data.success) {
            const settings = response.data.settings;
            
            // 설정 값을 폼에 채우기
            if (settings.default_scroll_interval) {
                document.getElementById('default-scroll-interval').value = Math.floor(settings.default_scroll_interval / 1000);
            }
            if (settings.max_priority) {
                document.getElementById('max-priority').value = settings.max_priority;
            }
            if (settings.optimal_banner_size) {
                document.getElementById('optimal-banner-size').value = settings.optimal_banner_size;
                document.getElementById('optimal-size-display').textContent = settings.optimal_banner_size;
            }
        }
    } catch (error) {
        console.error('광고 설정 로드 오류:', error);
    }
}

// 광고 설정 업데이트
async function updateAdSettings() {
    try {
        const defaultScrollInterval = document.getElementById('default-scroll-interval').value;
        const maxPriority = document.getElementById('max-priority').value;
        const optimalBannerSize = document.getElementById('optimal-banner-size').value;
        
        const response = await axios.put('/api/admin/advertisement-settings', {
            settings: {
                default_scroll_interval: (parseInt(defaultScrollInterval) * 1000).toString(), // 초를 밀리초로 변환
                max_priority: maxPriority,
                optimal_banner_size: optimalBannerSize
            }
        });
        
        if (response.data.success) {
            alert(response.data.message);
            // 최적 사이즈 표시 업데이트
            document.getElementById('optimal-size-display').textContent = optimalBannerSize;
        } else {
            alert('설정 업데이트 실패: ' + response.data.message);
        }
    } catch (error) {
        console.error('광고 설정 업데이트 오류:', error);
        alert('설정 업데이트 중 오류가 발생했습니다.');
    }
}

// 광고 관리 기능들
async function uploadAdvertisement() {
    const fileInput = document.getElementById('ad-upload');
    const titleInput = document.getElementById('ad-title');
    const linkInput = document.getElementById('ad-link');
    const priorityInput = document.getElementById('ad-priority');
    const scrollTimeInput = document.getElementById('ad-scroll-time');
    const durationInput = document.getElementById('ad-duration');
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
        formData.append('display_order', priorityInput ? priorityInput.value : '5');
        formData.append('scroll_interval', scrollTimeInput ? (parseInt(scrollTimeInput.value) * 1000).toString() : '3000');
        formData.append('duration', durationInput ? durationInput.value : '');

        const response = await axios.post('/api/admin/advertisements', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data.success) {
            alert(response.data.message);
            // 폼 리셋
            fileInput.value = '';
            if (titleInput) titleInput.value = '';
            if (linkInput) linkInput.value = '';
            if (priorityInput) priorityInput.value = '5';
            if (scrollTimeInput) scrollTimeInput.value = '3';
            if (durationInput) durationInput.value = '';
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
        <h3 class="text-lg font-semibold mb-3">📋 등록된 광고 목록</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${advertisements.map(ad => {
                const scrollTime = ad.scroll_interval ? Math.floor(ad.scroll_interval / 1000) : 3;
                const isExpired = ad.is_expired || (ad.expires_at && new Date(ad.expires_at) <= new Date());
                const expirationText = ad.expires_at ? 
                    (isExpired ? '만료됨' : `만료: ${new Date(ad.expires_at).toLocaleDateString('ko-KR')}`) : '무제한';
                
                return `
                <div class="border rounded-lg p-4 ${
                    isExpired ? 'border-orange-300 bg-orange-50' :
                    ad.is_active ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                }">
                    <img src="${ad.image_url}" 
                         alt="${ad.title || '광고 이미지'}" 
                         class="w-full h-32 object-cover rounded mb-3 cursor-pointer"
                         onclick="showPhotoLightbox('${ad.image_url.replace(/'/g, '\\\'').replace(/"/g, '&quot;')}')">
                    
                    <div class="mb-3">
                        <div class="flex justify-between items-start mb-2">
                            <div class="flex-1">
                                <p class="font-medium text-sm">${ad.title || '제목 없음'}</p>
                                <p class="text-xs text-gray-600">우선순위: ${ad.display_order}</p>
                                <p class="text-xs text-gray-600">스크롤 시간: ${scrollTime}초</p>
                                <p class="text-xs text-gray-600">기간: ${expirationText}</p>
                            </div>
                            <div class="flex flex-col items-end space-y-1">
                                <span class="px-2 py-1 text-xs rounded-full ${
                                    isExpired ? 'bg-orange-100 text-orange-800' :
                                    ad.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }">
                                    ${isExpired ? '만료' : ad.is_active ? '활성' : '비활성'}
                                </span>
                            </div>
                        </div>
                        ${ad.link_url ? `
                            <div class="text-xs text-blue-600 truncate" title="${ad.link_url}">
                                <i class="fas fa-link mr-1"></i>${ad.link_url}
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="flex flex-col space-y-2">
                        <div class="flex space-x-2">
                            <button onclick="editAdvertisementAdvanced(${ad.id})" 
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
            `}).join('')}
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

// 고급 광고 편집 (새로운 기능들 포함)
async function editAdvertisementAdvanced(adId) {
    // 현재 광고 정보 가져오기
    const currentAds = await getCurrentAdvertisements();
    const ad = currentAds.find(a => a.id === adId);
    
    if (!ad) {
        alert('광고 정보를 찾을 수 없습니다.');
        return;
    }

    // 고급 편집 모달 생성
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-screen overflow-y-auto">
            <div class="p-6 border-b">
                <h3 class="text-xl font-bold">광고 편집</h3>
            </div>
            <div class="p-6 space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">광고 제목</label>
                    <input type="text" id="edit-title" value="${ad.title || ''}" 
                           class="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">링크 URL</label>
                    <input type="url" id="edit-link" value="${ad.link_url || ''}" 
                           class="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">우선순위 (1-10)</label>
                    <input type="number" id="edit-priority" min="1" max="10" value="${ad.display_order || 5}" 
                           class="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">스크롤 시간 (초)</label>
                    <input type="number" id="edit-scroll-time" min="1" max="60" value="${ad.scroll_interval ? Math.floor(ad.scroll_interval / 1000) : 3}" 
                           class="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">광고 기간 연장</label>
                    <select id="edit-duration" class="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
                        <option value="">현재 상태 유지</option>
                        <option value="2주일">2주일 연장</option>
                        <option value="1달">1달 연장</option>
                        <option value="1년">1년 연장</option>
                        <option value="unlimited">무제한으로 변경</option>
                    </select>
                    ${ad.expires_at ? `<p class="text-xs text-gray-500 mt-1">현재 만료일: ${new Date(ad.expires_at).toLocaleDateString('ko-KR')}</p>` : ''}
                </div>
            </div>
            <div class="p-6 border-t flex justify-end space-x-4">
                <button onclick="this.closest('.fixed').remove()" 
                        class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    취소
                </button>
                <button onclick="saveAdvancedEdit(${adId})" 
                        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                    저장
                </button>
            </div>
        </div>
    `;
    
    // 배경 클릭 시 닫기
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    document.body.appendChild(modal);
}

// 고급 편집 저장
async function saveAdvancedEdit(adId) {
    const title = document.getElementById('edit-title').value.trim();
    const linkUrl = document.getElementById('edit-link').value.trim();
    const priority = document.getElementById('edit-priority').value;
    const scrollTime = document.getElementById('edit-scroll-time').value;
    const duration = document.getElementById('edit-duration').value;
    
    // URL 유효성 검증 (입력된 경우만)
    if (linkUrl && !isValidUrl(linkUrl)) {
        alert('올바른 URL 형식을 입력해주세요. (예: https://example.com)');
        return;
    }

    try {
        const updateData = {
            title: title,
            link_url: linkUrl,
            display_order: parseInt(priority),
            scroll_interval: parseInt(scrollTime) * 1000 // 초를 밀리초로 변환
        };
        
        // 기간 처리
        if (duration === 'unlimited') {
            updateData.expires_at = null;
        } else if (duration && ['2주일', '1달', '1년'].includes(duration)) {
            updateData.expires_at = duration; // 백엔드에서 처리
        }
        
        const response = await axios.put(`/api/admin/advertisements/${adId}`, updateData);
        
        if (response.data.success) {
            alert(response.data.message);
            document.querySelector('.fixed.inset-0').remove(); // 모달 닫기
            loadAdvertisementsList(); // 목록 새로고침
        } else {
            alert('업데이트 실패: ' + response.data.message);
        }
    } catch (error) {
        console.error('광고 업데이트 오류:', error);
        alert('업데이트 중 오류가 발생했습니다.');
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

// =============================================================================
// 데이터 백업 관리 기능
// =============================================================================

// 백업 목록 로드 (페이지 로드시 자동 호출)
async function loadBackupsList() {
    try {
        const response = await axios.get('/api/admin/backup/list');
        
        if (response.data.success) {
            displayBackupsList(response.data.backups);
        } else {
            console.error('백업 목록 로드 실패:', response.data.message);
            displayBackupsList([]);
        }
    } catch (error) {
        console.error('백업 목록 로드 오류:', error);
        displayBackupsList([]);
    }
}

// 백업 목록 화면 표시
function displayBackupsList(backups) {
    const backupListContainer = document.getElementById('backup-list');
    
    if (!backups || backups.length === 0) {
        backupListContainer.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-database text-3xl mb-3 opacity-50"></i>
                <p class="text-lg">생성된 백업이 없습니다</p>
                <p class="text-sm">위의 "백업 생성" 버튼을 눌러 첫 번째 백업을 만들어보세요.</p>
            </div>
        `;
        return;
    }

    const backupHTML = backups.map(backup => {
        const backupDate = new Date(backup.backup_date);
        const formattedDate = backupDate.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'Asia/Seoul'
        }) + ' (한국시간)';

        return `
            <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-center">
                    <div class="flex-1">
                        <div class="flex items-center mb-2">
                            <i class="fas fa-archive text-blue-600 mr-2"></i>
                            <h3 class="font-semibold text-lg">${backup.backup_name}</h3>
                        </div>
                        <div class="text-sm text-gray-600 space-y-1">
                            <p><i class="fas fa-clock mr-1"></i> 생성일시: ${formattedDate}</p>
                            <p><i class="fas fa-database mr-1"></i> 데이터 수: ${backup.backup_size}개 항목</p>
                            ${backup.backup_description ? `<p><i class="fas fa-info-circle mr-1"></i> ${backup.backup_description}</p>` : ''}
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="restoreBackup(${backup.id}, '${backup.backup_name}')" 
                                class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors">
                            <i class="fas fa-undo mr-1"></i>복원
                        </button>
                        <button onclick="deleteBackup(${backup.id}, '${backup.backup_name}')" 
                                class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors">
                            <i class="fas fa-trash mr-1"></i>삭제
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    backupListContainer.innerHTML = backupHTML;
}

// 백업 생성
async function createBackup() {
    // 확인 메시지
    const confirmed = confirm(
        '새로운 백업을 생성하시겠습니까?\n\n' +
        '• 현재 모든 워킹걸, 사진, 광고 데이터가 백업됩니다.\n' +
        '• 백업은 최대 5개까지 저장되며, 초과시 가장 오래된 백업이 삭제됩니다.\n' +
        '• 백업 생성에 시간이 걸릴 수 있습니다.'
    );
    
    if (!confirmed) {
        return;
    }

    const createButton = document.querySelector('button[onclick="createBackup()"]');
    const originalText = createButton.innerHTML;
    
    try {
        // 버튼 상태 변경 (로딩 표시)
        createButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>백업 생성 중...';
        createButton.disabled = true;

        const response = await axios.post('/api/admin/backup/create');
        
        if (response.data.success) {
            alert(`백업이 성공적으로 생성되었습니다!\n\n백업명: ${response.data.backup.name}\n데이터 수: ${response.data.backup.size}개 항목`);
            loadBackupsList(); // 목록 새로고침
        } else {
            alert('백업 생성 실패: ' + response.data.message);
        }
    } catch (error) {
        console.error('백업 생성 오류:', error);
        alert('백업 생성 중 오류가 발생했습니다.');
    } finally {
        // 버튼 상태 복원
        createButton.innerHTML = originalText;
        createButton.disabled = false;
    }
}

// 백업 복원
async function restoreBackup(backupId, backupName) {
    // 강력한 확인 메시지
    const firstConfirm = confirm(
        `⚠️ 백업 복원 경고 ⚠️\n\n` +
        `백업 "${backupName}"을(를) 복원하시겠습니까?\n\n` +
        `🔴 주의사항:\n` +
        `• 현재 모든 데이터가 완전히 삭제됩니다!\n` +
        `• 워킹걸, 사진, 광고 데이터가 모두 사라집니다!\n` +
        `• 이 작업은 되돌릴 수 없습니다!\n\n` +
        `정말로 계속하시겠습니까?`
    );
    
    if (!firstConfirm) {
        return;
    }

    // 두 번째 확인
    const secondConfirm = confirm(
        `마지막 확인\n\n` +
        `"${backupName}" 백업으로 복원하면\n` +
        `현재 모든 데이터가 삭제되고 백업 시점의 데이터로 교체됩니다.\n\n` +
        `이 작업을 진행하시겠습니까?\n\n` +
        `(취소하려면 "취소"를 클릭하세요)`
    );
    
    if (!secondConfirm) {
        return;
    }

    try {
        // 복원 진행 알림
        alert('백업 복원을 시작합니다. 완료될 때까지 기다려 주세요.');

        const response = await axios.post(`/api/admin/backup/restore/${backupId}`);
        
        if (response.data.success) {
            alert(
                `백업이 성공적으로 복원되었습니다!\n\n` +
                `백업명: ${response.data.backup.name}\n` +
                `복원된 데이터: ${response.data.backup.restored_count}개 항목\n` +
                `백업 생성일: ${new Date(response.data.backup.backup_date).toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'})} (한국시간)\n\n` +
                `페이지를 새로고침합니다.`
            );
            
            // 페이지 새로고침으로 복원된 데이터 표시
            window.location.reload();
        } else {
            alert('백업 복원 실패: ' + response.data.message);
        }
    } catch (error) {
        console.error('백업 복원 오류:', error);
        alert('백업 복원 중 오류가 발생했습니다.');
    }
}

// 백업 삭제
async function deleteBackup(backupId, backupName) {
    // 확인 메시지
    const confirmed = confirm(
        `백업 파일을 삭제하시겠습니까?\n\n` +
        `백업명: ${backupName}\n\n` +
        `⚠️ 삭제된 백업 파일은 복구할 수 없습니다!`
    );
    
    if (!confirmed) {
        return;
    }

    try {
        const response = await axios.delete(`/api/admin/backup/delete/${backupId}`);
        
        if (response.data.success) {
            alert(response.data.message);
            loadBackupsList(); // 목록 새로고침
        } else {
            alert('백업 삭제 실패: ' + response.data.message);
        }
    } catch (error) {
        console.error('백업 삭제 오류:', error);
        alert('백업 삭제 중 오류가 발생했습니다.');
    }
}

// 페이지 로드시 백업 목록도 함께 로드하도록 기존 초기화 함수 수정
// (기존 loadWorkingGirlsList(), loadAdvertisementsList() 함수와 함께 호출)