<template>
  <div><h1 class="title is-4">{{ tag ? `标签：${tag}` : `搜索：${query || '全部主题'}` }}</h1>
    <div class="mb-4"><router-link v-for="item in tags" :key="item.id" :to="`/tag/${encodeURIComponent(item.name)}`" class="tag is-light mr-2 mb-2">#{{ item.name }} · {{ item.topicCount }}</router-link></div>
    <PostList :query="query" :tag="tag" />
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getTags } from '@/api/post'
import type { Tag } from '@/types'
import PostList from './Index.vue'
const route = useRoute(), tags = ref<Tag[]>([])
const tag = computed(() => String(route.params.name || '')), query = computed(() => String(route.query.key || '').slice(0, 100))
onMounted(async () => { try { tags.value = (await getTags()).data } catch { /* Displayed by request layer. */ } })
</script>
