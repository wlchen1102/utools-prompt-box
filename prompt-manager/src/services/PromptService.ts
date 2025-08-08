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
import { UtoolsDB, type DBDoc } from '@/utils/utoolsAPI'

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
        .filter((doc: DBDoc) => doc && doc._id && doc._id.includes('prompt_')) // 只处理提示词数据
        .map((doc: DBDoc) => ({
          id: doc._id, // 直接使用完整的数据库ID
          _rev: doc._rev,
          title: doc.title as string || '',
          content: doc.content as string || '',
          tags: doc.tags as string[] || [],
          source: doc.source as string || '',
          usageCount: doc.usageCount as number || 0,
          isFavorite: doc.isFavorite as boolean || false,
          createdAt: doc.createdAt as string || new Date().toISOString(),
          updatedAt: doc.updatedAt as string || new Date().toISOString()
        }))
        .sort((a: Prompt, b: Prompt) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
      console.log('🔍 获取提示词，直接使用ID:', { id })
      
      const doc = this.db.get<DBDoc>(id)
      if (!doc) {
        return null
      }

      const prompt: Prompt = {
        id: doc._id,
        _rev: doc._rev,
        title: String((doc as unknown as Record<string, unknown>).title || ''),
        content: String((doc as unknown as Record<string, unknown>).content || ''),
        tags: (doc as unknown as Record<string, unknown>).tags as string[] || [],
        source: String((doc as unknown as Record<string, unknown>).source || ''),
        usageCount: Number((doc as unknown as Record<string, unknown>).usageCount || 0),
        isFavorite: Boolean((doc as unknown as Record<string, unknown>).isFavorite || false),
        createdAt: String((doc as unknown as Record<string, unknown>).createdAt || new Date().toISOString()),
        updatedAt: String((doc as unknown as Record<string, unknown>).updatedAt || new Date().toISOString())
      }

      return prompt
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
          let aValue: string | number, bValue: string | number
          
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
      const fullId = `prompt_manager_prompt_${id}`

      const prompt: Prompt = {
        id: fullId,
        title: data.title,
        content: data.content,
        tags: data.tags || [],
        source: data.source,
        usageCount: 0,
        isFavorite: false,
        createdAt: now,
        updatedAt: now
      }

      // 基础验证（仅内容必填，标题可为空）
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
      const result = this.db.put(fullId, dataToSave)
      
      if (result.ok) {
        prompt._rev = result.rev
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
      console.log('🔄 更新提示词，直接使用ID:', { id, data })
      
      // 直接使用完整ID获取文档
      const doc = this.db.get<DBDoc>(id)
      
      if (!doc) {
        return {
          success: false,
          error: '提示词不存在'
        }
      }

      // 基础验证：仅当传入 content 时才校验非空
      if (data.content !== undefined && !data.content.trim()) {
        return {
          success: false,
          error: '提示词内容不能为空'
        }
      }

      // 计算并“净化”可序列化的数据
      const now = new Date().toISOString()
      const dataToSave: Record<string, unknown> = {
        title: String((data.title ?? (doc as any).title) || ''),
        content: String((data.content ?? (doc as any).content) || ''),
        tags: Array.isArray(data.tags)
          ? (data.tags as unknown[]).map((t) => String(t))
          : (Array.isArray((doc as any).tags) ? ((doc as any).tags as unknown[]).map((t: unknown) => String(t)) : []),
        source: String((data.source ?? (doc as any).source) || ''),
        usageCount: Number((data.usageCount ?? (doc as any).usageCount) || 0),
        isFavorite: Boolean((data.isFavorite ?? (doc as any).isFavorite) || false),
        createdAt: String((doc as any).createdAt || now),
        updatedAt: now
      }

      console.log('🔄 更新提示词数据(已净化):', { id, dataToSave })

      // 保存
      const result = this.db.put(id, dataToSave)

      if (result.ok) {
        const returned: Prompt = {
          id,
          _rev: result.rev,
          title: dataToSave.title as string,
          content: dataToSave.content as string,
          tags: dataToSave.tags as string[],
          source: dataToSave.source as string,
          usageCount: dataToSave.usageCount as number,
          isFavorite: dataToSave.isFavorite as boolean,
          createdAt: dataToSave.createdAt as string,
          updatedAt: dataToSave.updatedAt as string
        }
        console.log('提示词更新成功:', returned)
        return {
          success: true,
          data: returned,
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
      console.log('🗑️ 开始删除提示词，直接使用ID:', id)
      
      // 直接使用完整ID获取文档
      const doc = this.db.get<DBDoc>(id)
      
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
      const promptDocs = allDocs.filter((doc): doc is DBDoc => !!(doc && (doc as unknown as { _id?: string })._id && (doc as unknown as { _id?: string })._id!.includes('prompt_')))
      
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