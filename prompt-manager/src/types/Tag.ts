/**
 * 标签数据模型定义
 */

// 预定义的标签颜色
export type TagColor = 
  | 'default'    // 默认灰色
  | 'primary'    // 主题绿色 #00B25A
  | 'success'    // 成功绿色
  | 'warning'    // 警告橙色
  | 'error'      // 错误红色
  | 'info'       // 信息蓝色
  | 'purple'     // 紫色
  | 'pink'       // 粉色
  | 'cyan'       // 青色
  | 'lime'       // 酸橙色

// 标签基础接口
export interface Tag {
  id: string                    // 唯一标识符
  name: string                  // 标签名称（最多20个字符）
  color: TagColor              // 标签颜色
  description?: string         // 标签描述
  promptCount: number          // 关联的提示词数量
  createdAt: string           // 创建时间 ISO字符串
  updatedAt: string           // 更新时间 ISO字符串
  isDeleted?: boolean         // 软删除标记
}

// 创建标签的DTO
export interface CreateTagDTO {
  name: string
  color?: TagColor
  description?: string
}

// 更新标签的DTO
export interface UpdateTagDTO {
  name?: string
  color?: TagColor
  description?: string
}

// 标签搜索参数
export interface TagSearchParams {
  keyword?: string            // 搜索关键词（名称和描述）
  color?: TagColor           // 按颜色筛选
  sortBy?: 'name' | 'promptCount' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  includeEmpty?: boolean     // 是否包含没有关联提示词的标签
}

// 标签统计信息
export interface TagStats {
  total: number              // 总标签数
  used: number              // 已使用的标签数（有关联提示词）
  unused: number            // 未使用的标签数
  colorStats: Record<TagColor, number>  // 按颜色统计
  averagePromptCount: number // 平均每个标签的提示词数量
}

// 标签操作结果
export interface TagOperationResult {
  success: boolean
  message?: string
  data?: Tag
  error?: string
}

// 标签删除结果（包含受影响的提示词信息）
export interface TagDeleteResult {
  success: boolean
  deletedTag?: Tag
  affectedPrompts: number    // 受影响的提示词数量
  message?: string
  error?: string
}

// 标签颜色配置
export interface TagColorConfig {
  color: TagColor
  label: string
  hex: string               // 对应的十六进制颜色值
  background: string        // 背景色（浅色）
  textColor: string        // 文字颜色
}

// 预定义的颜色配置
export const TAG_COLOR_CONFIGS: Record<TagColor, TagColorConfig> = {
  default: {
    color: 'default',
    label: '默认',
    hex: '#666666',
    background: '#f5f5f5',
    textColor: '#333333'
  },
  primary: {
    color: 'primary',
    label: '主题',
    hex: '#00B25A',
    background: '#e6f7ff',
    textColor: '#ffffff'
  },
  success: {
    color: 'success',
    label: '成功',
    hex: '#52c41a',
    background: '#f6ffed',
    textColor: '#ffffff'
  },
  warning: {
    color: 'warning',
    label: '警告',
    hex: '#faad14',
    background: '#fffbe6',
    textColor: '#ffffff'
  },
  error: {
    color: 'error',
    label: '错误',
    hex: '#ff4d4f',
    background: '#fff2f0',
    textColor: '#ffffff'
  },
  info: {
    color: 'info',
    label: '信息',
    hex: '#1890ff',
    background: '#e6f7ff',
    textColor: '#ffffff'
  },
  purple: {
    color: 'purple',
    label: '紫色',
    hex: '#722ed1',
    background: '#f9f0ff',
    textColor: '#ffffff'
  },
  pink: {
    color: 'pink',
    label: '粉色',
    hex: '#eb2f96',
    background: '#fff0f6',
    textColor: '#ffffff'
  },
  cyan: {
    color: 'cyan',
    label: '青色',
    hex: '#13c2c2',
    background: '#e6fffb',
    textColor: '#ffffff'
  },
  lime: {
    color: 'lime',
    label: '酸橙',
    hex: '#a0d911',
    background: '#fcffe6',
    textColor: '#ffffff'
  }
} 