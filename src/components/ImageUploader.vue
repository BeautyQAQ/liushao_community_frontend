<template>
  <div class="image-upload">
    <input ref="input" type="file" accept="image/png,image/jpeg" hidden @change="upload" />
    <el-button :loading="uploading" :disabled="disabled" @click="input?.click()">{{ label }}</el-button>
    <span class="has-text-grey is-size-7">PNG、JPEG，最大 4 MB</span>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadImage } from '@/api/uploads'
withDefaults(defineProps<{ label?: string; disabled?: boolean }>(), { label: '上传图片', disabled: false })
const emit = defineEmits<{ uploaded: [url: string]; uploading: [value: boolean] }>()
const input = ref<HTMLInputElement>(), uploading = ref(false)
async function upload(event: Event) {
  const element = event.target as HTMLInputElement, file = element.files?.[0]
  element.value = ''
  if (!file || uploading.value) return
  if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 4 * 1024 * 1024) {
    ElMessage.warning('请选择不超过 4 MB 的 PNG 或 JPEG 图片'); return
  }
  uploading.value = true; emit('uploading', true)
  try { const { data } = await uploadImage(file); emit('uploaded', data.url) }
  catch { /* The request layer explains upload errors. */ }
  finally { uploading.value = false; emit('uploading', false) }
}
</script>
<style scoped>.image-upload { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 8px 0; }</style>
