// uTools API 类型定义

declare global {
  interface Window {
    preloadAPI: PreloadAPI
    preload: PreloadAPI
    nodeAPI: {
      fs: typeof import('fs')
      path: typeof import('path')
      ipcRenderer: any
    }
    utools: UTools
  }
}

export interface PreloadAPI {
  // 基础方法
  showNotification: (message: string) => void
  copyText: (text: string) => void
  hideMainWindow: () => void
  getPluginInfo: () => { version: string; env: string }
  isUtools: () => boolean
  
  // 主题相关
  getTheme?: () => 'light' | 'dark'
  
  // 数据库操作
  db: {
    put: (doc: UtoolsDbDoc) => { ok: boolean; id: string; rev: string }
    get: (id: string) => UtoolsDbDoc | null
    remove: (id: string) => { ok: boolean; id: string; rev: string }
    allDocs: (prefix?: string) => UtoolsDbDoc[]
  }
  
  // 剪贴板操作
  clipboard: {
    writeText: (text: string) => Promise<void>
    readText: () => Promise<string>
  }
  
  // 文件操作
  file: {
    saveFile: (content: string, filename: string) => Promise<boolean>
    selectFile: (filters?: FileFilter[]) => Promise<string[]>
    readFile: (filepath: string) => Promise<string>
  }
  
  // 窗口操作
  window: {
    setSize: (width: number, height: number) => void
    hide: () => void
    show: () => void
  }
  
  // 插件生命周期
  onPluginEnter: (callback: (action: PluginEnterAction) => void) => void
  onPluginReady: (callback: () => void) => void
  onPluginDetach: (callback: () => void) => void
  
  // 用户信息
  getUserInfo?: () => { nickname: string; avatar: string } | null
}

export interface UtoolsDbDoc {
  _id: string
  _rev?: string
  data?: any
  [key: string]: any
}

export interface FileFilter {
  name: string
  extensions: string[]
}

export interface PluginEnterAction {
  code: string
  type: string
  payload: any
}

interface UTools {
  // 数据库操作
  db: {
    put: (doc: { _id: string; [key: string]: any }) => { ok: boolean; id: string; rev: string }
    get: (id: string) => any
    remove: (docOrId: string | { _id: string; _rev: string }) => { ok: boolean; id: string; rev: string }
    bulkDocs: (docs: any[]) => any[]
    allDocs: (key?: string) => any[]
  }

  // 基础功能
  copyText: (text: string) => void
  showNotification: (text: string, clickFeatureCode?: string) => void
  hideMainWindow: () => void
  showMainWindow: () => void
  setExpendHeight: (height: number) => void
  
  // 插件信息
  getPluginInfo: () => {
    version: string
    env: 'dev' | 'prod'
  }

  // 事件监听
  onPluginEnter: (callback: (action: PluginEnterAction) => void) => void
  onPluginOut: (callback: () => void) => void
  onPluginDetach: (callback: () => void) => void
}

interface PluginEnterAction {
  code: string
  type: string
  payload: any
}

export {} 