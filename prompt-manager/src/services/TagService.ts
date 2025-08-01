import type { 
  Tag, 
  TagColor,
  CreateTagDTO, 
  UpdateTagDTO, 
  TagSearchParams,
  TagStats,
  TagOperationResult,
  TagDeleteResult
} from '@/types/Tag'
import { UtoolsDB } from '@/utils/utoolsAPI'

/**
 * 标签服务类
 * 管理标签的增删改查和业务逻辑
 */
export class TagService {
  private static readonly TAG_STORE_KEY = 'tags'
  private db: UtoolsDB

  constructor() {
    this.db = new UtoolsDB()
  }

  /**
   * 创建新标签
   */
  async createTag(data: CreateTagDTO): Promise<TagOperationResult> {
    try {
      // 验证标签名称是否已存在
      const existingTags = await this.getAllTags()
      const nameExists = existingTags.some(tag => 
        tag.name.toLowerCase() === data.name.toLowerCase()
      )
      
      if (nameExists) {
        return {
          success: false,
          error: '标签名称已存在'
        }
      }

      // 创建新标签
      const newTag: Tag = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: data.name.trim(),
        color: data.color || 'primary',
        description: data.description?.trim(),
        promptCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // 保存到数据库
      this.db.put(`${TagService.TAG_STORE_KEY}_tag_${newTag.id}`, newTag)

      return {
        success: true,
        data: newTag,
        message: '标签创建成功'
      }
    } catch (error) {
      console.error('创建标签失败:', error)
      return {
        success: false,
        error: '创建标签失败'
      }
    }
  }

  /**
   * 更新标签
   */
  async updateTag(id: string, data: UpdateTagDTO): Promise<TagOperationResult> {
    try {
      const existingTag = await this.getTagById(id)
      if (!existingTag) {
        return {
          success: false,
          error: '标签不存在'
        }
      }

      // 如果更新名称，检查是否与其他标签重名
      if (data.name && data.name !== existingTag.name) {
        const allTags = await this.getAllTags()
        const nameExists = allTags.some(tag => 
          tag.id !== id && tag.name.toLowerCase() === data.name!.toLowerCase()
        )
        
        if (nameExists) {
          return {
            success: false,
            error: '标签名称已存在'
          }
        }
      }

      // 更新标签数据
      const updatedTag: Tag = {
        ...existingTag,
        ...(data.name && { name: data.name.trim() }),
        ...(data.color && { color: data.color }),
        ...(data.description !== undefined && { description: data.description?.trim() }),
        updatedAt: new Date().toISOString()
      }

      // 保存到数据库 - 直接使用完整ID
      console.log('💾 准备保存更新的标签:', { id, updatedTag })
      const saveResult = this.db.put(id, updatedTag)
      console.log('💾 标签保存结果:', saveResult)

      // 检查保存是否成功 - 需要处理 uTools 数据库可能返回的不同格式
      const result = saveResult as any
      if (result.error || !result.ok) {
        console.error('💥 标签保存失败:', saveResult)
        return {
          success: false,
          error: result.message || '保存标签失败，可能存在版本冲突'
        }
      }

      return {
        success: true,
        data: updatedTag,
        message: '标签更新成功'
      }
    } catch (error) {
      console.error('更新标签失败:', error)
      return {
        success: false,
        error: '更新标签失败'
      }
    }
  }

