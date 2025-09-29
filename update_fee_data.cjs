const { execSync } = require('child_process');

async function updateFeeData() {
    console.log('💰 Fee 데이터 업데이트 시작...');
    
    try {
        // 프로덕션에서 fee 데이터가 있는 워킹걸들 가져오기
        console.log('1️⃣ 프로덕션 fee 데이터 가져오기...');
        const feeResult = execSync(`npx wrangler d1 execute webapp-production --remote --command="SELECT id, fee FROM working_girls WHERE fee IS NOT NULL AND fee != ''" --json`, {cwd: '/home/user/webapp'});
        const feeData = JSON.parse(feeResult.toString());
        const girls = feeData[0].results;
        
        console.log(`📊 Fee 데이터가 있는 워킹걸: ${girls.length}명`);
        
        // 로컬 데이터베이스 업데이트
        let successCount = 0;
        let failCount = 0;
        
        for (const girl of girls) {
            const cleanFee = girl.fee.replace(/'/g, "''"); // SQL injection 방지
            
            try {
                execSync(`npx wrangler d1 execute webapp-production --local --command="UPDATE working_girls SET fee = '${cleanFee}' WHERE id = ${girl.id}"`, 
                         {cwd: '/home/user/webapp', stdio: 'ignore'});
                successCount++;
                console.log(`✅ ID ${girl.id}: Fee 데이터 업데이트 완료`);
            } catch (error) {
                failCount++;
                console.log(`❌ ID ${girl.id}: Fee 데이터 업데이트 실패`);
            }
        }
        
        console.log(`\n🎉 Fee 데이터 업데이트 완료!`);
        console.log(`✅ 성공: ${successCount}개`);
        console.log(`❌ 실패: ${failCount}개`);
        
        return successCount > 0;
        
    } catch (error) {
        console.error('❌ Fee 데이터 업데이트 오류:', error.message);
        return false;
    }
}

updateFeeData();