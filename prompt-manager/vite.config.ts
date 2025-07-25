import { fileURLToPath, URL } from 'node:url'
import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    // 自定义插件：拷贝 preload.cjs 到 dist 目录
    {
      name: 'copy-preload',
      writeBundle() {
        try {
          copyFileSync(
            resolve(__dirname, 'preload.cjs'),
            resolve(__dirname, 'dist/preload.js')
          )
          console.log('preload.cjs 已拷贝到 dist/preload.js')
        } catch (error) {
          console.warn('拷贝 preload 文件失败:', error)
        }
      }
    }
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    outDir: 'dist',
    // 适配 uTools 环境
    target: 'chrome89',
    rollupOptions: {
      // 确保 preload 文件被正确拷贝
      external: [],
      output: {
        // 保持文件结构
        preserveModules: false
      }
    }
  },
  // 开发环境配置
  server: {
    host: '127.0.0.1',
    port: 3000
  }
})
