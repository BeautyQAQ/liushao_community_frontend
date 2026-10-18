<template>
  <el-card shadow="never" class="comments">
    <template #header><h2 class="title is-5">评论与回复 <span class="has-text-grey">{{ total }}</span></h2></template>
    <el-form v-if="store.state.user.user" @submit.prevent="submit">
      <div v-if="replyTo" class="reply-heading">回复 {{ replyTo.alias || replyTo.username }} <el-button text @click="replyTo = undefined">取消回复</el-button></div>
      <el-input ref="input" v-model="content" type="textarea" :rows="3" maxlength="2000" show-word-limit :placeholder="replyTo ? '写下你的回复' : '分享你的观点，友善交流'" aria-label="评论内容" />
      <el-button class="mt-3" type="primary" native-type="submit" :loading="sending" :disabled="!content.trim()">{{ replyTo ? '发布回复' : '发表评论' }}</el-button>
    </el-form>
    <p v-else class="mb-4"><router-link :to="{ path: '/login', query: { redirect: route.fullPath } }">登录后发表评论</router-link></p>
    <div v-loading="loading" class="comment-list" aria-live="polite">
      <el-empty v-if="!loading && !records.length" :description="failed ? '评论加载失败' : '还没有评论，来分享你的观点吧'">
        <el-button v-if="failed" @click="load">重新加载</el-button>
      </el-empty>
      <article v-for="item in records" :id="`comment-${item.id}`" :key="item.id" class="comment" :class="{ reply: item.parentId }">
        <router-link :to="`/member/${item.username}/home`"><el-avatar :size="32" :src="mediaUrl(item.avatar)">{{ (item.alias || item.username).slice(0, 1) }}</el-avatar></router-link>
        <div class="comment-body">
          <router-link :to="`/member/${item.username}/home`"><strong>{{ item.alias || item.username }}</strong></router-link>
          <small class="has-text-grey ml-2">{{ dayjs(item.createdAt).format('MM/DD HH:mm') }}</small>
          <div v-if="item.parentId" class="has-text-grey is-size-7">回复评论 #{{ item.parentId }}</div>
          <p class="plain-content">{{ item.content }}</p>
          <el-button text size="small" @click="reply(item)">回复</el-button>
          <el-button v-if="item.username === store.state.user.user?.username" text type="danger" size="small" :loading="deleting === item.id" @click="remove(item)">删除</el-button>
        </div>
      </article>
    </div>
    <Pagination v-if="total" v-model:page="current" v-model:limit="size" :total="total" :auto-scroll="false" layout="total, prev, pager, next" @pagination="load" />
  </el-card>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type InputInstance } from 'element-plus'
import dayjs from 'dayjs'
import store from '@/store'
import { addComment, deleteComment, getComments } from '@/api/social'
import type { Comment } from '@/types'
import { mediaUrl } from '@/utils/media'
import { usePage } from '@/composables/usePage'
import Pagination from '@/components/Pagination/index.vue'
const props = defineProps<{ postId: number }>(), emit = defineEmits<{ changed: [] }>()
const route = useRoute(), router = useRouter(), input = ref<InputInstance>()
const content = ref(''), replyTo = ref<Comment>(), sending = ref(false), deleting = ref<number>()
const { records, total, current, size, loading, failed, load } = usePage((page, size) => getComments(props.postId, page, size), 20)
function reply(item: Comment) {
  if (!store.state.user.user) { void router.push({ path: '/login', query: { redirect: route.fullPath } }); return }
  replyTo.value = item; input.value?.focus(); input.value?.$el.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
async function submit() {
  if (sending.value || !content.value.trim()) return
  sending.value = true
  try {
    await addComment(props.postId, content.value.trim(), replyTo.value ? replyTo.value.parentId || replyTo.value.id : undefined)
    content.value = ''; replyTo.value = undefined; current.value = Math.floor(total.value / size.value) + 1
    await load(); emit('changed'); ElMessage.success('评论已发布')
  } catch { /* Keep the draft and reply target for retry. */ } finally { sending.value = false }
}
async function remove(item: Comment) {
  if (deleting.value) return
  if (!await ElMessageBox.confirm(item.parentId ? '确定删除这条回复？' : '删除评论也会删除其下的回复，确定继续？', '删除评论', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }).then(() => true).catch(() => false)) return
  deleting.value = item.id
  try { await deleteComment(item.id); if (replyTo.value?.id === item.id || replyTo.value?.parentId === item.id) replyTo.value = undefined; await load(); emit('changed'); ElMessage.success('评论已删除') }
  catch { /* Displayed by request layer. */ } finally { deleting.value = undefined }
}
</script>
<style scoped>
.comment-list { min-height: 80px; }.comment { display: flex; gap: 12px; padding: 20px 0; border-bottom: 1px solid #edf0f3; }.comment.reply { margin-left: 24px; border-left: 2px solid #dce6eb; padding-left: 12px; }.comment-body { min-width: 0; flex: 1; }.plain-content { white-space: pre-wrap; overflow-wrap: anywhere; margin: 10px 0; }.reply-heading { margin-bottom: 8px; }
@media(max-width: 600px) { .comment.reply { margin-left: 8px; }.comment { gap: 8px; } }
</style>
