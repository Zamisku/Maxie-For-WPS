# CLAUDE.md

类 "Claude for Word" 的 AI 写作助手，应用在 **WPS 文字**，接入自有云端模型服务。
形态：WPS 加载项（JS / React / TS）+ 任务窗格聊天面板 + 自建 BFF 网关 → 云端模型。

> 详细分阶段任务见 `docs/BUILD_PLAN.md`。本文件给你（Claude Code）项目上下文与协作规则，请每次开工前通读。

---

## 当前阶段（重要）

**阶段 0：Mac 可行性验证（go/no-go）。**
现在只做"最小闭环"：读选区 → 调一次模型（可先 mock）→ 写回光标处。**不要提前做完整功能**。这一关要靠人工在 Mac 的 WPS GUI 里点验证才能确认通过，你写完脚手架和适配层后，把验证步骤交回给我。

随进度更新这一节。

---

## 技术栈

- 前端（`addin/`）：WPS 加载项，wpsjs 脚手架，React + TypeScript，Vite。
- 后端（`bff/`）：Node.js + **NestJS**（TypeScript）。*（若改用 Go，更新本节及命令。）*
- 通信：前后端走 **SSE** 流式。
- 模型：自有云端服务（接口契约见文末 TODO）。
- RAG：后期再加，当前不引入向量库，但上下文模块要为它预留接口。

## 仓库结构

```
addin/                  # WPS 加载项（前端）
  src/
    adapter/            # 平台适配层：所有 wps.* 调用只能在这里
    ui/                 # 聊天面板 React 组件
    actions/            # 润色/续写/翻译等动作 → prompt
    api/                # 调 BFF 的 SSE 客户端
  ribbon.xml            # 功能区按钮
  publish.xml
  jsplugins.xml
bff/                    # 自建网关（后端）
  src/
    routes/             # /chat(SSE)、/actions、/health
    context/            # 上下文组装（可插拔，RAG-ready）
    prompts/            # 系统提示词
    auth/               # token 校验、密钥托管
  Dockerfile
  docker-compose.yml
docs/BUILD_PLAN.md      # 分阶段任务清单
```

## 常用命令

```bash
# 前端：拉起 WPS 并热更新调试（需本机已装 WPS + wpsjs）
cd addin && wpsjs debug
# 前端：打包 / 发布（按已装 wpsjs 版本核对子命令）
cd addin && wpsjs build

# 后端：本地开发
cd bff && npm run start:dev
# 后端：测试
cd bff && npm test
# 本地一键起（含依赖）
docker compose up -d
```

> 网页调试快捷键 ALT+F12（Mac 上是否可用待验证）。

---

## 架构铁律（不可违反）

1. **所有 `wps.*` 调用只能出现在 `addin/src/adapter/`。** UI、actions、api 层一律通过适配层接口，绝不直接碰 `wps` 全局对象。原因：隔离平台差异，Mac 或将来换集成方式时只改适配层。
2. **模型 API key 只存在于 BFF 的环境变量 / 密钥管理中，永不下发前端。** 前端只持短期会话 token。禁止把 key、密钥、第三方凭证写进 addin 代码或通过接口返回给前端。
3. **上下文组装（`context/`）与调模型逻辑解耦，做成可插拔模块。** 现在喂选区 / 全文，将来插 RAG 检索结果，不要把取上下文焊死在调用里。
4. **写回策略由简到繁**：当前用纯文本（插入光标 / 替换选区）；富文本走"后端返回 docx → 用 FileSystem 写临时文件 → 非显示打开插入"；最终形态是修订 / 批注建议。新功能默认走最简可用，别一上来做复杂修订。
5. **流式统一走 SSE**，前端逐字渲染，提供停止按钮。
6. **日志默认不落文档全文**，除非用户已明确同意。
7. **不在 addin 里用浏览器存储（localStorage 等）存放敏感信息。**

## 代码约定

- TypeScript 严格模式；类型不偷懒用 `any`。
- 适配层对外只暴露语义化接口（如 `getSelectionText()`），不泄漏 WPS 原始对象。
- 提交粒度小、可验证；动到核心逻辑就补必要测试。
- 注释说明"为什么"，不复述"做了什么"。

## 与我（人类）的协作方式

- **一次只推进 `BUILD_PLAN.md` 里的一个勾选项或一个小步骤**，做完等我在 WPS 里验证通过再继续。
- 凡标 `[人工]` 的事你做不了：装 / 启用 WPS、改 `oem.ini`、`wpsjs debug` 后在 GUI 里验证、注册开发者、ICP 备案、提交上架审核。**写完相关代码后，明确告诉我该跑什么命令、在 WPS 里看什么**，由我来验证并把结果反馈给你。
- 不确定某个 WPS API 的行为时，**先写最小验证再扩展，不要假设**。
- 改动尽量收敛在小范围，避免一次性大重构。

## WPS 加载项要点 / 已知坑

- 加载项本质是一个网页，底层是 Chromium 内核，`wps` 全局对象暴露 API（对象模型类似 VBA）。
- 本地用 `wpsjs debug` 拉起 WPS 并热更新。
- **跨域**：本地开发用 Vite 代理 / 反向代理解决；生产用同源或正确 CORS。
- **平台**：官方主要适配 Windows / Linux；**Mac 桌面加载项支持未经验证，是当前最大风险，不要默认它能用**——这正是阶段 0 要回答的问题。

---

## TODO（需我补充，补全前别硬编码）

- [ ] 云端模型服务：base URL、鉴权方式、请求 / 流式响应格式。
- [ ] 会话 token 的签发与校验方式（前端如何拿到、BFF 如何验）。
- [ ] BFF 语言最终确认（默认 NestJS；若 Go 则更新本文件）。
