const { execSync } = require('child_process');
const fs = require('fs');

async function restoreAllData() {
  console.log('🔄 모든 프로덕션 데이터를 로컬로 복원 시작...');
  
  try {
    // 1. 프로덕션 워킹걸 데이터 내보내기 (작은 청크로)
    console.log('1️⃣ 프로덕션 워킹걸 데이터 가져오는 중...');
    
    const girlsCmd = `npx wrangler d1 execute webapp-production --remote --command="SELECT id, user_id, password, nickname, age, height, weight, gender, region, line_id, kakao_id, phone, management_code, agency, fee, is_active, is_recommended, is_vip, created_at, updated_at FROM working_girls ORDER BY id" --json`;
    
    const result = execSync(girlsCmd, {cwd: '/home/user/webapp', maxBuffer: 1024 * 1024 * 50});
    const girlsData = JSON.parse(result.toString());
    const girls = girlsData[0].results;
    
    console.log(`📊 총 ${girls.length}개 워킹걸 데이터 발견`);
    
    // 2. 배치로 로컬에 삽입
    console.log('2️⃣ 로컬 데이터베이스에 복원 중...');
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < girls.length; i++) {
      const girl = girls[i];
      
      // SQL injection 방지를 위한 문자열 처리
      const cleanString = (str) => {
        if (!str) return 'NULL';
        return `'${str.toString().replace(/'/g, "''")}'`;
      };
      
      const cleanNumber = (num) => {
        return num !== null && num !== undefined ? num : 'NULL';
      };
      
      const insertSql = `INSERT INTO working_girls (
        id, user_id, password, nickname, age, height, weight, gender, region,
        line_id, kakao_id, phone, management_code, agency, fee, 
        is_active, is_recommended, is_vip, created_at, updated_at
      ) VALUES (
        ${girl.id}, 
        ${cleanString(girl.user_id)}, 
        ${cleanString(girl.password)}, 
        ${cleanString(girl.nickname)}, 
        ${girl.age}, ${girl.height}, ${girl.weight}, 
        ${cleanString(girl.gender)}, 
        ${cleanString(girl.region)},
        ${cleanString(girl.line_id)}, 
        ${cleanString(girl.kakao_id)}, 
        ${cleanString(girl.phone)}, 
        ${cleanString(girl.management_code)}, 
        ${cleanString(girl.agency)}, 
        ${cleanString(girl.fee)}, 
        ${cleanNumber(girl.is_active)}, 
        ${cleanNumber(girl.is_recommended)}, 
        ${cleanNumber(girl.is_vip)}, 
        ${cleanString(girl.created_at)}, 
        ${cleanString(girl.updated_at)}
      )`;
      
      try {
        execSync(`npx wrangler d1 execute webapp-production --local --command="${insertSql}"`, 
                 {cwd: '/home/user/webapp', stdio: 'ignore'});
        successCount++;
        console.log(`✅ ${i+1}/${girls.length}: ${girl.nickname} 복원 완료`);
      } catch (error) {
        failCount++;
        console.log(`❌ ${i+1}/${girls.length}: ${girl.nickname} 복원 실패`);
      }
    }
    
    // 3. 결과 확인
    console.log('3️⃣ 복원 결과 확인 중...');
    const countResult = execSync('npx wrangler d1 execute webapp-production --local --command="SELECT COUNT(*) as count FROM working_girls"', 
                                {cwd: '/home/user/webapp'});
    
    const countData = JSON.parse(countResult.toString());
    const finalCount = countData[0].results[0].count;
    
    console.log(`\n🎉 복원 완료!`);
    console.log(`✅ 성공: ${successCount}개`);
    console.log(`❌ 실패: ${failCount}개`);
    console.log(`📊 최종 로컬 데이터: ${finalCount}개`);
    
    if (finalCount === 48) {
      console.log('🎯 완벽! 모든 48개 워킹걸 데이터가 성공적으로 복원되었습니다!');
      return true;
    } else {
      console.log(`⚠️  예상 48개와 다름: 실제 ${finalCount}개`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ 전체 복원 오류:', error.message);
    return false;
  }
}

restoreAllData();