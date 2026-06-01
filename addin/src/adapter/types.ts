/**
 * 适配层对外契约（CONTRACT 第 5 节）。上层 UI/actions/api 只依赖这些接口，
 * 绝不直接接触 wps 全局（架构铁律 1）。
 */

export interface DocAdapter {
  /** 是否运行在 WPS 宿主内（存在 wps 全局）。 */
  isHostAvailable(): boolean;
  /** 读当前选区文本。 */
  getSelectionText(): Promise<string>;
  /** 读文档名，便于模型理解场景。 */
  getDocumentTitle(): Promise<string>;
  /** 光标处插入（不覆盖选区）。 */
  insertAtCursor(text: string): Promise<void>;
  /** 替换选区，或在光标处键入。 */
  replaceSelection(text: string): Promise<void>;
}

/**
 * 宿主级操作（创建任务窗格、ribbon 生命周期）。这些同属 wps.*，
 * 故归 adapter/，由 ribbon/register.ts 委托调用、自身不出现 wps。
 */
export interface HostAdapter {
  /** 是否在 WPS 宿主内。 */
  isAvailable(): boolean;
  /** ribbon onLoad：缓存宿主给的 ribbonUI 句柄。ui 类型由宿主决定，故为 unknown。 */
  onAddinLoad(ui: unknown): void;
  /** 显示任务窗格（指向本加载项的 #/taskpane 页面）。 */
  showTaskPane(): void;
}
