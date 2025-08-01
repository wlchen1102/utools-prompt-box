<template>
  <div class="search-bar">
    <n-input-group>
      <n-input
        ref="searchInputRef"
        v-model:value="searchKeyword"
        placeholder="搜索提示词标题或内容..."
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

    </n-input-group>
    
    <!-- 搜索历史下拉 -->
    <transition name="dropdown">
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
    </transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { 
  NInput, NInputGroup, NButton, NIcon
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
const searchHistory = ref<string[]>([])

// 防抖定时器
let debounceTimer: number | null = null

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
  
  emit('search', params)
}

const clearSearch = () => {
  searchKeyword.value = ''
  // 如果有搜索历史，则显示弹窗
  if (searchHistory.value.length > 0) {
    showHistory.value = true
  }
  // 让搜索框重新获得焦点
  nextTick(() => {
    searchInputRef.value?.focus()
  })
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

.search-history {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #ffffff;
  border: 1px solid #e0e0e6;
  border-radius: 8px;
  box-shadow: 0 6px 16px -8px rgba(0, 0, 0, 0.08), 0 9px 28px 0 rgba(0, 0, 0, 0.05), 0 3px 6px -4px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  max-height: 240px;
  overflow-y: auto;
  margin-top: 6px;
  backdrop-filter: blur(8px);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
  border-radius: 8px 8px 0 0;
}

.history-title {
  font-size: 13px;
  color: #333333;
  font-weight: 600;
}

.clear-history-btn {
  font-size: 11px;
  color: #666666;
}

.history-list {
  padding: 8px 0;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-radius: 4px;
  margin: 0 8px;
}

.history-item:hover {
  background: #f5f5f5;
}

.history-icon {
  margin-right: 10px;
  color: #999999;
}

.history-text {
  flex: 1;
  font-size: 14px;
  color: #333333;
  line-height: 1.4;
}

.remove-btn {
  opacity: 0;
  transition: opacity 0.2s ease;
  color: #999999;
}

.history-item:hover .remove-btn {
  opacity: 0.7;
}

.remove-btn:hover {
  opacity: 1 !important;
  color: #ff4757;
}

/* 下拉动画效果 */
.dropdown-enter-active {
  transition: all 0.2s ease-out;
}

.dropdown-leave-active {
  transition: all 0.15s ease-in;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
</style> 