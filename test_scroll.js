// 페이지를 아래로 스크롤해서 다음 페이지 로딩 테스트
async function testScroll() {
    // 페이지 하단으로 스크롤
    window.scrollTo(0, document.body.scrollHeight);
    
    // 1초 대기
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('스크롤 완료 - 추가 로딩 확인 중...');
}

testScroll();
