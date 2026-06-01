import type { HostAdapter } from './types';

/**
 * HostAdapter 的 WPS 真实实现：ribbon 生命周期 + 任务窗格创建。
 * 这些都是 wps.* 宿主操作，必须留在 adapter/（架构铁律 1）。
 *
 * ⚠️ CreateTaskPane / ribbonUI 在 Mac 上的行为未经验证（阶段 0 待人工 GUI 验证）。
 */
export function createWpsHostAdapter(host: NonNullable<typeof wps>): HostAdapter {
  // 宿主在 onLoad 时给的 ribbonUI 句柄；后续刷新控件可能用到，故缓存。
  let ribbonUI: WpsRibbonUI | undefined;

  return {
    isAvailable(): boolean {
      return true;
    },

    onAddinLoad(ui: unknown): void {
      // 宿主传入的句柄类型由 WPS 决定，这里收窄为已声明的最小接口。
      ribbonUI = ui as WpsRibbonUI;
    },

    // Mac 上行为未验证：阶段 0 待人工 GUI 验证。
    showTaskPane(): void {
      // 任务窗格加载本加载项页面并切到 #/taskpane 路由（main.tsx 据此挂载）。
      const url = location.origin + location.pathname + '#/taskpane';
      const pane = host.CreateTaskPane(url);
      pane.Visible = true;
      // 触发一次控件刷新（若宿主支持），保证按钮状态一致。
      ribbonUI?.InvalidateControl?.('maxieOpenPane');
    },
  };
}
