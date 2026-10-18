<template>
  <el-card shadow="never">
    <template #header>💐 发帖</template>
    <div class="welcome-actions">
      <router-link v-if="token" to="/post/create" class="action-link">✍ 发表想法</router-link>
      <template v-else>
        <router-link to="/register" class="action-link">马上入驻</router-link>
        <router-link to="/login" class="action-link">社区登录</router-link>
      </template>
    </div>
  </el-card>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import store from '@/store'
const token = computed(() => store.state.user.token)
</script>
<style scoped>
.welcome-actions { display: flex; justify-content: center; flex-wrap: wrap; gap: 10px; }
.action-link { display: inline-block; padding: 8px 12px; border: 1px solid #168478; color: #126b61; border-radius: 5px; }
.action-link:hover { background: #edf7f5; }
</style>
