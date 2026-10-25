<template>
  <header ref="header" class="site-header" @keydown.esc="closeMenus(true)">
    <nav class="container site-navigation" aria-label="社区导航">
      <router-link to="/" class="brand">流沙社区</router-link>
      <button ref="menuButton" class="nav-button menu-toggle" type="button" :aria-expanded="menuOpen" aria-controls="community-navigation" @click="menuOpen = !menuOpen">
        {{ menuOpen ? '收起导航' : '展开导航' }}
      </button>
      <div id="community-navigation" class="navigation-panel" :class="{ 'is-open': menuOpen }">
        <router-link to="/" class="nav-link">主页</router-link>
        <form class="site-search" role="search" @submit.prevent="search">
          <label for="community-search" class="sr-only">搜索标题、正文、标签或作者</label>
          <input id="community-search" v-model="searchKey" type="search" maxlength="100" placeholder="搜索社区内容" />
          <button type="submit" class="nav-button">搜索</button>
        </form>
        <button class="nav-button" type="button" :aria-pressed="darkMode" :disabled="themeLoading" @click="toggleTheme">
          {{ themeLoading ? '切换中…' : darkMode ? '浅色模式' : '深色模式' }}
        </button>
        <template v-if="!token">
          <router-link to="/register" class="nav-link">注册</router-link>
          <router-link to="/login" class="nav-link">登录</router-link>
        </template>
        <template v-else>
          <router-link to="/notifications" class="nav-link">通知<span v-if="notificationUnread" class="unread-count" :aria-label="`${notificationUnread} 条未读`">{{ Math.min(notificationUnread, 99) }}{{ notificationUnread > 99 ? '+' : '' }}</span></router-link>
          <router-link to="/messages" class="nav-link">私信<span v-if="messageUnread" class="unread-count" :aria-label="`${messageUnread} 条未读`">{{ Math.min(messageUnread, 99) }}{{ messageUnread > 99 ? '+' : '' }}</span></router-link>
          <details ref="accountMenu" class="account-menu">
            <summary class="nav-link">{{ user?.alias || '用户' }}</summary>
            <div class="account-links">
              <router-link :to="`/member/${user?.username}/home`">个人中心</router-link>
              <router-link to="/post/create">发布主题</router-link>
              <router-link to="/me/posts">我的帖子</router-link>
              <router-link to="/me/drafts">草稿箱</router-link>
              <router-link to="/me/bookmarks">我的收藏</router-link>
              <router-link to="/me/following">我的关注</router-link>
              <router-link to="/me/followers">我的粉丝</router-link>
              <router-link :to="`/member/${user?.username}/setting`">设置中心</router-link>
              <button type="button" :disabled="loggingOut" @click="logout">{{ loggingOut ? '正在退出…' : '退出登录' }}</button>
            </div>
          </details>
        </template>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import store from '@/store'
import { notificationUnread, messageUnread, refreshInbox } from '@/composables/useInbox'
import { getDarkMode, setDarkMode } from '@/utils/auth'

