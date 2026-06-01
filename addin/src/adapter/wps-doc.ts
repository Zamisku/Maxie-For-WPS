import type { DocAdapter } from './types';

/**
 * DocAdapter 的 WPS 真实实现。仅在宿主内（wps 已定义）使用。
 *
 * ⚠️ 通用提醒：以下每个方法依赖的 wps.Selection.Text / TypeText / Collapse /
 *    ActiveDocument.Name 在 **Mac** 上的行为均未经验证（阶段 0 的核心未知数）。
 *    若某 API 表现不符，只改本文件 / adapter 层，不动上层（架构铁律 1）。
 */
export function createWpsDocAdapter(host: NonNullable<typeof wps>): DocAdapter {
  return {
    isHostAvailable(): boolean {
      return true;
    },

    // Mac 上行为未验证：阶段 0 待人工 GUI 验证。
    // 读选区文本；空选区预期为空串，但 Mac 行为待证。
    async getSelectionText(): Promise<string> {
      return host.WpsApplication().Selection.Text;
    },

    // Mac 上行为未验证：阶段 0 待人工 GUI 验证。
    // 读文档名（含扩展名）。
    async getDocumentTitle(): Promise<string> {
      return host.WpsApplication().ActiveDocument.Name;
    },

    // Mac 上行为未验证：阶段 0 待人工 GUI 验证。
    // 先把选区折叠到末尾使其变为光标，再键入，从而"插入而不覆盖"。
    async insertAtCursor(text: string): Promise<void> {
      const selection = host.WpsApplication().Selection;
      // 折叠方向枚举宿主可能未提供，缺省回退到约定的 wdCollapseEnd=0。
      const collapseEnd = host.Enum?.wdCollapseEnd ?? 0;
      selection.Collapse(collapseEnd);
      selection.TypeText(text);
    },

    // Mac 上行为未验证：阶段 0 待人工 GUI 验证。
    // TypeText 对非空选区即为替换；对空选区即为光标处键入。
    async replaceSelection(text: string): Promise<void> {
      host.WpsApplication().Selection.TypeText(text);
    },
  };
}
