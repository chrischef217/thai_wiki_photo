const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  const page = await browser.newPage();
  
  // 콘솔 로그 캡처
  page.on('console', msg => {
    console.log('BROWSER LOG:', msg.type(), msg.text());
  });
  
  try {
    await page.goto('https://3000-ivn7qqwkug2m31nhzjr1c-6532622b.e2b.dev/admin');
    
    // 페이지 로드 대기
    await page.waitForSelector('button[onclick*="editWorkingGirl"]', { timeout: 10000 });
    
    console.log('페이지 로드 완료, 수정 버튼 찾음');
    
    // JavaScript 함수 직접 실행 (27번 요요)
    await page.evaluate(() => {
      console.log('editWorkingGirl(27) 호출 시작');
      if (typeof editWorkingGirl === 'function') {
        editWorkingGirl(27);
      } else {
        console.log('editWorkingGirl 함수가 존재하지 않음');
      }
    });
    
    // 잠시 대기해서 로그 확인
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('에러:', error.message);
  }
  
  await browser.close();
})();
