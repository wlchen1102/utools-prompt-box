<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import type { Prompt } from '@/types/Prompt'
import type { Tag } from '@/types/Tag'
import { TAG_COLOR_CONFIGS } from '@/types/Tag'

// Props 定义
interface Props {
  prompt: Prompt
  tags: Tag[]
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

// 方法
const handleView = () => {
  emit('view', props.prompt)
}

const handleCopy = () => {
  emit('copy', props.prompt)
}

const handleEdit = () => {
  emit('edit', props.prompt)
}

const handleDelete = () => {
  emit('delete', props.prompt)
}

// 获取内容预览（限制字数）
const getContentPreview = (content: string) => {
  if (!content) return '暂无内容'
  return content.length > 100 ? content.substring(0, 100) + '...' : content
}

// 获取标签信息
const getTagInfo = (tagId: string) => {
  const tag = props.tags.find((t: Tag) => t.id === tagId)
  if (!tag) return { name: '未知标签', color: '#666666' }
  
  const colorConfig = TAG_COLOR_CONFIGS[tag.color] || TAG_COLOR_CONFIGS.default
  return {
    name: tag.name,
    color: colorConfig.hex
  }
}

// 格式化时间显示
const formatTime = (timeStr: string) => {
  try {
    const date = new Date(timeStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days}天前`
    if (days < 30) return `${Math.floor(days / 7)}周前`
    if (days < 365) return `${Math.floor(days / 30)}个月前`
    return `${Math.floor(days / 365)}年前`
  } catch {
    return '未知时间'
  }
}
</script>

<template>
  <div class="prompt-card">
    <!-- 卡片头部 -->
    <div class="card-header">
      <h4 class="card-title" :title="prompt.title">
        {{ prompt.title || '未命名提示词' }}
      </h4>
      <div class="card-actions">
        <button class="card-btn" @click="handleView" title="查看详情">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
        <button class="card-btn copy" @click="handleCopy" title="复制内容">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
        <button class="card-btn edit" @click="handleEdit" title="编辑">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
          </svg>
        </button>
        <button class="card-btn delete" @click="handleDelete" title="删除">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="3,6 5,6 21,6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- 卡片内容 -->
    <div class="card-content">
      <p class="content-preview">
        {{ getContentPreview(prompt.content) }}
      </p>
    </div>
    
    <!-- 卡片底部 -->
    <div class="card-footer">
      <!-- 标签列表 -->
      <div class="card-tags">
        <span 
          v-for="tagId in prompt.tags.slice(0, 3)" 
          :key="tagId"
          class="card-tag"
          :style="{ backgroundColor: getTagInfo(tagId).color }"
          :title="getTagInfo(tagId).name"
        >
          {{ getTagInfo(tagId).name }}
        </span>
        <span v-if="prompt.tags.length > 3" class="more-tags" title="更多标签">
          +{{ prompt.tags.length - 3 }}
        </span>
      </div>
      
      <!-- 时间信息 -->
      <div class="card-meta">
        <span class="update-time" :title="prompt.updatedAt">
          {{ formatTime(prompt.updatedAt) }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.prompt-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border-color);
  
  /* 明显的阴影效果 */
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.06);
}

.prompt-card:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 8px 25px rgba(0, 0, 0, 0.15),
    0 4px 8px rgba(0, 0, 0, 0.1);
  border-color: var(--primary-color);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
  line-height: 1.4;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
  flex-shrink: 0;
}

.prompt-card:hover .card-actions {
  opacity: 1;
}

.card-btn {
  background: none;
  border: none;
  color: var(--text-color-secondary);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-btn:hover {
  background: var(--hover-background);
  transform: scale(1.1);
}

.card-btn.copy:hover {
  color: var(--primary-color);
  background: rgba(0, 178, 90, 0.1);
}

.card-btn.edit:hover {
  color: #1890ff;
  background: rgba(24, 144, 255, 0.1);
}

.card-btn.delete:hover {
  color: #ff4757;
  background: rgba(255, 71, 87, 0.1);
}

.card-content {
  margin-bottom: 16px;
}

.content-preview {
  font-size: 14px;
  color: var(--text-color-secondary);
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 60px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.card-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  flex: 1;
}

.card-tag {
  font-size: 11px;
  color: white;
  padding: 3px 8px;
  border-radius: 12px;
  white-space: nowrap;
  font-weight: 500;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.more-tags {
  font-size: 11px;
  color: var(--text-color-secondary);
  background: var(--hover-background);
  padding: 3px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.update-time {
  font-size: 12px;
  color: var(--text-color-secondary);
  white-space: nowrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .prompt-card {
    padding: 16px;
  }
  
  .card-title {
    font-size: 15px;
  }
  
  .content-preview {
    font-size: 13px;
    -webkit-line-clamp: 2;
    min-height: 40px;
  }
  
  .card-actions {
    opacity: 1; /* 移动端始终显示操作按钮 */
  }
  
  .card-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .card-tags {
    width: 100%;
  }
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.prompt-card {
  animation: fadeIn 0.3s ease-out;
}
</style> 