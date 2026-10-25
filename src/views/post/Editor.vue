<template>
  <el-card shadow="never" v-loading="loading">
    <template #header><div class="editor-heading"><h1 class="title is-4">{{ editing ? '编辑帖子' : '发表想法' }}</h1><router-link to="/me/drafts">草稿箱</router-link></div></template>
    <el-alert v-if="loadError" class="mb-4" type="warning" :closable="false" :title="loadError" />
    <el-alert v-if="ready && error" class="mb-4" type="warning" :closable="false" :title="statusText">
      <el-button v-if="!conflict" class="mt-2" @click="saveManually">重试保存</el-button>
      <el-button v-else class="mt-2" @click="reopen">重新打开草稿</el-button>
    </el-alert>
    <el-button v-if="(conflict || loadError) && hasRecovery" class="mb-4" @click="copyAsNew">将当前内容复制为新主题</el-button>
    <el-form v-if="ready" ref="formRef" :model="form" :rules="rules" :disabled="publishing" label-position="top" @submit.prevent="save">
      <el-form-item label="标题" prop="title"><el-input v-model="form.title" maxlength="160" show-word-limit placeholder="用一句话描述你的主题" /></el-form-item>
      <el-form-item label="标签" prop="tags"><el-select v-model="form.tags" multiple filterable allow-create default-first-option :multiple-limit="5" placeholder="输入标签后按回车，最多 5 个">
        <el-option v-for="tag in tags" :key="tag.id" :label="tag.name" :value="tag.name" />
      </el-select></el-form-item>
      <el-tabs v-model="tab"><el-tab-pane label="正文" name="write">
        <ImageUploader :disabled="publishing" @uploaded="insertImage" @uploading="uploading = $event" />
        <el-form-item label="内容" prop="content"><el-input v-model="form.content" type="textarea" :rows="16" maxlength="20000" show-word-limit placeholder="支持 Markdown。写下你的经验、问题或想法。" /></el-form-item>
      </el-tab-pane><el-tab-pane label="预览" name="preview"><MarkdownContent :content="form.content" /></el-tab-pane></el-tabs>
      <p class="draft-status has-text-grey is-size-7" role="status" aria-live="polite">{{ statusText }}</p>
      <div class="editor-actions mt-4"><el-button type="primary" native-type="submit" :loading="publishing" :disabled="uploading || conflict">{{ editing ? '保存修改' : '发布帖子' }}</el-button><el-button :loading="syncing" :disabled="publishing || conflict" @click="saveManually">保存草稿</el-button><el-button :disabled="publishing" @click="router.push('/me/drafts')">返回草稿箱</el-button></div>
    </el-form>
    <el-empty v-else-if="!loading" description="暂时无法打开编辑器"><el-button @click="router.go(0)">重试</el-button><el-button @click="router.push('/me/drafts')">返回草稿箱</el-button></el-empty>
  </el-card>
</template>
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { getTags } from '@/api/post'
import type { PostInput, Tag } from '@/types'
import { usePostDraft } from '@/composables/usePostDraft'
import MarkdownContent from '@/components/MarkdownContent.vue'
import ImageUploader from '@/components/ImageUploader.vue'
const route = useRoute(), router = useRouter(), editing = !!route.params.id
const form = reactive<PostInput>({ title: '', content: '', tags: [] })
const formRef = ref<FormInstance>(), tags = ref<Tag[]>([]), tab = ref('write'), uploading = ref(false)
const { loading, ready, syncing, publishing, error, loadError, conflict, statusText, hasRecovery, saveManually, publish, copyAsNew, reopen } = usePostDraft(form)
function insertImage(url: string) {
  const image = `\n\n![图片](${url})\n`
  if (form.content.length + image.length > 20000) { ElMessage.warning('正文已达到长度限制，请删减后插入图片'); return }
  form.content += image; ElMessage.success('图片已插入正文，可切换预览查看')
}
const rules: FormRules = {
  title: [{ required: true, whitespace: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, whitespace: true, message: '请输入正文', trigger: 'blur' }],
  tags: [{ validator: (_rule, value: string[], cb) => cb(value.some(t => !t.trim() || t.length > 32) ? new Error('标签需为 1 至 32 个字符') : undefined), trigger: 'change' }]
}
onMounted(async () => { try { tags.value = (await getTags()).data } catch { /* The request layer displays the failure. */ } })
async function save() {
  if (publishing.value || uploading.value || !await formRef.value?.validate().catch(() => false)) return
  await publish()
}
</script>
<style scoped>
.editor-heading { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.editor-heading .title { margin: 0; }.editor-actions { display: flex; gap: 10px; flex-wrap: wrap; }.editor-actions .el-button { margin-left: 0; }
.draft-status { min-height: 20px; margin-top: 16px; overflow-wrap: anywhere; }
</style>
