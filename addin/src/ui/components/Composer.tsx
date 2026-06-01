import type { ActionType } from '../../api/types';
import { ACTION_OPTIONS } from '../../actions';

interface ComposerProps {
  action: ActionType;
  onActionChange(action: ActionType): void;

  userInput: string;
  onUserInputChange(value: string): void;

  selection: string;
  onReadSelection(): void;

  streaming: boolean;
  onSend(): void;
  onStop(): void;
}

export function Composer(props: ComposerProps): JSX.Element {
  const {
    action,
    onActionChange,
    userInput,
    onUserInputChange,
    selection,
    onReadSelection,
    streaming,
    onSend,
    onStop,
  } = props;

  return (
    <div className="composer">
      {selection.length > 0 ? (
        <div className="composer__selection" title="当前已读取的选区">
          选区：{selection}
        </div>
      ) : null}

      <div className="composer__row">
        <select
          value={action}
          onChange={(e) => onActionChange(e.target.value as ActionType)}
          disabled={streaming}
        >
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button onClick={onReadSelection} disabled={streaming}>
          读取选区
        </button>
      </div>

      <textarea
        value={userInput}
        onChange={(e) => onUserInputChange(e.target.value)}
        placeholder="输入补充指令（可留空）"
        disabled={streaming}
      />

      <div className="composer__row">
        {streaming ? (
          <button className="btn--danger" onClick={onStop}>
            停止
          </button>
        ) : (
          <button className="btn--primary" onClick={onSend}>
            发送
          </button>
        )}
      </div>
    </div>
  );
}
