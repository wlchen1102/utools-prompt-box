import './assets/main.css'
import './styles/theme.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

// Naive UI
import { 
  create, 
  NMessageProvider, 
  NConfigProvider,
  NDialogProvider,
  NNotificationProvider,
  NLoadingBarProvider
} from 'naive-ui'

import App from './App.vue'
import router from './router'
import { themeOverrides } from './config/theme'

// 创建 naive ui 实例
const naive = create({
  components: [
    NMessageProvider,
    NConfigProvider, 
    NDialogProvider,
    NNotificationProvider,
    NLoadingBarProvider
  ]
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(naive)

// 全局配置主题
app.provide('themeOverrides', themeOverrides)

app.mount('#app')
