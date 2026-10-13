import axios, { type AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import { getToken } from './auth'
export interface ApiResult<T> { code: number; message: string; data: T }
const service = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '/api', timeout: 10000 })
service.interceptors.request.use(config => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
export default async function request<T>(config: AxiosRequestConfig): Promise<ApiResult<T>> {
  try {
    const { data } = await service.request<ApiResult<T>>(config)
    if (data.code !== 200) throw new Error(data.message || '请求失败')
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401 && config.url !== '/ums/user/login') {
      const { default: store } = await import('@/store')
      await store.dispatch('user/reset')
      const { default: router } = await import('@/router')
      if (router.currentRoute.value.meta.requiresAuth) void router.replace({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
    }
    const message = axios.isAxiosError<ApiResult<unknown>>(error) ? error.response?.data?.message || '网络连接失败，请稍后重试' : error instanceof Error ? error.message : '请求失败'
    ElMessage.error(message)
    throw error
  }
}
