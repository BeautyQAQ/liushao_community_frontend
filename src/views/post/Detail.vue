<template>
  <el-card v-loading="loading" shadow="never">
    <template v-if="post">
      <div class="post-heading"><h1 class="title is-3">{{ post.title }}</h1>
        <div v-if="isAuthor" class="buttons">
          <el-button @click="router.push(`/post/${post.id}/edit`)">编辑</el-button>
          <el-button type="danger" plain :loading="deleting" @click="remove">删除</el-button>
        </div>
      </div>
      <p class="has-text-grey mb-4"><router-link :to="`/member/${post.username}/home`">{{ post.alias || post.username }}</router-link>
        · {{ dayjs(post.createTime).format('YYYY/MM/DD HH:mm') }} · 浏览 {{ post.view }}</p>
      <router-link v-for="tag in post.tags" :key="tag.id" :to="`/tag/${encodeURIComponent(tag.name)}`" class="tag is-success is-light mr-1">#{{ tag.name }}</router-link>
      <el-divider /><MarkdownContent :content="post.content" />
    </template>
    <el-empty v-else-if="!loading" description="帖子不存在或暂时无法加载"><el-button @click="router.push('/')">返回首页</el-button></el-empty>
  </el-card>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import store from '@/store'
import { getPost, deletePost } from '@/api/post'
import type { PostDetail } from '@/types'
import MarkdownContent from '@/components/MarkdownContent.vue'
const route = useRoute(), router = useRouter()
const post = ref<PostDetail>(), loading = ref(true), deleting = ref(false)
const isAuthor = computed(() => post.value?.userId === store.state.user.user?.id)
onMounted(async () => {
  try { post.value = (await getPost(String(route.params.id))).data; document.title = `${post.value.title} - 流沙社区` }
  catch { /* Displayed by request layer. */ } finally { loading.value = false }
})
async function remove() {
  if (!post.value || deleting.value) return
  if (!await ElMessageBox.confirm('删除后无法恢复，确定删除这篇帖子？', '删除帖子', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }).then(() => true).catch(() => false)) return
  deleting.value = true
  try { await deletePost(post.value.id); ElMessage.success('帖子已删除'); await router.replace('/') }
  catch { /* Displayed by request layer. */ } finally { deleting.value = false }
}
</script>
<style scoped>.post-heading { display: flex; justify-content: space-between; gap: 20px; flex-wrap: wrap; }.title { overflow-wrap: anywhere; }</style>
