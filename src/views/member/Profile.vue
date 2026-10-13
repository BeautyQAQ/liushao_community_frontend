<template>
  <div v-loading="loading">
    <template v-if="profile">
      <el-card class="mb-5" shadow="never"><div class="profile-heading"><el-avatar :size="64" :src="profile.avatar || undefined">{{ profile.alias.slice(0, 1) }}</el-avatar>
        <div><h1 class="title is-4 mb-2">{{ profile.alias }}</h1><p>@{{ profile.username }} · 加入于 {{ dayjs(profile.createTime).format('YYYY/MM/DD') }}</p></div>
        <el-button v-if="isMe" @click="router.push(`/member/${profile.username}/setting`)">编辑资料</el-button>
      </div><p class="mt-4">{{ profile.bio || '这个人还没有填写简介。' }}</p></el-card>
      <h2 class="title is-5">发布的主题</h2><PostList :author="profile.username" />
    </template><el-empty v-else-if="!loading" description="用户不存在或暂时无法加载" />
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { getProfile } from '@/api/auth/auth'
import type { PublicUser } from '@/types'
import store from '@/store'
import PostList from '@/views/post/Index.vue'
const route = useRoute(), router = useRouter(), profile = ref<PublicUser>(), loading = ref(true)
const isMe = computed(() => profile.value?.id === store.state.user.user?.id)
onMounted(async () => { try { profile.value = (await getProfile(String(route.params.username))).data } catch { /* Displayed by request layer. */ } finally { loading.value = false } })
</script>
<style scoped>.profile-heading { display: flex; align-items: center; flex-wrap: wrap; gap: 20px; }</style>
