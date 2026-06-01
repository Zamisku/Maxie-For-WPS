import type { DocAdapter, HostAdapter } from './types';
import { createWpsDocAdapter } from './wps-doc';
import { createWpsHostAdapter } from './wps-host';
import { createMockDocAdapter } from './mock-doc';

export type { DocAdapter, HostAdapter } from './types';

/**
 * adapter/ 是上层唯一获取文档/宿主能力的入口。
 * 唯一允许出现 `wps` 标识符的目录（架构铁律 1）。
 */

/** 是否运行在 WPS 宿主内（存在 wps 全局）。 */
export function isHostAvailable(): boolean {
  return typeof wps !== 'undefined';
}

// 单例化：宿主对象在页面生命周期内稳定，避免每次创建新适配器。
let docAdapter: DocAdapter | undefined;
let hostAdapter: HostAdapter | undefined;

export function getDocAdapter(): DocAdapter {
  if (!docAdapter) {
    docAdapter = typeof wps !== 'undefined' ? createWpsDocAdapter(wps) : createMockDocAdapter();
  }
  return docAdapter;
}

export function getHostAdapter(): HostAdapter {
  if (!hostAdapter) {
    if (typeof wps !== 'undefined') {
      hostAdapter = createWpsHostAdapter(wps);
    } else {
      // 浏览器开发：宿主操作无意义，给空实现以保持调用点统一。
      hostAdapter = {
        isAvailable: () => false,
        onAddinLoad: () => {},
        showTaskPane: () => {
          console.log('[mock-host] showTaskPane (no WPS host)');
        },
      };
    }
  }
  return hostAdapter;
}
