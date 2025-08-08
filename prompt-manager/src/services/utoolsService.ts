/**
 * uTools 服务类
 * 封装 uTools API 调用，提供类型安全的接口
 */

import type { PreloadAPI, UtoolsDbDoc, FileFilter, PluginEnterAction } from '@/types/utools'
import type { Prompt } from '@/types/Prompt'

class UtoolsService {
  private preload: PreloadAPI | null = null

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.preload = (window as any).preload || null
  }

  /**
   * 检查是否在 uTools 环境中
   */
  get isUtools(): boolean {
    return this.preload?.isUtools() || false
  }

  /**
   * 获取当前主题
   */
  get theme(): 'light' | 'dark' {
    return this.preload?.getTheme?.() || 'light'
  }

  /**
   * 数据存储相关方法
   */
  
  // 保存提示词
  async savePrompt(prompt: Prompt): Promise<boolean> {
    if (!this.preload) return false
    
    try {
      const doc: UtoolsDbDoc = {
        _id: `prompt_${prompt.id}`,
        data: prompt
      }
      
      const result = this.preload.db.put(doc)
      return result?.ok || false
    } catch (error) {
      console.error('保存提示词失败:', error)
      return false
    }
  }

  // 获取提示词
  async getPrompt(id: string): Promise<Prompt | null> {
    if (!this.preload) return null
    
    try {
      const doc = this.preload.db.get(`prompt_${id}`) as UtoolsDbDoc | null
      const prompt = doc?.data as Prompt | undefined
      return prompt ?? null
    } catch (error) {
      console.error('获取提示词失败:', error)
      return null
    }
  }

  // 删除提示词
  async deletePrompt(id: string): Promise<boolean> {
    if (!this.preload) return false
    
    try {
      const result = this.preload.db.remove(`prompt_${id}`)
      return result?.ok || false
    } catch (error) {
      console.error('删除提示词失败:', error)
      return false
    }
  }

  // 获取所有提示词
  async getAllPrompts(): Promise<Prompt[]> {
    if (!this.preload) return []
    
    try {
      const docs = this.preload.db.allDocs('prompt_')
      return docs.map((doc: UtoolsDbDoc) => doc.data as Prompt).filter(Boolean)
    } catch (error) {
      console.error('获取所有提示词失败:', error)
      return []
    }
  }

  // 保存标签
  async saveTag(tag: { id: string; name: string; color?: string }): Promise<boolean> {
    if (!this.preload) return false
    
    try {
      const doc: UtoolsDbDoc = {
        _id: `tag_${tag.id}`,
        data: tag
      }
      
      const result = this.preload.db.put(doc)
      return result?.ok || false
    } catch (error) {
      console.error('保存标签失败:', error)
      return false
    }
  }

  // 获取所有标签
  async getAllTags(): Promise<Array<{ id: string; name: string; color?: string }>> {
    if (!this.preload) return []
    
    try {
      const docs = this.preload.db.allDocs('tag_')
      return docs.map((doc: UtoolsDbDoc) => doc.data as { id: string; name: string; color?: string }).filter(Boolean)
    } catch (error) {
      console.error('获取所有标签失败:', error)
      return []
    }
  }

  /**
   * 剪贴板操作
   */
  
  // 复制文本到剪贴板
  copyText(text: string): boolean {
    if (!this.preload) {
      // 开发环境回退到浏览器 API
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text)
        return true
      }
      return false
    }
    
    this.preload.clipboard.writeText(text)
    return true
  }

  /**
   * 系统通知
   */
  showNotification(title: string, body?: string): boolean {
    if (!this.preload) {
      // 开发环境回退到浏览器通知
      if ('Notification' in window) {
        new Notification(title, { body })
        return true
      }
      return false
    }
    
    this.preload.showNotification(title)
    return true
  }

  /**
   * 文件操作
   */
  
  // 导出提示词到文件
  async exportPrompts(prompts: Prompt[]): Promise<boolean> {
    if (!this.preload) {
      // 开发环境回退到下载
      const dataStr = JSON.stringify(prompts, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'prompts.json'
      link.click()
      URL.revokeObjectURL(url)
      return true
    }
    
    const content = JSON.stringify(prompts, null, 2)
    return this.preload.file.saveFile(content, 'prompts.json')
  }

  // 导入提示词从文件
  async importPrompts(): Promise<Prompt[]> {
    if (!this.preload) {
      // 开发环境回退到文件输入
      return new Promise((resolve) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0]
          if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
              try {
                const prompts = JSON.parse(e.target?.result as string)
                resolve(Array.isArray(prompts) ? prompts : [])
              } catch {
                resolve([])
              }
            }
            reader.readAsText(file)
          } else {
            resolve([])
          }
        }
        input.click()
      })
    }
    
    const filters: FileFilter[] = [
      { name: 'JSON 文件', extensions: ['json'] },
      { name: '所有文件', extensions: ['*'] }
    ]
    
    try {
      const files = await this.preload.file.selectFile(filters)
      if (!files || files.length === 0) return []
      
      const content = await this.preload.file.readFile(files[0])
      if (!content) return []
      
      const prompts = JSON.parse(content)
      return Array.isArray(prompts) ? prompts : []
    } catch (error) {
      console.error('解析导入文件失败:', error)
      return []
    }
  }

  /**
   * 窗口控制
   */
  setWindowSize(width: number, height: number): void {
    this.preload?.window.setSize(width, height)
  }

  hideWindow(): void {
    this.preload?.window.hide()
  }

  showWindow(): void {
    this.preload?.window.show()
  }

  /**
   * 插件生命周期
   */
  onPluginEnter(callback: (action: PluginEnterAction) => void): void {
    this.preload?.onPluginEnter(callback)
  }

  onPluginReady(callback: () => void): void {
    this.preload?.onPluginReady(callback)
  }

  onPluginDetach(callback: () => void): void {
    this.preload?.onPluginDetach(callback)
  }

  /**
   * 用户信息
   */
  getUserInfo() {
    return this.preload?.getUserInfo?.() || null
  }
}

// 创建单例实例
export const utoolsService = new UtoolsService()
export default utoolsService