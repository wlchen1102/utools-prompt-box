/**
 * 提示词服务
 * 负责提示词的增删改查操作和数据持久化
 */

import type { 
  Prompt, 
  CreatePromptDTO, 
  UpdatePromptDTO, 
  PromptSearchParams,
  PromptSearchResult,
  PromptOperationResult,
  BatchPromptOperationResult,
  PromptStats
} from '@/types/Prompt'
import { UtoolsDB } from '@/utils/utoolsAPI'
import { validatePrompt } from '@/utils/validators'

export class PromptService {
  private db: UtoolsDB

  constructor() {
    this.db = new UtoolsDB()
  }

  /**
   * 获取所有提示词
   */
  async getAllPrompts(): Promise<Prompt[]> {
    try {
      const docs = this.db.allDocs()
      console.log('📖 从 uTools 数据库读取数据:', docs)
      
      const prompts = docs
        .filter((doc: any) => doc && doc._id && doc._id.includes('prompt_')) // 只处理提示词数据
        .map((doc: any) => ({
          id: doc._id.replace(/^.*prompt_/, ''),
          title: doc.title || '',
          content: doc.content || '',
          tags: doc.tags || [],
          source: doc.source || '',
          usageCount: doc.usageCount || 0,
          isFavorite: doc.isFavorite || false,
          createdAt: doc.createdAt || new Date().toISOString(),
          updatedAt: doc.updatedAt || new Date().toISOString()
        }))
        .filter((prompt: Prompt) => prompt.title && prompt.title.trim()) // 只过滤无效数据
        .sort((a: Prompt, b: Prompt) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )

      console.log('✅ PromptService.getAllPrompts 返回:', prompts)
      return prompts
    } catch (error) {
      console.error('获取提示词失败:', error)
      return []
    }
  }

  /**
   * 根据ID获取提示词
   */
  async getPromptById(id: string): Promise<Prompt | null> {
    try {
      // 尝试不同的ID格式
      let doc = this.db.get(`prompt_${id}`)
      if (!doc) {
        doc = this.db.get(`prompt_manager_prompt_${id}`)
      }
      if (!doc) {
        return null
      }

      // 确保 doc._id 存在
      if (!doc._id) {
        console.error(`提示词 ${id} 缺少 _id 字段:`, doc)
        return null
      }

      return {
        id: doc._id.replace(/^.*prompt_/, ''),
        title: doc.title || '',
        content: doc.content || '',
        tags: doc.tags || [],
        source: doc.source || '',
        usageCount: doc.usageCount || 0,
        isFavorite: doc.isFavorite || false,
        createdAt: doc.createdAt || new Date().toISOString(),
        updatedAt: doc.updatedAt || new Date().toISOString()
      }
    } catch (error) {
      console.error(`获取提示词 ${id} 失败:`, error)
      return null
    }
  }

  /**
   * 搜索提示词
   */
  async searchPrompts(params: PromptSearchParams): Promise<PromptSearchResult> {
    try {
      let prompts = await this.getAllPrompts()

      // 关键词搜索
      if (params.keyword?.trim()) {
        const keyword = params.keyword.toLowerCase()
        prompts = prompts.filter(prompt => 
          prompt.title.toLowerCase().includes(keyword) ||
          prompt.content.toLowerCase().includes(keyword)
        )
      }

      // 按标签筛选
      if (params.tags && params.tags.length > 0) {
        prompts = prompts.filter(prompt => 
          params.tags!.some(tagId => prompt.tags.includes(tagId))
        )
      }

      // 按来源筛选
      if (params.source?.trim()) {
        prompts = prompts.filter(prompt => 
          prompt.source?.toLowerCase().includes(params.source!.toLowerCase())
        )
      }

      // 排序
      if (params.sortBy) {
        prompts.sort((a, b) => {
          let aValue: any, bValue: any
          
          switch (params.sortBy) {
            case 'title':
              aValue = a.title.toLowerCase()
              bValue = b.title.toLowerCase()
              break
            case 'createdAt':
              aValue = new Date(a.createdAt).getTime()
              bValue = new Date(b.createdAt).getTime()
              break
            case 'updatedAt':
              aValue = new Date(a.updatedAt).getTime()
              bValue = new Date(b.updatedAt).getTime()
              break
            default:
              return 0
          }

          if (params.sortOrder === 'desc') {
            return bValue > aValue ? 1 : -1
          } else {
            return aValue > bValue ? 1 : -1
          }
        })
      }

      // 分页
      const page = params.page || 1
      const limit = params.limit || 50
      const start = (page - 1) * limit
      const end = start + limit
      const items = prompts.slice(start, end)

      return {
        items,
        total: prompts.length,
        page,
        limit,
        hasMore: end < prompts.length
      }
    } catch (error) {
      console.error('搜索提示词失败:', error)
      return {
        items: [],
        total: 0,
        page: 1,
        limit: params.limit || 50,
        hasMore: false
      }
    }
  }

