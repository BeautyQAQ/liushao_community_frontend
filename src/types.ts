export interface User { id: number; username: string; alias: string; avatar: string; email: string; bio: string; createTime: string }
export type PublicUser = Omit<User, 'email'>
export interface LoginForm { name: string; pass: string; rememberMe: boolean }
export interface RegisterForm { name: string; pass: string; checkPass: string; email: string }
export interface Tag { id: number; name: string; topicCount: number }
export interface Post { id: number; userId: number; username: string; alias: string; avatar: string; title: string; view: number; createTime: string; modifyTime: string; tags: Tag[] }
export interface PostDetail extends Post { content: string; version: number }
export interface PostInput { title: string; content: string; tags: string[]; version?: number }
export interface Page<T> { content: T[]; totalElements: number; totalPages: number; number: number; size: number }
export interface Tip { content: string; author: string }
export interface Promotion { id: number; title: string; link: string }
export interface Billboard { content: string }
