import type { Billboard, Tip, Promotion, Page, Post } from '@/types'
import request from '@/utils/request'

export function getTodayTip() {
  return request<Tip>({
    url: '/tip/today',
    method: 'get'
  })
} 