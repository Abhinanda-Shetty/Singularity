import { useState, useRef, useEffect } from 'react';
import { queryLlmAssistant } from '../../services/api';
import './AiChatbot.css';

const QUICK_PROMPTS = [
  { label: '🚨 Critical Shortages', query: 'What critical medicine shortages exist right now?' },
  { label: '⏳ Expiring Batches', query: 'Which medicine batches are expiring within 90 days?' },
  { label: '📦 Surplus Inventory', query: 'Show facilities with surplus stock available for transfer' },
  { label: '📋 Pending Transfers', query: 'Are there any pending transfer requests that need attention?' },
];

export default function AiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello, I am your **MedSupply AI Copilot**. I am connected directly to live hospital inventory and telemetry. How can I assist your logistics today?',
      source: 'live-grid-telemetry',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  const handleSend = async (queryText) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || loading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await queryLlmAssistant(textToSend);
      const assistantMsg = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: res.answer || 'No response returned from supply intelligence assistant.',
        source: res.rag_source === 'gemini-model-grounded' ? 'Gemini 3.8 • Supabase Grounded' : 'Supabase Telemetry Grounded',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          text: `⚠️ **Unable to fetch analysis**: ${err.message || 'Network error'}. Please verify backend connection.`,
          source: 'System Error',
          isError: true,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        text: 'Conversation cleared. Ask me about medicine stock, imminent stockouts, or transfer recommendations.',
        source: 'live-grid-telemetry',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Helper to format simple markdown (**bold**, newlines)
  const renderFormattedText = (raw) => {
    if (!raw) return null;
    const parts = raw.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="ai-chatbot-root">
      {/* ── Floating Launcher Button (Bottom Right) ── */}
      {!isOpen && (
        <button
          type="button"
          className="ai-chatbot-trigger"
          onClick={() => setIsOpen(true)}
          title="Open MedSupply AI Assistant (Supabase RAG)"
          id="ai-chatbot-open-btn"
        >
          <div className="ai-trigger-icon-wrap">
            <svg
              className="ai-sparkle-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            <span className="ai-pulse-dot" />
          </div>
          <div className="ai-trigger-label">
            <span className="ai-trigger-title">AI Copilot</span>
            <span className="ai-trigger-sub">RAG Active</span>
          </div>
        </button>
      )}

      {/* ── Active Chat Window ── */}
      {isOpen && (
        <div className="ai-chatbot-window" id="ai-chatbot-window">
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-header-left">
              <div className="ai-header-avatar">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div className="ai-header-info">
                <div className="ai-header-title-row">
                  <span className="ai-header-title">MedSupply AI Copilot</span>
                  <span className="ai-status-pill">Live Grid</span>
                </div>
                <span className="ai-header-subtitle">RAG Grounded • Gemini 3.8</span>
              </div>
            </div>

            <div className="ai-header-actions">
              <button
                type="button"
                className="ai-icon-btn"
                onClick={handleClear}
                title="Clear conversation"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
              <button
                type="button"
                className="ai-icon-btn close-btn"
                onClick={() => setIsOpen(false)}
                title="Minimize chatbot"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Quick suggestions strip */}
          <div className="ai-quick-strip">
            <span className="ai-quick-label">Suggested:</span>
            <div className="ai-quick-scroll">
              {QUICK_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="ai-chip"
                  onClick={() => handleSend(p.query)}
                  disabled={loading}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Messages list */}
          <div className="ai-messages-body">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`ai-message-row ${m.role === 'user' ? 'user-row' : 'assistant-row'} ${m.isError ? 'error-row' : ''}`}
              >
                {m.role === 'assistant' && (
                  <div className="ai-msg-avatar">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                  </div>
                )}
                <div className="ai-bubble">
                  <div className="ai-bubble-content">{renderFormattedText(m.text)}</div>
                  <div className="ai-bubble-meta">
                    {m.source && <span className="ai-meta-source">{m.source}</span>}
                    <span className="ai-meta-time">{m.time}</span>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="ai-message-row assistant-row">
                <div className="ai-msg-avatar">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
                <div className="ai-bubble loading-bubble">
                  <div className="ai-typing-indicator">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                  <span className="ai-typing-text">Analyzing live hospital telemetry...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form
            className="ai-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              ref={inputRef}
              type="text"
              className="ai-chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about medicine stock, shortages, transfers..."
              disabled={loading}
              id="ai-chatbot-input"
            />
            <button
              type="submit"
              className="ai-send-btn"
              disabled={!input.trim() || loading}
              title="Send query"
              id="ai-chatbot-send-btn"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
          <div className="ai-footer-note">
            Grounding: Live Hospital Database • Multi-Node Telemetry
          </div>
        </div>
      )}
    </div>
  );
}
