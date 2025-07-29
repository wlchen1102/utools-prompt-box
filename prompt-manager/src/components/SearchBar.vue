<template>
  <div class="search-bar">
    <n-input-group>
      <n-input
        ref="searchInputRef"
        v-model:value="searchKeyword"
        placeholder="搜索提示词标题或内容..."
        clearable
        :loading="searching"
        @input="handleSearchInput"
        @keyup.enter="handleSearch"
        @focus="showHistory = true"
        @blur="handleBlur"
        class="search-input"
      >
        <template #prefix>
          <n-icon>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </n-icon>
        </template>
        <template #suffix>
          <n-button
            v-if="searchKeyword.trim()"
            quaternary
            size="small"
            @click="clearSearch"
            class="clear-btn"
          >
            <n-icon>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </n-icon>
          </n-button>
        </template>
      </n-input>
      
      <!-- 高级搜索按钮 -->
      <n-button
        @click="showAdvancedSearch = !showAdvancedSearch"
        :type="showAdvancedSearch ? 'primary' : 'default'"
        ghost
        class="advanced-btn"
      >
        <template #icon>
          <n-icon>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
          </n-icon>
        </template>
        筛选
      </n-button>
    </n-input-group>
    
    <!-- 搜索历史下拉 -->
    <div 
      v-if="showHistory && searchHistory.length > 0" 
      class="search-history"
      @mousedown.prevent
    >
      <div class="history-header">
        <span class="history-title">搜索历史</span>
        <n-button 
          quaternary 
          size="tiny" 
          @click="clearHistory"
          class="clear-history-btn"
        >
          清空
        </n-button>
      </div>
      <div class="history-list">
        <div
          v-for="(item, index) in searchHistory"
          :key="index"
          class="history-item"
          @click="selectHistoryItem(item)"
        >
          <n-icon class="history-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"></path>
            </svg>
          </n-icon>
          <span class="history-text">{{ item }}</span>
          <n-button
            quaternary
            size="tiny"
            @click.stop="removeHistoryItem(index)"
            class="remove-btn"
          >
            <n-icon>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </n-icon>
          </n-button>
        </div>
      </div>
    </div>
    
    <!-- 高级搜索面板 -->
    <div v-if="showAdvancedSearch" class="advanced-search">
      <div class="advanced-header">
        <span class="advanced-title">高级搜索</span>
        <n-button 
          quaternary 
          size="small" 
          @click="resetAdvanced"
          class="reset-btn"
        >
          重置
        </n-button>
      </div>
      
      <div class="advanced-content">
        <!-- 按来源筛选 -->
        <div class="filter-group">
          <label class="filter-label">来源筛选</label>
          <n-input
            v-model:value="advancedFilters.source"
            placeholder="按来源筛选"
            clearable
            size="small"
          />
        </div>
        
        <!-- 创建时间范围 -->
        <div class="filter-group">
          <label class="filter-label">创建时间</label>
          <n-date-picker
            v-model:value="advancedFilters.dateRange"
            type="daterange"
            size="small"
            clearable
            placeholder="选择时间范围"
            class="date-picker"
          />
        </div>
        
        <!-- 排序方式 -->
        <div class="filter-group">
          <label class="filter-label">排序方式</label>
          <n-select
            v-model:value="advancedFilters.sortBy"
            :options="sortOptions"
            size="small"
            clearable
            placeholder="选择排序方式"
            class="sort-select"
          />
        </div>
        
        <!-- 应用按钮 -->
        <div class="filter-actions">
          <n-button 
            type="primary" 
            size="small" 
            @click="applyAdvancedSearch"
            :loading="searching"
          >
            应用筛选
          </n-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { 
  NInput, NInputGroup, NButton, NIcon, NSelect, NDatePicker
} from 'naive-ui'
import type { PromptSearchParams } from '@/types/Prompt'

// Props
interface Props {
  loading?: boolean
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  placeholder: '搜索提示词标题或内容...'
})

// Emits
interface Emits {
  (e: 'search', params: PromptSearchParams): void
  (e: 'clear'): void
}

const emit = defineEmits<Emits>()

// 响应式数据
const searchInputRef = ref()
const searchKeyword = ref('')
const searching = ref(false)
const showHistory = ref(false)
const showAdvancedSearch = ref(false)
const searchHistory = ref<string[]>([])

// 高级搜索参数
const advancedFilters = ref({
  source: '',
  dateRange: null as [number, number] | null,
  sortBy: null as string | null
})

// 防抖定时器
let debounceTimer: number | null = null

// 排序选项
const sortOptions = [
  { label: '按创建时间降序', value: 'createdAt_desc' },
  { label: '按创建时间升序', value: 'createdAt_asc' },
  { label: '按更新时间降序', value: 'updatedAt_desc' },
  { label: '按更新时间升序', value: 'updatedAt_asc' },
  { label: '按标题升序', value: 'title_asc' },
  { label: '按标题降序', value: 'title_desc' }
]

// 计算属性
const hasFilters = computed(() => {
  return searchKeyword.value.trim() || 
         advancedFilters.value.source ||
         advancedFilters.value.dateRange ||
         advancedFilters.value.sortBy
})

