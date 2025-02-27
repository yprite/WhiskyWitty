import axios from 'axios';
import { Liquor } from '@/types/liquor';

const api = axios.create({
  baseURL: 'http://localhost:20010/api', // 실제 API 서버 주소로 변경 필요
});

export const liquorAPI = {
  // 전체 주류 목록 조회
  getAll: () => api.get<Liquor[]>('/liquors'),
  
  // 단일 주류 조회
  getById: (id: number) => api.get<Liquor>(`/liquors/${id}`),
  
  // 주류 추가
  create: (liquor: Omit<Liquor, 'id' | 'rating'>) => 
    api.post<Liquor>('/liquors', liquor),
  
  // 주류 수정
  update: (id: number, liquor: Partial<Liquor>) => 
    api.put<Liquor>(`/liquors/${id}`, liquor),
  
  // 주류 삭제
  delete: (id: number) => api.delete(`/liquors/${id}`),
  
  // 리뷰 추가
  addReview: (liquorId: number, review: { text: string; rating: number }) =>
    api.post<Liquor>(`/liquors/${liquorId}/reviews`, review),
}; 