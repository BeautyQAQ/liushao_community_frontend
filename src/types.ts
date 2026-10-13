export interface User { id: number; username: string; alias: string; avatar: string; email: string }
export interface LoginForm { name: string; pass: string; rememberMe: boolean }
export interface RegisterForm { name: string; pass: string; checkPass: string; email: string }
export interface Post { id: number; userId: number; username: string; alias: string; title: string; view: number; createTime: string; tags: { name: string }[] }
export interface Page<T> { content: T[]; totalElements: number; totalPages: number; number: number; size: number }
export interface Tip { content: string; author: string }
export interface Promotion { id: number; title: string; link: string }
export interface Billboard { content: string }
