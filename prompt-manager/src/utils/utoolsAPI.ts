/**
 * uTools API 封装层
 * 提供统一的数据操作和系统功能接口
 */

// 通用的 uTools 数据库文档类型
export interface DBDoc {
  _id: string;
  _rev?: string;
  [key: string]: unknown; // 允许任何其他属性
}

// 检查是否在 uTools 环境中
export const isUToolsEnv = (): boolean => {
  const result = typeof window !== 'undefined' && typeof window.utools !== 'undefined'
  console.log('🔍 环境检查:', { 
    hasWindow: typeof window !== 'undefined', 
    hasUtools: typeof window !== 'undefined' && typeof window.utools !== 'undefined',
    isUToolsEnv: result 
  })
  return result
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
   * 保存数据
   * @param id 文档ID（可以是简单ID或完整ID）
   * @param data 要保存的数据
   */
  put<T extends object>(id: string, data: T): { ok: boolean; id: string; rev: string } {
    if (!isUToolsEnv()) {
      // 开发环境使用 localStorage 模拟
      const key = id.startsWith(this.dbPrefix) ? id : this.getKey(id)
      const jsonData = JSON.stringify(data)
      localStorage.setItem(key, jsonData)
      console.log('📝 保存数据到 localStorage:', { key, data })
      return { ok: true, id, rev: Date.now().toString() }
    }

    // 检测ID是否已经包含前缀，避免重复添加
    const dbKey = id.startsWith(this.dbPrefix) ? id : this.getKey(id)
    
    // 获取现有文档以获得正确的 _rev
    const existingDoc = window.utools.db.get(dbKey) as { _rev?: string } | null
    console.log('🔍 获取现有文档:', { originalId: id, dbKey, existingDoc })
    
    // 构建要保存的文档 - 直接使用业务数据作为文档内容，而不是嵌套在data字段中
    const doc = {
      _id: dbKey,
      ...data, // 直接展开业务数据
      updatedAt: new Date().toISOString(),
      // 如果存在现有文档，使用其 _rev 来避免冲突
      ...(existingDoc && existingDoc._rev && { _rev: existingDoc._rev })
    }

    console.log('📝 准备保存文档到 uTools 数据库:', { doc, existingDoc })
    const result = window.utools.db.put(doc)
    console.log('📝 uTools 数据库保存结果:', result)
    
    return result
  }

  /**
   * 读取一个文档
   * @param id 文档ID（可以是简单ID或完整ID）
   */
  get<T extends DBDoc>(id: string): T | null {
    if (!isUToolsEnv()) {
      // 开发环境使用 localStorage
      const key = id.startsWith(this.dbPrefix) ? id : this.getKey(id)
      const data = localStorage.getItem(key)
      const result = data ? JSON.parse(data) : null
      console.log('📖 从 localStorage 读取数据:', { key, result })
      return result
    }

    // 检测ID是否已经包含前缀，避免重复添加
    const dbKey = id.startsWith(this.dbPrefix) ? id : this.getKey(id)
    console.log('📖 准备获取文档:', dbKey)
    const doc = window.utools.db.get(dbKey)
    console.log('📖 从 uTools 数据库读取数据:', { originalId: id, dbKey, doc })
    return doc as T | null
  }

  /**
   * 物理删除一个文档
   * @param docOrId 文档对象或文档ID
   */
  remove(docOrId: string | DBDoc): { ok: boolean; error?: boolean; message?: string } {
    if (!window.utools) {
      console.warn('uTools API 在浏览器环境中不可用。')
      return { ok: true } // 在开发环境中模拟成功
    }
    try {
      console.log('🗑️ 准备删除文档:', docOrId)
      let target: string | { _id: string; _rev: string }
      if (typeof docOrId === 'string') {
        target = docOrId
      } else {
        const id = docOrId._id
        let rev = (docOrId as { _rev?: string })._rev
        if (!rev) {
          const existing = window.utools.db.get(id) as { _rev?: string } | null
          rev = existing?._rev
        }
        target = rev ? { _id: id, _rev: rev } : id
      }
      const result = window.utools.db.remove(target)
      console.log('🗑️ 删除结果:', result)
      return result
    } catch (error) {
      console.error('🔴 uToolsDB.remove 失败:', { docOrId, error })
      return { ok: false, error: true, message: String(error) }
    }
  }

  /**
   * 获取所有文档
   */
  allDocs(idPrefix?: string): DBDoc[] {
    if (!window.utools) {
      console.warn('uTools API 在浏览器环境中不可用。')
      return []
    }
    try {
      // uTools 的 allDocs 不接受前缀参数，总是获取所有文档
      let docs = window.utools.db.allDocs()
      console.log('uTools.db.allDocs 返回:', docs)

      // 过滤掉已删除的文档 (墓碑记录)
      docs = docs.filter((doc) => !doc._deleted)

      // 如果指定了前缀，在应用层进行过滤
      if (idPrefix) {
        docs = docs.filter((doc) => doc._id && doc._id.includes(idPrefix))
      }

      // uTools 返回的文档结构是完整的文档对象，不需要从 doc.data 中提取
      return docs.map((doc: DBDoc) => {
        // 直接返回完整的文档对象，确保包含所有字段
        console.log('📦 allDocs 处理单个文档:', { original: doc })
        return doc
      })
    } catch (error) {
      console.error('🔴 uToolsDB.allDocs 失败:', error)
      return []
    }
  }

  /**
   * 批量操作
   */
  bulkDocs<T extends object>(operations: Array<{ id: string; data?: T; delete?: boolean }>): { ok: boolean; id: string; rev: string }[] {
    if (!isUToolsEnv()) {
      // 开发环境模拟批量操作，统一返回 { ok, id, rev }
      return operations.map(op => {
        if (op.delete) {
          const res = this.remove(op.id)
          return { ok: res.ok, id: op.id, rev: Date.now().toString() }
        } else if (op.data) {
          const res = this.put(op.id, op.data)
          return res
        }
        return { ok: false, id: op.id, rev: '' }
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
        data.forEach((item: DBDoc, index: number) => {
          try {
            if (item._id) {
              this.put(item._id, item)
              imported++
            } else {
              errors.push(`第 ${index + 1} 项缺少 id 字段`)
            }
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            errors.push(`第 ${index + 1} 项导入失败: ${errorMessage}`)
          }
        })
      }

      return { success: true, imported, errors }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return { success: false, imported: 0, errors: [`数据格式错误: ${errorMessage}`] }
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