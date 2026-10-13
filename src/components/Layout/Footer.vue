<template>
  <footer class="footer has-text-grey has-background-light"><div class="container">© {{ new Date().getFullYear() }} 流沙社区 · 分享经验，交流想法</div><BackTop /></footer>
</template>
<script setup lang="ts">
import BackTop from '@/components/Backtop/BackTop.vue'
</script>
<style scoped>footer { margin-top: 64px; padding: 32px 24px; }</style>