  /**
   * 创建提示词
   */
  async createPrompt(data: CreatePromptDTO): Promise<PromptOperationResult> {
    try {
      // 生成ID
      const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const now = new Date().toISOString()

      const prompt: Prompt = {
        id,
        title: data.title,
        content: data.content,
        tags: data.tags || [],
        source: data.source,
        usageCount: 0,
        isFavorite: false,
        createdAt: now,
        updatedAt: now
      }

      // 基础验证
      if (!prompt.title.trim()) {
        return {
          success: false,
          error: '提示词标题不能为空'
        }
      }
      if (!prompt.content.trim()) {
        return {
          success: false,
          error: '提示词内容不能为空'
        }
      }

      // 保存到数据库 - 确保数据可序列化
      const dataToSave = {
        title: String(prompt.title || ''),
        content: String(prompt.content || ''),
        tags: Array.isArray(prompt.tags) ? prompt.tags.map(tag => String(tag)) : [],
        source: String(prompt.source || ''),
        usageCount: Number(prompt.usageCount || 0),
        isFavorite: Boolean(prompt.isFavorite || false),
        createdAt: String(prompt.createdAt),
        updatedAt: String(prompt.updatedAt)
      }
      
      console.log('准备保存的数据:', dataToSave)
      const result = this.db.put(`prompt_${id}`, dataToSave)

      if (result.ok) {
        console.log('提示词创建成功:', prompt)
        return {
          success: true,
          data: prompt,
          message: '提示词创建成功'
        }
      } else {
        return {
          success: false,
          error: '数据库保存失败'
        }
      }
    } catch (error) {
      console.error('创建提示词失败:', error)
      return {
        success: false,
        error: '创建提示词失败'
      }
    }
  }

  /**
   * 更新提示词
   */
  async updatePrompt(id: string, data: UpdatePromptDTO): Promise<PromptOperationResult> {
    try {
      // 先尝试直接获取原始文档
      let doc = this.db.get(`prompt_${id}`)
      if (!doc) {
        doc = this.db.get(`prompt_manager_prompt_${id}`)
      }
      
      if (!doc) {
        return {
          success: false,
          error: '提示词不存在'
        }
      }

      // 基础验证
      if (!data.title?.trim()) {
        return {
          success: false,
          error: '提示词标题不能为空'
        }
      }
      if (!data.content?.trim()) {
        return {
          success: false,
          error: '提示词内容不能为空'
        }
      }

      // 更新数据
      const updatedData = {
        title: String(data.title || ''),
        content: String(data.content || ''),
        tags: Array.isArray(data.tags) ? data.tags.map((tag: any) => String(tag)) : (doc.tags || []),
        source: String(data.source || ''),
        usageCount: Number(data.usageCount || 0),
        isFavorite: Boolean(data.isFavorite || false),
        createdAt: String(doc.createdAt || new Date().toISOString()),
        updatedAt: new Date().toISOString()
      }
      
      // 使用原始文档的 _id 进行保存，但需要去掉前缀避免重复
      const cleanId = doc._id.replace(/^prompt_manager_/, '')
      const result = this.db.put(cleanId, updatedData)

      if (result.ok) {
        // 构建返回的提示词对象
        const updated: Prompt = {
          id: doc._id.replace(/^.*prompt_/, ''),
          title: updatedData.title,
          content: updatedData.content,
          tags: updatedData.tags,
          source: updatedData.source,
          usageCount: updatedData.usageCount || 0,
          isFavorite: updatedData.isFavorite || false,
          createdAt: updatedData.createdAt,
          updatedAt: updatedData.updatedAt
        }
        
        console.log('提示词更新成功:', updated)
        return {
          success: true,
          data: updated,
          message: '提示词更新成功'
        }
      } else {
        return {
          success: false,
          error: '数据库保存失败'
        }
      }
    } catch (error) {
      console.error('更新提示词失败:', error)
      return {
        success: false,
        error: '更新提示词失败'
      }
    }
  }

  /**
   * 物理删除提示词
   */
  async removePrompt(id: string): Promise<PromptOperationResult> {
    try {
      console.log('🗑️ 开始删除提示词:', id)
      
      // 方法1：先获取文档，然后删除（推荐，因为有更好的错误处理）
      let doc = this.db.get(`prompt_${id}`)
      if (!doc) {
        doc = this.db.get(`prompt_manager_prompt_${id}`)
      }
      
      if (!doc) {
        console.log(`提示词 ${id} 在数据库中已不存在，无需删除。`)
        return {
          success: true,
          message: '提示词已删除'
        }
      }

      console.log('🗑️ 找到文档，准备删除:', { id: doc._id, doc })
      
      // 使用文档对象删除
      const result = this.db.remove(doc)
      console.log('🗑️ 删除操作结果:', result)

      if (result.ok) {
        console.log('提示词物理删除成功:', id)
        return {
          success: true,
          message: '提示词删除成功'
        }
      } else {
        console.error('删除失败，结果:', result)
        return {
          success: false,
          error: result.message || '数据库操作失败'
        }
      }
    } catch (error) {
      console.error('删除提示词失败:', error)
      return {
        success: false,
        error: '删除提示词失败'
      }
    }
  }

