/**
 * 数据验证器
 * 提供 Prompt 和 Tag 的验证逻辑
 */

import type { Prompt, CreatePromptDTO, UpdatePromptDTO } from '@/types/Prompt'
import type { Tag, CreateTagDTO, UpdateTagDTO, TagColor } from '@/types/Tag'
import { TAG_COLOR_CONFIGS } from '@/types/Tag'

// 验证结果接口
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// 验证错误类型
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: string[] = [],
    public warnings: string[] = []
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * 通用验证工具函数
 */
export class ValidationUtils {
  // 检查字符串长度
  static validateLength(
    value: string,
    field: string,
    min: number = 0,
    max: number = Number.MAX_SAFE_INTEGER
  ): string[] {
    const errors: string[] = []
    const length = value.trim().length

    if (length < min) {
      errors.push(`${field}长度不能少于${min}个字符`)
    }
    if (length > max) {
      errors.push(`${field}长度不能超过${max}个字符`)
    }

    return errors
  }

  // 检查是否为空
  static validateRequired(value: unknown, field: string): string[] {
    const errors: string[] = []
    
    if (value === null || value === undefined || value === '') {
      errors.push(`${field}不能为空`)
    } else if (typeof value === 'string' && value.trim() === '') {
      errors.push(`${field}不能为空`)
    }

    return errors
  }

  // 检查字符串格式
  static validateFormat(
    value: string,
    field: string,
    pattern: RegExp,
    message: string
  ): string[] {
    const errors: string[] = []
    
    if (!pattern.test(value)) {
      errors.push(`${field}${message}`)
    }

    return errors
  }

  // 检查数组长度
  static validateArrayLength(
    value: unknown[],
    field: string,
    min: number = 0,
    max: number = Number.MAX_SAFE_INTEGER
  ): string[] {
    const errors: string[] = []
    
    if (value.length < min) {
      errors.push(`${field}至少需要${min}项`)
    }
    if (value.length > max) {
      errors.push(`${field}最多只能有${max}项`)
    }

    return errors
  }

  // 检查是否为有效的日期字符串
  static validateDateString(value: string, field: string): string[] {
    const errors: string[] = []
    
    try {
      const date = new Date(value)
      if (isNaN(date.getTime())) {
        errors.push(`${field}不是有效的日期格式`)
      }
    } catch {
      errors.push(`${field}不是有效的日期格式`)
    }

    return errors
  }

  // 检查 UUID 格式
  static validateUUID(value: string, field: string): string[] {
    const errors: string[] = []
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    
    if (!uuidPattern.test(value)) {
      errors.push(`${field}格式不正确`)
    }

    return errors
  }
}

/**
 * 提示词验证器
 */
export class PromptValidator {
  // 验证创建提示词的数据
  static validateCreate(data: CreatePromptDTO): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 验证标题
    errors.push(...ValidationUtils.validateRequired(data.title, '标题'))
    errors.push(...ValidationUtils.validateLength(data.title, '标题', 1, 100))

    // 验证内容
    errors.push(...ValidationUtils.validateRequired(data.content, '内容'))
    errors.push(...ValidationUtils.validateLength(data.content, '内容', 1, 10000))

    // 验证标签
    if (data.tags) {
      errors.push(...ValidationUtils.validateArrayLength(data.tags, '标签', 0, 10))
      
      // 检查标签ID格式
      data.tags.forEach((tagId, index) => {
        if (!tagId || typeof tagId !== 'string') {
          errors.push(`标签${index + 1}的ID格式不正确`)
        }
      })

      // 检查标签重复
      const uniqueTags = new Set(data.tags)
      if (uniqueTags.size !== data.tags.length) {
        warnings.push('存在重复的标签')
      }
    }

    // 验证来源
    if (data.source) {
      errors.push(...ValidationUtils.validateLength(data.source, '来源', 0, 200))
    }

    // 内容格式检查（警告）
    if (data.content.length > 5000) {
      warnings.push('内容较长，建议适当精简')
    }

