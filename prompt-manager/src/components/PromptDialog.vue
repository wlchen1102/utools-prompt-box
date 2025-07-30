<template>
  <n-modal
    :show="visible"
    preset="dialog"
    :title="isEditing ? '编辑提示词' : '新增提示词'"
    :positive-text="isEditing ? '保存' : '创建'"
    negative-text="取消"
    :loading="loading"
    @positive-click="handleSave"
    @negative-click="handleCancel"
    @close="handleCancel"
    @update:show="$emit('update:visible', $event)"
    style="width: 720px; max-width: 85vw;"
  >
    <n-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-placement="top"
      require-mark-placement="right-hanging"
      class="prompt-dialog-form"
    >
      <!-- 标题输入 -->
      <n-form-item path="title" class="form-item-clean">
        <n-input
          v-model:value="formData.title"
          placeholder="提示词标题"
          maxlength="100"
          show-count
          :disabled="loading"
          size="large"
          class="title-input"
        />
      </n-form-item>

      <!-- 内容输入 - 代码块样式 -->
      <n-form-item path="content" class="form-item-clean">
        <div class="content-editor-container">
          <div class="editor-header">
            <span class="editor-label">提示词内容</span>
            <n-button 
              size="small" 
              quaternary 
              type="primary" 
              @click="copyContent"
              :disabled="!formData.content.trim()"
            >
              <template #icon>
                <n-icon>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="m5 15-4-4 4-4"></path>
                    <path d="m11 6 4-4 4 4"></path>
                  </svg>
                </n-icon>
              </template>
              一键复制
            </n-button>
          </div>
          <n-input
            v-model:value="formData.content"
            type="textarea"
            placeholder="请输入提示词内容，支持 Markdown 格式..."
            :rows="10"
            :disabled="loading"
            class="content-editor"
            show-count
          />
        </div>
      </n-form-item>

      <!-- 标签选择 -->
      <n-form-item path="tags" class="form-item-clean">
        <n-select
          v-model:value="formData.tags"
          multiple
          :options="tagOptions"
          placeholder="标签（全局功能关键字）"
          :disabled="loading"
          clearable
          filterable
          tag
          :on-create="handleCreateTag"
          size="large"
        />
      </n-form-item>

      <!-- 来源链接 -->
      <n-form-item path="source" class="form-item-clean">
        <n-input
          v-model:value="formData.source"
          placeholder="备注说明"
          :disabled="loading"
          size="large"
        />
      </n-form-item>


    </n-form>


  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { 
  NModal, NForm, NFormItem, NInput, NButton, NSelect, NIcon,
  useMessage, type FormInst 
} from 'naive-ui'

import { useTagStore } from '@/stores/tagStore'
import type { Prompt, CreatePromptDTO, UpdatePromptDTO } from '@/types/Prompt'
import type { Tag, CreateTagDTO, UpdateTagDTO } from '@/types/Tag'
import { validatePrompt } from '@/utils/validators'
import { promptService } from '@/services/PromptService'

// Props 和 Emits
interface Props {
  visible: boolean
  prompt?: Prompt | null
}

interface Emits {
  (e: 'update:visible', visible: boolean): void
  (e: 'prompt-created', prompt: Prompt): void
  (e: 'prompt-updated', prompt: Prompt): void
}

const props = withDefaults(defineProps<Props>(), {
  prompt: null
})

const emit = defineEmits<Emits>()

// 状态管理
const tagStore = useTagStore()
const message = useMessage()

// 响应式数据
const formRef = ref<FormInst>()
const loading = ref(false)

// 表单数据
const formData = ref<CreatePromptDTO & { id?: string }>({
  title: '',
  content: '',
  tags: [],
  source: ''
})

// 计算属性
const isEditing = computed(() => props.prompt != null)

const tagOptions = computed(() => {
  return tagStore.tags.map(tag => ({
    label: tag.name,
    value: tag.id,
    disabled: false
  }))
})



// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入提示词标题', trigger: 'blur' },
    { min: 1, max: 100, message: '标题长度应在 1-100 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入提示词内容', trigger: 'blur' },
    { min: 1, max: 10000, message: '内容长度应在 1-10000 个字符', trigger: 'blur' }
  ]
}

// 监听 visible 变化
watch(() => props.visible, (newVal) => {
  if (newVal) {
    resetForm()
    if (props.prompt) {
      // 编辑模式：填充数据
      formData.value = {
        id: props.prompt.id,
        title: props.prompt.title,
        content: props.prompt.content,
        tags: [...props.prompt.tags],
        source: props.prompt.source || ''
      }
    }
    nextTick(() => {
      // 清除所有验证状态，确保输入框不显示错误颜色
      formRef.value?.restoreValidation()
      // 额外确保清理验证状态
      setTimeout(() => {
        formRef.value?.restoreValidation()
      }, 100)
    })
  }
})

// 方法
const resetForm = () => {
  formData.value = {
    title: '',
    content: '',
    tags: [],
    source: ''
  }
}

