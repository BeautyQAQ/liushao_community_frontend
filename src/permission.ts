import router from './router'
import store from './store'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { getToken } from './utils/auth'
NProgress.configure({ showSpinner: false })
router.beforeEach(async to => {
  NProgress.start()
  document.title = `${String(to.meta.title || '首页')} - 流沙社区`
  if (getToken()) {
    try { if (!store.state.user.user) await store.dispatch('user/getUserInfo') }
    catch { await store.dispatch('user/reset') }
  }
  if (to.meta.requiresAuth && !getToken()) return { path: '/login', query: { redirect: to.fullPath } }
  if (to.name === 'Settings' && store.state.user.user?.username !== to.params.username) return '/'
  if (to.path === '/login' && getToken()) return '/'
  return true
})
router.afterEach(() => NProgress.done())
router.onError(() => NProgress.done())
