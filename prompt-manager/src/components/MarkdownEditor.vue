<template>
  <div class="markdown-editor" ref="editorContainer"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { EditorView, placeholder as cmPlaceholder, lineNumbers, Decoration, ViewPlugin, ViewUpdate } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'


interface Props {
  modelValue: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
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
  lineWrap: true
})

const emit = defineEmits<Emits>()

const editorContainer = ref<HTMLElement>()
let editorView: EditorView | null = null



// 创建编辑器状态
const createEditorState = (content: string) => {
  // 轻量级 Markdown 装饰插件（不依赖 HighlightStyle，避免 uTools 环境崩溃）
  const mdLightDecorator = ViewPlugin.fromClass(class {
    decorations: ReturnType<typeof Decoration.set>
    constructor(view: EditorView) {
      this.decorations = this.build(view)
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.build(update.view)
      }
    }
    build(view: EditorView) {
      const decos: any[] = []
      const doc = view.state.doc
      const addMark = (from: number, to: number, className: string) => {
        decos.push(Decoration.mark({ class: className }).range(from, to))
      }
      // 遍历可见区域的每一行，做基于正则的轻量标注
      for (const { from, to } of view.visibleRanges) {
        let line = doc.lineAt(from)
        while (line.from <= to) {
          const text = line.text
          const base = line.from
          // 标题：开头 #、##、###
          const mHeading = /^(#{1,6})\s+.+/.exec(text)
          if (mHeading) {
            const level = mHeading[1].length
            addMark(base, line.to, level === 1 ? 'md-h1' : level === 2 ? 'md-h2' : 'md-h3')
          }
          // 列表项标记
          const bullet = /^\s*([*+-]|\d+\.)\s+/.exec(text)
          if (bullet) {
            const marker = bullet[1]
            // 只标注符号或序号本体
            const markerStart = base + bullet[0].indexOf(marker)
            addMark(markerStart, markerStart + marker.length, marker.match(/^\d+\.$/) ? 'md-olist' : 'md-ulist')
          }
          // 行内：粗体 **text** 或 __text__
          for (const r of text.matchAll(/\*\*([^*]+)\*\*|__([^_]+)__/g)) {
            // 外层（含 ** 或 __）用于背景着色
            const wrapStart = base + (r.index ?? 0)
            const wrapEnd = wrapStart + r[0].length
            addMark(wrapStart, wrapEnd, 'md-bold-wrap')

            // 内部文字加更强的字重
            const innerStart = wrapStart + 2
            const innerLen = Math.max(0, r[0].length - 4)
            if (innerLen > 0) addMark(innerStart, innerStart + innerLen, 'md-bold')
          }
          // 斜体 *text* 或 _text_ （仅高亮内部文字）
          for (const r of text.matchAll(/(?<!\*)\*([^*]+)\*(?!\*)|(?<!_)_([^_]+)_(?!_)/g)) {
            const start = base + (r.index ?? 0) + 1
            const len = Math.max(0, r[0].length - 2)
            if (len > 0) addMark(start, start + len, 'md-italic')
          }
          // 删除线 ~~text~~
          for (const r of text.matchAll(/~~([^~]+)~~/g)) {
            const s = base + (r.index ?? 0)
            addMark(s, s + r[0].length, 'md-strike')
          }
          // 行内代码 `code`
          for (const r of text.matchAll(/`([^`]+)`/g)) {
            const s = base + (r.index ?? 0)
            addMark(s, s + r[0].length, 'md-code')
          }
          if (line.to >= to) break
          line = doc.line(line.number + 1)
        }
      }
      return Decoration.set(decos, true)
    }
  }, { decorations: v => v.decorations })

  const extensions = [
    lineNumbers(),
    ...(props.lineWrap ? [EditorView.lineWrapping] : []),
    cmPlaceholder(props.placeholder),
    markdown(),
    mdLightDecorator,
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

// 监听只读/禁用/换行设置变化
watch(() => [props.readonly, props.disabled, props.lineWrap], async () => {
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

/* Markdown 轻量高亮（浅色） */
:global(.cm-content .md-h1) {
  color: #1677ff;
  font-weight: 700;
}
:global(.cm-content .md-h2) {
  color: #0958d9;
  font-weight: 700;
}
:global(.cm-content .md-h3) {
  color: #1d39c4;
  font-weight: 700;
}
:global(.cm-content .md-bold-wrap) {
  color: #00B25A; /* 主题色：提高可读性 */
}
:global(.cm-content .md-bold) {
  font-weight: 800 !important;
  color: currentColor !important; /* 继承外层颜色，强化字重 */
}
:global(.cm-content .md-italic) {
  font-style: italic;
}
:global(.cm-content .md-strike) {
  text-decoration: line-through;
  color: #595959;
}
:global(.cm-content .md-ulist) {
  color: #13c2c2; /* 无序项目符号：青色 */
  font-weight: 700;
}
:global(.cm-content .md-olist) {
  color: #13c2c2; /* 有序项目编号：保持同色或按需更改 */
  font-weight: 700;
}
:global(.cm-content .md-code) {
  color: #d4380d;
  background: #fff7e6;
  border-radius: 3px;
  padding: 0 2px;
}
</style>