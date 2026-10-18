<template>
  <el-card shadow="never">
    <template #header><div class="chat-heading"><div><router-link to="/messages">‹ 所有私信</router-link><h1 class="title is-4 mt-3">与 {{ partner?.alias || username }} 的私信</h1></div><div><router-link v-if="partner" :to="`/member/${username}/home`">查看主页</router-link><el-button class="ml-3" @click="refresh">刷新</el-button></div></div></template>
    <el-alert v-if="partnerFailed" type="warning" :closable="false" title="对方账号不存在、已停用或暂时无法加载，请刷新后重试。" />
    <div v-loading="loading" class="message-history" aria-live="polite">
      <el-empty v-if="!loading && !records.length" :description="failed ? '消息加载失败或对方不可用' : '还没有消息，打个招呼吧'"><el-button v-if="failed" @click="load">重试</el-button></el-empty>
      <article v-for="item in chronological" :key="item.id" class="message" :class="{ mine: item.senderUsername === store.state.user.user?.username }">
        <div class="bubble"><p>{{ item.content }}</p><small>{{ dayjs(item.createdAt).format('MM/DD HH:mm') }}<span v-if="item.senderUsername === store.state.user.user?.username"> · {{ item.read ? '已读' : '未读' }}</span></small></div>
      </article>
    </div>
    <p v-if="total > size" class="has-text-grey is-size-7">第 1 页为最近消息，翻页可查看更早的历史。</p>
    <Pagination v-if="total > size" v-model:page="current" v-model:limit="size" :total="total" :auto-scroll="false" layout="total, prev, pager, next" @pagination="load" />
    <el-form class="message-composer" @submit.prevent="send">
      <el-input v-model="content" type="textarea" :rows="3" maxlength="2000" show-word-limit placeholder="写下想说的话" aria-label="私信内容" :disabled="!partner || isMe" />
      <el-button class="mt-3" type="primary" native-type="submit" :loading="sending" :disabled="!partner || isMe || !content.trim()">发送私信</el-button>
    </el-form>
  </el-card>
</template>
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import store from '@/store'
import type { PublicUser } from '@/types'
import { getProfile } from '@/api/auth/auth'
import { getMessages, markMessagesRead, sendMessage } from '@/api/social'
import { usePage } from '@/composables/usePage'
import { refreshInbox } from '@/composables/useInbox'
import Pagination from '@/components/Pagination/index.vue'
const route = useRoute(), router = useRouter(), username = String(route.params.username)
const partner = ref<PublicUser>(), partnerFailed = ref(false), content = ref(''), sending = ref(false)
const isMe = computed(() => username === store.state.user.user?.username)
const { records, current, size, total, loading, failed, load, reset } = usePage((page, size) => getMessages(username, page, size), 20)
const chronological = computed(() => [...records.value].reverse())
let timer: ReturnType<typeof setInterval> | undefined
let active = true
watch(records, async messages => {
  await nextTick()
  if (!active || !messages.length || document.visibilityState !== 'visible') return
  try { await markMessagesRead(username); await refreshInbox() } catch { /* Retry when the visible conversation is refreshed. */ }
})
async function loadPartner() {
  partnerFailed.value = false
  try { partner.value = (await getProfile(username)).data } catch { partnerFailed.value = true }
}
async function refresh() { await Promise.all([loadPartner(), load()]) }
async function send() {
  if (sending.value || !content.value.trim() || !partner.value || isMe.value) return
  sending.value = true
  try { await sendMessage(username, content.value.trim()); content.value = ''; await reset(); ElMessage.success('私信已发送') }
  catch { /* Preserve the unsent message for retry. */ } finally { sending.value = false }
}
onMounted(async () => {
  if (isMe.value) { await router.replace('/messages'); return }
  await loadPartner()
  timer = setInterval(() => { if (document.visibilityState === 'visible' && current.value === 1 && !loading.value) void load() }, 30000)
})
onBeforeUnmount(() => { active = false; clearInterval(timer) })
onBeforeRouteLeave(() => !content.value.trim() || ElMessageBox.confirm('还有未发送的私信，确定离开？', '未发送的内容', { confirmButtonText: '离开', cancelButtonText: '继续编辑' }).then(() => true).catch(() => false))
</script>
<style scoped>.chat-heading { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }.chat-heading .title { margin-bottom: 0; }.message-history { min-height: 180px; max-height: 60vh; overflow-y: auto; padding: 12px 0; }.message { display: flex; margin: 14px 0; }.message.mine { justify-content: flex-end; }.bubble { max-width: 85%; padding: 12px 16px; background: #f1f4f7; border-radius: 12px; }.mine .bubble { background: #e3f3ed; }.bubble p { white-space: pre-wrap; overflow-wrap: anywhere; }.bubble small { display: block; color: #697681; margin-top: 8px; }.message-composer { border-top: 1px solid #edf0f3; padding-top: 20px; margin-top: 16px; }</style>
