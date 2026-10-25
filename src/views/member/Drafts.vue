<template>
  <el-card shadow="never" v-loading="loading">
    <template #header><div class="draft-heading"><h1 class="title is-4">草稿箱</h1><div><el-button @click="load">刷新</el-button><el-button type="primary" @click="router.push('/post/create')">新建草稿</el-button></div></div></template>
    <el-alert v-if="failed" class="mb-4" type="warning" :closable="false" title="暂时无法加载服务端草稿，仍可继续编辑此浏览器保留的内容" />
    <el-empty v-if="!loading && !visibleDrafts.length" :description="failed ? '草稿加载失败，请刷新重试' : '还没有草稿，开始记录你的想法吧'">
      <el-button v-if="!failed" @click="router.push('/post/create')">开始创作</el-button>
    </el-empty>
    <article v-for="item in visibleDrafts" :key="item.id" class="draft-row">
      <div class="draft-body"><router-link :to="draftLocation(item)"><strong>{{ item.title.trim() || '未命名草稿' }}</strong></router-link>
        <el-tag class="ml-2" size="small" :type="item.localOnly ? 'warning' : 'info'">{{ item.localOnly ? '待同步' : item.postId ? '编辑草稿' : '新主题' }}</el-tag>
        <p class="has-text-grey mt-2">更新于 {{ dayjs(item.updatedAt).format('YYYY/MM/DD HH:mm') }}</p>
        <p class="draft-excerpt has-text-grey mt-2">{{ item.excerpt || '还没有填写正文' }}</p>
      </div>
      <div class="draft-actions"><el-button @click="router.push(draftLocation(item))">继续编辑</el-button><el-button type="danger" plain :loading="removing === item.id" :disabled="!!removing" @click="remove(item)">删除</el-button></div>
    </article>
    <Pagination v-if="total > size" v-model:page="current" :limit="size" :total="total" layout="total, prev, pager, next" @pagination="load" />
  </el-card>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import store from '@/store'
import { deleteDraft, getDrafts } from '@/api/drafts'
import { draftError, draftLocation, httpStatus, localDrafts, removeRecovery } from '@/utils/drafts'
import type { DraftSummary } from '@/types'
import Pagination from '@/components/Pagination/index.vue'
const router = useRouter(), owner = store.state.user.user!.id
const records = ref<DraftSummary[]>([]), local = ref<DraftSummary[]>([]), current = ref(1), size = 20
const total = ref(0), loading = ref(false), failed = ref(false), removing = ref('')
let active = true, ticket = 0
const visibleDrafts = computed(() => {
  const merged = new Map(records.value.map(item => [item.id, item]))
  for (const item of local.value) merged.set(item.id, item)
  return [...merged.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
})
function refreshLocal() { local.value = localDrafts(owner) }
async function load() {
  const revision = ++ticket
  refreshLocal(); loading.value = true; failed.value = false
  try {
    const { data } = await getDrafts(current.value, size)
    if (!active || revision !== ticket) return
    records.value = data.content; total.value = data.totalElements
    if (!data.content.length && current.value > 1) { current.value--; await load() }
  } catch { if (active && revision === ticket) { records.value = []; failed.value = true } }
  finally { if (revision === ticket) loading.value = false }
}
async function remove(item: DraftSummary) {
  if (removing.value || !await ElMessageBox.confirm('删除后无法恢复，确定删除这份草稿？', '删除草稿', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }).then(() => true).catch(() => false)) return
  removing.value = item.id
  try {
    try { await deleteDraft(item.id, item.version) }
    catch (failure) { if (httpStatus(failure) !== 404) throw failure }
    removeRecovery(owner, item.id); await load(); ElMessage.success('草稿已删除')
  } catch (failure) { ElMessage.error(draftError(failure)); await load() }
  finally { removing.value = '' }
}
onMounted(() => { void load(); window.addEventListener('storage', refreshLocal) })
onBeforeUnmount(() => { active = false; window.removeEventListener('storage', refreshLocal) })
</script>
<style scoped>
.draft-heading,.draft-row { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }.draft-heading .title { margin: 0; }
.draft-row { padding: 22px 0; border-bottom: 1px solid #edf0f3; }.draft-body { flex: 1; min-width: 200px; overflow-wrap: anywhere; }.draft-excerpt { white-space: pre-wrap; max-height: 4.5em; overflow: hidden; }.draft-actions { display: flex; gap: 10px; }.draft-actions .el-button { margin-left: 0; }
</style>
