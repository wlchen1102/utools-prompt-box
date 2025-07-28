<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue'
import type { Prompt } from '@/types/Prompt'
import type { Tag } from '@/types/Tag'
import PromptCard from './PromptCard.vue'
import EmptyState from './EmptyState.vue'

// Props 定义
interface Props {
  prompts: Prompt[]
  tags: Tag[]
  loading?: boolean
  searchKeyword?: string
}

const props = defineProps<Props>()

// Emits 定义
interface Emits {
  (e: 'view', prompt: Prompt): void
  (e: 'copy', prompt: Prompt): void
  (e: 'edit', prompt: Prompt): void
  (e: 'delete', prompt: Prompt): void
}

const emit = defineEmits<Emits>()

// 计算属性
const isEmpty = computed(() => !props.loading && props.prompts.length === 0)

const emptyStateConfig = computed(() => {
  if (props.searchKeyword) {
    return {
      icon: 'search',
      title: '未找到相关提示词',
      description: `没有找到包含 "${props.searchKeyword}" 的提示词`,
      actionText: '清空搜索',
      showAction: true
    }
  }
  
  return {
    icon: 'prompt',
    title: '还没有提示词',
    description: '点击右上角的 "+" 按钮创建第一个提示词',
    actionText: '创建提示词',
    showAction: false
  }
})

// 方法
const handleView = (prompt: Prompt) => {
  emit('view', prompt)
}

const handleCopy = (prompt: Prompt) => {
  emit('copy', prompt)
}

const handleEdit = (prompt: Prompt) => {
  emit('edit', prompt)
}

const handleDelete = (prompt: Prompt) => {
  emit('delete', prompt)
}

const handleEmptyAction = () => {
  if (props.searchKeyword) {
    // 清空搜索
    // 这里应该通过事件通知父组件清空搜索
    console.log('清空搜索')
  }
}

// 检查提示词是否应该高亮（搜索匹配）
const isHighlighted = (prompt: Prompt) => {
  if (!props.searchKeyword) return false
  
  const keyword = props.searchKeyword.toLowerCase()
  return (
    prompt.title.toLowerCase().includes(keyword) ||
    prompt.content.toLowerCase().includes(keyword)
  )
}
</script>

<template>
  <div class="card-grid-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-grid">
        <div v-for="i in 6" :key="i" class="loading-card">
          <div class="loading-header">
            <div class="loading-title"></div>
            <div class="loading-actions"></div>
          </div>
          <div class="loading-content"></div>
          <div class="loading-footer">
            <div class="loading-tags"></div>
            <div class="loading-time"></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 空状态 -->
    <EmptyState
      v-else-if="isEmpty"
      :icon="emptyStateConfig.icon"
      :title="emptyStateConfig.title"
      :description="emptyStateConfig.description"
      :action-text="emptyStateConfig.actionText"
      :show-action="emptyStateConfig.showAction"
      @action="handleEmptyAction"
    />
    
    <!-- 提示词卡片网格 -->
    <div v-else class="card-grid">
      <PromptCard
        v-for="prompt in prompts"
        :key="prompt.id"
        :prompt="prompt"
        :tags="tags"
        :highlighted="isHighlighted(prompt)"
        @view="handleView"
        @copy="handleCopy"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>
  </div>
</template>

<style scoped>
.card-grid-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 4px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  padding: 4px;
}

/* 加载状态样式 */
.loading-container {
  padding: 4px;
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.loading-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--border-color);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.06);
}

.loading-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.loading-title {
  height: 20px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
  width: 60%;
}

.loading-actions {
  height: 16px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
  width: 80px;
}

.loading-content {
  height: 60px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 16px;
}

.loading-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.loading-tags {
  height: 16px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
  width: 40%;
}

.loading-time {
  height: 12px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
  width: 60px;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .card-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
  
  .loading-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .card-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .loading-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .card-grid-container {
    padding: 0 2px;
  }
}

@media (max-width: 480px) {
  .card-grid {
    gap: 8px;
  }
  
  .loading-grid {
    gap: 8px;
  }
}

/* 滚动条样式 */
.card-grid-container::-webkit-scrollbar {
  width: 6px;
}

.card-grid-container::-webkit-scrollbar-track {
  background: transparent;
}

.card-grid-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.card-grid-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>