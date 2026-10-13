import type { Billboard, Tip, Promotion, Page, Post } from '@/types'
import request from '@/utils/request'

// 列表
export function getList(pageNo: number, size: number, tab: string = 'latest') {
  return request<Page<Post>>(({
    url: '/post/list',
    method: 'get',
    params: { pageNo: pageNo, size: size, tab: tab }
  }))
}