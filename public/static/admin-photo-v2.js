// 이미지 압축 함수
function compressImage(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            // 비율 유지하면서 리사이즈
            const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;
            
            // 이미지 그리기
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // 압축된 이미지를 Blob으로 변환
            canvas.toBlob(resolve, file.type, quality);
        };
        
        img.src = URL.createObjectURL(file);
    });
}

// 새 사진 미리보기 (압축 기능 추가)
async function previewNewPhotos(input) {
    const container = document.getElementById('newPhotosPreview');
    container.innerHTML = '';
    
    if (input.files.length === 0) return;
    
    // 사진 개수 제한 (5장)
    if (input.files.length > 5) {
        alert('사진은 최대 5장까지만 업로드할 수 있습니다.');
        return;
    }
    
    const progressDiv = document.createElement('div');
    progressDiv.className = 'col-span-full mb-4';
    progressDiv.innerHTML = '<p class="text-blue-600">이미지 처리 중...</p>';
    container.appendChild(progressDiv);
    
    // 파일 필터링, 검증 및 압축
    const processedFiles = [];
    
    for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        
        // 이미지 파일 체크
        if (!file.type.startsWith('image/')) {
            alert(`파일 ${i + 1}: 이미지 파일만 업로드 가능합니다.`);
            continue;
        }
        
        // 원본 파일 크기 체크 (20MB 제한)
        if (file.size > 20 * 1024 * 1024) {
            alert(`파일 ${i + 1}: 원본 파일이 너무 큽니다. (최대 20MB)`);
            continue;
        }
        
        try {
            // 이미지 압축
            const compressedFile = await compressImage(file);
            
            // 압축 후 크기 체크 (2MB 제한)
            if (compressedFile.size > 2 * 1024 * 1024) {
                alert(`파일 ${i + 1}: 압축 후에도 파일이 너무 큽니다. 다른 이미지를 선택해주세요.`);
                continue;
            }
            
            processedFiles.push({
                original: file,
                compressed: compressedFile,
                index: i
            });
            
        } catch (error) {
            console.error(`이미지 ${i + 1} 압축 오류:`, error);
            alert(`파일 ${i + 1}: 이미지 처리 중 오류가 발생했습니다.`);
        }
    }
    
    // 진행률 업데이트
    progressDiv.remove();
    
    // 처리된 파일들 미리보기 생성
    processedFiles.forEach((fileData, index) => {
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
                    새 #${index + 1} (${(fileData.compressed.size / 1024 / 1024).toFixed(1)}MB)
                </div>
            `;
            container.appendChild(div);
        };
        reader.readAsDataURL(fileData.compressed);
    });
    
    // input 파일 목록을 압축된 파일들로 교체
    if (processedFiles.length > 0) {
        const dt = new DataTransfer();
        processedFiles.forEach(fileData => {
            // 압축된 파일을 File 객체로 변환
            const compressedFile = new File([fileData.compressed], fileData.original.name, {
                type: fileData.original.type,
                lastModified: Date.now()
            });
            dt.items.add(compressedFile);
        });
        input.files = dt.files;
    }
}

// 순차적 사진 업로드 함수
async function uploadPhotosSequentially(workingGirlId, photoFiles, isEdit = false) {
    const results = [];
    const totalPhotos = photoFiles.length;
    
    // 진행률 표시 모달 생성
    const progressModal = document.createElement('div');
    progressModal.className = 'fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center';
    progressModal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 class="text-lg font-bold mb-4">사진 업로드 중...</h3>
            <div class="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div id="upload-progress-bar" class="bg-blue-600 h-2.5 rounded-full" style="width: 0%"></div>
            </div>
            <p id="upload-status" class="text-sm text-gray-600">준비 중...</p>
        </div>
    `;
    document.body.appendChild(progressModal);
    
    try {
        for (let i = 0; i < totalPhotos; i++) {
            const file = photoFiles[i];
            const progress = ((i) / totalPhotos * 100);
            
            // 진행률 업데이트
            document.getElementById('upload-progress-bar').style.width = `${progress}%`;
            document.getElementById('upload-status').textContent = `사진 ${i + 1}/${totalPhotos} 업로드 중...`;
            
            try {
                // 개별 사진 업로드
                const photoFormData = new FormData();
                photoFormData.append('working_girl_id', workingGirlId);
                photoFormData.append('photo', file);
                photoFormData.append('upload_order', i + 1);
                photoFormData.append('is_main', i === 0 ? '1' : '0');
                
                const response = await axios.post('/api/admin/upload-single-photo', photoFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    timeout: 30000 // 30초 타임아웃
                });
                
                if (response.data.success) {
                    results.push({ success: true, index: i, photoId: response.data.photoId });
                } else {
                    results.push({ success: false, index: i, error: response.data.message });
                }
            } catch (error) {
                console.error(`사진 ${i + 1} 업로드 오류:`, error);
                results.push({ success: false, index: i, error: error.message });
            }
            
            // 잠시 대기 (서버 부하 방지)
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // 완료 상태 표시
        document.getElementById('upload-progress-bar').style.width = '100%';
        document.getElementById('upload-status').textContent = '업로드 완료!';
        
        // 2초 후 모달 제거
        setTimeout(() => {
            progressModal.remove();
        }, 2000);
        
        return results;
        
    } catch (error) {
        progressModal.remove();
        throw error;
    }
}

// 워킹걸 폼 제출 처리 (최적화)
async function handleWorkingGirlSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const editingId = document.getElementById('editingWorkingGirlId').value;
    const photoFiles = Array.from(document.getElementById('photoFiles').files);
    
    // 제출 버튼 비활성화
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>처리 중...';
    
    try {
        // 1단계: 기본 정보만 먼저 저장/업데이트 (사진 제외)
        const formData = new FormData();
        
        // 기본 정보 추가
        const fields = ['username', 'nickname', 'management_code', 'agency', 'age', 'height', 'weight', 'gender', 'region', 'phone', 'line_id', 'wechat_id', 'fee', 'conditions'];
        fields.forEach(field => {
            const element = document.getElementById(`wg_${field}`);
            if (element) {
                const value = element.value?.trim() || '';
                formData.append(field, value);
            }
        });
        
        // 등급 라디오 버튼 처리 (안전하게)
        let vipChecked = false;
        let recommendedChecked = false;
        
        const vipRadio = document.querySelector('#wg_grade_vip');
        const recommendedRadio = document.querySelector('#wg_grade_recommended');
        const activeElement = document.querySelector('#wg_is_active');
        
        // 라디오 버튼 상태 확인 (안전하게)
        if (vipRadio && vipRadio.checked) {
            vipChecked = true;
            recommendedChecked = false;
        } else if (recommendedRadio && recommendedRadio.checked) {
            vipChecked = false;
            recommendedChecked = true;
        } else {
            vipChecked = false;
            recommendedChecked = false;
        }
        
        // 활성 상태 확인 (안전하게)
        const activeChecked = activeElement ? activeElement.checked : true; // 기본값 true
        
        // FormData에 추가
        formData.append('is_vip', vipChecked ? 'true' : 'false');
        formData.append('is_recommended', recommendedChecked ? 'true' : 'false');
        formData.append('is_active', activeChecked ? 'true' : 'false');
        
        // 삭제할 사진 ID 추가 (수정 모드일 때만)
        if (editingId && selectedPhotosToDelete.size > 0) {
            formData.append('delete_photo_ids', Array.from(selectedPhotosToDelete).join(','));
        }
        
        // 메인 사진 ID 추가 (수정 모드일 때만)
        if (editingId && selectedMainPhotoId) {
            formData.append('main_photo_id', selectedMainPhotoId);
        }
        
        let basicInfoResponse;
        let workingGirlId;
        
        if (editingId) {
            // 수정 요청
            basicInfoResponse = await axios.put(`/api/admin/working-girls/${editingId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 15000 // 15초 타임아웃
            });
            workingGirlId = editingId;
        } else {
            // 등록 요청
            basicInfoResponse = await axios.post('/api/admin/working-girls', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 15000 // 15초 타임아웃
            });
            workingGirlId = basicInfoResponse.data.workingGirl?.id;
        }
        
        if (!basicInfoResponse.data.success) {
            throw new Error(basicInfoResponse.data.message);
        }
        
        // 2단계: 사진이 있으면 순차적으로 업로드
        if (photoFiles.length > 0 && workingGirlId) {
            const uploadResults = await uploadPhotosSequentially(workingGirlId, photoFiles, !!editingId);
            
            // 업로드 결과 분석
            const successful = uploadResults.filter(r => r.success).length;
            const failed = uploadResults.filter(r => !r.success).length;
            
            if (failed > 0) {
                alert(`기본 정보는 저장되었으나, ${failed}개 사진 업로드에 실패했습니다. (성공: ${successful}개)`);
            } else {
                alert(`모든 정보가 성공적으로 저장되었습니다. (사진 ${successful}개 업로드 완료)`);
            }
        } else {
            alert(basicInfoResponse.data.message);
        }
        
        closeWorkingGirlModal();
        loadWorkingGirlsList(); // 목록 새로고침
        
    } catch (error) {
        console.error('워킹걸 저장 오류:', error);
        
        let errorMessage = '알 수 없는 오류가 발생했습니다.';
        if (error.response?.status === 503) {
            errorMessage = '서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요.';
        } else if (error.response?.status === 413) {
            errorMessage = '파일 크기가 너무 큽니다. 더 작은 이미지를 사용해주세요.';
        } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        alert('저장 중 오류가 발생했습니다: ' + errorMessage);
    } finally {
        // 제출 버튼 복원
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}