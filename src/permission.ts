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
    try {
      if (!store.state.user.user) await store.dispatch('user/getUserInfo')
      if (to.path === '/login') return '/'
    } catch { await store.dispatch('user/reset'); return to.path === '/login' ? true : '/login' }
  }
  return true
})
router.afterEach(() => NProgress.done())
router.onError(() => NProgress.done())
