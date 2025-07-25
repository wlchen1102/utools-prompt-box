<script setup lang="ts">
import { onMounted } from 'vue'

// uTools 插件初始化
onMounted(() => {
  console.log('提示词管理工具已启动')
  
  // 如果在 uTools 环境中，初始化插件
  if (typeof window.utools !== 'undefined') {
    console.log('uTools 环境检测到，插件已就绪')
    
    // 可以在这里进行 uTools 相关的初始化
    // 注意：不要直接赋值给 utools 的方法，而是调用它们
    try {
      // 示例：设置插件就绪状态
      // window.utools.onPluginReady(callback)
    } catch (error) {
      console.warn('uTools API 调用失败:', error)
    }
  } else {
    console.log('非 uTools 环境，运行在开发模式')
  }
})
</script>

<template>
  <div id="app" class="app-container">
    <!-- 左侧窄边栏导航 -->
    <aside class="sidebar">
      <div class="sidebar-content">
        <!-- 顶部 Logo -->
        <div class="logo-section">
          <img src="/logo.png" alt="Logo" class="app-logo" />
        </div>
        
        <!-- 导航菜单 -->
        <nav class="nav-menu">
          <router-link 
            to="/" 
            class="nav-item"
            :class="{ active: $route.path === '/' }"
            title="提示词管理"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
            <span class="nav-text">Prompt</span>
          </router-link>
          
          <router-link 
            to="/marketplace" 
            class="nav-item"
            :class="{ active: $route.path === '/marketplace' }"
            title="提示词广场"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z"></path>
            </svg>
            <span class="nav-text">广场</span>
          </router-link>
        </nav>
      </div>
    </aside>

    <!-- 主内容区域 -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  height: calc(100vh - 40px);
  display: flex;
  background-color: var(--background-color);
  font-family: var(--font-family);
  margin: 20px;
  border-radius: 12px;
  overflow: hidden;
}

.sidebar {
  width: 60px;
  background: #ffffff;
  border-right: 1px solid var(--border-color);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
  z-index: 100;
  border-radius: 12px 0 0 12px;
}

.sidebar-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 12px 0;
}

.logo-section {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
  padding: 0 8px;
}

.app-logo {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 8px;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 6px;
  border-radius: 8px;
  text-decoration: none;
  color: var(--text-color-secondary);
  transition: all 0.2s ease;
  position: relative;
  min-height: 56px;
  justify-content: center;
}

.nav-item:hover {
  background-color: var(--hover-background);
  color: var(--text-color);
  transform: translateY(-1px);
}

.nav-item.active {
  background-color: var(--primary-color);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 178, 90, 0.3);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: var(--primary-color);
  border-radius: 0 2px 2px 0;
}

.nav-text {
  font-size: 10px;
  font-weight: 500;
  text-align: center;
  line-height: 1;
  white-space: nowrap;
}

.main-content {
  flex: 1;
  overflow: hidden;
  background: var(--background-color);
  border-radius: 0 12px 12px 0;
}

/* 悬浮提示效果 */
.nav-item:hover::after {
  content: attr(title);
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 12px;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  font-size: 12px;
  border-radius: 4px;
  white-space: nowrap;
  z-index: 1000;
  opacity: 0;
  animation: tooltip-show 0.2s ease-out 0.5s forwards;
}

@keyframes tooltip-show {
  from {
    opacity: 0;
    transform: translateY(-50%) translateX(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    width: 50px;
  }
  
  .sidebar-content {
    padding: 12px 0;
  }
  
  .logo-section {
    margin-bottom: 16px;
  }
  
  .app-logo {
    width: 28px;
    height: 28px;
  }
  
  .nav-item {
    padding: 10px 4px;
    min-height: 48px;
  }
  
  .nav-text {
    font-size: 9px;
  }
}

/* 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  .sidebar {
    background: #1a1a1a;
    border-right-color: #333;
  }
  
  .nav-item:hover::after {
    background: rgba(255, 255, 255, 0.9);
    color: #000;
  }
}
</style>
