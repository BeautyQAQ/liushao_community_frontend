<template>
  <div v-loading="loading">
    <template v-if="profile">
      <el-card class="mb-5" shadow="never"><div class="profile-heading"><el-avatar :size="64" :src="mediaUrl(profile.avatar)">{{ (profile.alias || profile.username).slice(0, 1) }}</el-avatar>
        <div><h1 class="title is-4 mb-2">{{ profile.alias }}</h1><p>@{{ profile.username }} · 加入于 {{ dayjs(profile.createTime).format('YYYY/MM/DD') }}</p></div>
        <el-button v-if="isMe" @click="router.push(`/member/${profile.username}/setting`)">编辑资料</el-button>
        <div v-else class="profile-actions"><el-button :type="relationship?.following ? 'default' : 'primary'" :loading="following" :disabled="relationshipLoading" @click="toggleFollow">{{ relationship?.following ? '已关注 · 取消' : '关注' }}</el-button><el-button @click="message">发私信</el-button></div>
      </div><p class="mt-4">{{ profile.bio || '这个人还没有填写简介。' }}</p>
      <div v-if="relationship" class="profile-stats mt-4"><router-link v-if="isMe" to="/me/following">关注 {{ relationship.followingCount }}</router-link><span v-else>关注 {{ relationship.followingCount }}</span><router-link v-if="isMe" to="/me/followers">粉丝 {{ relationship.followers }}</router-link><span v-else>粉丝 {{ relationship.followers }}</span><router-link v-if="isMe" to="/me/posts">我的全部帖子（含待审核）</router-link></div>
      <el-button v-if="relationshipFailed" class="mt-3" text @click="loadRelationship">重新加载关注状态</el-button>
      </el-card>
      <h2 class="title is-5">发布的主题</h2><PostList :author="profile.username" />
    </template><el-empty v-else-if="!loading" description="用户不存在或暂时无法加载"><el-button @click="load">重试</el-button></el-empty>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import { getProfile } from '@/api/auth/auth'
import { getRelationship, setFollow } from '@/api/social'
import type { PublicUser, Relationship } from '@/types'
import { mediaUrl } from '@/utils/media'
import store from '@/store'
import PostList from '@/views/post/Index.vue'
const route = useRoute(), router = useRouter(), profile = ref<PublicUser>(), loading = ref(true)
const isMe = computed(() => profile.value?.id === store.state.user.user?.id)
const relationship = ref<Relationship>(), relationshipLoading = ref(false), relationshipFailed = ref(false), following = ref(false)
async function loadRelationship() {
  if (!profile.value || !store.state.user.user) return
  relationshipLoading.value = true; relationshipFailed.value = false
  try { relationship.value = (await getRelationship(profile.value.username)).data }
  catch { relationshipFailed.value = true } finally { relationshipLoading.value = false }
}
async function load() {
  loading.value = true
  try { profile.value = (await getProfile(String(route.params.username))).data; await loadRelationship() }
  catch { /* Displayed by request layer. */ } finally { loading.value = false }
}
async function toggleFollow() {
  if (!store.state.user.user) { await router.push({ path: '/login', query: { redirect: route.fullPath } }); return }
  if (!profile.value || following.value || isMe.value) return
  if (!relationship.value) { await loadRelationship(); if (!relationship.value) return }
  following.value = true
  try { relationship.value = (await setFollow(profile.value.username, !relationship.value.following)).data; ElMessage.success(relationship.value.following ? '已关注，可在我的关注查看' : '已取消关注') }
  catch { /* Preserve confirmed relationship state. */ } finally { following.value = false }
}
function message() { if (profile.value) void router.push(`/messages/${profile.value.username}`) }
onMounted(load)
</script>
<style scoped>.profile-heading { display: flex; align-items: center; flex-wrap: wrap; gap: 20px; }.profile-heading > div { min-width: 0; }.profile-actions,.profile-stats { display:flex; gap:16px; flex-wrap:wrap; align-items:center; }.profile-actions .el-button { margin:0; }</style>
