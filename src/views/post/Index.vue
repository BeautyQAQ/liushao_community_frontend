<template>
  <el-card class="post-list" shadow="never" v-loading="loading" :aria-busy="loading">
    <template #header><el-tabs v-model="activeName" @tab-change="changeTab">
      <el-tab-pane label="最新主题" name="latest" /><el-tab-pane label="近七天热门" name="hot" />
      <el-tab-pane label="精华" name="essence" /><el-tab-pane v-if="discovery" label="关注动态" name="following" />
    </el-tabs></template>
    <p v-if="loading && !articleList.length" class="sr-only" role="status">正在加载主题…</p>
    <div v-if="loading && !articleList.length" aria-hidden="true">
      <div v-for="index in page.size" :key="index" class="media">
        <span class="media-left skeleton-avatar" />
        <div class="media-content"><span class="skeleton-line" /><span class="skeleton-meta" /><span class="skeleton-tag" /></div>
      </div>
    </div>
    <el-empty v-if="!loading && !articleList.length" :description="emptyDescription">
      <el-button v-if="failed" @click="loadPosts">重试</el-button>
      <el-button v-else-if="activeName === 'following' && !signedIn" type="primary" @click="router.push({ path: '/login', query: { redirect: route.fullPath } })">登录查看关注动态</el-button>
      <el-button v-else-if="activeName === 'following'" @click="router.push('/')">发现社区主题</el-button>
    </el-empty>
    <article v-for="item in articleList" :key="item.id" class="media">
      <router-link class="media-left" :to="`/member/${item.username}/home`" :aria-label="`查看 ${item.alias || item.username} 的主页`"><el-avatar :src="mediaUrl(item.avatar)">{{ item.alias?.slice(0, 1) || item.username.slice(0, 1) }}</el-avatar></router-link>
      <div class="media-content">
        <div class="post-title"><el-tag v-if="item.top" size="small">置顶</el-tag><el-tag v-if="item.essence" size="small" type="warning">精华</el-tag><router-link :to="'/post/' + item.id">{{ item.title }}</router-link></div>
        <p class="has-text-grey is-size-7 mt-2">
          <router-link :to="`/member/${item.username}/home`">{{ item.alias || item.username }}</router-link>
          · {{ dayjs(item.createTime).format('YYYY/MM/DD HH:mm') }} · 浏览 {{ item.view }}
        </p>
        <router-link v-for="tag in item.tags" :key="tag.id" :to="`/tag/${encodeURIComponent(tag.name)}`" class="tag is-success is-light mr-1">#{{ tag.name }}</router-link>
      </div>
    </article>
    <Pagination v-show="page.total > 0" :total="page.total" v-model:page="page.current" v-model:limit="page.size" @pagination="loadPosts" />
  </el-card>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { getList, getFollowingPosts } from '@/api/post'
import store from '@/store'
import type { Post } from '@/types'
import Pagination from '@/components/Pagination/index.vue'
import { mediaUrl } from '@/utils/media'
const props = withDefaults(defineProps<{ query?: string; tag?: string; author?: string; discovery?: boolean }>(), { query: '', tag: '', author: '', discovery: false })
const route = useRoute(), router = useRouter()
const initialTab = String(route.query.tab || 'latest')
const activeName = ref(props.discovery && ['latest', 'hot', 'essence', 'following'].includes(initialTab) ? initialTab : 'latest'), loading = ref(false), failed = ref(false)
const signedIn = computed(() => !!store.state.user.user)
const emptyDescription = computed(() => failed.value ? '加载失败，请重试' : activeName.value === 'following'
  ? signedIn.value ? '关注的人还没有公开主题，去发现感兴趣的作者吧' : '登录后查看你关注的作者发布的主题'
  : activeName.value === 'essence' ? '暂时没有精华主题' : '暂无主题')
const articleList = ref<Post[]>([])
const page = reactive({ current: 1, size: 10, total: 0 })
let revision = 0
async function loadPosts() {
  const ticket = ++revision
  loading.value = true; failed.value = false
  if (activeName.value === 'following' && !signedIn.value) { articleList.value = []; page.total = 0; loading.value = false; return }
  try {
    const filters = { query: props.query, tag: props.tag, author: props.author }
    const { data } = await (activeName.value === 'following' ? getFollowingPosts(page.current, page.size, filters) : getList(page.current, page.size, activeName.value, filters))
    if (ticket !== revision) return
    articleList.value = data.content; page.total = data.totalElements
  } catch { if (ticket === revision) { articleList.value = []; page.total = 0; failed.value = true } }
  finally { if (ticket === revision) loading.value = false }
}
function changeTab() {
  page.current = 1
  if (props.discovery && route.query.tab !== activeName.value) void router.replace({ path: route.path, query: { ...route.query, tab: activeName.value } })
  else void loadPosts()
}
watch(() => [props.query, props.tag, props.author], () => { page.current = 1; void loadPosts() }, { immediate: true })
watch(() => store.state.user.user?.id, () => { if (activeName.value === 'following') { page.current = 1; void loadPosts() } })
onBeforeUnmount(() => { revision++ })
</script>
<style scoped>
.post-list { min-height: 320px; }
.post-title { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; overflow-wrap: anywhere; }
.skeleton-avatar, .skeleton-line, .skeleton-meta, .skeleton-tag { display: block; background: #eef1f4; border-radius: 4px; }
.skeleton-avatar { width: 40px; height: 40px; border-radius: 50%; }
.skeleton-line { width: 72%; height: 21px; }
.skeleton-meta { width: 55%; height: 18px; margin-top: 8px; }
.skeleton-tag { width: 55px; height: 22px; margin-top: 6px; }
</style>
