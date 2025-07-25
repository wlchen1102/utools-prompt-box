<script setup lang="ts">
import { defineProps, defineEmits, computed, ref, onMounted, onUnmounted } from 'vue'
import type { Tag } from '@/types/Tag'
import { TAG_COLOR_CONFIGS } from '@/types/Tag'

// Props
interface Props {
  tags: Tag[]
  selectedTag: Tag | null
  promptCount: number
  tagPromptCounts?: Record<string, number>
}

const props = defineProps<Props>()

// Emits
interface Emits {
  (e: 'tag-select', tag: Tag | null): void
  (e: 'tag-add'): void
  (e: 'tag-edit', tag: Tag): void
  (e: 'tag-delete', tag: Tag): void
}

const emit = defineEmits<Emits>()

// 响应式数据
const activeMenuId = ref<string | null>(null)

// 计算属性
const totalPromptCount = computed(() => props.promptCount)

// 获取标签关联的提示词数量
const getTagPromptCount = (tagId: string) => {
  const tag = props.tags.find(t => t.id === tagId)
  return props.tagPromptCounts?.[tagId] || tag?.promptCount || 0
}

// 获取标签颜色配置
const getTagColorConfig = (colorKey: string) => {
  return TAG_COLOR_CONFIGS[colorKey as keyof typeof TAG_COLOR_CONFIGS] || TAG_COLOR_CONFIGS.default
}

// 方法
const handleTagSelect = (tag: Tag | null, event?: Event) => {
  // 检查是否点击的是菜单相关区域
  if (event) {
    const target = event.target as HTMLElement
    const isMenuClick = target.closest('.tag-menu') || 
                       target.closest('.tag-dropdown') || 
                       target.closest('.tag-menu-btn')
    
    if (isMenuClick) {
      // 点击菜单区域，不处理标签选择
      return
    }
  }
  
  // 选择标签时关闭所有菜单
  closeAllMenus()
  emit('tag-select', tag)
}

const handleAddTag = () => {
  emit('tag-add')
}



const handleEditTag = (tag: Tag) => {
  activeMenuId.value = null
  emit('tag-edit', tag)
}

const handleDeleteTag = (tag: Tag) => {
  activeMenuId.value = null
  emit('tag-delete', tag)
}

// 新增菜单控制方法
const toggleTagMenu = (tagId: string, event: Event) => {
  event.stopPropagation()
  console.log('切换菜单:', tagId) // 调试日志
  activeMenuId.value = activeMenuId.value === tagId ? null : tagId
}

const closeAllMenus = () => {
  activeMenuId.value = null
}



// 暴露方法给父组件
defineExpose({
  closeAllMenus
})

// 键盘事件处理
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && activeMenuId.value) {
    console.log('ESC键按下，关闭菜单')
    closeAllMenus()
  }
}

// 生命周期
onMounted(() => {
  console.log('TagPanel mounted') // 调试日志
  
  // 只添加键盘事件监听（ESC键关闭菜单）
  try {
    document.addEventListener('keydown', handleKeyDown)
    console.log('ESC 键事件监听器已添加')
  } catch (error) {
    console.error('添加键盘事件监听器失败:', error)
  }
})

onUnmounted(() => {
  console.log('TagPanel unmounted') // 调试日志
  
  try {
    document.removeEventListener('keydown', handleKeyDown)
    console.log('键盘事件监听器已移除')
  } catch (error) {
    console.error('移除键盘事件监听器失败:', error)
  }
})
</script>

