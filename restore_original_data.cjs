const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔄 원본 데이터 복원 시작...');

// JSON 파일 읽기
const workingGirlsData = JSON.parse(fs.readFileSync('original_working_girls.json', 'utf8'));
const photosData = JSON.parse(fs.readFileSync('original_photos.json', 'utf8'));

const girls = workingGirlsData[0].results;
const photos = photosData[0].results;

console.log(`📊 복원할 데이터: 워킹걸 ${girls.length}명, 사진 ${photos.length}개`);

// 워킹걸 데이터 복원
for (const girl of girls) {
  const sql = `INSERT INTO working_girls (
    id, user_id, password, nickname, age, height, weight, gender, region,
    line_id, kakao_id, phone, management_code, agency, conditions, main_photo,
    is_active, is_recommended, is_vip, fee, created_at, updated_at
  ) VALUES (
    ${girl.id}, '${girl.user_id}', '${girl.password}', '${girl.nickname}', 
    ${girl.age}, ${girl.height}, ${girl.weight}, '${girl.gender}', '${girl.region}',
    '${girl.line_id || ''}', '${girl.kakao_id || ''}', '${girl.phone || ''}', 
    '${girl.management_code || ''}', '${girl.agency || ''}', '${girl.conditions || ''}', 
    '${girl.main_photo || ''}', ${girl.is_active}, ${girl.is_recommended}, 
    ${girl.is_vip}, '${girl.fee || ''}', '${girl.created_at}', '${girl.updated_at}'
  )`;
  
  try {
    execSync(`npx wrangler d1 execute webapp-production --local --command="${sql}"`, {stdio: 'ignore'});
    console.log(`✅ ${girl.nickname} 복원 완료`);
  } catch (error) {
    console.log(`❌ ${girl.nickname} 복원 실패:`, error.message);
  }
}

// 사진 데이터 복원
for (const photo of photos) {
  const sql = `INSERT INTO working_girl_photos (
    id, working_girl_id, photo_url, is_main, upload_order, created_at
  ) VALUES (
    ${photo.id}, ${photo.working_girl_id}, '${photo.photo_url}', 
    ${photo.is_main}, ${photo.upload_order}, '${photo.created_at}'
  )`;
  
  try {
    execSync(`npx wrangler d1 execute webapp-production --local --command="${sql}"`, {stdio: 'ignore'});
  } catch (error) {
    console.log(`❌ 사진 ${photo.id} 복원 실패`);
  }
}

console.log('🎉 원본 데이터 복원 완료!');