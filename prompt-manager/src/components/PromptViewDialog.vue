<script setup lang="ts">
import { defineProps, defineEmits, computed, ref, watch } from 'vue'
import type { Prompt } from '@/types/Prompt'
import type { Tag } from '@/types/Tag'
import { TAG_COLOR_CONFIGS } from '@/types/Tag'

// Props
interface Props {
  visible: boolean
  prompt?: Prompt | null
  tags: Tag[]
}

const props = defineProps<Props>()

// Emits
interface Emits {
  (e: 'update:visible', visible: boolean): void
  (e: 'copy', prompt: Prompt): void
  (e: 'edit', prompt: Prompt): void
  (e: 'close'): void
}

const emit = defineEmits<Emits>()

// 响应式数据
const isLoading = ref(false)

// 计算属性
const dialogTitle = computed(() => props.prompt?.title || '提示词详情')

const formattedContent = computed(() => {
  if (!props.prompt?.content) return ''
  
  // 简单的 Markdown 渲染（基础支持）
  let content = props.prompt.content
  
  // 处理标题
  content = content.replace(/^### (.*$)/gim, '<h3>$1</h3>')
  content = content.replace(/^## (.*$)/gim, '<h2>$1</h2>')
  content = content.replace(/^# (.*$)/gim, '<h1>$1</h1>')
  
  // 处理粗体和斜体
  content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  content = content.replace(/\*(.*?)\*/g, '<em>$1</em>')
  
  // 处理代码块
  content = content.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
  content = content.replace(/`(.*?)`/g, '<code>$1</code>')
  
  // 处理链接
  content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
  
  // 处理换行
  content = content.replace(/\n/g, '<br>')
  
  return content
})

const promptTags = computed(() => {
  if (!props.prompt?.tags) return []
  
  return props.prompt.tags.map(tagId => {
    const tag = props.tags.find(t => t.id === tagId)
    if (!tag) return { id: tagId, name: '未知标签', color: '#666666' }
    
    const colorConfig = TAG_COLOR_CONFIGS[tag.color] || TAG_COLOR_CONFIGS.default
    return {
      id: tag.id,
      name: tag.name,
      color: colorConfig.hex
    }
  })
})

// 方法
const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}

const handleCopy = async () => {
  if (!props.prompt) return
  
  try {
    isLoading.value = true
    
    // 复制 Markdown 格式内容到剪贴板
    const markdownContent = `# ${props.prompt.title}\n\n${props.prompt.content}`
    
    if (window.utools) {
      // uTools 环境下使用原生 API
      window.utools.copyText(markdownContent)
      window.utools.showNotification('提示词已复制到剪贴板')
    } else {
      // 开发环境下使用浏览器 API
      await navigator.clipboard.writeText(markdownContent)
      console.log('提示词已复制到剪贴板')
    }
    
    emit('copy', props.prompt)
  } catch (error) {
    console.error('复制失败:', error)
    if (window.utools) {
      window.utools.showNotification('复制失败，请重试')
    }
  } finally {
    isLoading.value = false
  }
}

const handleEdit = () => {
  if (!props.prompt) return
  emit('edit', props.prompt)
  handleClose()
}

const formatTime = (timeStr: string) => {
  try {
    const date = new Date(timeStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return '未知时间'
  }
}

// 监听键盘事件
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    handleClose()
  }
}

// 生命周期
watch(() => props.visible, (visible) => {
  if (visible) {
    document.addEventListener('keydown', handleKeyDown)
  } else {
    document.removeEventListener('keydown', handleKeyDown)
  }
})
</script>

<template>
  <div v-if="visible" class="dialog-overlay" @click.self="handleClose">
    <div class="dialog-container">
      <!-- 对话框头部 -->
      <div class="dialog-header">
        <div class="header-content">
          <h3 class="dialog-title">{{ dialogTitle }}</h3>
          <div class="header-actions">
            <button 
              class="action-btn copy-btn" 
              @click="handleCopy"
              :disabled="isLoading"
              title="复制内容 (Markdown格式)"
            >
              <svg v-if="!isLoading" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <svg v-else class="loading-spinner" width="16" height="16" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.3"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"/>
              </svg>
              复制
            </button>
            <button 
              class="action-btn edit-btn" 
              @click="handleEdit"
              title="编辑提示词"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
              </svg>
              编辑
            </button>
          </div>
        </div>
        <button class="dialog-close" @click="handleClose">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <!-- 对话框内容 -->
      <div class="dialog-body">
        <div v-if="prompt" class="prompt-details">
          <!-- 标签列表 -->
          <div v-if="promptTags.length > 0" class="prompt-tags">
            <span 
              v-for="tag in promptTags" 
              :key="tag.id"
              class="prompt-tag"
              :style="{ backgroundColor: tag.color }"
            >
              {{ tag.name }}
            </span>
          </div>
          
          <!-- 提示词内容 -->
          <div class="prompt-content">
            <div 
              class="content-rendered" 
              v-html="formattedContent"
            ></div>
          </div>
          
          <!-- 来源链接 -->
          <div v-if="prompt.source" class="prompt-source">
            <div class="source-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              来源链接：
            </div>
            <a :href="prompt.source" target="_blank" class="source-link">
              {{ prompt.source }}
            </a>
          </div>
          
          <!-- 元信息 -->
          <div class="prompt-meta">
            <div class="meta-item">
              <span class="meta-label">创建时间：</span>
              <span class="meta-value">{{ formatTime(prompt.createdAt) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">更新时间：</span>
              <span class="meta-value">{{ formatTime(prompt.updatedAt) }}</span>
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-else class="empty-prompt">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14,2 14,8 20,8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10,9 9,9 8,9"></polyline>
          </svg>
          <p>未找到提示词内容</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.dialog-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border-color);
  background: #fafafa;
}

.header-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-right: 16px;
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 16px;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.copy-btn {
  background: var(--primary-color);
  color: white;
}

.copy-btn:hover:not(:disabled) {
  background: #00a555;
  transform: translateY(-1px);
}

.copy-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.edit-btn {
  background: #1890ff;
  color: white;
}

.edit-btn:hover {
  background: #1677ff;
  transform: translateY(-1px);
}

.dialog-close {
  background: none;
  border: none;
  color: var(--text-color-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.dialog-close:hover {
  background: var(--hover-background);
  color: var(--text-color);
}

.dialog-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.prompt-details {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.prompt-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.prompt-tag {
  font-size: 12px;
  color: white;
  padding: 4px 12px;
  border-radius: 16px;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.prompt-content {
  flex: 1;
}

.content-rendered {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-color);
  word-wrap: break-word;
}

.content-rendered h1,
.content-rendered h2,
.content-rendered h3 {
  margin: 16px 0 8px 0;
  color: var(--text-color);
}

.content-rendered h1 {
  font-size: 20px;
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 8px;
}

.content-rendered h2 {
  font-size: 18px;
}

.content-rendered h3 {
  font-size: 16px;
}

.content-rendered strong {
  font-weight: 600;
  color: var(--text-color);
}

.content-rendered em {
  font-style: italic;
}

.content-rendered code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
}

.content-rendered pre {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 12px 0;
}

.content-rendered pre code {
  background: none;
  padding: 0;
}

.content-rendered a {
  color: var(--primary-color);
  text-decoration: none;
}

.content-rendered a:hover {
  text-decoration: underline;
}

.prompt-source {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
  border-left: 3px solid var(--primary-color);
}

.source-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--text-color-secondary);
  font-weight: 500;
}

.source-link {
  color: var(--primary-color);
  text-decoration: none;
  font-size: 13px;
  word-break: break-all;
}

.source-link:hover {
  text-decoration: underline;
}

.prompt-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 6px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-label {
  font-size: 13px;
  color: var(--text-color-secondary);
  font-weight: 500;
  min-width: 80px;
}

.meta-value {
  font-size: 13px;
  color: var(--text-color);
}

.empty-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--text-color-secondary);
  text-align: center;
}

.empty-prompt svg {
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-prompt p {
  margin: 0;
  font-size: 14px;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dialog-container {
    width: 95%;
    margin: 20px;
    max-height: 85vh;
  }
  
  .dialog-header {
    padding: 16px 20px 12px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .dialog-title {
    margin-right: 0;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .dialog-body {
    padding: 20px;
  }
  
  .prompt-meta {
    padding: 12px;
  }
  
  .meta-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .meta-label {
    min-width: auto;
  }
}
</style>