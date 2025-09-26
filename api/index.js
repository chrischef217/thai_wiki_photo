// 간단한 메모리 저장소
let users = [
  {
    id: 1,
    nickname: "떠기",
    age: 22,
    height: "155",
    weight: "55",
    region: "방콕",
    code: "aaa222",
    conditions: "1.dsfsdf\n2.sdfdsf",
    photos: [
      { 
        photo_url: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=" 
      }
    ]
  }
]

// Vercel 서버리스 함수
export default function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // URL 경로 파싱
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  
  if (pathname === '/api/working-girls' && req.method === 'GET') {
    // 워킹걸 목록 반환
    res.status(200).json({
      success: true,
      data: users
    });
  } else {
    // 404 에러
    res.status(404).json({
      success: false,
      message: 'API endpoint not found'
    });
  }
}