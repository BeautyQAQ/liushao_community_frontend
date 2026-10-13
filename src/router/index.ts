import { createRouter, createWebHashHistory } from 'vue-router'
export default createRouter({ history: createWebHashHistory(), routes: [
  { path: '/', name: 'Home', component: () => import('../views/Home.vue') },
  { path: '/register', name: 'Register', component: () => import('../views/auth/Register.vue'), meta: { title: '注册' } },
  { path: '/login', name: 'Login', component: () => import('../views/auth/Login.vue'), meta: { title: '登录' } },
  { path: '/post/create', name: 'CreatePost', component: () => import('../views/post/Editor.vue'), meta: { title: '发布帖子', requiresAuth: true } },
  { path: '/post/:id/edit', name: 'EditPost', component: () => import('../views/post/Editor.vue'), meta: { title: '编辑帖子', requiresAuth: true } },
  { path: '/post/:id', name: 'PostDetail', component: () => import('../views/post/Detail.vue'), meta: { title: '帖子详情' } },
  { path: '/search', name: 'Search', component: () => import('../views/post/Browse.vue'), meta: { title: '搜索' } },
  { path: '/tag/:name', name: 'Tag', component: () => import('../views/post/Browse.vue'), meta: { title: '标签主题' } },
  { path: '/member/:username/home', name: 'Profile', component: () => import('../views/member/Profile.vue'), meta: { title: '用户主页' } },
  { path: '/member/:username/setting', name: 'Settings', component: () => import('../views/member/Settings.vue'), meta: { title: '个人设置', requiresAuth: true } },
  { path: '/404', name: '404', component: () => import('../views/error/404.vue'), meta: { title: '页面不存在' } },
  { path: '/:pathMatch(.*)*', redirect: '/404' }
] })
