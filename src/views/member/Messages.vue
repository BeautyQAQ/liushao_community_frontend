<template>
  <el-card shadow="never" v-loading="loading">
    <template #header><div class="message-heading"><h1 class="title is-4">私信 <el-tag v-if="messageUnread" type="danger">{{ messageUnread }} 条未读</el-tag></h1><el-button @click="refresh">刷新</el-button></div></template>
    <el-form class="start-conversation" @submit.prevent="start"><el-input v-model="username" maxlength="32" placeholder="输入对方账号，开始私信" aria-label="私信接收者账号" /><el-button type="primary" native-type="submit" :disabled="!username.trim()">发私信</el-button></el-form>
    <el-empty v-if="!loading && !records.length" :description="failed ? '会话加载失败' : '暂时没有私信会话'"><el-button v-if="failed" @click="load">重试</el-button></el-empty>
    <router-link v-for="item in records" :key="item.username" :to="`/messages/${item.username}`" class="conversation">
      <el-avatar :size="48" :src="mediaUrl(item.avatar)">{{ (item.alias || item.username).slice(0, 1) }}</el-avatar>
      <div class="conversation-body"><div class="message-heading"><strong>{{ item.alias || item.username }}</strong><small class="has-text-grey">{{ dayjs(item.createdAt).format('MM/DD HH:mm') }}</small></div><p>{{ item.lastContent }}</p></div>
      <el-tag v-if="item.unread" type="danger" round>{{ item.unread }}</el-tag>
    </router-link>
    <Pagination v-if="total" v-model:page="current" v-model:limit="size" :total="total" layout="total, prev, pager, next" @pagination="load" />
  </el-card>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import store from '@/store'
import { getConversations } from '@/api/social'
import { usePage } from '@/composables/usePage'
import { messageUnread, refreshInbox } from '@/composables/useInbox'
import { mediaUrl } from '@/utils/media'
import Pagination from '@/components/Pagination/index.vue'
const router = useRouter(), username = ref('')
const { records, current, size, total, loading, failed, load } = usePage(getConversations)
async function refresh() { await Promise.all([load(), refreshInbox()]) }
function start() {
  const target = username.value.trim().toLowerCase()
  if (!/^[a-z0-9_]{2,32}$/.test(target)) { ElMessage.warning('请输入 2 至 32 位字母、数字或下划线账号'); return }
  if (target === store.state.user.user?.username) { ElMessage.warning('请选择其他用户'); return }
  void router.push(`/messages/${target}`)
}
onMounted(refreshInbox)
</script>
<style scoped>.message-heading { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }.message-heading .title { margin: 0; }.start-conversation { display: flex; gap: 12px; }.conversation { display: flex; align-items: center; gap: 14px; padding: 22px 0; border-bottom: 1px solid #edf0f3; }.conversation-body { min-width: 0; flex: 1; }.conversation-body p { margin-top: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #6e7782; }</style>
