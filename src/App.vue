<template>
  <el-config-provider :locale="zhCn">
    <a class="skip-link" href="#main-content" @click.prevent="focusContent">跳到主要内容</a>
    <Header />
    <main id="main-content" tabindex="-1" class="container context">
      <router-view :key="$route.fullPath" />
    </main>
    <Footer />
  </el-config-provider>
</template>

<script setup lang="ts">
import { nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import Header from '@/components/Layout/Header.vue'
import Footer from '@/components/Layout/Footer.vue'
const route = useRoute()
function focusContent() { document.getElementById('main-content')?.focus({ preventScroll: true }) }
watch(() => route.fullPath, async () => { await nextTick(); focusContent() })
</script>

<style scoped>
main { min-height: calc(100vh - 64px); }
</style>
