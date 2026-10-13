import type { Billboard, Tip, Promotion, Page, Post } from '@/types'
import request from '@/utils/request'

export function getBillboard() {
  return request<Billboard>({
    url: '/billboard/show',
    method: 'get'
  })
} 