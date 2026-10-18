<template>
  <el-card shadow="never" :aria-busy="loading">
    <template #header>🥳 每日一句</template>
    <p v-if="loading" role="status">正在加载…</p>
    <div v-else-if="failed" role="alert">提示语加载失败。<el-button link type="primary" @click="load">重试</el-button></div>
    <template v-else><p>{{ tip.content }}</p><p class="has-text-right mt-5">——{{ tip.author }}</p></template>
  </el-card>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getTodayTip } from '@/api/tip'
const tip = ref({ content: '', author: '' }), loading = ref(true), failed = ref(false)
async function load() {
  loading.value = true; failed.value = false
  try { const { data } = await getTodayTip(); tip.value = data || { content: '欢迎分享你的经验与想法。', author: '流沙社区' } }
  catch { failed.value = true }
  finally { loading.value = false }
}
onMounted(load)
</script>