const copyContent = async () => {
  if (!formData.value.content.trim()) return
  
  try {
    // 使用 uTools API 复制
    if (typeof window.utools !== 'undefined') {
      window.utools.copyText(formData.value.content)
      message.success('内容已复制到剪贴板')
    } else {
      // 开发环境使用浏览器 API
      await navigator.clipboard.writeText(formData.value.content)
      message.success('内容已复制到剪贴板')
    }
  } catch (error) {
    message.error('复制失败，请手动复制')
    console.error('复制失败:', error)
  }
}

const handleCreateTag = (label: string) => {
  // 创建新标签的逻辑，返回一个选项对象
  return {
    label,
    value: `new_tag_${Date.now()}`
  }
}



const handleSave = async () => {
  try {
    // 表单验证
    await formRef.value?.validate()
    
    // 基础表单验证（不包括ID验证，因为ID由服务生成）
    if (!formData.value.title.trim()) {
      message.error('请输入提示词标题')
      return false
    }
    if (!formData.value.content.trim()) {
      message.error('请输入提示词内容')
      return false
    }
    
    loading.value = true
    
    if (isEditing.value) {
      // 编辑模式
      const updateData: UpdatePromptDTO = {
        title: formData.value.title,
        content: formData.value.content,
        tags: formData.value.tags,
        source: formData.value.source
      }
      
      const result = await promptService.updatePrompt(props.prompt!.id, updateData)
      
      if (result.success && result.data) {
        emit('prompt-updated', result.data)
        message.success('提示词更新成功')
      } else {
        message.error(result.error || '更新失败')
        return false
      }
    } else {
      // 新增模式
      const createData: CreatePromptDTO = {
        title: formData.value.title,
        content: formData.value.content,
        tags: formData.value.tags,
        source: formData.value.source
      }
      
      const result = await promptService.createPrompt(createData)
      
      if (result.success && result.data) {
        emit('prompt-created', result.data)
        message.success('提示词创建成功')
      } else {
        message.error(result.error || '创建失败')
        return false
      }
    }
    
    emit('update:visible', false)
    return true
  } catch (error) {
    console.error('保存失败:', error)
    message.error('保存失败，请重试')
    return false
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  emit('update:visible', false)
}

// 加载标签数据
tagStore.loadTags()
</script>

<style scoped>
.prompt-dialog-form {
  padding: 0;
}

/* 去掉标签的表单项样式 */
.form-item-clean {
  margin-bottom: 20px;
  width: 100%;
}

.form-item-clean :deep(.n-form-item-label) {
  display: none;
}

.form-item-clean :deep(.n-form-item-blank) {
  min-height: auto;
}

/* 重置表单项的验证状态样式 */
.form-item-clean :deep(.n-form-item-feedback-wrapper) {
  display: none;
}

/* 确保输入框使用正常的主题色而不是错误色 */
.form-item-clean :deep(.n-input:not(.n-input--disabled) .n-input__wrapper) {
  border-color: var(--n-border-color);
}

.form-item-clean :deep(.n-input:not(.n-input--disabled):hover .n-input__wrapper) {
  border-color: var(--n-border-color-hover);
}

.form-item-clean :deep(.n-input:focus-within .n-input__wrapper) {
  border-color: var(--n-color-primary) !important;
  box-shadow: 0 0 0 2px var(--n-color-primary-opacity) !important;
}

/* 标题输入框样式 */
.title-input :deep(.n-input__input-el) {
  font-size: 16px;
  font-weight: 500;
}

.title-input :deep(.n-input:not(.n-input--disabled):hover .n-input__wrapper) {
  border-color: var(--n-border-color-hover);
}

.title-input :deep(.n-input:focus-within .n-input__wrapper) {
  border-color: var(--n-color-primary);
  box-shadow: 0 0 0 2px var(--n-color-primary-opacity);
}



/* 确保所有输入组件宽度一致 */
.form-item-clean :deep(.n-input),
.form-item-clean :deep(.n-select),
.title-input,
.content-editor-container {
  width: 100%;
}

.form-item-clean :deep(.n-input__wrapper),
.form-item-clean :deep(.n-select .n-base-selection) {
  width: 100%;
}

.content-editor-container {
  width: 100%;
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
  overflow: hidden;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--n-color-embedded);
  border-bottom: 1px solid var(--n-border-color);
  font-size: 12px;
  color: var(--n-text-color-2);
}

.editor-label {
  font-weight: 500;
}

.content-editor {
  width: 100%;
  border: none !important;
  border-radius: 0 !important;
}

.content-editor :deep(.n-input__wrapper) {
  border: none !important;
  border-radius: 0 !important;
  background: var(--n-color-embedded-popover);
  width: 100%;
}

.content-editor :deep(.n-input__textarea) {
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.6;
  background: var(--n-color-embedded-popover);
}

.content-editor :deep(.n-input:not(.n-input--disabled):hover .n-input__wrapper) {
  border-color: var(--n-border-color-hover);
}

.content-editor :deep(.n-input:focus-within .n-input__wrapper) {
  border-color: var(--n-color-primary);
  box-shadow: 0 0 0 2px var(--n-color-primary-opacity);
}




</style> 