import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerRibbon } from './ribbon/register';
import { isHostAvailable } from './adapter';
import { App } from './ui/App';
import './ui/styles.css';

// 宿主上下文需要 window.ribbon 存在（ribbon.xml 的回调指向它）。
// 浏览器开发时注册的是 mock 宿主实现，无副作用。
registerRibbon();

/**
 * 何时挂载聊天面板：
 * - 任务窗格页面（CreateTaskPane 打开，URL 带 #/taskpane）；
 * - 或宿主不可用（浏览器直接开 Vite，便于无 WPS 调 UI）。
 * 其它情况（如宿主主页面仅用于注册 ribbon）不挂载 UI。
 */
function shouldMountUi(): boolean {
  if (location.hash.startsWith('#/taskpane')) return true;
  if (!isHostAvailable()) return true;
  return false;
}

if (shouldMountUi()) {
  const rootEl = document.getElementById('root');
  if (rootEl) {
    createRoot(rootEl).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  }
}