// 监听 loading 变化
watch(() => props.loading, (newVal) => {
  searching.value = newVal
})

// 初始化时加载搜索历史
const loadSearchHistory = () => {
  try {
    const saved = localStorage.getItem('prompt_search_history')
    if (saved) {
      searchHistory.value = JSON.parse(saved)
    }
  } catch (error) {
    console.error('加载搜索历史失败:', error)
  }
}

// 保存搜索历史
const saveSearchHistory = () => {
  try {
    localStorage.setItem('prompt_search_history', JSON.stringify(searchHistory.value))
  } catch (error) {
    console.error('保存搜索历史失败:', error)
  }
}

// 添加搜索历史
const addToHistory = (keyword: string) => {
  if (!keyword.trim()) return
  
  // 移除重复项
  const index = searchHistory.value.indexOf(keyword)
  if (index > -1) {
    searchHistory.value.splice(index, 1)
  }
  
  // 添加到开头
  searchHistory.value.unshift(keyword)
  
  // 限制历史记录数量
  if (searchHistory.value.length > 10) {
    searchHistory.value = searchHistory.value.slice(0, 10)
  }
  
  saveSearchHistory()
}

// 方法
const handleSearchInput = (value: string) => {
  // 清除之前的防抖定时器
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  
  // 设置新的防抖定时器
  debounceTimer = setTimeout(() => {
    if (value.trim()) {
      performSearch()
    } else {
      emit('clear')
    }
  }, 500) // 500ms 防抖延迟
}

const handleSearch = () => {
  performSearch()
  showHistory.value = false
}

const performSearch = () => {
  const keyword = searchKeyword.value.trim()
  
  // 构建搜索参数
  const params: PromptSearchParams = {}
  
  if (keyword) {
    params.keyword = keyword
    addToHistory(keyword)
  }
  
  if (advancedFilters.value.source) {
    params.source = advancedFilters.value.source
  }
  
  if (advancedFilters.value.sortBy) {
    const [sortBy, sortOrder] = advancedFilters.value.sortBy.split('_')
    params.sortBy = sortBy as any
    params.sortOrder = sortOrder as 'asc' | 'desc'
  }
  
  // TODO: 处理日期范围
  
  emit('search', params)
}

const clearSearch = () => {
  searchKeyword.value = ''
  resetAdvanced()
  showHistory.value = false
  emit('clear')
}

const handleBlur = () => {
  // 延迟隐藏历史，以便点击历史项
  setTimeout(() => {
    showHistory.value = false
  }, 200)
}

const selectHistoryItem = (item: string) => {
  searchKeyword.value = item
  showHistory.value = false
  nextTick(() => {
    performSearch()
  })
}

const removeHistoryItem = (index: number) => {
  searchHistory.value.splice(index, 1)
  saveSearchHistory()
}

const clearHistory = () => {
  searchHistory.value = []
  saveSearchHistory()
}

const resetAdvanced = () => {
  advancedFilters.value = {
    source: '',
    dateRange: null,
    sortBy: null
  }
}

const applyAdvancedSearch = () => {
  performSearch()
  showAdvancedSearch.value = false
}

// 初始化
loadSearchHistory()
</script>

<style scoped>
.search-bar {
  position: relative;
  width: 100%;
}

.search-input {
  flex: 1;
}

.clear-btn {
  opacity: 0.6;
}

.clear-btn:hover {
  opacity: 1;
}

.advanced-btn {
  border-left: none;
}

.search-history {
  position: absolute;
  top: 100%;
  left: 0;
  right: 40px;
  background: var(--n-color-popover);
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
  box-shadow: var(--n-box-shadow-2);
  z-index: 1000;
  max-height: 240px;
  overflow-y: auto;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--n-border-color);
}

.history-title {
  font-size: 12px;
  color: var(--n-text-color-2);
  font-weight: 500;
}

.clear-history-btn {
  font-size: 11px;
}

.history-list {
  padding: 4px 0;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.history-item:hover {
  background: var(--n-color-hover);
}

.history-icon {
  margin-right: 8px;
  color: var(--n-text-color-3);
}

.history-text {
  flex: 1;
  font-size: 13px;
  color: var(--n-text-color-2);
}

.remove-btn {
  opacity: 0;
  transition: opacity 0.2s;
}

.history-item:hover .remove-btn {
  opacity: 0.6;
}

.remove-btn:hover {
  opacity: 1 !important;
}

.advanced-search {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--n-color-popover);
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
  box-shadow: var(--n-box-shadow-2);
  z-index: 1000;
  margin-top: 4px;
}

.advanced-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--n-border-color);
}

.advanced-title {
  font-size: 14px;
  color: var(--n-text-color-1);
  font-weight: 500;
}

.advanced-content {
  padding: 16px;
}

.filter-group {
  margin-bottom: 16px;
}

.filter-group:last-child {
  margin-bottom: 0;
}

.filter-label {
  display: block;
  font-size: 12px;
  color: var(--n-text-color-2);
  margin-bottom: 6px;
  font-weight: 500;
}

.date-picker,
.sort-select {
  width: 100%;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style> 