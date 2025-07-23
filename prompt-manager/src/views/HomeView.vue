<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Prompt } from '@/types/Prompt'
import type { Tag } from '@/types/Tag'

// 响应式数据
const searchKeyword = ref('')
const selectedTag = ref<Tag | null>(null)
const prompts = ref<Prompt[]>([])
const tags = ref<Tag[]>([])

// 计算属性
const promptCount = computed(() => prompts.value.length)

const filteredPrompts = computed(() => {
  let filtered = prompts.value

  // 按标签筛选
  if (selectedTag.value) {
    filtered = filtered.filter(prompt => 
      prompt.tags.includes(selectedTag.value!.id)
    )
  }

  // 按搜索关键词筛选
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(prompt => 
      prompt.title.toLowerCase().includes(keyword) ||
      prompt.content.toLowerCase().includes(keyword)
    )
  }

  return filtered
})

// 方法
const selectTag = (tag: Tag | null) => {
  selectedTag.value = tag
}

const getTagPromptCount = (tagId: string) => {
  return prompts.value.filter(prompt => prompt.tags.includes(tagId)).length
}

const getTagName = (tagId: string) => {
  const tag = tags.value.find(t => t.id === tagId)
  return tag?.name || ''
}

const getTagColor = (tagId: string) => {
  const tag = tags.value.find(t => t.id === tagId)
  return tag?.color || '#00B25A'
}

const getContentPreview = (content: string) => {
  return content.length > 100 ? content.substring(0, 100) + '...' : content
}

// 操作方法（临时实现）
const addPrompt = () => {
  console.log('添加提示词')
}

const addTag = () => {
  console.log('添加标签')
}

const viewPrompt = (prompt: Prompt) => {
  console.log('查看提示词:', prompt)
}

const copyPrompt = (prompt: Prompt) => {
  console.log('复制提示词:', prompt)
  // 后续会集成 uTools API
}

const editPrompt = (prompt: Prompt) => {
  console.log('编辑提示词:', prompt)
}

const deletePrompt = (prompt: Prompt) => {
  console.log('删除提示词:', prompt)
}

// 生命周期
onMounted(() => {
  // 初始化数据（后续会从 uTools 数据库加载）
  console.log('提示词管理页面已加载')
})
</script>

<template>
  <div class="prompt-manager-container">
    <!-- 顶部操作栏 -->
    <div class="top-toolbar">
      <div class="toolbar-right">
        <!-- 搜索框 -->
        <div class="search-box">
          <input 
            type="text" 
            placeholder="搜索提示词..." 
            class="search-input"
            v-model="searchKeyword"
          />
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </div>
        
        <!-- 统计信息 -->
        <div class="stats-info">
          <span class="prompt-count">共 {{ promptCount }} 个提示词</span>
        </div>
        
        <!-- 添加按钮 -->
        <button class="btn-add" @click="addPrompt">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          添加提示词
        </button>
      </div>
    </div>

    <!-- 主内容区域：左侧标签面板 + 右侧卡片区域 -->
    <div class="main-content">
      <!-- 左侧标签面板 (20%) -->
      <aside class="tag-panel">
        <div class="panel-header">
          <h3>标签分类</h3>
          <button class="btn-add-tag" @click="addTag">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
        
        <div class="tag-list">
          <!-- 全部标签 -->
          <div 
            class="tag-item all-tag" 
            :class="{ active: selectedTag === null }"
            @click="selectTag(null)"
          >
            <span class="tag-name">全部</span>
            <span class="tag-count">{{ promptCount }}</span>
          </div>
          
          <!-- 标签列表 -->
          <div 
            v-for="tag in tags" 
            :key="tag.id"
            class="tag-item"
            :class="{ active: selectedTag?.id === tag.id }"
            @click="selectTag(tag)"
          >
            <span class="tag-color" :style="{ backgroundColor: tag.color }"></span>
            <span class="tag-name">{{ tag.name }}</span>
            <span class="tag-count">{{ getTagPromptCount(tag.id) }}</span>
          </div>
        </div>
      </aside>

      <!-- 右侧提示词卡片区域 (80%) -->
      <main class="card-area">
        <!-- 空状态 -->
        <div v-if="filteredPrompts.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
          </div>
          <h3>{{ searchKeyword ? '未找到相关提示词' : '还没有提示词' }}</h3>
          <p>{{ searchKeyword ? '尝试使用其他关键词搜索' : '点击"添加提示词"开始创建您的第一个提示词' }}</p>
          <button v-if="!searchKeyword" class="btn-primary" @click="addPrompt">
            添加提示词
          </button>
        </div>

        <!-- 提示词卡片网格 -->
        <div v-else class="card-grid">
          <div 
            v-for="prompt in filteredPrompts" 
            :key="prompt.id"
            class="prompt-card"
          >
            <div class="card-header">
              <h4 class="card-title">{{ prompt.title }}</h4>
              <div class="card-actions">
                <button class="card-btn" @click="viewPrompt(prompt)" title="查看">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
                <button class="card-btn" @click="copyPrompt(prompt)" title="复制">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
                <button class="card-btn" @click="editPrompt(prompt)" title="编辑">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                  </svg>
                </button>
                <button class="card-btn delete" @click="deletePrompt(prompt)" title="删除">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="3,6 5,6 21,6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <div class="card-content">
              <p class="card-preview">{{ getContentPreview(prompt.content) }}</p>
            </div>
            
            <div class="card-footer">
              <div class="card-tags">
                <span 
                  v-for="tagId in prompt.tags" 
                  :key="tagId"
                  class="card-tag"
                  :style="{ backgroundColor: getTagColor(tagId) }"
                >
                  {{ getTagName(tagId) }}
                </span>
              </div>
              <span class="card-source" v-if="prompt.source">来源: {{ prompt.source }}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.prompt-manager-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--background-color);
}

