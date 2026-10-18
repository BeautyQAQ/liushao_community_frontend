import { ref } from 'vue'
import { getNotificationUnread, getMessageUnread } from '@/api/social'
import store from '@/store'
export const notificationUnread = ref(0), messageUnread = ref(0)
let revision = 0
export async function refreshInbox() {
  const ticket = ++revision, token = store.state.user.token
  if (!token) { notificationUnread.value = 0; messageUnread.value = 0; return }
  const results = await Promise.allSettled([getNotificationUnread(), getMessageUnread()])
  if (ticket !== revision || token !== store.state.user.token) return
  if (results[0].status === 'fulfilled') notificationUnread.value = results[0].value.data.count
  if (results[1].status === 'fulfilled') messageUnread.value = results[1].value.data.count
}
