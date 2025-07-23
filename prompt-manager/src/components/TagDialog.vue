<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Tag, TagColor, CreateTagDTO, UpdateTagDTO } from '@/types/Tag'
import { TAG_COLOR_CONFIGS } from '@/types/Tag'

// Props
interface Props {
  visible: boolean
  tag?: Tag | null
  mode: 'create' | 'edit'
}

const props = defineProps<Props>()

// Emits
interface Emits {
  (e: 'update:visible', visible: boolean): void
  (e: 'confirm', data: CreateTagDTO | UpdateTagDTO): void
  (e: 'cancel'): void
}

const emit = defineEmits<Emits>()

// 响应式数据
const formData = ref({
  name: '',
  color: 'primary' as TagColor,
  description: ''
})

const isSubmitting = ref(false)

// 计算属性
const title = computed(() => props.mode === 'create' ? '添加标签' : '编辑标签')
const confirmText = computed(() => props.mode === 'create' ? '添加' : '保存')

const colorOptions = computed(() => {
  return Object.values(TAG_COLOR_CONFIGS).map(config => ({
    value: config.color,
    label: config.label,
    hex: config.hex,
    background: config.background
  }))
})

// 表单验证
const errors = ref<Record<string, string>>({})

const validateForm = () => {
  errors.value = {}
  
  if (!formData.value.name.trim()) {
    errors.value.name = '标签名称不能为空'
  } else if (formData.value.name.length > 20) {
    errors.value.name = '标签名称不能超过20个字符'
  }
  
  if (formData.value.description && formData.value.description.length > 100) {
    errors.value.description = '标签描述不能超过100个字符'
  }
  
  return Object.keys(errors.value).length === 0
}

// 方法
const handleClose = () => {
  emit('update:visible', false)
  emit('cancel')
}

const handleConfirm = async () => {
  if (!validateForm()) {
    return
  }
  
  isSubmitting.value = true
  
  try {
    const data = {
      name: formData.value.name.trim(),
      color: formData.value.color,
      description: formData.value.description.trim() || undefined
    }
    
    emit('confirm', data)
    emit('update:visible', false)
  } catch (error) {
    console.error('保存标签失败:', error)
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  formData.value = {
    name: '',
    color: 'primary',
    description: ''
  }
  errors.value = {}
  isSubmitting.value = false
}

// 初始化表单数据
const initFormData = () => {
  if (props.mode === 'edit' && props.tag) {
    formData.value = {
      name: props.tag.name,
      color: props.tag.color,
      description: props.tag.description || ''
    }
  } else {
    resetForm()
  }
}

// 监听props变化
watch(() => props.visible, (visible) => {
  if (visible) {
    initFormData()
  }
})

watch(() => props.tag, (tag) => {
  if (props.visible && props.mode === 'edit' && tag) {
    initFormData()
  }
})

watch(() => props.mode, () => {
  if (props.visible) {
    initFormData()
  }
})
</script>

<template>
  <div v-if="visible" class="dialog-overlay" @click.self="handleClose">
    <div class="dialog-container">
      <div class="dialog-header">
        <h3 class="dialog-title">{{ title }}</h3>
        <button class="dialog-close" @click="handleClose">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div class="dialog-body">
        <form @submit.prevent="handleConfirm">
          <!-- 标签名称 -->
          <div class="form-group">
            <label class="form-label" for="tag-name">
              标签名称 <span class="required">*</span>
            </label>
            <input
              id="tag-name"
              v-model="formData.name"
              type="text"
              class="form-input"
              :class="{ error: errors.name }"
              placeholder="请输入标签名称（最多20个字符）"
              maxlength="20"
              @blur="validateForm"
            />
            <div v-if="errors.name" class="error-message">{{ errors.name }}</div>
            <div class="form-hint">限制最多20个字符，超过8个字符将显示省略号</div>
          </div>
          
          <!-- 标签颜色 -->
          <div class="form-group">
            <label class="form-label">标签颜色</label>
            <div class="color-selector">
              <div 
                v-for="colorOption in colorOptions"
                :key="colorOption.value"
                class="color-option"
                :class="{ active: formData.color === colorOption.value }"
                @click="formData.color = colorOption.value"
                :title="colorOption.label"
              >
                <div 
                  class="color-circle" 
                  :style="{ backgroundColor: colorOption.hex }"
                ></div>
                <span class="color-label">{{ colorOption.label }}</span>
              </div>
            </div>
          </div>
          
          <!-- 标签描述 -->
          <div class="form-group">
            <label class="form-label" for="tag-description">标签描述</label>
            <textarea
              id="tag-description"
              v-model="formData.description"
              class="form-textarea"
              :class="{ error: errors.description }"
              placeholder="可选：为标签添加简短描述"
              rows="3"
              maxlength="100"
              @blur="validateForm"
            ></textarea>
            <div v-if="errors.description" class="error-message">{{ errors.description }}</div>
            <div class="form-hint">{{ formData.description.length }}/100 字符</div>
          </div>
        </form>
      </div>
      
      <div class="dialog-footer">
        <button 
          type="button" 
          class="btn-secondary" 
          @click="handleClose"
          :disabled="isSubmitting"
        >
          取消
        </button>
        <button 
          type="submit" 
          class="btn-primary" 
          @click="handleConfirm"
          :disabled="isSubmitting"
        >
          <svg v-if="isSubmitting" class="loading-spinner" width="16" height="16" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"/>
          </svg>
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.dialog-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 480px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border-color);
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.dialog-close {
  background: none;
  border: none;
  color: var(--text-color-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.dialog-close:hover {
  background: var(--hover-background);
  color: var(--text-color);
}

.dialog-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 8px;
}

.required {
  color: #ff4757;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(0, 178, 90, 0.1);
}

.form-input.error,
.form-textarea.error {
  border-color: #ff4757;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.form-hint {
  font-size: 12px;
  color: var(--text-color-secondary);
  margin-top: 4px;
}

.error-message {
  font-size: 12px;
  color: #ff4757;
  margin-top: 4px;
}

.color-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 8px;
}

.color-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-option:hover {
  background: var(--hover-background);
}

.color-option.active {
  border-color: var(--primary-color);
  background: rgba(0, 178, 90, 0.1);
}

.color-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.1);
}

.color-label {
  font-size: 12px;
  color: var(--text-color);
  text-align: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px 20px;
  border-top: 1px solid var(--border-color);
  background: #fafafa;
}

.btn-secondary,
.btn-primary {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-secondary {
  background: white;
  color: var(--text-color);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--hover-background);
}

.btn-primary {
  background: var(--primary-color);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 178, 90, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: #00a555;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 178, 90, 0.4);
}

.btn-secondary:disabled,
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dialog-container {
    width: 95%;
    margin: 20px;
  }
  
  .color-selector {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .dialog-footer {
    flex-direction: column-reverse;
  }
  
  .btn-secondary,
  .btn-primary {
    width: 100%;
    justify-content: center;
  }
}
</style> 