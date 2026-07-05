import { useEffect, useRef, useState } from 'react';

export default function ChatBox({ messages, onSend, disabled, placeholder }) {
  const [text, setText] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  }

  return (
    <div className="card flex flex-col h-full overflow-hidden">
      <div ref={listRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
        {messages.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)] italic m-auto">
            Guesses and chat show up here...
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="text-sm leading-snug break-words">
            {m.system ? (
              <span className="text-[var(--color-accent)] italic">{m.text}</span>
            ) : (
              <span>
                <span className="font-semibold text-[var(--color-primary)]">{m.playerName}: </span>
                <span className={m.guessFeedback === 'close' ? 'text-[var(--color-accent)]' : ''}>{m.text}</span>
              </span>
            )}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 p-2 border-t border-[var(--color-border)]">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
          maxLength={200}
          placeholder={placeholder || 'Type your guess...'}
          className="flex-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled}
          className="btn-primary rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
