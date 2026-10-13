<template>
  <el-card shadow="never" v-loading="loading">
    <template #header><el-tabs v-model="activeName" @tab-change="changeTab">
      <el-tab-pane label="最新主题" name="latest" /><el-tab-pane label="近七天热门" name="hot" />
    </el-tabs></template>
    <el-empty v-if="!loading && !articleList.length" :description="failed ? '加载失败，请重试' : '暂无主题'">
      <el-button v-if="failed" @click="loadPosts">重试</el-button>
    </el-empty>
    <article v-for="item in articleList" :key="item.id" class="media">
      <router-link class="media-left" :to="`/member/${item.username}/home`"><el-avatar :src="item.avatar || undefined">{{ item.alias?.slice(0, 1) || item.username.slice(0, 1) }}</el-avatar></router-link>
      <div class="media-content">
        <router-link :to="'/post/' + item.id">{{ item.title }}</router-link>
        <p class="has-text-grey is-size-7 mt-2">
          <router-link :to="`/member/${item.username}/home`">{{ item.alias || item.username }}</router-link>
          · {{ dayjs(item.createTime).format('YYYY/MM/DD HH:mm') }} · 浏览 {{ item.view }}
        </p>
        <router-link v-for="tag in item.tags" :key="tag.id" :to="`/tag/${encodeURIComponent(tag.name)}`" class="tag is-success is-light mr-1">#{{ tag.name }}</router-link>
      </div>
    </article>
    <Pagination v-show="page.total > 0" :total="page.total" v-model:page="page.current" v-model:limit="page.size" @pagination="loadPosts" />
  </el-card>
</template>
<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import dayjs from 'dayjs'
import { getList } from '@/api/post'
import type { Post } from '@/types'
import Pagination from '@/components/Pagination/index.vue'
const props = withDefaults(defineProps<{ query?: string; tag?: string; author?: string }>(), { query: '', tag: '', author: '' })
const activeName = ref('latest'), loading = ref(false), failed = ref(false)
const articleList = ref<Post[]>([])
const page = reactive({ current: 1, size: 10, total: 0 })
let revision = 0
async function loadPosts() {
  const ticket = ++revision
  loading.value = true; failed.value = false
  try {
    const { data } = await getList(page.current, page.size, activeName.value, props)
    if (ticket !== revision) return
    articleList.value = data.content; page.total = data.totalElements
  } catch { if (ticket === revision) { articleList.value = []; page.total = 0; failed.value = true } }
  finally { if (ticket === revision) loading.value = false }
}
function changeTab() { page.current = 1; void loadPosts() }
watch(() => [props.query, props.tag, props.author], () => { page.current = 1; void loadPosts() }, { immediate: true })
</script>
