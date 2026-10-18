<template><div class="markdown-content" v-html="html" /></template>
<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { mediaUrl } from '@/utils/media'
const props = defineProps<{ content: string }>()
const html = computed(() => {
  const fragment = DOMPurify.sanitize(marked.parse(props.content, { async: false }), {
    USE_PROFILES: { html: true }, FORBID_TAGS: ['style', 'form', 'input', 'button', 'iframe'], FORBID_ATTR: ['style'], RETURN_DOM_FRAGMENT: true
  })
  fragment.querySelectorAll('img').forEach(img => {
    const source = img.getAttribute('src')
    if (source?.startsWith('/uploads/')) img.setAttribute('src', mediaUrl(source)!)
    img.setAttribute('loading', 'lazy')
  })
  const container = document.createElement('div')
  container.append(fragment)
  return container.innerHTML
})
</script>
<style scoped>
.markdown-content { line-height: 1.8; overflow-wrap: anywhere; }
.markdown-content :deep(h1), .markdown-content :deep(h2), .markdown-content :deep(h3) { font-weight: 600; margin: 1em 0 .5em; }
.markdown-content :deep(h1) { font-size: 1.7em; }.markdown-content :deep(h2) { font-size: 1.4em; }
.markdown-content :deep(p) { margin: .8em 0; }.markdown-content :deep(pre) { padding: 16px; overflow: auto; border-radius: 6px; }
.markdown-content :deep(ul), .markdown-content :deep(ol) { padding-left: 24px; list-style: revert; }
.markdown-content :deep(blockquote) { border-left: 3px solid #dce4ed; padding-left: 16px; color: #667; }
.markdown-content :deep(img) { max-width: 100%; }.markdown-content :deep(table) { display: block; overflow: auto; }
.markdown-content :deep(td), .markdown-content :deep(th) { border: 1px solid #ddd; padding: 8px; }
</style>
