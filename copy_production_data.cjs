const { execSync } = require('child_process');

async function copyProductionData() {
  console.log('🔄 프로덕션 데이터를 로컬로 복사 중...');
  
  try {
    // 로컬 데이터 삭제
    console.log('1. 로컬 데이터 삭제 중...');
    execSync('npx wrangler d1 execute webapp-production --local --command="DELETE FROM working_girl_photos"', {cwd: '/home/user/webapp'});
    execSync('npx wrangler d1 execute webapp-production --local --command="DELETE FROM working_girls"', {cwd: '/home/user/webapp'});
    
    // 프로덕션 데이터 가져와서 로컬에 삽입
    console.log('2. 프로덕션 워킹걸 데이터 복사 중...');
    const girlsResult = execSync('npx wrangler d1 execute webapp-production --remote --command="SELECT * FROM working_girls" --json', {cwd: '/home/user/webapp'});
    const girls = JSON.parse(girlsResult.toString())[0].results;
    
    console.log(`찾은 워킹걸: ${girls.length}명`);
    
    // 하나씩 로컬에 삽입
    for (let i = 0; i < girls.length; i++) {
      const girl = girls[i];
      console.log(`${i+1}/${girls.length}: ${girl.nickname} 복사 중...`);
      
      const insertCmd = `INSERT INTO working_girls (
        id, user_id, password, nickname, age, height, weight, gender, region,
        line_id, kakao_id, phone, management_code, agency, conditions, main_photo,
        is_active, is_recommended, is_vip, fee, created_at, updated_at
      ) VALUES (
        ${girl.id}, 
        '${girl.user_id.replace(/'/g, "''")}', 
        '${girl.password.replace(/'/g, "''")}', 
        '${girl.nickname.replace(/'/g, "''")}', 
        ${girl.age}, ${girl.height}, ${girl.weight}, 
        '${girl.gender.replace(/'/g, "''")}', 
        '${girl.region.replace(/'/g, "''")}',
        '${(girl.line_id || '').replace(/'/g, "''")}', 
        '${(girl.kakao_id || '').replace(/'/g, "''")}', 
        '${(girl.phone || '').replace(/'/g, "''")}', 
        '${(girl.management_code || '').replace(/'/g, "''")}', 
        '${(girl.agency || '').replace(/'/g, "''")}', 
        ${girl.conditions ? `'${girl.conditions.replace(/'/g, "''")}'` : 'NULL'}, 
        ${girl.main_photo ? `'${girl.main_photo.substring(0, 100)}...'` : 'NULL'},
        ${girl.is_active}, ${girl.is_recommended}, 
        ${girl.is_vip}, 
        ${girl.fee ? `'${girl.fee.replace(/'/g, "''")}'` : 'NULL'}, 
        '${girl.created_at}', '${girl.updated_at}'
      )`;
      
      try {
        execSync(`npx wrangler d1 execute webapp-production --local --command="${insertCmd}"`, {cwd: '/home/user/webapp', stdio: 'ignore'});
      } catch (error) {
        console.log(`❌ ${girl.nickname} 복사 실패`);
      }
    }
    
    console.log('3. 로컬 데이터 확인 중...');
    const countResult = execSync('npx wrangler d1 execute webapp-production --local --command="SELECT COUNT(*) as count FROM working_girls"', {cwd: '/home/user/webapp'});
    console.log('복사된 데이터:', countResult.toString());
    
    console.log('🎉 프로덕션 데이터 복사 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

copyProductionData();