# Maxie for WPS

类 "Claude for Word" 的 AI 写作助手，应用在 **WPS 文字**，接入自有云端模型服务。

- 形态：WPS 加载项（React / TS / Vite）+ 任务窗格聊天面板 + 自建 BFF 网关 → 云端模型。
- 项目上下文与协作规则见 [`CLAUDE_1.md`](./CLAUDE_1.md)。
- 前后端契约见 [`docs/CONTRACT.md`](./docs/CONTRACT.md)。
- 分阶段任务见 [`docs/BUILD_PLAN.md`](./docs/BUILD_PLAN.md)。

> **当前阶段 0**：Mac 可行性验证（go/no-go）。只做最小闭环：读选区 → 调一次模型（mock）→ 写回光标处。

## 目录

```
addin/   # WPS 加载项（前端）：adapter / ui / actions / api
bff/     # 自建网关（后端）：routes / context / prompts / auth / model
docs/    # 契约与分阶段计划
```

## 快速开始（Phase 0，mock 模型，无需云端）

```bash
# 1) 后端（默认 mock 模型 + 开发放行鉴权）
cd bff && cp .env.example .env && npm i && npm run start:dev   # http://localhost:3000

# 2) 前端（Vite，固定端口，/api 代理到 BFF）
cd addin && npm i && npm run dev

# 3) [人工] 在 Mac WPS 文字里加载本加载项并验证（见 docs/BUILD_PLAN.md 0.2）
```

不带 WPS 也能在浏览器里开发前端 UI：无 `wps` 全局时自动用 `MockDocAdapter`。

## 架构铁律（摘要，详见 CLAUDE_1.md）

1. 所有 `wps.*` 只在 `addin/src/adapter/`。
2. 模型 API key 只存 BFF env，**永不下发前端**。
3. 上下文组装可插拔（RAG-ready）。
4. 写回由简到繁：Phase 0 仅纯文本。
5. 流式统一 SSE，前端逐字渲染 + 停止按钮。
6. 日志默认不落文档全文。
7. addin 不用浏览器存储存敏感信息。