  /**
   * 删除标签
   */
  async deleteTag(id: string): Promise<TagDeleteResult> {
    try {
      const tag = await this.getTagById(id)
      if (!tag) {
        return {
          success: false,
          affectedPrompts: 0,
          error: '标签不存在'
        }
      }

      // 获取关联的提示词数量
      const affectedPrompts = await this.getPromptCountByTag(id)

      // 直接使用完整ID获取和删除文档
      console.log('🗑️ 删除标签，直接使用ID:', { id })
      
      // 先获取完整文档，然后删除
      const fullDoc = await this.db.get(id)
      if (fullDoc) {
        await this.db.remove(fullDoc)
        console.log('✅ 标签删除成功:', id)
      } else {
        console.log('⚠️ 标签文档不存在:', id)
        return {
          success: false,
          affectedPrompts: 0,
          error: '标签不存在'
        }
      }

      // 如果有关联的提示词，需要在调用方处理提示词的标签关联
      return {
        success: true,
        deletedTag: tag,
        affectedPrompts,
        message: `标签删除成功${affectedPrompts > 0 ? `，影响了 ${affectedPrompts} 个提示词` : ''}`
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

  /**
   * 清理所有标签数据（临时方法，用于解决重复标签问题）
   */
  async clearAllTags(): Promise<{ success: boolean; message: string; deletedCount: number }> {
    try {
      console.log('🧹 开始清理所有标签数据...')
      
      const allTags = this.db.allDocs()
      const tagDocs = allTags.filter(doc => doc && doc._id && doc._id.includes('tag_'))
      
      console.log(`找到 ${tagDocs.length} 个标签文档，准备删除...`)
      
      let deletedCount = 0
      for (const tagDoc of tagDocs) {
        try {
          const result = this.db.remove(tagDoc)
          if (result.ok) {
            deletedCount++
            console.log(`✅ 已删除标签: ${tagDoc.name} (${tagDoc._id})`)
          } else {
            console.error(`❌ 删除标签失败: ${tagDoc.name} (${tagDoc._id})`, result)
          }
        } catch (error) {
          console.error(`❌ 删除标签时出错: ${tagDoc.name} (${tagDoc._id})`, error)
        }
      }
      
      console.log(`🧹 清理完成，共删除 ${deletedCount} 个标签`)
      
      return {
        success: true,
        message: `清理完成，共删除 ${deletedCount} 个标签`,
        deletedCount
      }
    } catch (error) {
      console.error('清理标签失败:', error)
      return {
        success: false,
        message: '清理标签失败',
        deletedCount: 0
      }
    }
  }

  /**
   * 根据ID获取标签
   */
  async getTagById(id: string): Promise<Tag | null> {
    try {
      console.log('🔍 获取标签，直接使用ID:', { id })
      
      const tag = await this.db.get(id)
      return tag || null
    } catch (error) {
      console.error('获取标签失败:', error)
      return null
    }
  }

  /**
   * 获取所有标签
   */
  async getAllTags(): Promise<Tag[]> {
    try {
      // 直接调用同步的 allDocs 方法，过滤逻辑已在 utoolsAPI 层面处理
      const allTags = this.db.allDocs('tag_')
      console.log('从数据库获取的所有标签:', allTags)
      
      const tags = allTags
        // 进一步确保只处理标签数据
        .filter(tag => tag && tag._id && tag._id.includes('tag_'))
        .map(tag => ({
          id: tag._id, // 直接使用完整的数据库ID，不再截取
          name: tag.name || '',
          color: tag.color || 'default',
          description: tag.description || '',
          promptCount: tag.promptCount || 0,
          createdAt: tag.createdAt || new Date().toISOString(),
          updatedAt: tag.updatedAt || new Date().toISOString(),
          _rev: tag._rev
        }))
      
      console.log('映射后的标签:', tags)

      // 按创建时间倒序排序
      const sortedTags = tags.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      console.log('排序后的标签:', sortedTags)
      
      return sortedTags
    } catch (error) {
      console.error('获取标签列表失败:', error)
      return []
    }
  }

  /**
   * 搜索标签
   */
  async searchTags(params: TagSearchParams): Promise<Tag[]> {
    try {
      let tags = await this.getAllTags()

      // 按关键词筛选
      if (params.keyword) {
        const keyword = params.keyword.toLowerCase()
        tags = tags.filter(tag => 
          tag.name.toLowerCase().includes(keyword) ||
          (tag.description && tag.description.toLowerCase().includes(keyword))
        )
      }

      // 按颜色筛选
      if (params.color) {
        tags = tags.filter(tag => tag.color === params.color)
      }

      // 是否包含空标签
      if (!params.includeEmpty) {
        tags = tags.filter(tag => tag.promptCount > 0)
      }

      // 排序
      if (params.sortBy) {
        tags.sort((a, b) => {
          let aValue: any = a[params.sortBy!]
          let bValue: any = b[params.sortBy!]

          if (params.sortBy === 'createdAt' || params.sortBy === 'updatedAt') {
            aValue = new Date(aValue).getTime()
            bValue = new Date(bValue).getTime()
          }

          if (params.sortOrder === 'desc') {
            return bValue - aValue
          } else {
            return aValue - bValue
          }
        })
      }

      return tags
    } catch (error) {
      console.error('搜索标签失败:', error)
      return []
    }
  }

  /**
   * 获取标签统计信息
   */
  async getTagStats(): Promise<TagStats> {
    try {
      const tags = await this.getAllTags()
      const used = tags.filter(tag => tag.promptCount > 0).length
      const colorStats = {} as Record<TagColor, number>

      tags.forEach(tag => {
        colorStats[tag.color] = (colorStats[tag.color] || 0) + 1
      })

      const totalPromptCount = tags.reduce((sum, tag) => sum + tag.promptCount, 0)

      return {
        total: tags.length,
        used,
        unused: tags.length - used,
        colorStats,
        averagePromptCount: tags.length > 0 ? totalPromptCount / tags.length : 0
      }
    } catch (error) {
      console.error('获取标签统计失败:', error)
      return {
        total: 0,
        used: 0,
        unused: 0,
        colorStats: {} as Record<TagColor, number>,
        averagePromptCount: 0
      }
    }
  }

  /**
   * 更新标签的提示词数量
   */
  async updateTagPromptCount(tagId: string, count: number): Promise<boolean> {
    try {
      const tag = await this.getTagById(tagId)
      if (!tag) return false

      tag.promptCount = count
      tag.updatedAt = new Date().toISOString()

      this.db.put(`${TagService.TAG_STORE_KEY}_${tagId}`, tag)
      return true
    } catch (error) {
      console.error('更新标签提示词数量失败:', error)
      return false
    }
  }

  /**
   * 获取标签关联的提示词数量（需要从提示词服务获取）
   */
  private async getPromptCountByTag(tagId: string): Promise<number> {
    // 这里需要与提示词服务配合，暂时返回标签存储的数量
    const tag = await this.getTagById(tagId)
    return tag?.promptCount || 0
  }

  /**
   * 批量更新标签的提示词数量
   */
  async batchUpdatePromptCounts(counts: Record<string, number>): Promise<void> {
    try {
      const updatePromises = Object.entries(counts).map(([tagId, count]) => 
        this.updateTagPromptCount(tagId, count)
      )
      await Promise.all(updatePromises)
    } catch (error) {
      console.error('批量更新标签提示词数量失败:', error)
    }
  }

  /**
   * 数据导出
   */
  async exportTags(): Promise<Tag[]> {
    return await this.getAllTags()
  }

  /**
   * 数据导入
   */
  async importTags(tags: Tag[]): Promise<{ success: number; failed: number }> {
    let success = 0
    let failed = 0

    for (const tag of tags) {
      try {
        // 检查ID冲突
        const existing = await this.getTagById(tag.id)
        if (existing) {
          // 生成新ID
          tag.id = `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }

        this.db.put(`${TagService.TAG_STORE_KEY}_${tag.id}`, tag)
        success++
      } catch (error) {
        console.error('导入标签失败:', tag, error)
        failed++
      }
    }

    return { success, failed }
  }
}

// 导出单例实例
export const tagService = new TagService() 