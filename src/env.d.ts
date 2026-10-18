/// <reference types="vite/client" />
import type { Store } from 'vuex'
import type { RootState } from './store'
declare module 'vue' {
  interface ComponentCustomProperties {
    $store: Store<RootState>
  }
}
export {}