.top-toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 12px 20px;
  background: white;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  border-radius: 0 12px 0 0;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  justify-content: space-between;
}

.stats-info {
  flex: 1;
  text-align: center;
}

.prompt-count {
  color: var(--text-color-secondary);
  font-size: 14px;
  font-weight: 500;
}

.search-box {
  position: relative;
  width: 280px;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(0, 178, 90, 0.1);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-color-secondary);
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 178, 90, 0.3);
}

.btn-add:hover {
  background: #00a555;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 178, 90, 0.4);
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.tag-panel {
  width: 240px;
  min-width: 200px;
  background: white;
  border-right: 1px solid var(--border-color);
  padding: 16px;
  overflow-y: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.panel-header h3 {
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
}

.btn-add-tag:hover {
  background: var(--hover-background);
  color: var(--primary-color);
}

.tag-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tag-item:hover {
  background: var(--hover-background);
}

.tag-item.active {
  background: var(--primary-color);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 178, 90, 0.3);
}

.tag-item.all-tag {
  font-weight: 500;
  border: 2px solid var(--border-color);
}

.tag-item.all-tag.active {
  border-color: transparent;
}

.tag-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tag-name {
  flex: 1;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-count {
  font-size: 12px;
  color: var(--text-color-secondary);
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
  min-width: 20px;
  text-align: center;
}

.tag-item.active .tag-count {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.card-area {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: var(--text-color-secondary);
}

.empty-icon {
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 18px;
  margin: 0 0 8px 0;
  color: var(--text-color);
}

.empty-state p {
  margin: 0 0 24px 0;
  max-width: 300px;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
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

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.prompt-card {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

.prompt-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-actions {
  display: flex;
  gap: 4px;
  margin-left: 12px;
}

.card-btn {
  background: none;
  border: none;
  color: var(--text-color-secondary);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.card-btn:hover {
  background: var(--hover-background);
  color: var(--primary-color);
}

.card-btn.delete:hover {
  color: #ff4757;
}

.card-content {
  margin-bottom: 14px;
}

.card-preview {
  font-size: 14px;
  color: var(--text-color-secondary);
  line-height: 1.5;
  margin: 0;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.card-tag {
  font-size: 11px;
  color: white;
  padding: 3px 8px;
  border-radius: 12px;
  white-space: nowrap;
  font-weight: 500;
}

.card-source {
  font-size: 11px;
  color: var(--text-color-secondary);
  font-style: italic;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .top-toolbar {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .toolbar-right {
    flex-direction: column;
    gap: 12px;
  }
  
  .search-box {
    width: 100%;
  }
  
  .main-content {
    flex-direction: column;
  }
  
  .tag-panel {
    width: 100%;
    max-height: 200px;
  }
  
  .card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
