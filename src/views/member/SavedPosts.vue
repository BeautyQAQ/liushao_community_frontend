<template>
  <el-card shadow="never" v-loading="loading">
    <template #header><div class="section-heading"><h1 class="title is-4">{{ own ? '我的帖子' : '我的收藏' }}</h1><router-link v-if="own" to="/post/create">发布新主题</router-link></div></template>
    <el-empty v-if="!loading && !records.length" :description="failed ? '加载失败，请重试' : own ? '还没有发布过帖子' : '还没有收藏的帖子'">
      <el-button v-if="failed" @click="load">重试</el-button><el-button v-else @click="router.push(own ? '/post/create' : '/')">{{ own ? '发布帖子' : '浏览社区' }}</el-button>
    </el-empty>
    <article v-for="item in records" :key="item.id" class="saved-post">
      <div class="saved-body">
        <router-link :to="own ? `/me/posts/${item.id}` : `/post/${item.id}`"><strong>{{ item.title }}</strong></router-link>
        <el-tag v-if="own" class="ml-2" size="small" :type="item.status === 'PUBLISHED' ? 'success' : 'warning'">{{ statusLabel(item.status) }}</el-tag>
        <p class="has-text-grey mt-2">{{ item.alias || item.username }} · {{ dayjs(item.createTime).format('YYYY/MM/DD HH:mm') }} · {{ item.likes || 0 }} 赞 · {{ item.comments || 0 }} 评论</p>
        <p v-if="own && item.moderationReason" class="moderation-reason mt-2">审核说明：{{ item.moderationReason }}</p>
      </div>
      <el-button v-if="own" @click="router.push(`/post/${item.id}/edit`)">编辑</el-button>
      <el-button v-else :loading="removing === item.id" @click="remove(item.id)">取消收藏</el-button>
    </article>
    <Pagination v-if="total" v-model:page="current" v-model:limit="size" :total="total" layout="total, prev, pager, next" @pagination="load" />
  </el-card>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { getBookmarks, getMyPosts, setBookmark } from '@/api/social'
import { usePage } from '@/composables/usePage'
import Pagination from '@/components/Pagination/index.vue'
const route = useRoute(), router = useRouter(), own = computed(() => route.name === 'MyPosts')
const removing = ref<number>()
const { records, current, size, total, loading, failed, load } = usePage((page, size) => own.value ? getMyPosts(page, size) : getBookmarks(page, size))
function statusLabel(status?: string) { return status === 'PENDING' ? '待审核' : status === 'HIDDEN' ? '已隐藏' : '已发布' }
async function remove(id: number) {
  if (removing.value) return
  removing.value = id
  try { await setBookmark(id, false); await load(); ElMessage.success('已取消收藏') }
  catch { /* Displayed by request layer. */ } finally { removing.value = undefined }
}
</script>
<style scoped>.section-heading,.saved-post { display: flex; justify-content: space-between; align-items: center; gap: 16px; }.section-heading .title { margin: 0; }.saved-post { padding: 22px 0; border-bottom: 1px solid #edf0f3; }.saved-body { min-width: 0; overflow-wrap: anywhere; }.moderation-reason { color: #a0671a; }@media(max-width:600px){.saved-post{align-items:flex-start;flex-wrap:wrap;}}</style>
