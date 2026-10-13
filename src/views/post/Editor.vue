<template>
  <el-card shadow="never" v-loading="loading">
    <template #header><h1 class="title is-4">{{ editing ? '编辑帖子' : '发表想法' }}</h1></template>
    <el-form v-if="ready" ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="save">
      <el-form-item label="标题" prop="title"><el-input v-model="form.title" maxlength="160" show-word-limit placeholder="用一句话描述你的主题" /></el-form-item>
      <el-form-item label="标签" prop="tags"><el-select v-model="form.tags" multiple filterable allow-create default-first-option :multiple-limit="5" placeholder="输入标签后按回车，最多 5 个">
        <el-option v-for="tag in tags" :key="tag.id" :label="tag.name" :value="tag.name" />
      </el-select></el-form-item>
      <el-tabs v-model="tab"><el-tab-pane label="正文" name="write">
        <el-form-item label="内容" prop="content"><el-input v-model="form.content" type="textarea" :rows="16" maxlength="20000" show-word-limit placeholder="支持 Markdown。写下你的经验、问题或想法。" /></el-form-item>
      </el-tab-pane><el-tab-pane label="预览" name="preview"><MarkdownContent :content="form.content" /></el-tab-pane></el-tabs>
      <div class="mt-5"><el-button type="primary" native-type="submit" :loading="saving">{{ editing ? '保存修改' : '发布帖子' }}</el-button><el-button @click="router.back()">取消</el-button></div>
    </el-form>
    <el-empty v-else-if="!loading" description="无法编辑此帖子"><el-button @click="router.push('/')">返回首页</el-button></el-empty>
  </el-card>
</template>
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { getPost, getTags, createPost, updatePost } from '@/api/post'
import type { PostInput, Tag } from '@/types'
import store from '@/store'
import MarkdownContent from '@/components/MarkdownContent.vue'
const route = useRoute(), router = useRouter(), editing = !!route.params.id
const form = reactive<PostInput>({ title: '', content: '', tags: [] })
const formRef = ref<FormInstance>(), tags = ref<Tag[]>([]), tab = ref('write')
const loading = ref(true), saving = ref(false), ready = ref(false)
let initial = '', saved = false
const rules: FormRules = {
  title: [{ required: true, whitespace: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, whitespace: true, message: '请输入正文', trigger: 'blur' }],
  tags: [{ validator: (_rule, value: string[], cb) => cb(value.some(t => !t.trim() || t.length > 32) ? new Error('标签需为 1 至 32 个字符') : undefined), trigger: 'change' }]
}
onMounted(async () => {
  try {
    if (editing) {
      const { data } = await getPost(String(route.params.id))
      if (data.userId !== store.state.user.user?.id) { ElMessage.error('只能编辑自己的帖子'); return }
      Object.assign(form, { title: data.title, content: data.content, tags: data.tags.map(t => t.name), version: data.version })
    }
    initial = JSON.stringify(form); ready.value = true
    tags.value = (await getTags()).data
  } catch { /* Displayed by request layer. */ } finally { loading.value = false }
})
async function save() {
  if (saving.value || !await formRef.value?.validate().catch(() => false)) return
  saving.value = true
  try {
    const { data } = editing ? await updatePost(String(route.params.id), form) : await createPost(form)
    saved = true; ElMessage.success(editing ? '修改已保存' : '帖子已发布'); await router.replace(`/post/${data.id}`)
  } catch { /* Preserve text on validation/network/version conflicts. */ } finally { saving.value = false }
}
onBeforeRouteLeave(async () => {
  if (saved || !ready.value || JSON.stringify(form) === initial) return true
  return ElMessageBox.confirm('还有未保存的内容，确定离开？', '离开编辑', { confirmButtonText: '离开', cancelButtonText: '继续编辑' }).then(() => true).catch(() => false)
})
</script>