const route = useRoute(), router = useRouter()
const token = computed(() => store.state.user.token), user = computed(() => store.state.user.user)
const header = ref<HTMLElement>(), menuButton = ref<HTMLButtonElement>(), accountMenu = ref<HTMLDetailsElement>()
const searchKey = ref(''), menuOpen = ref(false), loggingOut = ref(false)
const darkMode = ref(getDarkMode()), themeLoading = ref(false)
let theme: typeof import('darkreader') | undefined
let mounted = true
async function applyTheme(enabled: boolean) {
  themeLoading.value = true
  try {
    if (enabled) theme ??= await import('darkreader')
    if (!mounted) return
    if (enabled) theme?.enable({})
    else theme?.disable()
    darkMode.value = enabled; setDarkMode(enabled)
  } catch {
    ElMessage.error('主题切换失败，请重试')
    darkMode.value = false; setDarkMode(false)
  } finally { themeLoading.value = false }
}
function toggleTheme() { void applyTheme(!darkMode.value) }
function closeMenus(restoreFocus = false) {
  if (menuOpen.value && restoreFocus) menuButton.value?.focus()
  if (accountMenu.value?.open) {
    accountMenu.value.open = false
    if (restoreFocus && !menuOpen.value) accountMenu.value.querySelector('summary')?.focus()
  }
  menuOpen.value = false
}
function outsideClick(event: PointerEvent) {
  if (!header.value?.contains(event.target as Node)) closeMenus()
}
function search() {
  const key = searchKey.value.trim()
  if (!key) { ElMessage.info('请输入关键字搜索'); return }
  void router.push({ path: '/search', query: { key } })
}
async function logout() {
  if (loggingOut.value) return
  loggingOut.value = true
  try { await store.dispatch('user/logout'); ElMessage.success('退出登录成功') }
  catch { /* The request layer displays the error. */ }
  finally { loggingOut.value = false; closeMenus(); await router.push('/') }
}
watch(() => [token.value, route.fullPath], refreshInbox, { immediate: true })
watch(() => route.fullPath, () => closeMenus())
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  if (darkMode.value) void applyTheme(true)
  document.addEventListener('pointerdown', outsideClick)
  timer = setInterval(() => { if (token.value && document.visibilityState === 'visible') void refreshInbox() }, 30000)
})
onBeforeUnmount(() => { mounted = false; clearInterval(timer); document.removeEventListener('pointerdown', outsideClick); theme?.disable() })
</script>

<style scoped>
.site-header { position: sticky; top: 0; z-index: 100; background: #fff; border-bottom: 1px solid #e4e7ed; }
.site-navigation { display: flex; align-items: center; gap: 20px; min-height: 64px; }
.brand { flex-shrink: 0; color: #176d66; font-size: 18px; font-weight: 700; }
.navigation-panel { display: flex; align-items: center; justify-content: flex-end; gap: 12px; flex: 1; min-width: 0; }
.nav-link, .nav-button { display: inline-flex; gap: 5px; align-items: center; justify-content: center; min-height: 40px; padding: 8px; border-radius: 6px; color: #344450; white-space: nowrap; }
.nav-button { border: 1px solid #d4dce2; background: #fff; cursor: pointer; font: inherit; }
.nav-link:hover, .nav-button:hover { background: #eef6f5; color: #176d66; }
.nav-button:disabled { cursor: wait; opacity: .7; }
.site-search { display: flex; flex: 1; max-width: 330px; min-width: 140px; gap: 6px; }
.site-search input { min-width: 0; width: 100%; padding: 8px 10px; border: 1px solid #c8d1da; border-radius: 6px; font: inherit; }
.unread-count { border-radius: 12px; padding: 0 5px; background: #b93838; color: white; font-size: 12px; }
.account-menu { position: relative; min-width: 0; }
.account-menu summary { display: list-item; max-width: 120px; overflow: hidden; text-overflow: ellipsis; cursor: pointer; }
.account-links { position: absolute; right: 0; min-width: 160px; padding: 6px; background: white; border: 1px solid #d4dce2; border-radius: 8px; box-shadow: 0 8px 24px #20364c20; }
.account-links a, .account-links button { display: block; padding: 10px 12px; width: 100%; text-align: left; border: 0; background: white; color: #344450; font: inherit; border-radius: 4px; cursor: pointer; }
.account-links a:hover, .account-links button:hover { background: #eef6f5; }
.menu-toggle { display: none; }
@media (max-width: 1000px) {
  .site-navigation { flex-wrap: wrap; justify-content: space-between; gap: 0; padding-top: 8px; padding-bottom: 8px; }
  .menu-toggle { display: inline-flex; }
  .navigation-panel { display: none; flex: 0 0 100%; flex-wrap: wrap; justify-content: flex-start; padding-top: 12px; max-height: calc(100dvh - 72px); overflow-y: auto; }
  .navigation-panel.is-open { display: flex; }
  .site-search { order: -1; flex: 0 0 100%; max-width: none; }
  .account-menu { flex: 0 0 100%; }
  .account-menu summary { max-width: 100%; }
  .account-links { position: static; border: 0; box-shadow: none; }
}
</style>
