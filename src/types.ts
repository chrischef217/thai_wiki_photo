export interface Bindings {
  DB: D1Database;
  BUCKET: R2Bucket;
}

export interface WorkingGirl {
  id: number;
  user_id: string;
  password: string;
  nickname: string;
  age: number;
  height: number;
  weight: number;
  gender: '여자' | '트랜스젠더' | '레이디보이';
  region: '방콕' | '파타야' | '치앙마이' | '푸켓';
  line_id?: string;
  kakao_id?: string;
  phone?: string;
  code?: string;
  main_photo?: string;
  is_active: boolean;
  is_recommended: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkingGirlPhoto {
  id: number;
  working_girl_id: number;
  photo_url: string;
  is_main: boolean;
  upload_order: number;
  created_at: string;
}

export interface Admin {
  id: number;
  username: string;
  password: string;
  created_at: string;
}

export interface Advertisement {
  id: number;
  image_url: string;
  title?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Session {
  id: number;
  session_token: string;
  user_type: 'working_girl' | 'admin';
  user_id: number;
  expires_at: string;
  created_at: string;
}

export interface WorkingGirlRegistrationForm {
  user_id: string;
  password: string;
  nickname: string;
  age: number;
  height: number;
  weight: number;
  gender: '여자' | '트랜스젠더' | '레이디보이';
  region: '방콕' | '파타야' | '치앙마이' | '푸켓';
  line_id?: string;
  kakao_id?: string;
  phone?: string;
  code?: string;
  photos?: File[];
  main_photo_index?: number;
}

export interface WorkingGirlListItem {
  id: number;
  user_id: string;
  nickname: string;
  age: number;
  height: number;
  weight: number;
  gender: string;
  region: string;
  code?: string;
  is_recommended: boolean;
  main_photo?: string;
  photos: WorkingGirlPhoto[];
}

export interface AdminDashboardStats {
  total_working_girls: number;
  active_working_girls: number;
  recommended_working_girls: number;
  bangkok_count: number;
  pattaya_count: number;
  chiangmai_count: number;
  phuket_count: number;
}