<template>
  <div>
    <el-card v-loading="loading" shadow="never">
      <template v-if="post">
        <el-alert v-if="!published" class="mb-4" type="warning" :closable="false" :title="post.status === 'PENDING' ? '帖子正在等待审核，仅自己可见' : '帖子暂不可公开访问，仅自己可见'" :description="post.moderationReason || '你可以编辑内容后重新提交审核。'" />
        <div class="post-heading"><div><div v-if="post.top || post.essence" class="mb-3"><el-tag v-if="post.top" class="mr-2">置顶</el-tag><el-tag v-if="post.essence" type="warning">精华</el-tag></div><h1 class="title is-3">{{ post.title }}</h1></div>
          <div v-if="isAuthor" class="buttons"><el-button @click="router.push(`/post/${post.id}/edit`)">编辑</el-button><el-button type="danger" plain :loading="deleting" @click="remove">删除</el-button></div>
        </div>
        <p class="has-text-grey mb-4"><router-link :to="`/member/${post.username}/home`">{{ post.alias || post.username }}</router-link> · {{ dayjs(post.createTime).format('YYYY/MM/DD HH:mm') }} · 浏览 {{ post.view }}</p>
        <router-link v-for="tag in post.tags" :key="tag.id" :to="`/tag/${encodeURIComponent(tag.name)}`" class="tag is-success is-light mr-1">#{{ tag.name }}</router-link>
        <el-divider /><MarkdownContent :content="post.content" />
        <div v-if="published" class="interaction-bar">
          <el-button :type="interaction.liked ? 'primary' : 'default'" :loading="acting === 'like'" :disabled="!!acting || interactionLoading" @click="toggle('like')">{{ interaction.liked ? '已点赞' : '点赞' }} {{ interaction.likes }}</el-button>
          <el-button :type="interaction.bookmarked ? 'warning' : 'default'" :loading="acting === 'bookmark'" :disabled="!!acting || interactionLoading" @click="toggle('bookmark')">{{ interaction.bookmarked ? '已收藏' : '收藏' }} {{ interaction.bookmarks }}</el-button>
          <span class="has-text-grey">{{ interaction.comments }} 条评论</span>
          <el-button v-if="interactionFailed" text @click="loadInteraction">重新加载互动状态</el-button>
        </div>
      </template>
      <el-empty v-else-if="!loading" description="帖子不存在、已下架或暂时无法加载"><el-button @click="load">重试</el-button><el-button @click="router.push('/')">返回首页</el-button></el-empty>
    </el-card>
    <PostComments v-if="post && published" :post-id="post.id" @changed="loadInteraction" />
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import store from '@/store'
import { getPost, deletePost } from '@/api/post'
import { getOwnPost, getInteraction, setLike, setBookmark } from '@/api/social'
import type { PostDetail, Interaction } from '@/types'
import MarkdownContent from '@/components/MarkdownContent.vue'
import PostComments from '@/components/PostComments.vue'
const route = useRoute(), router = useRouter(), post = ref<PostDetail>()
const loading = ref(true), deleting = ref(false), acting = ref(''), interactionLoading = ref(false), interactionFailed = ref(false)
const interaction = reactive<Interaction>({ liked: false, bookmarked: false, likes: 0, bookmarks: 0, comments: 0 })
const isAuthor = computed(() => post.value?.userId === store.state.user.user?.id)
const published = computed(() => !post.value?.status || post.value.status === 'PUBLISHED')
async function load() {
  loading.value = true
  try {
    post.value = (await (route.name === 'MyPostDetail' ? getOwnPost(String(route.params.id)) : getPost(String(route.params.id)))).data
    Object.assign(interaction, { likes: post.value.likes || 0, bookmarks: post.value.collects || 0, comments: post.value.comments || 0 })
    document.title = `${post.value.title} - 流沙社区`; if (published.value) await loadInteraction()
  } catch { /* Render retry and unavailable state. */ } finally { loading.value = false }
}
async function loadInteraction() {
  if (!post.value || !store.state.user.user) return
  interactionLoading.value = true; interactionFailed.value = false
  try { Object.assign(interaction, (await getInteraction(post.value.id)).data) }
  catch { interactionFailed.value = true } finally { interactionLoading.value = false }
}
async function toggle(kind: 'like' | 'bookmark') {
  if (!store.state.user.user) { await router.push({ path: '/login', query: { redirect: route.fullPath } }); return }
  if (!post.value || acting.value) return
  if (interactionFailed.value) { await loadInteraction(); if (interactionFailed.value) return }
  acting.value = kind
  try {
    Object.assign(interaction, (await (kind === 'like' ? setLike(post.value.id, !interaction.liked) : setBookmark(post.value.id, !interaction.bookmarked))).data)
    ElMessage.success(kind === 'like' ? (interaction.liked ? '已点赞' : '已取消点赞') : (interaction.bookmarked ? '已收藏，可在我的收藏查看' : '已取消收藏'))
  } catch { /* Preserve the confirmed server state. */ } finally { acting.value = '' }
}
async function remove() {
  if (!post.value || deleting.value) return
  if (!await ElMessageBox.confirm('删除后无法恢复，确定删除这篇帖子？', '删除帖子', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }).then(() => true).catch(() => false)) return
  deleting.value = true
  try { await deletePost(post.value.id); ElMessage.success('帖子已删除'); await router.replace('/me/posts') }
  catch { /* Displayed by request layer. */ } finally { deleting.value = false }
}
onMounted(load)
</script>
<style scoped>.post-heading { display: flex; justify-content: space-between; gap: 20px; flex-wrap: wrap; }.title { overflow-wrap: anywhere; }.interaction-bar { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #edf0f3; }.interaction-bar .el-button { margin-left: 0; }</style>
