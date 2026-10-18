<template>
  <el-card shadow="never" v-loading="loading">
    <template #header><h1 class="title is-4">我的关注与粉丝</h1><div class="connection-tabs"><router-link to="/me/following" :class="{ selected: following }">我的关注</router-link><router-link to="/me/followers" :class="{ selected: !following }">我的粉丝</router-link></div></template>
    <el-empty v-if="!loading && !records.length" :description="failed ? '加载失败，请重试' : following ? '暂未关注其他用户' : '还没有粉丝'">
      <el-button v-if="failed" @click="load">重试</el-button><el-button v-else @click="router.push('/')">发现社区主题</el-button>
    </el-empty>
    <article v-for="item in records" :key="item.id" class="member-row">
      <router-link :to="`/member/${item.username}/home`"><el-avatar :size="48" :src="mediaUrl(item.avatar)">{{ (item.alias || item.username).slice(0, 1) }}</el-avatar></router-link>
      <div class="member-info"><router-link :to="`/member/${item.username}/home`"><strong>{{ item.alias || item.username }}</strong> <span class="has-text-grey">@{{ item.username }}</span></router-link><p class="has-text-grey mt-2">{{ item.bio || '还没有填写简介' }}</p></div>
      <div class="member-actions"><el-button @click="router.push(`/messages/${item.username}`)">私信</el-button><el-button v-if="following" :loading="removing === item.username" @click="unfollow(item.username)">取消关注</el-button></div>
    </article>
    <Pagination v-if="total" v-model:page="current" v-model:limit="size" :total="total" layout="total, prev, pager, next" @pagination="load" />
  </el-card>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getFollowing, getFollowers, setFollow } from '@/api/social'
import { usePage } from '@/composables/usePage'
import { mediaUrl } from '@/utils/media'
import Pagination from '@/components/Pagination/index.vue'
const route = useRoute(), router = useRouter(), following = computed(() => route.name === 'Following'), removing = ref('')
const { records, current, size, total, loading, failed, load } = usePage((page, size) => following.value ? getFollowing(page, size) : getFollowers(page, size))
async function unfollow(username: string) {
  if (removing.value) return
  removing.value = username
  try { await setFollow(username, false); await load(); ElMessage.success('已取消关注') }
  catch { /* Displayed by request layer. */ } finally { removing.value = '' }
}
</script>
<style scoped>.connection-tabs { display: flex; gap: 24px; }.selected { font-weight: 700; color: #176d86; }.member-row { display: flex; align-items: center; gap: 16px; padding: 22px 0; border-bottom: 1px solid #edf0f3; }.member-info { min-width: 0; flex: 1; overflow-wrap: anywhere; }.member-actions { display: flex; gap: 8px; flex-wrap: wrap; }.member-actions .el-button { margin: 0; }@media(max-width:600px){.member-row{flex-wrap:wrap;}.member-actions{width:100%;padding-left:64px;}}</style>
