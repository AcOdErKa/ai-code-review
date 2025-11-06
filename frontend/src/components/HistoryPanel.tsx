import { useState, useEffect } from 'react';
import './HistoryPanel.css';

interface ReviewHistory {
  commitHash: string;
  review: string;
  timestamp: string;
  date: string;
}

interface HistoryPanelProps {
  userId: string;
  repo: string;
  onSelectReview?: (review: string) => void;
  onClose: () => void;
}

export default function HistoryPanel({ userId, repo, onSelectReview, onClose }: HistoryPanelProps) {
  const [history, setHistory] = useState<ReviewHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const API = 'http://localhost:8000';

  const loadHistory = async () => {
    if (!repo || !userId) return;
    
    setIsLoading(true);
    try {
      const [, repoName] = repo.split('/');
      const res = await fetch(`${API}/history/${userId}/${repoName}`);
      const data = await res.json();
      setHistory(data.history || []);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteReview = async (commitHash: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    
    try {
      const [, repoName] = repo.split('/');
      const res = await fetch(`${API}/history/${userId}/${repoName}/${commitHash}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        // Refresh the history list
        await loadHistory();
      } else {
        const error = await res.json();
        alert(`Failed to delete review: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to delete review:', error);
      alert('Failed to delete review. Please try again.');
    }
  };

  const handleViewReview = (review: string, index: number) => {
    setSelectedIndex(index);
    if (onSelectReview) {
      onSelectReview(review);
    }
    onClose();
  };

  const parseStructuredReview = (reviewText: string) => {
    try {
      const structured = JSON.parse(reviewText);
      if (structured.summary && structured.issues) {
        return structured;
      }
    } catch {
      // Not structured JSON, treat as plain text
    }
    return null;
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    loadHistory();
  }, [userId, repo]);

  return (
    <div className="history-overlay">
      <div className="history-panel">
        <div className="history-header">
          <h2>Review History</h2>
          <div className="history-info">
            <div className="repo-info">{repo}</div>
            <button 
              className="refresh-btn" 
              onClick={loadHistory}
              disabled={isLoading}
            >
              ↻ Refresh
            </button>
          </div>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="history-content">
          {isLoading ? (
            <div className="history-loading">
              <div className="loading-spinner"></div>
              Loading review history...
            </div>
          ) : history.length === 0 ? (
            <div className="history-empty">
              <div className="empty-icon">📜</div>
              <h3>No Review History</h3>
              <p>No previous reviews found for this repository. Start a review to build your history!</p>
            </div>
          ) : (
            <div className="history-list">
              {history.map((item, index) => {
                const structured = parseStructuredReview(item.review);
                const isSelected = selectedIndex === index;

                return (
                  <div 
                    key={item.commitHash} 
                    className={`history-item ${isSelected ? 'selected' : ''}`}
                  >
                    <div className="history-item-header">
                      <div className="commit-info">
                        <div className="commit-hash">{item.commitHash}</div>
                        <div className="review-date">{formatDate(item.timestamp)}</div>
                      </div>
                      <div className="history-actions">
                        <button 
                          className="view-btn"
                          onClick={() => handleViewReview(item.review, index)}
                        >
                          View
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => deleteReview(item.commitHash)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="history-item-content">
                      {structured ? (
                        <div className="structured-preview">
                          <div className={`quality-badge quality-${structured.overallQuality?.toLowerCase() || 'unknown'}`}>
                            Quality: {structured.overallQuality || 'Unknown'}
                          </div>
                          
                          <div className="stats-grid">
                            <div className="stat-item">
                              <div className="stat-label">Issues</div>
                              <div className="stat-value">{structured.issues?.length || 0}</div>
                            </div>
                            <div className="stat-item">
                              <div className="stat-label">Files</div>
                              <div className="stat-value">{structured.filesReviewed || 'N/A'}</div>
                            </div>
                            <div className="stat-item">
                              <div className="stat-label">Score</div>
                              <div className="stat-value">{structured.qualityScore || 'N/A'}</div>
                            </div>
                          </div>

                          {structured.keyFindings && (
                            <div className="key-findings-preview">
                              <strong>Key Findings:</strong> {structured.keyFindings.slice(0, 120)}
                              {structured.keyFindings.length > 120 && '...'}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-preview">
                          {item.review.slice(0, 200)}
                          {item.review.length > 200 && '...'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="history-footer">
          <button className="close-btn-footer" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}