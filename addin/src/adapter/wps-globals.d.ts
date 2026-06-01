/**
 * 最小化 WPS 全局类型声明。只声明本项目实际用到的成员，
 * 避免 any，也避免引入庞杂的完整对象模型。
 *
 * 架构铁律 1：这些类型仅供 adapter/ 内部使用，不向上层泄漏。
 * 各成员在 Mac 上的真实行为未经验证（阶段 0 待人工 GUI 验证）。
 */

// wp.WdCollapseDirection.wdCollapseEnd 的等价值；不同宿主可能用枚举或数字。
// adapter 仅需"折叠到末尾"，用此别名表达意图。
type WpsCollapseDirection = number;

interface WpsSelection {
  /** 选区文本；空选区为空串。读为属性，写回用 TypeText。 */
  Text: string;
  /** 在选区/光标处键入文本（替换选区或在光标处插入）。 */
  TypeText(text: string): void;
  /** 折叠选区（如折叠到末尾，使后续 TypeText 表现为光标处插入）。 */
  Collapse(direction?: WpsCollapseDirection): void;
}

interface WpsDocument {
  /** 文档名（含扩展名），用于让模型理解场景。 */
  readonly Name: string;
}

interface WpsApplicationInstance {
  readonly Selection: WpsSelection;
  readonly ActiveDocument: WpsDocument;
}

/** ribbon onLoad 回调拿到的 UI 句柄；用于 InvalidateControl 等刷新操作。 */
interface WpsRibbonUI {
  InvalidateControl?(controlId: string): void;
}

/** CreateTaskPane 返回的窗格句柄。 */
interface WpsTaskPane {
  Visible: boolean;
}

interface WpsGlobal {
  /** 取 WPS 文字应用实例（对象模型类似 VBA）。 */
  WpsApplication(): WpsApplicationInstance;
  /** 创建任务窗格，url 指向本加载项页面（带 #/taskpane 路由）。 */
  CreateTaskPane(url: string): WpsTaskPane;
  /** 折叠方向枚举容器（宿主可能未提供，故可选）。 */
  Enum?: { wdCollapseEnd?: WpsCollapseDirection };
}

// 宿主注入；浏览器开发时为 undefined。仅 adapter/ 内允许引用。
declare const wps: WpsGlobal | undefined;

// ribbon 回调由宿主在 window.ribbon 上查找；register.ts 负责设置。
interface Window {
  ribbon?: {
    OnAddinLoad(ribbonUI: WpsRibbonUI): string;
    OnAction(controlId: string): void;
    GetImage(controlId: string): string;
  };
}
