<template>
  <n-drawer
    :show="visible"
    :width="'70%'"
    placement="right"
    @update:show="$emit('update:visible', $event)"
    class="prompt-drawer"
  >
    <n-drawer-content
      :title="isEditing ? '编辑提示词' : '新增提示词'"
      closable
      class="prompt-drawer-content"
    >
      <template #footer>
        <div class="drawer-footer">
          <n-button 
            @click="handleCancel"
            :disabled="loading"
            size="medium"
          >
            取消
          </n-button>
          <n-button 
            type="primary" 
            @click="handleSave"
            :loading="loading"
            size="medium"
          >
            {{ isEditing ? '保存' : '创建' }}
          </n-button>
        </div>
      </template>
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
          placeholder="请输入标题"
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
            <div class="editor-title">提示词</div>
            <div class="editor-spacer"></div>
            <div class="editor-right-controls">
              <span class="editor-language">Markdown</span>
              <n-button 
                size="small" 
                quaternary 
                @click="toggleLineWrap"
                class="line-wrap-btn"
                :class="{ 'line-wrap-active': lineWrapEnabled }"
                :title="lineWrapEnabled ? '关闭自动换行' : '开启自动换行'"
              >
                <template #icon>
                  <n-icon>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path v-if="lineWrapEnabled" d="M3 10h11M9 21V3m0 18l3-3m-3 3l-3-3"></path>
                      <path v-else d="M3 6h18M3 12h18M3 18h18"></path>
                    </svg>
                  </n-icon>
                </template>
                自动换行
              </n-button>
              <n-button 
                size="small" 
                quaternary 
                type="primary" 
                @click="copyContent"
                :disabled="!formData.content.trim()"
                class="copy-btn"
              >
                <template #icon>
                  <n-icon>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </n-icon>
                </template>
                复制
              </n-button>
            </div>
          </div>
          <MarkdownEditor
            v-model="formData.content"
            placeholder="请输入提示词内容，支持 Markdown 格式..."
            :disabled="loading"
            :line-wrap="lineWrapEnabled"
            class="content-editor"
          />
        </div>
      </n-form-item>

      <!-- 标签选择 -->
      <n-form-item path="tags" class="form-item-clean">
        <n-select
          v-model:value="formData.tags"
          multiple
          :options="tagOptions"
          placeholder="添加标签"
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
          placeholder="添加备注"
          :disabled="loading"
          size="large"
        />
      </n-form-item>


          </n-form>
    </n-drawer-content>
  </n-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { 
  NDrawer, NDrawerContent, NForm, NFormItem, NInput, NButton, NSelect, NIcon,
  useMessage, type FormInst 
} from 'naive-ui'

import { useTagStore } from '@/stores/tagStore'
import type { Prompt, CreatePromptDTO, UpdatePromptDTO } from '@/types/Prompt'
import { promptService } from '@/services/PromptService'
import MarkdownEditor from './MarkdownEditor.vue'

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
const lineWrapEnabled = ref(true)

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

const toggleLineWrap = () => {
  lineWrapEnabled.value = !lineWrapEnabled.value
  // 这里我们需要通知 MarkdownEditor 组件更新换行设置
  // 暂时先切换状态，后续需要在 MarkdownEditor 中实现换行功能
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
      return
    }
    if (!formData.value.content.trim()) {
      message.error('请输入提示词内容')
      return
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
        emit('update:visible', false)
      } else {
        message.error(result.error || '更新失败')
        return
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
        emit('update:visible', false)
      } else {
        message.error(result.error || '创建失败')
        return
      }
    }
  } catch (error) {
    console.error('保存失败:', error)
    message.error('保存失败，请重试')
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
/* 抽屉样式 */
.prompt-drawer {
  z-index: 1000;
}

.prompt-drawer-content {
  height: 100%;
}

/* 重新设计头部样式 - 添加分界线 */
.prompt-drawer :deep(.n-drawer-header) {
  padding: 16px 20px !important;
  border-bottom: 1px solid var(--n-border-color) !important;
  background: #ffffff;
}

/* 主体内容区域 - 减少上下间距 */
.prompt-drawer :deep(.n-drawer-body) {
  padding: 16px 20px 8px 20px !important;
}

/* 底部区域 - 添加分界线和背景 */
.prompt-drawer :deep(.n-drawer-footer) {
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
  height: auto !important;
  min-height: auto !important;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 8px 20px;
  border-top: 1px solid var(--n-border-color);
  margin-top: 0;
  background: transparent;
  width: 100%;
  height: 30px;
  box-sizing: border-box;
}

.prompt-dialog-form {
  padding: 0;
  margin: 0;
}

/* 去掉标签的表单项样式 */
.form-item-clean {
  margin-bottom: 16px;
  width: 100%;
}

.form-item-clean:first-child {
  margin-top: 0;
}

/* 消除 n-form-item 的标签预留空间 */
.form-item-clean {
  --n-label-height: 0 !important;
  --n-label-padding: 0 !important;
  --n-blank-height: auto !important;
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

/* 统一所有输入框的字体大小 */
.form-item-clean :deep(.n-input__input-el),
.form-item-clean :deep(.n-select .n-base-selection-input__content) {
  font-size: 16px;
}

.content-editor-container {
  width: 100%;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  overflow: hidden;
  min-height: 175px;
  background: #f8f9fa;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #ffffff;
  border-bottom: 1px solid #e9ecef;
  font-size: 12px;
  color: #6c757d;
}

.editor-title {
  font-weight: 500;
  color: #495057;
  font-size: 14px;
}

.editor-spacer {
  flex: 1;
}

.editor-right-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.editor-language {
  font-size: 12px;
  font-weight: 500;
  color: #6c757d;
  padding: 4px 8px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.line-wrap-btn,
.copy-btn {
  font-size: 12px !important;
}

.line-wrap-btn.line-wrap-active {
  background: rgba(0, 178, 90, 0.1) !important;
  border-color: var(--primary-color) !important;
  color: var(--primary-color) !important;
}

.line-wrap-btn :deep(.n-button__content) {
  gap: 4px;
}

.copy-btn :deep(.n-button__content) {
  gap: 4px;
}

.content-editor {
  width: 100%;
  border: none !important;
  border-radius: 0 !important;
  height: 100%;
  min-height: 150px;
}

/* MarkdownEditor 在 PromptDialog 中的样式 */
.content-editor :deep(.cm-editor) {
  border: none !important;
  border-radius: 0 !important;
  background: transparent;
  font-size: 14px;
  height: 100%;
  min-height: 150px;
}

.content-editor :deep(.markdown-editor) {
  border: none !important;
  background: transparent !important;
  height: 100%;
  min-height: 150px;
}

.content-editor :deep(.cm-content) {
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
  font-size: 16px;
  line-height: 1.5;
  background: var(--n-color-embedded-popover);
  padding: 12px;
  min-height: 100px;
}

.content-editor :deep(.cm-focused) {
  outline: none;
}

.content-editor :deep(.cm-editor:hover) {
  border-color: var(--n-border-color-hover);
}

.content-editor :deep(.cm-editor.cm-focused) {
  border-color: var(--n-color-primary);
  box-shadow: 0 0 0 2px var(--n-color-primary-opacity);
}

.drawer-footer .n-button {
  --n-height: 32px !important;
  --n-padding: 0 24px !important;  /* 加长按钮 */
}


</style> 