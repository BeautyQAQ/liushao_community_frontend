<template>
  <el-card shadow="never" v-loading="loading">
    <template #header><div class="notification-heading"><h1 class="title is-4">通知中心 <el-tag v-if="notificationUnread" type="danger">{{ notificationUnread }} 条未读</el-tag></h1><div><el-button @click="refresh">刷新</el-button><el-button :loading="markingAll" :disabled="!notificationUnread" @click="readAll">全部标为已读</el-button></div></div></template>
    <el-empty v-if="!loading && !records.length" :description="failed ? '通知加载失败' : '暂时没有通知'"><el-button v-if="failed" @click="load">重试</el-button></el-empty>
    <article v-for="item in records" :key="item.id" class="notification-row" :class="{ unread: !item.read }">
      <div><el-tag size="small">{{ labels[item.type] || '通知' }}</el-tag><strong class="ml-2">{{ item.actorAlias || item.actorUsername || '社区管理' }}</strong><span v-if="!item.read" class="unread-dot" aria-label="未读" /></div>
      <p class="notification-content">{{ item.content }}</p>
      <div class="notification-footer"><small class="has-text-grey">{{ dayjs(item.createdAt).format('YYYY/MM/DD HH:mm') }}</small><div>
        <el-button v-if="item.postId || item.actorUsername" text @click="open(item)">{{ item.postId ? '查看帖子' : '查看用户' }}</el-button>
        <el-button v-if="!item.read" text :loading="marking === item.id" @click="read(item)">标为已读</el-button>
      </div></div>
    </article>
    <Pagination v-if="total" v-model:page="current" v-model:limit="size" :total="total" layout="total, prev, pager, next" @pagination="load" />
  </el-card>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import type { Notification } from '@/types'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/api/social'
import { notificationUnread, refreshInbox } from '@/composables/useInbox'
import { usePage } from '@/composables/usePage'
import Pagination from '@/components/Pagination/index.vue'
const router = useRouter(), marking = ref<number>(), markingAll = ref(false)
const labels: Record<string, string> = { COMMENT: '评论', REPLY: '回复', LIKE: '点赞', FOLLOW: '关注', MODERATION: '审核' }
const { records, current, size, total, loading, failed, load } = usePage(getNotifications)
async function refresh() { await Promise.all([load(), refreshInbox()]) }
async function read(item: Notification) {
  if (item.read || marking.value) return
  marking.value = item.id
  try { await markNotificationRead(item.id); records.value = records.value.map(row => row.id === item.id ? { ...row, read: true } : row); await refreshInbox() }
  catch { /* Displayed by request layer. */ } finally { marking.value = undefined }
}
async function readAll() {
  if (markingAll.value) return
  markingAll.value = true
  try { await markAllNotificationsRead(); await refresh(); ElMessage.success('通知已全部标为已读') }
  catch { /* Displayed by request layer. */ } finally { markingAll.value = false }
}
async function open(item: Notification) {
  await read(item)
  if (item.postId) await router.push(`${item.type === 'MODERATION' ? '/me/posts/' : '/post/'}${item.postId}`)
  else if (item.actorUsername) await router.push(`/member/${item.actorUsername}/home`)
}
onMounted(refreshInbox)
</script>
<style scoped>.notification-heading,.notification-footer { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }.notification-heading .title { margin: 0; }.notification-row { padding: 20px 14px; border-bottom: 1px solid #edf0f3; }.notification-row.unread { background: #f2f9fc; }.notification-content { white-space: pre-wrap; overflow-wrap: anywhere; margin: 12px 0; }.unread-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #df564f; margin-left: 10px; }</style>
