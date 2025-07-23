<template>
  <div class="marketplace-container">
    <div class="placeholder-content">
      <!-- 缺省图标 -->
      <div class="placeholder-icon">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="60" cy="60" r="50" fill="#f0f0f0" stroke="#d9d9d9" stroke-width="2"/>
          <path d="M40 60h40M60 40v40" stroke="#bfbfbf" stroke-width="3" stroke-linecap="round"/>
        </svg>
      </div>
      
      <!-- 标题和描述 -->
      <h2 class="placeholder-title">提示词广场</h2>
      <p class="placeholder-description">
        精选优质提示词，助您提升工作效率
      </p>
      
      <!-- 状态提示 -->
      <div class="status-badge">
        <span class="status-dot"></span>
        正在开发中
      </div>
      
      <!-- 功能预告 -->
      <div class="feature-preview">
        <h3>即将上线的功能：</h3>
        <ul class="feature-list">
          <li>
            <span class="feature-icon">🏪</span>
            浏览精选提示词库
          </li>
          <li>
            <span class="feature-icon">⬇️</span>
            一键导入优质提示词
          </li>
          <li>
            <span class="feature-icon">🔍</span>
            按分类搜索提示词
          </li>
          <li>
            <span class="feature-icon">⭐</span>
            收藏喜欢的提示词
          </li>
        </ul>
      </div>
      
      <!-- 临时操作 -->
      <div class="temp-actions">
        <button @click="goToManagement" class="btn-primary">
          返回提示词管理
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goToManagement = () => {
  router.push('/')
}
</script>

<style scoped>
.marketplace-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 24px;
}

.placeholder-content {
  max-width: 480px;
  text-align: center;
  background: white;
  border-radius: 16px;
  padding: 48px 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.placeholder-icon {
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
}

.placeholder-title {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 12px 0;
}

.placeholder-description {
  font-size: 16px;
  color: var(--text-color-secondary);
  margin: 0 0 24px 0;
  line-height: 1.6;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  color: #856404;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 32px;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #ffa502;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.feature-preview {
  text-align: left;
  margin-bottom: 32px;
}

.feature-preview h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 16px 0;
  text-align: center;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  color: var(--text-color-secondary);
}

.feature-list li:last-child {
  border-bottom: none;
}

.feature-icon {
  font-size: 20px;
  width: 32px;
  text-align: center;
}

.temp-actions {
  margin-top: 24px;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 178, 90, 0.3);
}

.btn-primary:hover {
  background: #00a555;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 178, 90, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .marketplace-container {
    padding: 16px;
  }
  
  .placeholder-content {
    padding: 32px 24px;
  }
  
  .placeholder-title {
    font-size: 24px;
  }
  
  .feature-icon {
    font-size: 18px;
    width: 28px;
  }
}
</style> 