    // 检查是否包含敏感词（简单示例）
    const sensitiveWords = ['password', '密码', 'secret', '机密']
    const lowerContent = data.content.toLowerCase()
    if (sensitiveWords.some(word => lowerContent.includes(word))) {
      warnings.push('内容可能包含敏感信息，请检查')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  // 验证更新提示词的数据
  static validateUpdate(data: UpdatePromptDTO): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 只验证提供的字段
    if (data.title !== undefined) {
      errors.push(...ValidationUtils.validateRequired(data.title, '标题'))
      errors.push(...ValidationUtils.validateLength(data.title, '标题', 1, 100))
    }

    if (data.content !== undefined) {
      errors.push(...ValidationUtils.validateRequired(data.content, '内容'))
      errors.push(...ValidationUtils.validateLength(data.content, '内容', 1, 10000))
      
      if (data.content.length > 5000) {
        warnings.push('内容较长，建议适当精简')
      }
    }

    if (data.tags !== undefined) {
      errors.push(...ValidationUtils.validateArrayLength(data.tags, '标签', 0, 10))
      
      data.tags.forEach((tagId, index) => {
        if (!tagId || typeof tagId !== 'string') {
          errors.push(`标签${index + 1}的ID格式不正确`)
        }
      })

      const uniqueTags = new Set(data.tags)
      if (uniqueTags.size !== data.tags.length) {
        warnings.push('存在重复的标签')
      }
    }

    if (data.source !== undefined && data.source !== null) {
      errors.push(...ValidationUtils.validateLength(data.source, '来源', 0, 200))
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  // 验证完整的提示词对象
  static validatePrompt(prompt: Prompt): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 验证基础字段
    errors.push(...ValidationUtils.validateRequired(prompt.id, 'ID'))
    errors.push(...ValidationUtils.validateRequired(prompt.title, '标题'))
    errors.push(...ValidationUtils.validateRequired(prompt.content, '内容'))
    errors.push(...ValidationUtils.validateRequired(prompt.createdAt, '创建时间'))
    errors.push(...ValidationUtils.validateRequired(prompt.updatedAt, '更新时间'))

    // 验证长度
    errors.push(...ValidationUtils.validateLength(prompt.title, '标题', 1, 100))
    errors.push(...ValidationUtils.validateLength(prompt.content, '内容', 1, 10000))

    // 验证日期格式
    errors.push(...ValidationUtils.validateDateString(prompt.createdAt, '创建时间'))
    errors.push(...ValidationUtils.validateDateString(prompt.updatedAt, '更新时间'))

    // 验证标签数组
    if (!Array.isArray(prompt.tags)) {
      errors.push('标签必须是数组格式')
    } else {
      errors.push(...ValidationUtils.validateArrayLength(prompt.tags, '标签', 0, 10))
    }

    // 验证来源
    if (prompt.source) {
      errors.push(...ValidationUtils.validateLength(prompt.source, '来源', 0, 200))
    }

    // 逻辑验证
    const createdTime = new Date(prompt.createdAt).getTime()
    const updatedTime = new Date(prompt.updatedAt).getTime()
    if (updatedTime < createdTime) {
      errors.push('更新时间不能早于创建时间')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
}

/**
 * 标签验证器
 */
export class TagValidator {
  // 检查标签颜色是否有效
  static isValidTagColor(color: string): color is TagColor {
    return Object.keys(TAG_COLOR_CONFIGS).includes(color as TagColor)
  }

  // 验证创建标签的数据
  static validateCreate(data: CreateTagDTO): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 验证名称
    errors.push(...ValidationUtils.validateRequired(data.name, '名称'))
    errors.push(...ValidationUtils.validateLength(data.name, '名称', 1, 6))

    // 验证名称格式（不允许特殊字符）
    const namePattern = /^[\u4e00-\u9fa5a-zA-Z0-9\s-_]+$/
    errors.push(...ValidationUtils.validateFormat(
      data.name,
      '名称',
      namePattern,
      '只能包含中文、英文、数字、空格、短横线和下划线'
    ))

    // 验证颜色
    if (data.color && !this.isValidTagColor(data.color)) {
      errors.push('标签颜色不在支持的范围内')
    }

    // 验证描述
    if (data.description) {
      errors.push(...ValidationUtils.validateLength(data.description, '描述', 0, 100))
    }

    // 名称警告检查
    if (data.name.length === 6) {
      warnings.push('标签名称已达到最大长度限制')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  // 验证更新标签的数据
  static validateUpdate(data: UpdateTagDTO): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 只验证提供的字段
    if (data.name !== undefined) {
      errors.push(...ValidationUtils.validateRequired(data.name, '名称'))
      errors.push(...ValidationUtils.validateLength(data.name, '名称', 1, 6))

      const namePattern = /^[\u4e00-\u9fa5a-zA-Z0-9\s-_]+$/
      errors.push(...ValidationUtils.validateFormat(
        data.name,
        '名称',
        namePattern,
        '只能包含中文、英文、数字、空格、短横线和下划线'
      ))

      if (data.name.length === 6) {
        warnings.push('标签名称已达到最大长度限制')
      }
    }

    if (data.color !== undefined && !this.isValidTagColor(data.color)) {
      errors.push('标签颜色不在支持的范围内')
    }

    if (data.description !== undefined && data.description !== null) {
      errors.push(...ValidationUtils.validateLength(data.description, '描述', 0, 100))
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  // 验证完整的标签对象
  static validateTag(tag: Tag): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 验证基础字段
    errors.push(...ValidationUtils.validateRequired(tag.id, 'ID'))
    errors.push(...ValidationUtils.validateRequired(tag.name, '名称'))
    errors.push(...ValidationUtils.validateRequired(tag.color, '颜色'))
    errors.push(...ValidationUtils.validateRequired(tag.createdAt, '创建时间'))
    errors.push(...ValidationUtils.validateRequired(tag.updatedAt, '更新时间'))

    // 验证长度和格式
    errors.push(...ValidationUtils.validateLength(tag.name, '名称', 1, 6))
    
    const namePattern = /^[\u4e00-\u9fa5a-zA-Z0-9\s-_]+$/
    errors.push(...ValidationUtils.validateFormat(
      tag.name,
      '名称',
      namePattern,
      '只能包含中文、英文、数字、空格、短横线和下划线'
    ))

    // 验证颜色
    if (!this.isValidTagColor(tag.color)) {
      errors.push('标签颜色不在支持的范围内')
    }

    // 验证描述
    if (tag.description) {
      errors.push(...ValidationUtils.validateLength(tag.description, '描述', 0, 100))
    }

    // 验证提示词数量
    if (typeof tag.promptCount !== 'number' || tag.promptCount < 0) {
      errors.push('提示词数量必须是非负整数')
    }

    // 验证日期格式
    errors.push(...ValidationUtils.validateDateString(tag.createdAt, '创建时间'))
    errors.push(...ValidationUtils.validateDateString(tag.updatedAt, '更新时间'))

    // 逻辑验证
    const createdTime = new Date(tag.createdAt).getTime()
    const updatedTime = new Date(tag.updatedAt).getTime()
    if (updatedTime < createdTime) {
      errors.push('更新时间不能早于创建时间')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  // 验证标签删除操作
  static validateDelete(tag: Tag, forceDelete: boolean = false): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!forceDelete && tag.promptCount > 0) {
      warnings.push(`该标签关联了 ${tag.promptCount} 个提示词，删除后这些关联将被移除`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
}

// 导出主要验证函数的便捷版本
export const validatePromptCreate = PromptValidator.validateCreate
export const validatePromptUpdate = PromptValidator.validateUpdate
export const validatePrompt = PromptValidator.validatePrompt

export const validateTagCreate = TagValidator.validateCreate
export const validateTagUpdate = TagValidator.validateUpdate
export const validateTag = TagValidator.validateTag
export const validateTagDelete = TagValidator.validateDelete

// 抛出验证错误的辅助函数
export function throwIfInvalid(result: ValidationResult, operation: string = '操作'): void {
  if (!result.isValid) {
    throw new ValidationError(
      `${operation}验证失败`,
      result.errors,
      result.warnings
    )
  }
} 