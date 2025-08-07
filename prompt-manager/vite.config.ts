import { fileURLToPath, URL } from 'node:url'
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    // 自定义插件：拷贝 preload.js 到 dist 目录
    {
      name: 'copy-preload',
      generateBundle() {
        // 确保 dist 目录存在
        const distDir = resolve(__dirname, 'dist')
        if (!existsSync(distDir)) {
          mkdirSync(distDir, { recursive: true })
        }
      },
      writeBundle() {
        try {
          const srcPath = resolve(__dirname, 'preload.js')
          const destPath = resolve(__dirname, 'dist/preload.js')
          
          // 确保目标目录存在
          const destDir = dirname(destPath)
          if (!existsSync(destDir)) {
            mkdirSync(destDir, { recursive: true })
          }
          
          // 检查源文件是否存在
          if (existsSync(srcPath)) {
            copyFileSync(srcPath, destPath)
            console.log('✅ preload.js 已成功拷贝到 dist 目录')
          } else {
            console.warn('❌ 源文件 preload.js 不存在')
          }
          
          // 同时拷贝 logo.png 和 plugin.json
          const logoSrcPath = resolve(__dirname, 'logo.png')
          const logoDestPath = resolve(__dirname, 'dist/logo.png')
          const pluginJsonSrcPath = resolve(__dirname, 'plugin.json')
          const pluginJsonDestPath = resolve(__dirname, 'dist/plugin.json')
          
          if (existsSync(logoSrcPath)) {
            copyFileSync(logoSrcPath, logoDestPath)
            console.log('✅ logo.png 已成功拷贝到 dist 目录')
          }
          
          if (existsSync(pluginJsonSrcPath)) {
            copyFileSync(pluginJsonSrcPath, pluginJsonDestPath)
            console.log('✅ plugin.json 已成功拷贝到 dist 目录')
          }
        } catch (error) {
          console.warn('❌ 拷贝 preload 文件失败:', error)
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
    },
    // 确保插件相关文件被正确处理
    copyPublicDir: true,
    // 构建完成后确保所有必要文件都在正确位置
    emptyOutDir: true
  },
  // 开发环境配置
  server: {
    host: '127.0.0.1',
    port: 3000
  }
})
