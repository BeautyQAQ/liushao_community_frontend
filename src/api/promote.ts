import type { Billboard, Tip, Promotion, Page, Post } from '@/types'
import request from '@/utils/request'

// 获取推广
export function getList() {
  return request<Promotion[]>({
    url: '/promotion/all',
    method: 'get'
  })
} 