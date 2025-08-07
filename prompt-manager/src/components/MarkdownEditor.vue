<template>
  <div class="markdown-editor" ref="editorContainer"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { basicSetup } from 'codemirror'
import { EditorView } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import { placeholder } from '@codemirror/view'

interface Props {
  modelValue: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  theme?: 'light' | 'dark'
  lineWrap?: boolean
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
  readonly: false,
  theme: 'light',
  lineWrap: true
})

const emit = defineEmits<Emits>()

const editorContainer = ref<HTMLElement>()
let editorView: EditorView | null = null
// 用于管理只读状态的 Compartment
const readOnlyCompartment = new Compartment()

// 创建编辑器状态
const createEditorState = (content: string) => {
  const extensions = [
    basicSetup,
    markdown(),
    placeholder(props.placeholder),
    // 根据 lineWrap 属性决定是否启用换行
    ...(props.lineWrap ? [EditorView.lineWrapping] : []),
    // 添加只读状态管理
    readOnlyCompartment.of(EditorState.readOnly.of(props.readonly || props.disabled)),
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
      '&': {
        fontSize: '14px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        height: '100%'
      },
      '.cm-content': {
        padding: '16px',
        minHeight: '300px',
        lineHeight: '1.6',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        backgroundColor: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '6px'
      },
      '.cm-focused': {
        outline: 'none'
      },
      '.cm-editor': {
        border: 'none',
        borderRadius: '0',
        backgroundColor: 'transparent',
        height: '100%'
      },
      '.cm-editor.cm-focused': {
        outline: 'none'
      },
      '.cm-scroller': {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        height: '100%',
        backgroundColor: '#f8f9fa'
      },
      '.cm-gutters': {
        backgroundColor: '#f8f9fa',
        border: 'none'
      },
      '.cm-lineNumbers': {
        backgroundColor: '#f8f9fa'
      },
      '.cm-lineNumbers .cm-gutterElement': {
        color: '#9ca3af',
        fontSize: '12px'
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'rgba(0, 178, 90, 0.05)',
        color: 'var(--primary-color)',
        fontWeight: '500'
      },
      // Markdown 语法高亮样式
      '.cm-header': {
        color: 'var(--primary-color)',
        fontWeight: 'bold'
      },
      '.cm-strong': {
        fontWeight: 'bold',
        color: 'var(--text-color)'
      },
      '.cm-emphasis': {
        fontStyle: 'italic',
        color: 'var(--text-color)'
      },
      '.cm-strikethrough': {
        textDecoration: 'line-through'
      },
      '.cm-link': {
        color: 'var(--primary-color)',
        textDecoration: 'underline'
      },
      '.cm-monospace': {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        padding: '1px 3px',
        borderRadius: '3px',
        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace'
      },
      '.cm-list': {
        color: 'var(--primary-color)'
      },
      '.cm-quote': {
        color: '#6b7280',
        fontStyle: 'italic',
        borderLeft: '3px solid var(--primary-color)',
        paddingLeft: '8px'
      },
      // 光标和选择相关样式
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: 'var(--primary-color)'
      },
      '.cm-selectionBackground': {
        backgroundColor: 'rgba(0, 178, 90, 0.2)'
      },
      '.cm-focused .cm-selectionBackground': {
        backgroundColor: 'rgba(0, 178, 90, 0.25)'
      }
    })
  ]

  // 如果是暗色主题，添加暗色主题扩展
  if (props.theme === 'dark') {
    extensions.push(oneDark)
  }

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

// 监听主题变化
watch(() => props.theme, async () => {
  if (editorView) {
    // 销毁旧编辑器
    editorView.destroy()
    // 重新创建编辑器
    await nextTick()
    initEditor()
  }
})

// 监听换行设置变化
watch(() => props.lineWrap, async () => {
  if (editorView) {
    // 销毁旧编辑器
    editorView.destroy()
    // 重新创建编辑器
    await nextTick()
    initEditor()
  }
})

// 监听只读状态变化
watch(() => [props.readonly, props.disabled], ([readonly, disabled]) => {
  if (editorView) {
    editorView.dispatch({
      effects: [readOnlyCompartment.reconfigure(EditorState.readOnly.of(readonly || disabled))]
    })
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
  min-height: 300px;
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