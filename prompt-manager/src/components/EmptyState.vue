<template>
  <div class="empty-state" :class="sizeClass">
    <!-- 图标区域 -->
    <div class="empty-icon" :class="iconColorClass">
      <!-- 默认空状态图标 -->
      <svg v-if="type === 'default'" :width="iconSize" :height="iconSize" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14,2 14,8 20,8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10,9 9,9 8,9"></polyline>
      </svg>
      
      <!-- 搜索无结果图标 -->
      <svg v-else-if="type === 'search'" :width="iconSize" :height="iconSize" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
        <line x1="9" y1="9" x2="15" y2="15"></line>
        <line x1="15" y1="9" x2="9" y2="15"></line>
      </svg>
      
      <!-- 网络错误图标 -->
      <svg v-else-if="type === 'error'" :width="iconSize" :height="iconSize" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      
      <!-- 文件夹空状态图标 -->
      <svg v-else-if="type === 'folder'" :width="iconSize" :height="iconSize" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z"></path>
      </svg>
      
      <!-- 收藏空状态图标 -->
      <svg v-else-if="type === 'favorite'" :width="iconSize" :height="iconSize" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
      </svg>
      
      <!-- 自定义图标插槽 -->
      <slot v-else name="icon">
        <svg :width="iconSize" :height="iconSize" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </slot>
    </div>
    
    <!-- 标题 -->
    <h3 v-if="title" class="empty-title">{{ title }}</h3>
    
    <!-- 描述 -->
    <p v-if="description" class="empty-description">{{ description }}</p>
    
    <!-- 操作按钮区域 -->
    <div v-if="hasActions" class="empty-actions">
      <slot name="actions">
        <button v-if="primaryAction" class="btn-primary" @click="handlePrimaryAction">
          <svg v-if="primaryAction.icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          {{ primaryAction.text }}
        </button>
        
        <button v-if="secondaryAction" class="btn-secondary" @click="handleSecondaryAction">
          {{ secondaryAction.text }}
        </button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'

export interface EmptyStateAction {
  text: string
  icon?: boolean
  handler: () => void
}

export interface EmptyStateProps {
  type?: 'default' | 'search' | 'error' | 'folder' | 'favorite' | 'custom'
  size?: 'small' | 'medium' | 'large'
  title?: string
  description?: string
  primaryAction?: EmptyStateAction
  secondaryAction?: EmptyStateAction
}

const props = withDefaults(defineProps<EmptyStateProps>(), {
  type: 'default',
  size: 'medium',
  title: '',
  description: ''
})

const emit = defineEmits<{
  primaryAction: []
  secondaryAction: []
}>()

const slots = useSlots()

const sizeClass = computed(() => `size-${props.size}`)

const iconSize = computed(() => {
  const sizeMap = {
    small: 48,
    medium: 64,
    large: 80
  }
  return sizeMap[props.size]
})

const iconColorClass = computed(() => {
  const colorMap = {
    default: 'icon-default',
    search: 'icon-warning',
    error: 'icon-danger',
    folder: 'icon-default',
    favorite: 'icon-default',
    custom: 'icon-default'
  }
  return colorMap[props.type]
})

const hasActions = computed(() => {
  return props.primaryAction || props.secondaryAction || slots.actions
})

const handlePrimaryAction = () => {
  if (props.primaryAction) {
    props.primaryAction.handler()
  }
  emit('primaryAction')
}

const handleSecondaryAction = () => {
  if (props.secondaryAction) {
    props.secondaryAction.handler()
  }
  emit('secondaryAction')
}
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px 24px;
  min-height: 200px;
}

.empty-state.size-small {
  padding: 24px 16px;
  min-height: 150px;
}

.empty-state.size-large {
  padding: 48px 32px;
  min-height: 300px;
}

.empty-icon {
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-icon.icon-default {
  color: var(--text-color-secondary);
}

.empty-icon.icon-warning {
  color: #ff9800;
}

.empty-icon.icon-danger {
  color: #f44336;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 8px 0;
}

.size-small .empty-title {
  font-size: 16px;
}

.size-large .empty-title {
  font-size: 20px;
}

.empty-description {
  font-size: 14px;
  color: var(--text-color-secondary);
  line-height: 1.6;
  margin: 0 0 24px 0;
  max-width: 400px;
}

.size-small .empty-description {
  font-size: 13px;
  margin-bottom: 16px;
  max-width: 300px;
}

.size-large .empty-description {
  font-size: 16px;
  margin-bottom: 32px;
  max-width: 500px;
}

.empty-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  text-decoration: none;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 178, 90, 0.3);
}

.btn-primary:hover {
  background: #00a555;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 178, 90, 0.4);
}

.btn-secondary {
  background: transparent;
  color: var(--text-color-secondary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--hover-background);
  color: var(--text-color);
  border-color: var(--primary-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .empty-state {
    padding: 24px 16px;
  }
  
  .empty-actions {
    flex-direction: column;
    width: 100%;
    max-width: 200px;
  }
  
  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }
}

/* 动画效果 */
.empty-state {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 