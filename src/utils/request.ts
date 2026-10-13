import axios, { type AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import { getToken, removeToken } from './auth'
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
    if (data.code !== 200) {
      if (data.code === 401) removeToken()
      throw new Error(data.message || '请求失败')
    }
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) removeToken()
    ElMessage.error(error instanceof Error ? error.message : '网络连接失败')
    throw error
  }
}
