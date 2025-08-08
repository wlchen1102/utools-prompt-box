/**
 * 应用状态和配置数据模型定义
 */

import type { TagColor } from './Tag'

// 应用配置
export interface AppConfig {
  // 界面设置
  ui: {
    theme: 'light' | 'dark'           // 主题模式
    language: 'zh-CN' | 'en-US'       // 语言设置
    sidebarWidth: number              // 侧边栏宽度百分比（10-30）
    cardSize: 'small' | 'medium' | 'large'  // 卡片大小
    enableAnimation: boolean          // 是否启用动画
  }

  // 功能设置
  features: {
    autoSave: boolean                 // 是否自动保存
    confirmDelete: boolean            // 删除前是否确认
    showLineNumbers: boolean          // 编辑器是否显示行号
    enableMarkdown: boolean           // 是否启用 Markdown 渲染
    searchDelay: number              // 搜索防抖延迟（毫秒）
  }

  // 默认值设置
  defaults: {
    newTagColor: TagColor            // 新建标签的默认颜色
    sortBy: 'createdAt' | 'updatedAt' | 'title'  // 默认排序字段
    sortOrder: 'asc' | 'desc'        // 默认排序方向
    pageSize: number                 // 默认分页大小
  }

  // 数据设置
  data: {
    autoBackup: boolean              // 是否自动备份
    backupInterval: number           // 备份间隔（小时）
    maxBackups: number              // 最大备份数量
    compressionEnabled: boolean      // 是否启用压缩
  }
}

// 应用状态
export interface AppState {
  // 当前用户操作状态
  currentRoute: string              // 当前路由
  selectedTags: string[]           // 当前选中的标签
  searchKeyword: string            // 当前搜索关键词
  viewMode: 'grid' | 'list'        // 查看模式
  
  // UI 状态
  ui: {
    loading: boolean               // 全局加载状态
    sidebarCollapsed: boolean      // 侧边栏是否收起
    fullscreen: boolean           // 是否全屏模式
    lastActiveTime: string        // 最后活跃时间
  }

  // 数据状态
  data: {
    lastSyncTime: string          // 最后同步时间
    isDirty: boolean             // 是否有未保存的更改
    totalPrompts: number         // 提示词总数
    totalTags: number           // 标签总数
  }

  // 编辑状态
  editing: {
    promptId?: string            // 正在编辑的提示词ID
    tagId?: string              // 正在编辑的标签ID
    isModified: boolean         // 是否已修改
    lastSaveTime?: string       // 最后保存时间
  }
}

// 用户偏好设置
export interface UserPreferences {
  // 最近使用
  recentTags: string[]             // 最近使用的标签ID
  recentSearches: string[]         // 最近搜索的关键词
  pinnedPrompts: string[]          // 置顶的提示词ID
  
  // 快捷操作
  favoriteOperations: Array<{
    name: string
    action: string
    shortcut?: string
  }>

  // 自定义设置
  customCSS?: string               // 自定义样式
  customShortcuts: Record<string, string>  // 自定义快捷键
}

// 应用元数据
export interface AppMetadata {
  version: string                  // 应用版本
  buildTime: string               // 构建时间
  environment: 'development' | 'production'
  platform: string               // 运行平台
  uToolsVersion?: string          // uTools 版本
}

// 错误信息
export interface AppError {
  id: string
  type: 'warning' | 'error' | 'critical'
  message: string
  details?: string
  timestamp: string
  resolved: boolean
  stack?: string
}

// 操作历史记录
export interface AppHistory {
  id: string
  action: string                  // 操作类型
  target: string                  // 目标对象ID
  targetType: 'prompt' | 'tag' | 'config'
  details: Record<string, unknown>    // 操作详情
  timestamp: string
  userId?: string                 // 操作用户（未来扩展）
}

// 应用初始化状态
export interface AppInitState {
  isFirstRun: boolean             // 是否首次运行
  hasData: boolean               // 是否有已存在的数据
  needsMigration: boolean        // 是否需要数据迁移
  migrationVersion?: string      // 迁移版本
}

// 默认配置
export const DEFAULT_APP_CONFIG: AppConfig = {
  ui: {
    theme: 'light',
    language: 'zh-CN',
    sidebarWidth: 20,
    cardSize: 'medium',
    enableAnimation: true
  },
  features: {
    autoSave: true,
    confirmDelete: true,
    showLineNumbers: true,
    enableMarkdown: true,
    searchDelay: 500
  },
  defaults: {
    newTagColor: 'primary',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    pageSize: 20
  },
  data: {
    autoBackup: true,
    backupInterval: 24,
    maxBackups: 10,
    compressionEnabled: true
  }
} 