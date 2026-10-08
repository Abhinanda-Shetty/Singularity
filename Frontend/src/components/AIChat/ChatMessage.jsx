import { Sparkles, User } from 'lucide-react';

export default function ChatMessage({ message }) {
  const isAssistant = message.sender === 'assistant';

  return (
    <div className={`chat-message-row ${isAssistant ? 'assistant' : 'user'}`}>
      {isAssistant && (
        <div className="chat-avatar assistant-avatar" aria-hidden="true">
          <Sparkles size={14} />
        </div>
      )}

      <div className="chat-bubble-container">
        <div className={`chat-bubble ${isAssistant ? 'assistant' : 'user'}`}>
          <div className="chat-bubble-text">
            {message.text}
          </div>
        </div>
        {message.timestamp && (
          <span className="chat-timestamp">
            {message.timestamp}
          </span>
        )}
      </div>

      {!isAssistant && (
        <div className="chat-avatar user-avatar" aria-hidden="true">
          <User size={13} />
        </div>
      )}
    </div>
  );
}
