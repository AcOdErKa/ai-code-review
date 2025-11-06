import { useState, useRef, useEffect } from 'react';
import './LogPanel.css';

interface LogPanelProps {
  log: string;
  isActive?: boolean;
}

export default function LogPanel({ log, isActive = false }: LogPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [filter, setFilter] = useState('');
  const logRef = useRef<HTMLPreElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (isAutoScroll && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log, isAutoScroll]);

  const filteredLog = filter 
    ? log.split('\n').filter(line => 
        line.toLowerCase().includes(filter.toLowerCase())
      ).join('\n')
    : log;

  const logLines = log.split('\n').filter(line => line.trim());
  const hasLogs = logLines.length > 0;

  const clearLogs = () => {
    // This would need to be passed as a prop if we want to actually clear
    // For now, just scroll to top
    if (logRef.current) {
      logRef.current.scrollTop = 0;
    }
  };

  return (
    <div className="log-panel">
      <div className="log-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h2 className="log-title">
          <span className="log-icon">📊</span>
          Live Log
          {isActive && <span className="log-status active">Active</span>}
          {hasLogs && !isActive && <span className="log-status complete">Complete</span>}
          <span className="log-count">({logLines.length} lines)</span>
        </h2>
        <button className="expand-btn" aria-label={isExpanded ? 'Collapse' : 'Expand'}>
          {isExpanded ? '🔽' : '▶️'}
        </button>
      </div>

      {isExpanded && (
        <div className="log-content">
          <div className="log-controls">
            <div className="log-filters">
              <input
                type="text"
                placeholder="Filter logs..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="filter-input"
              />
              {filter && (
                <button 
                  onClick={() => setFilter('')}
                  className="clear-filter-btn"
                  title="Clear filter"
                >
                  ✕
                </button>
              )}
            </div>
            
            <div className="log-actions">
              <label className="auto-scroll-toggle">
                <input
                  type="checkbox"
                  checked={isAutoScroll}
                  onChange={(e) => setIsAutoScroll(e.target.checked)}
                />
                <span>Auto-scroll</span>
              </label>
              
              <button 
                onClick={clearLogs}
                className="btn btn-small btn-secondary"
                title="Scroll to top"
              >
                ⬆️ Top
              </button>
              
              <button 
                onClick={() => navigator.clipboard.writeText(log)}
                className="btn btn-small btn-secondary"
                disabled={!hasLogs}
                title="Copy logs to clipboard"
              >
                📋 Copy
              </button>
            </div>
          </div>

          <div className="log-display">
            {hasLogs ? (
              <pre 
                ref={logRef}
                className={`log-text ${isActive ? 'active' : ''}`}
              >
                {filteredLog || (filter ? 'No logs match the filter' : log)}
              </pre>
            ) : (
              <div className="log-empty">
                <div className="empty-icon">📝</div>
                <h3>No Logs Yet</h3>
                <p>Start a code review to see real-time progress logs here.</p>
              </div>
            )}
          </div>

          {filter && (
            <div className="filter-info">
              Showing {filteredLog.split('\n').filter(line => line.trim()).length} of {logLines.length} lines
            </div>
          )}
        </div>
      )}
    </div>
  );
}