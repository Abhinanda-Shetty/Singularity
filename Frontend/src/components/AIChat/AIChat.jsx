import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, RotateCcw, MessageSquare } from 'lucide-react';
import ChatMessage from './ChatMessage';
import SuggestedQuestions from './SuggestedQuestions';
import { sendChatMessage } from './chatService';
import './AIChat.css';

const INITIAL_WELCOME_MESSAGE = {
  id: 'welcome-1',
  sender: 'assistant',
  text: "Hello! I'm your MedSupply AI Assistant. I can help you understand inventory, risks, forecasts, expiry alerts, and transfer recommendations.",
  timestamp: 'Just now'
};

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Auto-focus input when opened
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, messages, isTyping]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const getCurrentTimeString = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Process a user message and dispatch mock AI answer
  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isTyping) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: getCurrentTimeString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setShowSuggestions(false);

    try {
      const responseText = await sendChatMessage(query);

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: responseText,
        timestamp: getCurrentTimeString()
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: "I'm having trouble retrieving that information right now. Please try again in a moment.",
        timestamp: getCurrentTimeString()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([{
      ...INITIAL_WELCOME_MESSAGE,
      id: `welcome-${Date.now()}`,
      timestamp: getCurrentTimeString()
    }]);
    setShowSuggestions(true);
    setInputValue('');
  };

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          Floating Launcher Button
         ───────────────────────────────────────────────────────────── */}
      <button
        type="button"
        className="ai-chat-launcher"
        onClick={() => setIsOpen((prev) => !prev)}
        title="MedSupply AI Assistant"
        aria-label="MedSupply AI Assistant"
        aria-expanded={isOpen}
      >
        <div className="ai-launcher-icon-wrap">
          {isOpen ? (
            <X size={20} />
          ) : (
            <>
              <Sparkles size={20} className="ai-launcher-sparkle" />
              <span className="ai-launcher-pulse" />
              <span className="ai-launcher-pulse-ring" />
            </>
          )}
        </div>
        <span className="ai-launcher-label">
          {isOpen ? 'Close AI' : 'MedSupply AI'}
        </span>
      </button>

      {/* ─────────────────────────────────────────────────────────────
          Chat Panel Window
         ───────────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="ai-chat-window"
          role="dialog"
          aria-label="MedSupply AI Assistant Chat"
          aria-modal="false"
        >
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-header-left">
              <div className="ai-header-avatar">
                <Sparkles size={16} />
              </div>
              <div className="ai-header-info">
                <span className="ai-header-title">MedSupply AI</span>
                <span className="ai-header-status">
                  <span className="ai-status-indicator" />
                  Online
                </span>
              </div>
            </div>

            <div className="ai-header-actions">
              <button
                type="button"
                className="ai-header-btn"
                onClick={handleClearChat}
                title="Reset conversation"
                aria-label="Reset conversation"
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                className="ai-header-btn"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                aria-label="Close chat"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body / Messages List */}
          <div className="ai-chat-body">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {/* Suggested questions under welcome message */}
            {showSuggestions && (
              <SuggestedQuestions
                onSelectQuestion={(q) => handleSendMessage(q)}
                disabled={isTyping}
              />
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="chat-message-row assistant">
                <div className="chat-avatar assistant-avatar" aria-hidden="true">
                  <Sparkles size={14} />
                </div>
                <div className="ai-typing-indicator">
                  <span className="ai-typing-text">MedSupply AI is thinking</span>
                  <div className="ai-typing-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer / Input Area */}
          <div className="ai-chat-footer">
            <div className="ai-input-row">
              <MessageSquare size={16} style={{ color: '#8E9B93', flexShrink: 0 }} />
              <input
                ref={inputRef}
                type="text"
                className="ai-chat-input"
                placeholder="Ask MedSupply AI about inventory, risks, transfers…"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
              />
              <button
                type="button"
                className="ai-send-btn"
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isTyping}
                title="Send message"
                aria-label="Send message"
              >
                <Send size={14} />
              </button>
            </div>
            <span className="ai-footer-hint">
              Press Enter ↵ to send • Shift+Enter for new line
            </span>
          </div>
        </div>
      )}
    </>
  );
}