  /**
   * 批量操作
   */
  async batchOperation(
    operation: 'delete' | 'update',
    ids: string[],
    data?: UpdatePromptDTO
  ): Promise<BatchPromptOperationResult> {
    const errors: Array<{ id: string; error: string }> = []
    let succeeded = 0

    for (const id of ids) {
      try {
        let result: PromptOperationResult
        
        if (operation === 'delete') {
          result = await this.removePrompt(id)
        } else if (operation === 'update' && data) {
          result = await this.updatePrompt(id, data)
        } else {
          continue
        }

        if (result.success) {
          succeeded++
        } else {
          errors.push({ id, error: result.error || '操作失败' })
        }
      } catch (error) {
        errors.push({ id, error: String(error) })
      }
    }

    return {
      success: errors.length === 0,
      total: ids.length,
      succeeded,
      failed: errors.length,
      errors
    }
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<PromptStats> {
    try {
      const prompts = await this.getAllPrompts()
      const sourceStats: Record<string, number> = {}
      
      prompts.forEach(prompt => {
        const source = prompt.source || '未知来源'
        sourceStats[source] = (sourceStats[source] || 0) + 1
      })

      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const recentCount = prompts.filter(prompt => 
        new Date(prompt.createdAt) >= sevenDaysAgo
      ).length

      // 获取所有标签ID的唯一集合
      const allTagIds = new Set<string>()
      prompts.forEach(prompt => {
        prompt.tags.forEach(tagId => allTagIds.add(tagId))
      })

      return {
        total: prompts.length,
        tagCount: allTagIds.size,
        recentCount,
        sourceStats
      }
    } catch (error) {
      console.error('获取统计信息失败:', error)
      return {
        total: 0,
        tagCount: 0,
        recentCount: 0,
        sourceStats: {}
      }
    }
  }

  /**
   * 导出数据
   */
  async exportData(): Promise<{ prompts: Prompt[]; success: boolean; error?: string }> {
    try {
      const prompts = await this.getAllPrompts()
      return {
        prompts,
        success: true
      }
    } catch (error) {
      console.error('导出数据失败:', error)
      return {
        prompts: [],
        success: false,
        error: '导出失败'
      }
    }
  }

  /**
   * 导入数据
   */
  async importData(prompts: Prompt[]): Promise<BatchPromptOperationResult> {
    const errors: Array<{ id: string; error: string }> = []
    let succeeded = 0

    for (const prompt of prompts) {
      try {
        const createData: CreatePromptDTO = {
          title: prompt.title,
          content: prompt.content,
          tags: prompt.tags,
          source: prompt.source
        }
        
        const result = await this.createPrompt(createData)
        
        if (result.success) {
          succeeded++
        } else {
          errors.push({ 
            id: prompt.id, 
            error: result.error || '导入失败' 
          })
        }
      } catch (error) {
        errors.push({ 
          id: prompt.id, 
          error: String(error) 
        })
      }
    }

    return {
      success: errors.length === 0,
      total: prompts.length,
      succeeded,
      failed: errors.length,
      errors
    }
  }

  /**
   * 清理异常提示词数据（临时方法，用于解决脏数据问题）
   */
  async cleanInvalidPrompts(): Promise<{ success: boolean; message: string; deletedCount: number }> {
    try {
      console.log('🧹 开始清理异常提示词数据...')
      
      const allDocs = this.db.allDocs()
      const promptDocs = allDocs.filter(doc => doc && doc._id && doc._id.includes('prompt_'))
      
      console.log(`找到 ${promptDocs.length} 个提示词文档，检查异常数据...`)
      
      let deletedCount = 0
      for (const promptDoc of promptDocs) {
        try {
          // 检查是否是异常ID
          const extractedId = promptDoc._id.replace(/^.*prompt_/, '')
          
          // 检查ID是否异常（包含undefined、null等）
          if (!extractedId || 
              extractedId === 'undefined' || 
              extractedId === 'null' || 
              extractedId.includes('undefined') ||
              extractedId.includes('manager') ||
              extractedId.length < 10) { // 正常ID应该是时间戳+随机字符，长度会比较长
            
            console.log(`🔍 发现异常提示词: ${promptDoc.title} (ID: ${extractedId}, 完整ID: ${promptDoc._id})`)
            
            const result = this.db.remove(promptDoc)
            if (result.ok) {
              deletedCount++
              console.log(`✅ 已删除异常提示词: ${promptDoc.title}`)
            } else {
              console.error(`❌ 删除异常提示词失败: ${promptDoc.title}`, result)
            }
          }
        } catch (error) {
          console.error(`❌ 处理提示词时出错: ${promptDoc.title}`, error)
        }
      }
      
      console.log(`🧹 清理完成，共删除 ${deletedCount} 个异常提示词`)
      
      return {
        success: true,
        message: `清理完成，共删除 ${deletedCount} 个异常提示词`,
        deletedCount
      }
    } catch (error) {
      console.error('清理异常提示词失败:', error)
      return {
        success: false,
        message: '清理异常提示词失败',
        deletedCount: 0
      }
    }
  }
}

// 导出单例实例
export const promptService = new PromptService() 