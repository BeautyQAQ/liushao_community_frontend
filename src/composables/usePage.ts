import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import type { Page } from '@/types'
import type { ApiResult } from '@/utils/request'

export function usePage<T>(fetch: (page: number, size: number) => Promise<ApiResult<Page<T>>>, pageSize = 10) {
  const records = shallowRef<T[]>([]), current = ref(1), size = ref(pageSize), total = ref(0)
  const loading = ref(false), failed = ref(false)
  let revision = 0
  async function load() {
    const ticket = ++revision
    loading.value = true; failed.value = false
    try {
      const { data } = await fetch(current.value, size.value)
      if (ticket !== revision) return
      if (current.value > 1 && data.totalElements > 0 && !data.content.length) {
        current.value = Math.max(1, Math.ceil(data.totalElements / size.value)); await load(); return
      }
      records.value = data.content; total.value = data.totalElements
    } catch { if (ticket === revision) { records.value = []; total.value = 0; failed.value = true } }
    finally { if (ticket === revision) loading.value = false }
  }
  function reset() { current.value = 1; return load() }
  onMounted(load)
  onBeforeUnmount(() => { revision++ })
  return { records, current, size, total, loading, failed, load, reset }
}
