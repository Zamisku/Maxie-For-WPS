import { useCallback, useRef, useState } from 'react';
import { getDocAdapter } from '../adapter';
import { buildChatRequest } from '../actions';
import { streamChat } from '../api/sse-client';
import type { ActionType } from '../api/types';
import { MessageList, type UiMessage } from './components/MessageList';
import { Composer } from './components/Composer';

export function App(): JSX.Element {
  const doc = getDocAdapter();

  const [messages, setMessages] = useState<readonly UiMessage[]>([]);
  const [action, setAction] = useState<ActionType>('polish');
  const [userInput, setUserInput] = useState('');
  const [selection, setSelection] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [writebackBusy, setWritebackBusy] = useState(false);
  const [error, setError] = useState('');

  // 停止按钮：持有当前流的 controller，abort() 中断（架构铁律 5）。
  const abortRef = useRef<AbortController | null>(null);
  // 单调自增，给消息生成稳定 key。
  const idRef = useRef(0);
  const nextId = (): string => `m${++idRef.current}`;

  const readSelection = useCallback(async (): Promise<void> => {
    setError('');
    try {
      const [text, title] = await Promise.all([doc.getSelectionText(), doc.getDocumentTitle()]);
      setSelection(text);
      setDocTitle(title);
    } catch (err) {
      setError(toMessage(err));
    }
  }, [doc]);

  const send = useCallback((): void => {
    if (streaming) return;
    setError('');

    const req = buildChatRequest(action, selection, userInput, docTitle);

    const userMsg: UiMessage = { id: nextId(), role: 'user', content: userVisible(req) };
    const assistantId = nextId();
    const assistantMsg: UiMessage = { id: assistantId, role: 'assistant', content: '' };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setUserInput('');
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    void streamChat(req, {
      signal: controller.signal,
      onToken: (delta) => {
        // 逐字渲染：累加到当前助手消息（架构铁律 5）。
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + delta } : m)),
        );
      },
      onDone: () => {
        setStreaming(false);
        abortRef.current = null;
      },
      onError: (message) => {
        setError(message);
        setStreaming(false);
        abortRef.current = null;
      },
    });
  }, [action, selection, userInput, docTitle, streaming]);

  const stop = useCallback((): void => {
    abortRef.current?.abort();
  }, []);

  const writeback = useCallback(
    async (mode: 'insert' | 'replace', text: string): Promise<void> => {
      setError('');
      setWritebackBusy(true);
      try {
        if (mode === 'insert') {
          await doc.insertAtCursor(text);
        } else {
          await doc.replaceSelection(text);
        }
      } catch (err) {
        setError(toMessage(err));
      } finally {
        setWritebackBusy(false);
      }
    },
    [doc],
  );

  return (
    <div className="app">
      <header className="app__header">
        Maxie
        <small>{doc.isHostAvailable() ? 'WPS 宿主已连接' : '浏览器开发模式（无 WPS）'}</small>
      </header>

      <div className="messages">
        <MessageList
          messages={messages}
          writebackBusy={writebackBusy}
          onInsert={(text) => void writeback('insert', text)}
          onReplace={(text) => void writeback('replace', text)}
        />
      </div>

      {error.length > 0 ? <div className="error-bar">错误：{error}</div> : null}

      <Composer
        action={action}
        onActionChange={setAction}
        userInput={userInput}
        onUserInputChange={setUserInput}
        selection={selection}
        onReadSelection={() => void readSelection()}
        streaming={streaming}
        onSend={send}
        onStop={stop}
      />
    </div>
  );
}

// 在消息列表里展示用户这轮发了什么（含动作与选区摘要）。
function userVisible(req: { messages: { content: string }[] }): string {
  return req.messages[req.messages.length - 1]?.content ?? '';
}

function toMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
