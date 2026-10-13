<template>
  <el-card shadow="never" v-loading="loading">
    <template #header>
      <el-tabs v-model="activeName" @tab-change="changeTab">
        <el-tab-pane label="最新主题" name="latest" />
        <el-tab-pane label="热门主题" name="hot" />
      </el-tabs>
    </template>
    <el-empty v-if="!loading && articleList.length === 0" description="暂无主题" />
    <article v-for="item in articleList" :key="item.id" class="media">
      <div class="media-left"><img :src="`https://cn.gravatar.com/avatar/${item.userId}?s=48&d=monsterid`" width="48" height="48" alt="用户头像" /></div>
      <div class="media-content">
        <router-link :to="'/post/' + item.id">{{ item.title }}</router-link>
        <p class="has-text-grey is-size-7 mt-2">
          {{ item.alias || item.username }} · 发布于 {{ dayjs(item.createTime).format('YYYY/MM/DD') }} · 浏览 {{ item.view }}
        </p>
        <span v-for="tag in item.tags" :key="tag.name" class="tag is-success is-light mr-1">#{{ tag.name }}</span>
      </div>
    </article>
    <Pagination v-show="page.total > 0" :total="page.total" v-model:page="page.current" v-model:limit="page.size" @pagination="loadPosts" />
  </el-card>
</template>
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import dayjs from 'dayjs'
import { getList } from '@/api/post'
import type { Post } from '@/types'
import Pagination from '@/components/Pagination/index.vue'
const activeName = ref('latest')
const loading = ref(false)
const articleList = ref<Post[]>([])
const page = reactive({ current: 1, size: 10, total: 0 })
async function loadPosts() {
  loading.value = true
  try {
    const { data } = await getList(page.current, page.size, activeName.value)
    articleList.value = data.content
    page.total = data.totalElements
  } catch { articleList.value = []; page.total = 0 }
  finally { loading.value = false }
}
function changeTab() { page.current = 1; void loadPosts() }
onMounted(loadPosts)
</script>
