import { useState } from 'react';
import './ReviewPanel.css';

interface ReviewPanelProps {
  review: string;
  isLoading?: boolean;
}

interface StructuredReview {
  summary?: {
    totalFiles: number;
    overallQuality: string;
    mainLanguages: string[];
    architecturePattern: string;
    keyFindings: string;
  };
  criticalIssues?: Array<{
    severity: string;
    category: string;
    title: string;
    description: string;
    files: string[];
    recommendation: string;
  }>;
  potentialBugs?: Array<{
    file: string;
    line: string;
    issue: string;
    severity: string;
    suggestion: string;
  }>;
  fileReviews?: Array<{
    file: string;
    score: string;
    strengths: string[];
    issues: string[];
    suggestions: string[];
  }>;
  recommendations?: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  metrics?: {
    codeComplexity: string;
    testCoverage: string;
    documentationQuality: string;
    codeConsistency: string;
  };
}

export default function ReviewPanel({ review, isLoading = false }: ReviewPanelProps) {
  const [activeTab, setActiveTab] = useState('summary');
  const [isExpanded, setIsExpanded] = useState(true);

  const parseStructuredReview = (reviewText: string): StructuredReview | null => {
    try {
      // Try to extract JSON from the review text
      const jsonMatch = reviewText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse structured review:', error);
    }
    return null;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getScoreColor = (score: string) => {
    switch (score) {
      case 'A': return '#28a745';
      case 'B': return '#20c997';
      case 'C': return '#ffc107';
      case 'D': return '#fd7e14';
      case 'F': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const structuredReview = parseStructuredReview(review);
  const hasReview = review && review.trim().length > 0;

  const renderSummary = (summary: StructuredReview['summary']) => {
    if (!summary) return null;
    
    return (
      <div className="summary-section">
        <div className="summary-grid">
          <div className="summary-card">
            <h4>📊 Overview</h4>
            <p><strong>Files:</strong> {summary.totalFiles}</p>
            <p><strong>Quality:</strong> <span className={`quality-badge ${summary.overallQuality}`}>{summary.overallQuality}</span></p>
            <p><strong>Languages:</strong> {summary.mainLanguages.join(', ')}</p>
          </div>
          <div className="summary-card">
            <h4>🏗️ Architecture</h4>
            <p>{summary.architecturePattern}</p>
          </div>
        </div>
        <div className="key-findings">
          <h4>🔍 Key Findings</h4>
          <p>{summary.keyFindings}</p>
        </div>
      </div>
    );
  };

  const renderCriticalIssues = (issues: StructuredReview['criticalIssues']) => {
    if (!issues || issues.length === 0) {
      return <div className="no-issues">✅ No critical issues found!</div>;
    }

    return (
      <div className="issues-list">
        {issues.map((issue, index) => (
          <div key={index} className="issue-card">
            <div className="issue-header">
              <span 
                className="severity-badge" 
                style={{ backgroundColor: getSeverityColor(issue.severity) }}
              >
                {issue.severity}
              </span>
              <span className="category-badge">{issue.category}</span>
              <h4>{issue.title}</h4>
            </div>
            <p className="issue-description">{issue.description}</p>
            <div className="issue-files">
              <strong>Files:</strong> {issue.files.join(', ')}
            </div>
            <div className="issue-recommendation">
              <strong>💡 Recommendation:</strong> {issue.recommendation}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderPotentialBugs = (bugs: StructuredReview['potentialBugs']) => {
    if (!bugs || bugs.length === 0) {
      return <div className="no-issues">✅ No potential bugs detected!</div>;
    }

    return (
      <div className="bugs-list">
        {bugs.map((bug, index) => (
          <div key={index} className="bug-card">
            <div className="bug-header">
              <span 
                className="severity-badge" 
                style={{ backgroundColor: getSeverityColor(bug.severity) }}
              >
                {bug.severity}
              </span>
              <span className="file-name">{bug.file}</span>
              <span className="line-number">Line {bug.line}</span>
            </div>
            <p className="bug-issue">{bug.issue}</p>
            <p className="bug-suggestion"><strong>💡 Fix:</strong> {bug.suggestion}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderFileReviews = (fileReviews: StructuredReview['fileReviews']) => {
    if (!fileReviews || fileReviews.length === 0) {
      return <div className="no-reviews">No file-specific reviews available.</div>;
    }

    return (
      <div className="file-reviews">
        {fileReviews.map((fileReview, index) => (
          <div key={index} className="file-review-card">
            <div className="file-header">
              <span className="file-name">{fileReview.file}</span>
              <span 
                className="score-badge" 
                style={{ backgroundColor: getScoreColor(fileReview.score) }}
              >
                {fileReview.score}
              </span>
            </div>
            
            {fileReview.strengths.length > 0 && (
              <div className="file-section">
                <h5>✅ Strengths</h5>
                <ul>
                  {fileReview.strengths.map((strength, i) => (
                    <li key={i}>{strength}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {fileReview.issues.length > 0 && (
              <div className="file-section">
                <h5>⚠️ Issues</h5>
                <ul>
                  {fileReview.issues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {fileReview.suggestions.length > 0 && (
              <div className="file-section">
                <h5>💡 Suggestions</h5>
                <ul>
                  {fileReview.suggestions.map((suggestion, i) => (
                    <li key={i}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderRecommendations = (recommendations: StructuredReview['recommendations']) => {
    if (!recommendations) return null;

    return (
      <div className="recommendations-section">
        {recommendations.immediate.length > 0 && (
          <div className="rec-category">
            <h4>🚨 Immediate Actions</h4>
            <ul>
              {recommendations.immediate.map((rec, i) => (
                <li key={i} className="immediate-rec">{rec}</li>
              ))}
            </ul>
          </div>
        )}
        
        {recommendations.shortTerm.length > 0 && (
          <div className="rec-category">
            <h4>📋 Short Term (Next Sprint)</h4>
            <ul>
              {recommendations.shortTerm.map((rec, i) => (
                <li key={i} className="short-term-rec">{rec}</li>
              ))}
            </ul>
          </div>
        )}
        
        {recommendations.longTerm.length > 0 && (
          <div className="rec-category">
            <h4>🚀 Long Term (Strategic)</h4>
            <ul>
              {recommendations.longTerm.map((rec, i) => (
                <li key={i} className="long-term-rec">{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderMetrics = (metrics: StructuredReview['metrics']) => {
    if (!metrics) return null;

    return (
      <div className="metrics-grid">
        <div className="metric-card">
          <h4>⚡ Code Complexity</h4>
          <span className={`metric-value ${metrics.codeComplexity}`}>{metrics.codeComplexity}</span>
        </div>
        <div className="metric-card">
          <h4>🧪 Test Coverage</h4>
          <span className="metric-value">{metrics.testCoverage}</span>
        </div>
        <div className="metric-card">
          <h4>📚 Documentation</h4>
          <span className={`metric-value ${metrics.documentationQuality}`}>{metrics.documentationQuality}</span>
        </div>
        <div className="metric-card">
          <h4>🎯 Consistency</h4>
          <span className={`metric-value ${metrics.codeConsistency}`}>{metrics.codeConsistency}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="review-panel">
      <div className="review-header-section" onClick={() => setIsExpanded(!isExpanded)}>
        <h2 className="review-title">
          <span className="review-icon">📋</span>
          Code Review Report
          {hasReview && <span className="review-status ready">Ready</span>}
          {isLoading && <span className="review-status loading">Generating...</span>}
        </h2>
        <button className="expand-btn" aria-label={isExpanded ? 'Collapse' : 'Expand'}>
          {isExpanded ? '🔽' : '▶️'}
        </button>
      </div>

      {isExpanded && (
        <div className="review-content">
          {isLoading ? (
            <div className="review-loading">
              <div className="loading-spinner"></div>
              <p>AI is analyzing your code and generating comprehensive review...</p>
            </div>
          ) : hasReview ? (
            structuredReview ? (
              <div className="structured-review">
                <div className="review-tabs">
                  <button 
                    className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
                    onClick={() => setActiveTab('summary')}
                  >
                    📊 Summary
                  </button>
                  <button 
                    className={`tab ${activeTab === 'issues' ? 'active' : ''}`}
                    onClick={() => setActiveTab('issues')}
                  >
                    🚨 Critical Issues
                  </button>
                  <button 
                    className={`tab ${activeTab === 'bugs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('bugs')}
                  >
                    🐛 Potential Bugs
                  </button>
                  <button 
                    className={`tab ${activeTab === 'files' ? 'active' : ''}`}
                    onClick={() => setActiveTab('files')}
                  >
                    📁 File Reviews
                  </button>
                  <button 
                    className={`tab ${activeTab === 'recommendations' ? 'active' : ''}`}
                    onClick={() => setActiveTab('recommendations')}
                  >
                    💡 Recommendations
                  </button>
                  <button 
                    className={`tab ${activeTab === 'metrics' ? 'active' : ''}`}
                    onClick={() => setActiveTab('metrics')}
                  >
                    📈 Metrics
                  </button>
                </div>

                <div className="tab-content">
                  {activeTab === 'summary' && renderSummary(structuredReview.summary)}
                  {activeTab === 'issues' && renderCriticalIssues(structuredReview.criticalIssues)}
                  {activeTab === 'bugs' && renderPotentialBugs(structuredReview.potentialBugs)}
                  {activeTab === 'files' && renderFileReviews(structuredReview.fileReviews)}
                  {activeTab === 'recommendations' && renderRecommendations(structuredReview.recommendations)}
                  {activeTab === 'metrics' && renderMetrics(structuredReview.metrics)}
                </div>

                <div className="review-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => navigator.clipboard.writeText(review)}
                    title="Copy review to clipboard"
                  >
                    📋 Copy Review
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => {
                      const blob = new Blob([review], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `code-review-${new Date().toISOString().split('T')[0]}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    title="Download review as text file"
                  >
                    💾 Download
                  </button>
                </div>
              </div>
            ) : (
              <div className="fallback-review">
                <h4>📝 Review Results</h4>
                <pre className="raw-review">{review}</pre>
                <div className="review-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => navigator.clipboard.writeText(review)}
                    title="Copy review to clipboard"
                  >
                    📋 Copy Review
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="review-empty">
              <div className="empty-icon">📝</div>
              <h3>No Review Yet</h3>
              <p>Start a code review to see the AI-generated analysis and recommendations here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}