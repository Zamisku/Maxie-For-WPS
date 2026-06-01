# BUILD_PLAN.md — 分阶段任务清单

> 协作规则：**一次只推进一个勾选项**，做完等人工在 WPS 里验证通过再继续。
> `[人工]` = Claude Code 做不了、需人来做的事。契约见 `docs/CONTRACT.md`。

---

## 阶段 0：Mac 可行性验证（go/no-go）— **当前阶段**

目标：最小闭环 **读选区 → 调一次模型（mock）→ 写回光标/选区**，证明 WPS 加载项在 Mac 上能跑。

### 0.1 脚手架与适配层（Claude Code 可做）
- [x] 写 `docs/CONTRACT.md`、`docs/BUILD_PLAN.md`。
- [x] `bff/` NestJS 骨架：`/health`、`/chat`(SSE)、`/actions`(SSE)；`context/`、`prompts/`、`auth/`、`model/` 可插拔模块；Mock 模型 provider；Dockerfile + docker-compose。
- [x] `addin/` Vite+React+TS 骨架：`adapter/`（含 WPS 实现 + 浏览器 Mock）、`ui/` 聊天面板、`actions/`、`api/` SSE 客户端；`ribbon.xml` / `jsplugins.xml` / `publish.xml`。
- [x] 前端最小闭环：读选区 → `/chat` SSE 逐字渲染（带停止按钮）→ 「插入」/「替换选区」写回。

### 0.2 本地联调（部分 [人工]）
- [ ] [人工] 安装并启用 WPS（Mac 桌面版），确认开发者模式 / 加载项开关（可能需改 `oem.ini`）。
- [ ] [人工] 安装 wpsjs CLI：`npm i -g wpsjs`（若 Mac 不可用，记录现象）。
- [ ] 启动 BFF：`cd bff && npm i && npm run start:dev`（默认 `MODEL_PROVIDER=mock`、`AUTH_DISABLED=true`）。
- [ ] 启动前端：`cd addin && npm i && npm run dev`（Vite，固定端口）。
- [ ] [人工] 在 WPS 注册并加载本加载项（`wpsjs debug` 或手动放置 `jsplugins.xml`），点功能区按钮唤出任务窗格。
- [ ] [人工] 在 WPS 文字里：选中一段文字 → 面板「读取选区」显示文本 → 发送 → 看到逐字流式回复 → 点「插入」/「替换选区」→ 文档被正确写回。
- [ ] [人工] 反馈结论：Mac 上加载项 **能/不能** 用；`wps.Selection` 读写、`CreateTaskPane`、ALT+F12 调试是否可用。

> ⚠️ 适配层里的 `wps.Selection.Text` / `TypeText` / `CreateTaskPane` 行为在 Mac 上**未经验证**，
> 都加了注释标注。若某 API 行为不符，只改 `addin/src/adapter/`，不动其它层。

### 0.3 判定
- [ ] go：Mac 可用 → 进入阶段 1。
- [ ] no-go：记录阻塞点，评估改集成方式（如换宿主/换写回路径），只动适配层重试。

---

## 阶段 1：真实模型接入与会话（待阶段 0 通过）
- [ ] [人工] 补全 `CONTRACT.md` TODO：云端模型 base URL / 鉴权 / 流式格式。
- [ ] 实现 `CloudModelProvider`（从 env 读 key，永不下发前端）。
- [ ] 实现会话 token 签发 / 校验，替换 `AUTH_DISABLED` 开发开关。
- [ ] 错误处理、超时、重试、限流。

## 阶段 2：动作完善（润色/续写/翻译/总结）
- [ ] `prompts/` 各动作模板打磨；`/actions` 端点完善。
- [ ] 前端动作按钮与参数（目标语言等）。

## 阶段 3：上下文与 RAG-ready
- [ ] `RetrievalContextAssembler` 接口落地（仍不引向量库，先留检索插点）。
- [ ] 全文/分段上下文策略，token 预算控制。

## 阶段 4：富文本与修订写回
- [ ] 后端返回 docx → FileSystem 临时文件 → 非显示打开插入。
- [ ] 修订 / 批注建议形态。

## 阶段 5：打包发布
- [ ] `addin && wpsjs build`、`publish.xml` 完善。
- [ ] [人工] 注册开发者、ICP 备案、提交上架审核。
