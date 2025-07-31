// uTools API 类型定义

declare global {
  interface Window {
    preloadAPI: {
      showNotification: (message: string) => void
      copyText: (text: string) => void
      hideMainWindow: () => void
      getPluginInfo: () => { version: string; env: string }
    }
    nodeAPI: {
      fs: typeof import('fs')
      path: typeof import('path')
      ipcRenderer: any
    }
    utools: UTools
  }
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