<template>
  <div class="markdown-editor" ref="editorContainer"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { EditorView, placeholder as cmPlaceholder, lineNumbers } from '@codemirror/view'
import { EditorState } from '@codemirror/state'


interface Props {
  modelValue: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
  (e: 'focus'): void
  (e: 'blur'): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请输入提示词内容（支持 Markdown 格式）',
  disabled: false,
  readonly: false
})

const emit = defineEmits<Emits>()

const editorContainer = ref<HTMLElement>()
let editorView: EditorView | null = null



// 创建编辑器状态
const createEditorState = (content: string) => {
  const extensions = [
    lineNumbers(),
    EditorView.lineWrapping,
    cmPlaceholder(props.placeholder),
    // 设置只读状态（如果需要）
    ...(props.readonly || props.disabled ? [EditorState.readOnly.of(true)] : []),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const newValue = update.state.doc.toString()
        emit('update:modelValue', newValue)
        emit('change', newValue)
      }
    }),
    EditorView.updateListener.of((update) => {
      if (update.focusChanged) {
        if (update.view.hasFocus) {
          emit('focus')
        } else {
          emit('blur')
        }
      }
    }),
    EditorView.theme({
      '.cm-content': {
        padding: '16px',
        minHeight: '150px',
        lineHeight: '1.6',
        backgroundColor: '#ffffff'
      },
      '.cm-scroller': {
        minHeight: '150px'
      },
      '.cm-focused': {
        outline: 'none'
      },
      '.cm-editor': {
        border: '1px solid #e9ecef',
        borderRadius: '6px'
      }
    })
  ]

  return EditorState.create({
    doc: content,
    extensions
  })
}

// 初始化编辑器
const initEditor = () => {
  if (!editorContainer.value) return

  const state = createEditorState(props.modelValue)
  
  editorView = new EditorView({
    state,
    parent: editorContainer.value
  })

  // 初始化时不需要额外设置只读状态，因为已经在 createEditorState 中配置了
}

// 更新编辑器内容
const updateContent = (newContent: string) => {
  if (!editorView) return
  
  const currentContent = editorView.state.doc.toString()
  if (currentContent !== newContent) {
    editorView.dispatch({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: newContent
      }
    })
  }
}

// 监听 modelValue 变化
watch(() => props.modelValue, (newValue) => {
  updateContent(newValue)
})

// 监听只读状态变化
watch(() => [props.readonly, props.disabled], async () => {
  if (editorView) {
    // 重新创建编辑器以更新只读状态
    editorView.destroy()
    await nextTick()
    initEditor()
  }
})

// 组件挂载时初始化编辑器
onMounted(() => {
  nextTick(() => {
    initEditor()
  })
})

// 暴露编辑器实例方法
defineExpose({
  focus: () => editorView?.focus(),
  blur: () => editorView?.contentDOM.blur(),
  getContent: () => editorView?.state.doc.toString() || '',
  setContent: (content: string) => updateContent(content)
})
</script>

<style scoped>
.markdown-editor {
  width: 100%;
  min-height: 150px;
  height: 100%;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  background: #f8f9fa;
  overflow: hidden;
}

/* 全局样式，用于 CodeMirror 编辑器 */
:global(.cm-editor) {
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

:global(.cm-content) {
  caret-color: var(--primary-color);
}

/* 光标样式 */
:global(.cm-cursor) {
  border-left-color: var(--primary-color) !important;
}

:global(.cm-cursor-primary) {
  border-left-color: var(--primary-color) !important;
}

/* 占位符样式 */
:global(.cm-placeholder) {
  color: #6c757d;
  font-style: italic;
}

/* 选中文本样式 */
:global(.cm-selectionBackground) {
  background-color: rgba(0, 178, 90, 0.2) !important;
}

/* 焦点时的选中样式 */
:global(.cm-focused .cm-selectionBackground) {
  background-color: rgba(0, 178, 90, 0.25) !important;
}

/* 激活行背景 */
:global(.cm-activeLine) {
  background-color: rgba(0, 178, 90, 0.05) !important;
}

/* 行号区域样式 */
:global(.cm-gutters) {
  background-color: #f8f9fa !important;
  border-right: 1px solid #e9ecef !important;
}

:global(.cm-lineNumbers) {
  background-color: #f8f9fa !important;
}

:global(.cm-lineNumbers .cm-gutterElement) {
  color: #9ca3af !important;
  font-size: 12px !important;
  padding-right: 8px !important;
}

/* 激活行的行号样式 */
:global(.cm-activeLineGutter) {
  background-color: rgba(0, 178, 90, 0.05) !important;
  color: var(--primary-color) !important;
  font-weight: 500 !important;
}

/* 搜索匹配样式 */
:global(.cm-searchMatch) {
  background-color: rgba(255, 213, 79, 0.4);
}

:global(.cm-searchMatch.cm-searchMatch-selected) {
  background-color: rgba(255, 213, 79, 0.8);
}
</style>