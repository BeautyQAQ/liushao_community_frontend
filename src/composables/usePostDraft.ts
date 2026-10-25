import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import store from '@/store'
import { getOwnPost } from '@/api/social'
import { getDraft, publishDraft, saveDraft } from '@/api/drafts'
import { draftError, draftLocation, httpStatus, isDraftId, newDraftId, readRecovery, removeRecovery, writeRecovery } from '@/utils/drafts'
import type { DraftInput, PostDraft, PostInput } from '@/types'

const fingerprint = (draft: Omit<DraftInput, 'version'>) => JSON.stringify([draft.title, draft.content, draft.tags, draft.postId, draft.postVersion])

export function usePostDraft(form: PostInput) {
  const route = useRoute(), router = useRouter(), owner = store.state.user.user!.id
  const postId = route.params.id ? Number(route.params.id) : null
  const id = ref(String(route.query.draft || ''))
  const loading = ref(true), ready = ref(false), syncing = ref(false), publishing = ref(false)
  const error = ref(''), loadError = ref(''), conflict = ref(false), localSaved = ref(false)
  const version = ref(0), updatedAt = ref(''), savedFingerprint = ref('')
  let timer: ReturnType<typeof setTimeout> | undefined
  let active = true, published = false, inFlight: Promise<boolean> | undefined
  const recovery = ref<PostDraft>()

  function input(): DraftInput {
    return { title: form.title, content: form.content, tags: [...form.tags], postId, postVersion: postId ? form.version ?? null : null, version: version.value }
  }
  const dirty = computed(() => fingerprint(input()) !== savedFingerprint.value)
  const hasRecovery = computed(() => !!(ready.value ? form.title || form.content || form.tags.length : recovery.value?.title || recovery.value?.content || recovery.value?.tags.length))
  const statusText = computed(() => error.value
    ? `${error.value}${localSaved.value ? '；内容已保留在此浏览器' : '；请保留当前页面'}`
    : syncing.value ? '正在保存草稿…'
    : dirty.value && localSaved.value ? '已保存在此浏览器，等待同步'
    : version.value ? `草稿已保存 ${dayjs(updatedAt.value).format('HH:mm:ss')}` : '输入内容后会自动保存草稿')

  function cache() {
    localSaved.value = writeRecovery(owner, { ...input(), id: id.value, updatedAt: new Date().toISOString() }, dirty.value)
  }
  function schedule() {
    clearTimeout(timer)
    if (!conflict.value) timer = setTimeout(() => { void persist().then(ok => { if (ok && dirty.value && active) schedule() }) }, 1000)
  }
  async function persist(): Promise<boolean> {
    clearTimeout(timer)
    if (inFlight) return inFlight
    if (!ready.value || conflict.value || owner !== store.state.user.user?.id) return false
    if (!dirty.value && version.value > 0) return true
    const sent = input()
    syncing.value = true
    inFlight = (async () => {
      try {
        const { data } = await saveDraft(id.value, sent)
        version.value = data.version; updatedAt.value = data.updatedAt
        savedFingerprint.value = fingerprint(data); error.value = ''
        cache()
        return true
      } catch (failure) {
        error.value = draftError(failure)
        if ([404, 409].includes(httpStatus(failure) || 0)) conflict.value = true
        cache()
        return false
      } finally { syncing.value = false; inFlight = undefined }
    })()
    return inFlight
  }
  async function flush(): Promise<boolean> {
    const ok = await persist()
    return ok && dirty.value && active ? flush() : ok
  }
  async function saveManually() {
    if (await flush()) ElMessage.success('草稿已保存')
  }

  watch(() => JSON.stringify([form.title, form.content, form.tags]), () => {
    if (!ready.value || published) return
    cache(); schedule()
  }, { flush: 'sync' })

  async function initialize() {
    try {
      if (!id.value) {
        if (postId) {
          const { data } = await getOwnPost(postId)
          Object.assign(form, { title: data.title, content: data.content, tags: data.tags.map(tag => tag.name), version: data.version })
        }
        id.value = newDraftId()
        const fresh = { ...input(), id: id.value, updatedAt: new Date().toISOString() }
        // Assign a stable URL before typing so a reload can recover even before the first save.
        if (!writeRecovery(owner, fresh, false)) await saveDraft(id.value, input())
        await router.replace(draftLocation(fresh))
        return
      }
      if (!isDraftId(id.value)) { loadError.value = '草稿地址不正确，请返回草稿箱重新打开'; return }
      const cached = readRecovery(owner, id.value)
      recovery.value = cached?.draft
      let remote: PostDraft | undefined
      try { remote = (await getDraft(id.value)).data }
      catch (failure) {
        if (httpStatus(failure) === 404 && cached?.draft.version !== 0) {
          loadError.value = '草稿已删除或已发布。你可以将保留的内容复制为新主题'; return
        }
        if (!cached) { loadError.value = draftError(failure); return }
        if (httpStatus(failure) !== 404) error.value = draftError(failure)
      }
      const selected = cached && (cached.dirty || !remote) ? cached.draft : remote!
      if (selected.postId !== postId) { await router.replace(draftLocation(selected)); return }
      if (postId) await getOwnPost(postId)
      if (remote && cached?.dirty && remote.version !== cached.draft.version && fingerprint(remote) !== fingerprint(cached.draft)) {
        conflict.value = true; error.value = '草稿已在其他页面更新，请重新打开，或将当前内容复制为新主题'
      }
      version.value = conflict.value ? selected.version : remote?.version ?? selected.version
      updatedAt.value = remote?.updatedAt ?? selected.updatedAt
      savedFingerprint.value = remote ? fingerprint(remote) : cached?.dirty ? '' : fingerprint(selected)
      Object.assign(form, { title: selected.title, content: selected.content, tags: [...selected.tags], version: selected.postVersion ?? undefined })
      ready.value = true; cache()
      if (cached?.dirty && !conflict.value) schedule()
    } catch (failure) { loadError.value = draftError(failure) }
    finally { loading.value = false }
  }

  async function publish() {
    if (publishing.value || conflict.value) return
    publishing.value = true
    try {
      if (!await flush()) return
      const { data } = await publishDraft(id.value, version.value)
      published = true; removeRecovery(owner, id.value)
      ElMessage.success(data.status && data.status !== 'PUBLISHED' ? '内容已提交，等待审核' : postId ? '修改已保存' : '帖子已发布')
      await router.replace(data.status && data.status !== 'PUBLISHED' ? `/me/posts/${data.id}` : `/post/${data.id}`)
    } catch (failure) {
      error.value = draftError(failure)
      if ([404, 409].includes(httpStatus(failure) || 0)) conflict.value = true
    } finally { publishing.value = false }
  }

  async function copyAsNew() {
    const source = ready.value ? input() : recovery.value
    if (!source) return
    const fresh: PostDraft = { ...source, tags: [...source.tags], id: newDraftId(), postId: null, postVersion: null, version: 0, updatedAt: new Date().toISOString() }
    if (!writeRecovery(owner, fresh, true)) { ElMessage.error('无法保存恢复副本，请先复制正文保留内容'); return }
    await router.push(draftLocation(fresh))
  }

  function beforeUnload(event: BeforeUnloadEvent) {
    if (ready.value && dirty.value && !localSaved.value && !published) { event.preventDefault(); event.returnValue = '' }
  }
  async function reopen() {
    if (!await ElMessageBox.confirm('重新打开会载入服务端的最新草稿。当前未同步的内容将被替换，可先复制为新主题保留。', '重新打开草稿', { confirmButtonText: '载入最新草稿', cancelButtonText: '继续编辑' }).then(() => true).catch(() => false)) return
    removeRecovery(owner, id.value); router.go(0)
  }
  onMounted(() => { window.addEventListener('beforeunload', beforeUnload); void initialize() })
  onBeforeUnmount(() => { active = false; clearTimeout(timer); window.removeEventListener('beforeunload', beforeUnload) })
  onBeforeRouteLeave(async () => {
    if (published || !ready.value) return true
    if (publishing.value) return false
    if (version.value === 0 && !dirty.value) { removeRecovery(owner, id.value); return true }
    if (await flush()) return true
    if (localSaved.value) return true
    return ElMessageBox.confirm('草稿尚未保存成功，离开可能丢失内容，确定离开？', '保留草稿', { confirmButtonText: '离开', cancelButtonText: '继续编辑' }).then(() => true).catch(() => false)
  })
  return { loading, ready, syncing, publishing, error, loadError, conflict, statusText, hasRecovery, saveManually, publish, copyAsNew, reopen }
}
