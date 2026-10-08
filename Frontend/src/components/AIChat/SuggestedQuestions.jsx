import { HelpCircle, ChevronRight } from 'lucide-react';
import { SUGGESTED_QUESTIONS } from './chatService';

export default function SuggestedQuestions({ onSelectQuestion, disabled = false }) {
  return (
    <div className="suggested-questions-wrap">
      <div className="suggested-header">
        <HelpCircle size={13} className="suggested-icon" />
        <span>Suggested Questions</span>
      </div>
      <div className="suggested-list">
        {SUGGESTED_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            type="button"
            className="suggested-btn"
            onClick={() => onSelectQuestion(q)}
            disabled={disabled}
          >
            <span className="suggested-text">{q}</span>
            <ChevronRight size={13} className="suggested-arrow" />
          </button>
        ))}
      </div>
    </div>
  );
}
