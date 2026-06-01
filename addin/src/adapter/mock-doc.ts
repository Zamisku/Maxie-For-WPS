import type { DocAdapter } from './types';

/**
 * 浏览器开发用的假 DocAdapter（无 wps 全局时）。
 * 让无 WPS 环境也能调通 UI/SSE 全链路（架构铁律 1 的副产品）。
 */
export function createMockDocAdapter(): DocAdapter {
  return {
    isHostAvailable(): boolean {
      return false;
    },

    async getSelectionText(): Promise<string> {
      // 给一段可见的假选区，便于触发动作/流式。
      return '这是一段用于浏览器开发的假选区文本。';
    },

    async getDocumentTitle(): Promise<string> {
      return 'mock-document.docx';
    },

    async insertAtCursor(text: string): Promise<void> {
      // 无文档可写，落到控制台供开发观察。
      console.log('[mock-doc] insertAtCursor:', text);
    },

    async replaceSelection(text: string): Promise<void> {
      console.log('[mock-doc] replaceSelection:', text);
    },
  };
}