<template>


  <aside class="tag-panel">
    <div class="panel-header">
      <h3 class="panel-title">标签分类</h3>
      <div style="display: flex; gap: 4px;">

        <button 
          class="btn-add-tag" 
          @click="handleAddTag"
          title="添加标签"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>
    </div>
    
    <div class="tag-list">
      <!-- 全部标签按钮 -->
      <div 
        class="tag-item all-tag" 
        :class="{ active: selectedTag === null }"
        @click="handleTagSelect(null)"
      >
        <div class="tag-icon all-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9,22 9,12 15,12 15,22"></polyline>
          </svg>
        </div>
        <span class="tag-name">全部</span>
        <span class="tag-count">{{ totalPromptCount }}</span>
      </div>
      
      <!-- 标签列表 -->
      <div 
        v-for="tag in tags" 
        :key="tag.id"
        class="tag-item"
        :class="{ active: selectedTag?.id === tag.id }"
        @click="handleTagSelect(tag, $event)"
      >
        <span 
          class="tag-color" 
          :style="{ backgroundColor: getTagColorConfig(tag.color).hex }"
          :title="getTagColorConfig(tag.color).label"
        ></span>
        <span 
          class="tag-name" 
          :title="tag.name.length > 8 ? tag.name : undefined"
        >
          {{ tag.name.length > 8 ? tag.name.substring(0, 8) + '...' : tag.name }}
        </span>
        <!-- 标签计数和操作按钮区域 -->
        <div class="tag-right-section">
          <!-- 默认显示的计数 -->
          <span class="tag-count">{{ getTagPromptCount(tag.id) }}</span>
          
          <!-- 悬浮时显示的操作菜单 -->
          <div 
            class="tag-menu" 
            :class="{ 'menu-open': activeMenuId === tag.id }"
            v-if="tag.id && !tag.id.startsWith('all')"
          >
            <button 
              class="tag-menu-btn" 
              @click="toggleTagMenu(tag.id, $event)"
              title="更多操作"
            >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="5" cy="12" r="1"></circle>
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
            </svg>
          </button>
          
          <!-- 下拉菜单 -->
          <div 
            v-if="activeMenuId === tag.id" 
            class="tag-dropdown"
            v-click-outside="closeAllMenus"
          >
            <div class="dropdown-item" @click.stop="handleEditTag(tag)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
              </svg>
              <span>修改</span>
            </div>
            <div class="dropdown-item delete" @click.stop="handleDeleteTag(tag)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              <span>删除</span>
            </div>
          </div>
        </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-if="tags.length === 0" class="empty-tags">
        <div class="empty-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
            <line x1="7" y1="7" x2="7.01" y2="7"></line>
          </svg>
        </div>
        <p class="empty-text">还没有标签</p>
        <p class="empty-hint">点击上方 "+" 按钮创建第一个标签</p>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.tag-panel {
  width: 240px;
  min-width: 200px;
  max-width: 280px;
  background: white;
  border-right: 1px solid var(--border-color);
  padding: 16px;
  overflow-y: auto;
  flex-shrink: 0;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.btn-add-tag {
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

.btn-add-tag:hover {
  background: var(--hover-background);
  color: var(--primary-color);
  transform: scale(1.1);
}

.tag-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  min-height: 40px;
}

.tag-item:hover {
  background: var(--hover-background);
}

.tag-item:hover .tag-actions {
  opacity: 1;
}

.tag-item.active {
  background: var(--primary-color);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 178, 90, 0.3);
}

.tag-item.all-tag {
  font-weight: 500;
  border: 2px solid var(--border-color);
  margin-bottom: 8px;
}

.tag-item.all-tag.active {
  border-color: transparent;
}

.tag-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.all-icon {
  color: var(--text-color-secondary);
}

.tag-item.active .all-icon {
  color: white;
}

.tag-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.tag-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  word-break: break-all;
}

.tag-right-section {
  position: relative;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.tag-count {
  font-size: 12px;
  color: var(--text-color-secondary);
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
  min-width: 20px;
  text-align: center;
  font-weight: 500;
  flex-shrink: 0;
  transition: opacity 0.2s ease;
}

.tag-item.active .tag-count {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

/* 悬浮时隐藏计数，显示操作按钮 */
.tag-item:hover .tag-count {
  opacity: 0;
}

.tag-item:hover .tag-menu {
  opacity: 1;
}

.tag-menu {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 0.2s ease;
}

/* 当菜单打开时，保持菜单可见，不受hover影响 */
.tag-menu.menu-open {
  opacity: 1 !important;
}

.tag-menu-btn {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tag-menu-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.tag-item.active .tag-menu-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.tag-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 80px;
  z-index: 1000;
  margin-top: 4px;
  animation: fadeInDown 0.2s ease-out;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--text-color);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.dropdown-item:hover {
  background: var(--hover-background);
}

.dropdown-item.delete {
  color: #ff4757;
}

.dropdown-item.delete:hover {
  background: rgba(255, 71, 87, 0.1);
}

.dropdown-item svg {
  flex-shrink: 0;
}

.empty-tags {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 32px 16px;
  color: var(--text-color-secondary);
}

.empty-icon {
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 4px 0;
  color: var(--text-color);
}

.empty-hint {
  font-size: 12px;
  margin: 0;
  line-height: 1.4;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tag-panel {
    width: 100%;
    max-height: 200px;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
  }
  
  .tag-list {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .tag-item {
    flex: 0 0 auto;
    min-width: 100px;
  }
  
  .tag-item.all-tag {
    margin-bottom: 0;
  }
  
  .tag-name {
    max-width: none;
  }
}

/* 标签名称显示优化 */
.tag-name {
  max-width: calc(100% - 60px); /* 为计数和菜单按钮留出空间 */
}


</style> 