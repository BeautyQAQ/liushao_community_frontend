<template>
  <div>
    <h1 class="sr-only">社区主题</h1>
    <div class="box announcement" :aria-busy="loading">
      <span v-if="loading" role="status">正在加载公告…</span>
      <template v-else>🔔 {{ content }}</template>
      <el-button v-if="failed" link type="primary" @click="load">公告加载失败，重试</el-button>
    </div>
    <div class="columns">
      <div class="column is-three-quarters"><PostList /></div>
      <aside class="column" aria-label="社区信息"><CardBar /></aside>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getBillboard } from '@/api/billboard'
import CardBar from '@/views/card/CardBar.vue'
import PostList from '@/views/post/Index.vue'
const content = ref('欢迎来到流沙社区'), loading = ref(true), failed = ref(false)
async function load() {
  loading.value = true; failed.value = false
  try { const { data } = await getBillboard(); content.value = data?.content || '欢迎来到流沙社区' }
  catch { failed.value = true }
  finally { loading.value = false }
}
onMounted(load)
</script>
<style scoped>.announcement { min-height: 66px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }</style>
