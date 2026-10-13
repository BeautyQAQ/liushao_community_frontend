import request from '@/utils/request'
import type { User, RegisterForm } from '@/types'
export const userRegister = (data: RegisterForm) => request<User>({ url: '/ums/user/register', method: 'post', data })
export const login = (data: { username: string; password: string; rememberMe: boolean }) => request<{ token: string }>({ url: '/ums/user/login', method: 'post', data })
export const getUserInfo = () => request<User>({ url: '/ums/user/info' })
export const logout = () => request<null>({ url: '/ums/user/logout' })
