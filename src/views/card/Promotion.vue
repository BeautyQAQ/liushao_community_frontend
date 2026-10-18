<template>
  <el-card shadow="never" :aria-busy="loading">
    <template #header>🥂 推广</template>
    <p v-if="loading" role="status">正在加载…</p>
    <div v-else-if="failed" role="alert">推广内容加载失败。<el-button link type="primary" @click="load">重试</el-button></div>
    <p v-else-if="!list.length" class="has-text-grey">暂无推广内容</p>
    <template v-else><p v-for="item in list" :key="item.id" class="block"><a :href="item.link" target="_blank" rel="noopener noreferrer">{{ item.title }}<span class="sr-only">（在新窗口打开）</span></a></p></template>
  </el-card>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Promotion } from '@/types'
import { getList } from '@/api/promote'
const list = ref<Promotion[]>([]), loading = ref(true), failed = ref(false)
async function load() {
  loading.value = true; failed.value = false
  try { const { data } = await getList(); list.value = data }
  catch { failed.value = true }
  finally { loading.value = false }
}
onMounted(load)
</script>
