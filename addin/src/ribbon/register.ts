import { getHostAdapter } from '../adapter';

/**
 * 把 ribbon.xml 里 onLoad/onAction/getImage 指向的回调挂到 window.ribbon。
 * 全部委托 HostAdapter——本文件不直接触碰 WPS 全局对象（架构铁律 1）。
 * window.ribbon 的类型在 adapter/wps-globals.d.ts 里声明。
 */
export function registerRibbon(): void {
  const host = getHostAdapter();

  window.ribbon = {
    OnAddinLoad(ribbonUI): string {
      host.onAddinLoad(ribbonUI);
      // wpsjs 约定：onLoad 回调需返回 ribbon XML 字符串。
      // Phase 0 由宿主加载的 ribbon.xml 决定 UI，这里返回空串占位。
      // [人工] 若本机 wpsjs 版本要求在此返回 XML，再补全。
      return '';
    },

    OnAction(_controlId): void {
      host.showTaskPane();
    },

    GetImage(_controlId): string {
      // Phase 0 无图标资源，返回空串占位。
      return '';
    },
  };
}
