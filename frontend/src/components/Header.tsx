import './Header.css';

interface HeaderProps {
  onRulesClick: () => void;
  onHistoryClick: () => void;
}

export default function Header({ onRulesClick, onHistoryClick }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="header-title">
            <span className="logo-icon">🔍</span>
            AI Code Reviewer
          </h1>
          <p className="header-subtitle">
            Automated code review powered by AI
          </p>
        </div>
        <div className="header-right">
          <button className="history-btn" onClick={onHistoryClick}>
            <span className="history-icon">📜</span>
            History
          </button>
          <button className="rules-btn" onClick={onRulesClick}>
            <span className="rules-icon">⚙️</span>
            Custom Rules
          </button>
        </div>
      </div>
    </header>
  );
}