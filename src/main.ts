import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import Buefy from 'buefy'
import 'buefy/dist/css/buefy.css'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import '@/assets/app.css'
import './assets/plugins/font-awesome-4.7.0/css/font-awesome.min.css'
import './permission'

const app = createApp(App)
dayjs.extend(relativeTime)
dayjs.locale('zh-cn')
app.config.globalProperties.dayjs = dayjs
app.use(Buefy)
app.use(store).use(router).use(ElementPlus, { locale: zhCn }).mount('#app')
