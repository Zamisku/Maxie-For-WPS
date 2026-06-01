import type { ChatRole } from '../../api/types';

export interface UiMessage {
  id: string;
  role: ChatRole;
  content: string;
}

interface MessageListProps {
  messages: readonly UiMessage[];
  // 助手消息可写回文档；交互在父层（持有 DocAdapter）。
  onInsert(text: string): void;
  onReplace(text: string): void;
  // 写回是异步且依赖宿主，进行中禁用按钮。
  writebackBusy: boolean;
}

export function MessageList(props: MessageListProps): JSX.Element {
  const { messages, onInsert, onReplace, writebackBusy } = props;

  if (messages.length === 0) {
    return <div className="messages__empty">读取选区并选择动作，开始对话。</div>;
  }

  return (
    <>
      {messages.map((m) => (
        <div key={m.id} className={`msg msg--${m.role}`}>
          <div className="msg__role">{roleLabel(m.role)}</div>
          <div>{m.content}</div>
          {m.role === 'assistant' && m.content.length > 0 ? (
            <div className="msg__actions">
              <button
                className="btn--small"
                disabled={writebackBusy}
                onClick={() => onInsert(m.content)}
              >
                插入
              </button>
              <button
                className="btn--small"
                disabled={writebackBusy}
                onClick={() => onReplace(m.content)}
              >
                替换选区
              </button>
            </div>
          ) : null}
        </div>
      ))}
    </>
  );
}

function roleLabel(role: ChatRole): string {
  switch (role) {
    case 'user':
      return '我';
    case 'assistant':
      return 'Maxie';
    case 'system':
      return '系统';
  }
}
