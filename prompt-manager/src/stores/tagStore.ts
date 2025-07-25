import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Tag, CreateTagDTO, UpdateTagDTO } from '@/types/Tag'
import { tagService } from '@/services/TagService'

export const useTagStore = defineStore('tag', () => {
  // 状态
  const tags = ref<Tag[]>([])
  const isLoaded = ref(false)
  const isLoading = ref(false)
  const selectedTag = ref<Tag | null>(null)

  // 计算属性
  const tagCount = computed(() => tags.value.length)
  
  const tagMap = computed(() => {
    const map = new Map<string, Tag>()
    tags.value.forEach(tag => map.set(tag.id, tag))
    return map
  })

  // 操作方法
  const loadTags = async (forceReload = false) => {
    console.log('🚀 loadTags 被调用:', { forceReload, isLoaded: isLoaded.value, isLoading: isLoading.value })
    
    if (isLoaded.value && !forceReload) {
      console.log('⏭️ 标签已加载，跳过重复加载。当前标签:', tags.value.map(t => ({ id: t.id, name: t.name })))
      return tags.value
    }

    if (isLoading.value) {
      console.log('⏳ 标签正在加载中，等待完成')
      return tags.value
    }

    try {
      isLoading.value = true
      console.log('📥 开始从数据库加载标签数据...')
      
      const loadedTags = await tagService.getAllTags()
      console.log('📊 从数据库加载的标签:', loadedTags)
      
      tags.value = loadedTags
      isLoaded.value = true
      
      console.log('✅ Store 中的标签已更新为:', tags.value.map(t => ({ id: t.id, name: t.name })))
      
      // 如果没有标签数据，创建默认标签
      if (loadedTags.length === 0) {
        console.log('🔧 没有找到已保存的标签，创建默认标签...')
        await createDefaultTags()
      }
      
      return tags.value
    } catch (error) {
      console.error('❌ 加载标签数据失败:', error)
      return []
    } finally {
      isLoading.value = false
    }
  }

  const createDefaultTags = async () => {
    const defaultTags = [
      { name: 'AI写作', color: 'primary' as const, description: 'AI协助写作相关的提示词' },
      { name: '编程助手', color: 'info' as const, description: '编程开发相关的提示词' },
      { name: '翻译工具', color: 'success' as const, description: '语言翻译相关的提示词' }
    ]
    
    for (const tagData of defaultTags) {
      const result = await tagService.createTag(tagData)
      if (result.success && result.data) {
        tags.value.push(result.data)
      }
    }
  }

  const createTag = async (data: CreateTagDTO) => {
    try {
      const result = await tagService.createTag(data)
      if (result.success && result.data) {
        tags.value.push(result.data)
        console.log('标签创建成功:', result.data)
        return result
      } else {
        console.error('创建标签失败:', result.error)
        return result
      }
    } catch (error) {
      console.error('创建标签失败:', error)
      return {
        success: false,
        error: '创建标签失败'
      }
    }
  }

  const updateTag = async (id: string, data: UpdateTagDTO) => {
    try {
      console.log('🔄 开始更新标签:', { id, data })
      
      const result = await tagService.updateTag(id, data)
      console.log('🔄 TagService.updateTag 返回结果:', result)
      
      if (result.success && result.data) {
        const index = tags.value.findIndex(t => t.id === id)
        console.log('🔍 查找标签索引:', { id, index, 当前标签数量: tags.value.length })
        
        if (index !== -1) {
          const oldTag = tags.value[index]
          tags.value[index] = result.data
          console.log('✅ Store 中标签已更新:', { 
            旧标签: oldTag, 
            新标签: result.data,
            Store中当前所有标签: tags.value.map(t => ({ id: t.id, name: t.name }))
          })
        }
        return result
      } else {
        console.error('更新标签失败:', result.error)
        return result
      }
    } catch (error) {
      console.error('更新标签失败:', error)
      return {
        success: false,
        error: '更新标签失败'
      }
    }
  }

  const deleteTag = async (id: string) => {
    try {
      const result = await tagService.deleteTag(id)
      if (result.success) {
        tags.value = tags.value.filter(t => t.id !== id)
        
        // 如果当前选中的是被删除的标签，重置选择
        if (selectedTag.value?.id === id) {
          selectedTag.value = null
        }
        
        console.log('标签删除成功')
        return result
      } else {
        console.error('删除标签失败:', result.error)
        return result
      }
    } catch (error) {
      console.error('删除标签失败:', error)
      return {
        success: false,
        affectedPrompts: 0,
        error: '删除标签失败'
      }
    }
  }

  const getTagById = (id: string) => {
    return tagMap.value.get(id) || null
  }

  const selectTag = (tag: Tag | null) => {
    selectedTag.value = tag
  }

  // 重置状态
  const resetState = () => {
    tags.value = []
    isLoaded.value = false
    isLoading.value = false
    selectedTag.value = null
  }

  return {
    // 状态
    tags,
    isLoaded,
    isLoading,
    selectedTag,
    
    // 计算属性
    tagCount,
    tagMap,
    
    // 方法
    loadTags,
    createTag,
    updateTag,
    deleteTag,
    getTagById,
    selectTag,
    resetState
  }
}) 