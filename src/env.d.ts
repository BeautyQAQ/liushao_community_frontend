/// <reference types="vite/client" />
import type { ElMessage, ElMessageBox } from 'element-plus'
import type { Store } from 'vuex'
import type { RootState } from './store'
import type dayjs from 'dayjs'
declare module 'vue' {
  interface ComponentCustomProperties {
    $message: typeof ElMessage
    $alert: typeof ElMessageBox.alert
    $confirm: typeof ElMessageBox.confirm
    $store: Store<RootState>
    dayjs: typeof dayjs
  }
}
export {}
