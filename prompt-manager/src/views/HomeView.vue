<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Prompt } from '@/types/Prompt'
import type { Tag, CreateTagDTO, UpdateTagDTO } from '@/types/Tag'
import { TAG_COLOR_CONFIGS } from '@/types/Tag'
import TagPanel from '@/components/TagPanel.vue'
import TagDialog from '@/components/TagDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

// 响应式数据
const searchKeyword = ref('')
const selectedTag = ref<Tag | null>(null)
const prompts = ref<Prompt[]>([])
const tags = ref<Tag[]>([])

// 对话框状态
const tagDialogVisible = ref(false)
const tagDialogMode = ref<'create' | 'edit'>('create')
const editingTag = ref<Tag | null>(null)
const confirmDialogVisible = ref(false)
const deletingTag = ref<Tag | null>(null)

// TagPanel组件引用
const tagPanelRef = ref()

// 计算属性
const promptCount = computed(() => prompts.value.length)

const tagPromptCounts = computed(() => {
  const counts: Record<string, number> = {}
  tags.value.forEach(tag => {
    counts[tag.id] = getTagPromptCount(tag.id)
  })
  return counts
})

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
const handleTagSelect = (tag: Tag | null) => {
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
  const colorConfig = TAG_COLOR_CONFIGS[tag?.color as keyof typeof TAG_COLOR_CONFIGS] || TAG_COLOR_CONFIGS.default
  return colorConfig.hex
}

const getContentPreview = (content: string) => {
  return content.length > 100 ? content.substring(0, 100) + '...' : content
}

// 操作方法（临时实现）
const addPrompt = () => {
  console.log('添加提示词')
}

const handleTagAdd = () => {
  tagDialogMode.value = 'create'
  editingTag.value = null
  tagDialogVisible.value = true
}

const handleTagEdit = (tag: Tag) => {
  tagDialogMode.value = 'edit'
  editingTag.value = tag
  tagDialogVisible.value = true
}

const handleTagDelete = (tag: Tag) => {
  deletingTag.value = tag
  confirmDialogVisible.value = true
}

const handleTagDialogConfirm = async (data: CreateTagDTO | UpdateTagDTO) => {
  try {
    if (tagDialogMode.value === 'create') {
      // 创建新标签
      const newTag: Tag = {
        id: Date.now().toString(),
        name: data.name as string,
        color: data.color || 'primary',
        ...(data.description && { description: data.description }),
        promptCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      tags.value.push(newTag)
      console.log('创建标签成功:', newTag)
    } else if (editingTag.value) {
      // 更新标签
      const index = tags.value.findIndex(t => t.id === editingTag.value!.id)
      if (index !== -1) {
        tags.value[index] = {
          ...tags.value[index],
          ...(data.name && { name: data.name }),
          ...(data.color && { color: data.color }),
          ...(data.description !== undefined && { description: data.description }),
          updatedAt: new Date().toISOString()
        }
        console.log('更新标签成功:', tags.value[index])
      }
    }
    tagDialogVisible.value = false
  } catch (error) {
    console.error('保存标签失败:', error)
  }
}

const handleTagDeleteConfirm = () => {
  if (deletingTag.value) {
    const tagId = deletingTag.value.id
    const affectedPrompts = prompts.value.filter(p => p.tags.includes(tagId))
    
    // 删除标签
    tags.value = tags.value.filter(t => t.id !== tagId)
    
    // 从提示词中移除标签关联
    affectedPrompts.forEach(prompt => {
      prompt.tags = prompt.tags.filter(t => t !== tagId)
    })
    
    // 如果当前选中的是被删除的标签，重置选择
    if (selectedTag.value?.id === tagId) {
      selectedTag.value = null
    }
    
    console.log(`删除标签成功，影响了 ${affectedPrompts.length} 个提示词`)
    confirmDialogVisible.value = false
    deletingTag.value = null
  }
}

// 处理容器点击事件，用于关闭标签菜单
const handleContainerClick = (event: Event) => {
  console.log('容器点击事件:', event.target)
  const target = event.target as HTMLElement
  const isTagMenu = target.closest('.tag-menu') || target.closest('.tag-dropdown')
  
  if (!isTagMenu) {
    console.log('点击容器外部，通知TagPanel关闭菜单')
    // 通过ref调用TagPanel的关闭方法
    if (tagPanelRef.value && tagPanelRef.value.closeAllMenus) {
      tagPanelRef.value.closeAllMenus()
    }
  }
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
  
  // 临时添加一些测试数据
  tags.value = [
    {
      id: '1',
      name: 'AI写作',
      color: 'primary',
      promptCount: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2', 
      name: '编程助手',
      color: 'info',
      promptCount: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '3',
      name: '翻译工具',
      color: 'success',
      promptCount: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
  
  prompts.value = [
    {
      id: '1',
      title: '技术文档写作助手',
      content: '你是一个专业的技术文档写作助手，请帮我编写清晰、准确的技术文档...',
      tags: ['1', '2'],
      source: '个人创建',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Vue 3 代码生成器',
      content: '根据用户需求生成符合 Vue 3 最佳实践的代码...',
      tags: ['2'],
      source: '社区分享',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
})
</script>

<template>
  <div class="prompt-manager-container" @click="handleContainerClick">
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
      <TagPanel
        ref="tagPanelRef"
        :tags="tags"
        :selected-tag="selectedTag"
        :prompt-count="promptCount"
        :tag-prompt-counts="tagPromptCounts"
        @tag-select="handleTagSelect"
        @tag-add="handleTagAdd"
        @tag-edit="handleTagEdit"
        @tag-delete="handleTagDelete"
      />

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

    <!-- 标签对话框 -->
    <TagDialog
      v-model:visible="tagDialogVisible"
      :mode="tagDialogMode"
      :tag="editingTag"
      @confirm="handleTagDialogConfirm"
    />

    <!-- 删除确认对话框 -->
    <ConfirmDialog
      v-model:visible="confirmDialogVisible"
      title="删除标签"
      :message="`确定要删除标签「${deletingTag?.name}」吗？`"
      :detail="`删除后，关联此标签的 ${deletingTag ? getTagPromptCount(deletingTag.id) : 0} 个提示词将移除此标签关联，但提示词本身不会被删除。`"
      confirm-text="删除"
      cancel-text="取消"
      type="danger"
      @confirm="handleTagDeleteConfirm"
    />
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

/* 标签面板样式已移至 TagPanel.vue 组件 */

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
