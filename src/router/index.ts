import { createRouter, createWebHashHistory } from 'vue-router'
export default createRouter({ history: createWebHashHistory(), routes: [
  { path: '/', name: 'Home', component: () => import('../views/Home.vue') },
  { path: '/register', name: 'Register', component: () => import('../views/auth/Register.vue'), meta: { title: '注册' } },
  { path: '/login', name: 'Login', component: () => import('../views/auth/Login.vue'), meta: { title: '登录' } },
  { path: '/404', name: '404', component: () => import('../views/error/404.vue'), meta: { title: '页面不存在' } },
  { path: '/:pathMatch(.*)*', redirect: '/404' }
] })
