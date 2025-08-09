## 项目与 uTools 插件实现要点（开发者笔记）

### 1. 项目定位与结构
- 本项目是 uTools 插件「提示词管理工具」，用于本地管理 AI 提示词（新增/编辑/删除/搜索/标签/复制/导入导出）。
- 前端栈：Vue 3 + TypeScript + Pinia + Vue Router + Naive UI + CodeMirror 6。
- 关键目录：
  - `src/services`：业务服务（提示词、标签、uTools 适配）。
  - `src/utils/utoolsAPI.ts`：对 uTools DB 与系统能力的封装（含浏览器降级）。
  - `src/components`：UI 组件（`PromptDialog`、`MarkdownEditor` 等）。
  - `src/views/HomeView.vue`：主列表视图。

### 2. uTools 插件环境要点
- uTools 渲染进程为 Chromium 环境，提供 `window.utools` 能力；发布包入口受 `plugin.json` 约束。
- 常见能力：`utools.db.*`（文档式本地 DB，带 `_id`/`_rev`）、`copyText`、通知、窗口控制、生命周期事件等。
- 预加载与降级：
  - 首选 `window.preloadAPI` 或 `window.utools`。
  - 非 uTools 开发模式下使用浏览器 API/`localStorage` 做降级，避免开发时报错。

### 3. 数据存储策略
- 文档 `_id` 统一前缀：`prompt_manager_`（见 `UtoolsDB`）。外部业务层仅使用 `id`，对 `_id`/`_rev` 透明。
- `UtoolsDB.put/get/remove/allDocs` 封装：
  - `put`：自动补 `_rev`；在浏览器模式下写 `localStorage`。
  - `allDocs`：uTools 返回“完整文档对象”，需过滤墓碑 `_deleted`。
- 对存储对象“净化”：仅保存可序列化的原始值（string/number/boolean/array），避免 Proxy/函数/DOM 造成结构化克隆错误。

### 4. 业务校验（前后端职责）
- 仅「提示词内容」为必填；标题可为空。
  - 前端 `PromptDialog.vue`：
    - 轻量必填拦截 → 统一提示“请输入提示词内容”。
    - 表单规则仅对 `content` 做长度等校验。
  - 服务端 `PromptService.ts`：
    - `create`：仅校验 `content` 非空。
    - `update`：当传入 `content` 时校验非空；标题可为空或不传。

### 5. Markdown 编辑器实现
- 基础：CodeMirror 6。
- 高亮策略：自定义 ViewPlugin（正则装饰）替代 Lezer 高亮。
  - 背景：在 uTools 环境下 Lezer 高亮易触发 `tags is not iterable` 崩溃，且版本混用风险高。
  - 装饰对象：标题（#/##/###）、粗体（**__）、列表标记（- + * / 有序 1.）、行内代码（`code`）、链接 `[text](url)`、图片 `![alt](url)`。
  - 颜色方案：统一单色系（当前为 #E6783A），仅改文字颜色，不加底色；
  - 代码块围栏 ``` 内部不做任何 Markdown 高亮（保持纯黑）。
  - 占位符字号统一为 14px。
- 兼容性与依赖：
  - 禁用 `@codemirror/basic-setup`（会引入老版本 `@lezer/highlight` 导致冲突）。
  - 统一 CM6 版本：`@codemirror/language`、`@codemirror/view`、`@codemirror/state`、`@codemirror/lang-markdown` 保持 6.x 一致；检查 `npm ls @lezer/highlight` 仅 1.x。

### 6. 标签与列表
- 标签 CRUD：统一通过 `TagService`，ID 为完整 `_id` 存储；界面依赖 `tagStore`（Pinia）。
- 列表卡片：标题可空，展示用 `prompt.title || ''`；复制仅复制 `content`。

### 7. 典型易错与规避
- 结构化克隆失败（An object could not be cloned）：
  - 存储前做“净化”，确保仅原始类型；`tags` 强制为 string[]；移除响应式/函数。
- CodeMirror 高亮崩溃（tags is not iterable）：
  - 不使用 `HighlightStyle`；若必须引入主题，务必做“失败降级”。
- 版本混装：
  - 移除 `@codemirror/basic-setup`/`codemirror` 聚合包；统一至 CM6。

### 8. UX 细节
- 提示词内容为空 → 统一提示“请输入提示词内容”。
- 标题为空 → 允许保存，不强制占位展示。
- 链接/图片/粗体等：仅改文字颜色，不加背景；降低视觉干扰。

### 9. 开发与构建
- 开发：`npm run dev`（`vite`，开发模式自动走浏览器降级）。
- 类型检查：`npm run type-check`。
- 构建：`npm run build`（产出 `dist/`，Vite 插件会拷贝 `preload.js`、`plugin.json`、`logo.png`）。

### 10. 代码约定
- TypeScript：避免 any，服务层返回统一结果类型（success/error/data/message）。
- 早返回 + 边界先行，错误统一打印并返回兜底结构。
- 组件样式：尽量作用域隔离；对 CodeMirror 使用 `:global` 注入必要类。

### 11. 可扩展方向
- 提示词广场（异步加载、导入合并策略）。
- 多主题/暗色适配（颜色变量化）。
- 更精细的 Markdown token（分离链接文字与 URL、图片 alt 与 URL 的不同着色）。

> 以上为在 uTools 环境中确保稳定性的实现经验与约定。落地原则：能前端即时提示的尽量前端提示，服务层只做兜底校验；对第三方编辑器能力尽量“增量、安全、可降级”。


