/**
 * uTools API 封装层
 * 提供统一的数据操作和系统功能接口
 */

// 检查是否在 uTools 环境中
export const isUToolsEnv = (): boolean => {
  return typeof window !== 'undefined' && typeof window.utools !== 'undefined'
}

// 数据库操作类
export class UtoolsDB {
  private dbPrefix = 'prompt_manager_'

  /**
   * 生成带前缀的数据库键
   */
  private getKey(id: string): string {
    return `${this.dbPrefix}${id}`
  }

  /**
   * 存储数据
   */
  put<T = any>(id: string, data: T): { ok: boolean; id: string; rev: string } {
    if (!isUToolsEnv()) {
      // 开发环境使用 localStorage 模拟
      localStorage.setItem(this.getKey(id), JSON.stringify(data))
      return { ok: true, id, rev: Date.now().toString() }
    }

    const doc = {
      _id: this.getKey(id),
      data,
      updatedAt: new Date().toISOString()
    }

    return window.utools.db.put(doc)
  }

  /**
   * 获取数据
   */
  get<T = any>(id: string): T | null {
    if (!isUToolsEnv()) {
      // 开发环境使用 localStorage 模拟
      const data = localStorage.getItem(this.getKey(id))
      return data ? JSON.parse(data) : null
    }

    const doc = window.utools.db.get(this.getKey(id))
    return doc ? doc.data : null
  }

  /**
   * 删除数据
   */
  remove(id: string): { ok: boolean; id: string; rev: string } {
    if (!isUToolsEnv()) {
      // 开发环境使用 localStorage 模拟
      localStorage.removeItem(this.getKey(id))
      return { ok: true, id, rev: Date.now().toString() }
    }

    return window.utools.db.remove(this.getKey(id))
  }

  /**
   * 获取所有文档
   */
  allDocs<T = any>(): T[] {
    if (!isUToolsEnv()) {
      // 开发环境使用 localStorage 模拟
      const keys = Object.keys(localStorage).filter(key => key.startsWith(this.dbPrefix))
      return keys.map(key => {
        const data = localStorage.getItem(key)
        return data ? JSON.parse(data) : null
      }).filter(Boolean)
    }

    const docs = window.utools.db.allDocs(this.dbPrefix)
    return docs.map(doc => doc.data).filter(Boolean)
  }

  /**
   * 批量操作
   */
  bulkDocs<T = any>(operations: Array<{ id: string; data?: T; delete?: boolean }>): any[] {
    if (!isUToolsEnv()) {
      // 开发环境模拟批量操作
      return operations.map(op => {
        if (op.delete) {
          return this.remove(op.id)
        } else if (op.data) {
          return this.put(op.id, op.data)
        }
        return { ok: false, id: op.id, error: 'Invalid operation' }
      })
    }

    const docs = operations.map(op => {
      if (op.delete) {
        return { _deleted: true, _id: this.getKey(op.id) }
      } else {
        return {
          _id: this.getKey(op.id),
          data: op.data,
          updatedAt: new Date().toISOString()
        }
      }
    })

    return window.utools.db.bulkDocs(docs)
  }

  /**
   * 导出所有数据
   */
  exportData(): string {
    const allData = this.allDocs()
    return JSON.stringify({
      exportTime: new Date().toISOString(),
      version: '1.0.0',
      data: allData
    }, null, 2)
  }

  /**
   * 导入数据
   */
  importData(jsonData: string): { success: boolean; imported: number; errors: string[] } {
    try {
      const { data } = JSON.parse(jsonData)
      const errors: string[] = []
      let imported = 0

      if (Array.isArray(data)) {
        data.forEach((item, index) => {
          try {
            if (item.id) {
              this.put(item.id, item)
              imported++
            } else {
              errors.push(`第 ${index + 1} 项缺少 id 字段`)
            }
          } catch (err) {
            errors.push(`第 ${index + 1} 项导入失败: ${err}`)
          }
        })
      }

      return { success: true, imported, errors }
    } catch (err) {
      return { success: false, imported: 0, errors: [`数据格式错误: ${err}`] }
    }
  }
}

// 系统功能类
export class UtoolsSystem {
  /**
   * 复制文本到剪贴板
   */
  static copyText(text: string): void {
    if (!isUToolsEnv()) {
      // 开发环境使用浏览器 API
      navigator.clipboard?.writeText(text).then(() => {
        console.log('已复制到剪贴板:', text)
      }).catch(err => {
        console.error('复制失败:', err)
      })
      return
    }

    if (window.preloadAPI?.copyText) {
      window.preloadAPI.copyText(text)
    } else {
      window.utools.copyText(text)
      this.showNotification('已复制到剪贴板')
    }
  }

  /**
   * 显示通知
   */
  static showNotification(message: string): void {
    if (!isUToolsEnv()) {
      // 开发环境使用 console 或浏览器通知
      console.log('通知:', message)
      return
    }

    if (window.preloadAPI?.showNotification) {
      window.preloadAPI.showNotification(message)
    } else {
      window.utools.showNotification(message)
    }
  }

  /**
   * 隐藏主窗口
   */
  static hideMainWindow(): void {
    if (!isUToolsEnv()) {
      console.log('隐藏主窗口')
      return
    }

    if (window.preloadAPI?.hideMainWindow) {
      window.preloadAPI.hideMainWindow()
    } else {
      window.utools.hideMainWindow()
    }
  }

  /**
   * 获取插件信息
   */
  static getPluginInfo(): { version: string; env: string } {
    if (!isUToolsEnv()) {
      return { version: '1.0.0', env: 'dev' }
    }

    if (window.preloadAPI?.getPluginInfo) {
      return window.preloadAPI.getPluginInfo()
    } else {
      return window.utools.getPluginInfo()
    }
  }
}

// 导出实例
export const utoolsDB = new UtoolsDB()
export const utoolsSystem = UtoolsSystem 