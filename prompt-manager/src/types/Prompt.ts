/**
 * 提示词数据模型定义
 */

// 提示词基础接口
export interface Prompt {
  id: string                    // 唯一标识符
  title: string                 // 提示词标题
  content: string               // 提示词内容（Markdown格式）
  tags: string[]               // 关联的标签ID数组
  source?: string              // 来源说明
  createdAt: string            // 创建时间 ISO字符串
  updatedAt: string            // 更新时间 ISO字符串
  isDeleted?: boolean          // 软删除标记
}

// 创建提示词的DTO
export interface CreatePromptDTO {
  title: string
  content: string
  tags?: string[]
  source?: string
}

// 更新提示词的DTO
export interface UpdatePromptDTO {
  title?: string
  content?: string
  tags?: string[]
  source?: string
}

// 提示词搜索参数
export interface PromptSearchParams {
  keyword?: string             // 搜索关键词（标题和内容）
  tags?: string[]             // 按标签筛选
  source?: string             // 按来源筛选
  sortBy?: 'createdAt' | 'updatedAt' | 'title'  // 排序字段
  sortOrder?: 'asc' | 'desc'  // 排序方向
  page?: number               // 分页页码
  limit?: number              // 分页大小
}

// 提示词搜索结果
export interface PromptSearchResult {
  items: Prompt[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// 提示词统计信息
export interface PromptStats {
  total: number               // 总数
  tagCount: number           // 标签数量
  recentCount: number        // 最近7天新增数量
  sourceStats: Record<string, number>  // 按来源统计
}

// 提示词操作结果
export interface PromptOperationResult {
  success: boolean
  message?: string
  data?: Prompt
  error?: string
}

// 批量操作结果
export interface BatchPromptOperationResult {
  success: boolean
  total: number
  succeeded: number
  failed: number
  errors: Array<{ id: string; error: string }>
} 