import { useState } from 'react';
import './ProgressPanel.css';

interface Checkpoint {
  agent: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  startTime?: string;
  endTime?: string;
  description: string;
  details?: string;
}

interface AgentProgress {
  plan: string[];
  currentStep: number;
  totalSteps: number;
  checkpoints: Checkpoint[];
}

interface ProgressPanelProps {
  progress: AgentProgress | null;
  isActive: boolean;
}

export default function ProgressPanel({ progress, isActive }: ProgressPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getStatusIcon = (status: Checkpoint['status']) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in-progress': return '🔄';
      case 'error': return '❌';
      case 'pending': 
      default: return '⏳';
    }
  };

  const getStatusColor = (status: Checkpoint['status']) => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'in-progress': return '#007bff';
      case 'error': return '#dc3545';
      case 'pending': 
      default: return '#6c757d';
    }
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString();
  };

  const getElapsedTime = (startTime?: string, endTime?: string) => {
    if (!startTime) return '';
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    const elapsed = Math.round((end - start) / 1000);
    return `${elapsed}s`;
  };

  return (
    <div className="progress-panel">
      <div className="progress-header-section" onClick={() => setIsExpanded(!isExpanded)}>
        <h2 className="progress-title">
          <span className="progress-icon">⚡</span>
          Agent Flow & Progress
          {isActive && <span className="progress-status active">Running</span>}
          {!isActive && progress && <span className="progress-status completed">Completed</span>}
        </h2>
        <button className="expand-btn" aria-label={isExpanded ? 'Collapse' : 'Expand'}>
          {isExpanded ? '🔽' : '▶️'}
        </button>
      </div>

      {isExpanded && (
        <div className="progress-content">
          {progress ? (
            <>
              <div className="progress-overview">
                <div className="progress-bar-container">
                  <div className="progress-info">
                    <span>Step {progress.currentStep} of {progress.totalSteps}</span>
                    <span>{Math.round((progress.currentStep / progress.totalSteps) * 100)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${(progress.currentStep / progress.totalSteps) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div className="plan-overview">
                  <h4>📋 Review Plan</h4>
                  <ul className="plan-list">
                    {progress.plan.map((step, index) => (
                      <li 
                        key={index} 
                        className={`plan-item ${index < progress.currentStep ? 'completed' : ''} ${index === progress.currentStep ? 'current' : ''}`}
                      >
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="checkpoints-section">
                <h4>🔍 Agent Checkpoints</h4>
                <div className="checkpoints-timeline">
                  {progress.checkpoints.map((checkpoint, index) => (
                    <div key={index} className={`checkpoint-item ${checkpoint.status}`}>
                      <div className="checkpoint-indicator">
                        <span className="checkpoint-icon">{getStatusIcon(checkpoint.status)}</span>
                        <div className="checkpoint-line" />
                      </div>
                      
                      <div className="checkpoint-content">
                        <div className="checkpoint-header">
                          <h5 className="checkpoint-title">{checkpoint.description}</h5>
                          <div className="checkpoint-meta">
                            <span 
                              className="checkpoint-status"
                              style={{ color: getStatusColor(checkpoint.status) }}
                            >
                              {checkpoint.status.replace('-', ' ')}
                            </span>
                            {checkpoint.startTime && (
                              <span className="checkpoint-time">
                                {checkpoint.endTime ? (
                                  `${formatTime(checkpoint.startTime)} - ${formatTime(checkpoint.endTime)} (${getElapsedTime(checkpoint.startTime, checkpoint.endTime)})`
                                ) : (
                                  `Started ${formatTime(checkpoint.startTime)} (${getElapsedTime(checkpoint.startTime)})`
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {checkpoint.details && (
                          <div className="checkpoint-details">
                            {checkpoint.details}
                          </div>
                        )}
                        
                        <div className="checkpoint-agent">
                          <span className="agent-badge">{checkpoint.agent}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="progress-empty">
              <div className="empty-icon">⏱️</div>
              <h3>No Active Review</h3>
              <p>Start a code review to see the real-time agent flow and progress tracking here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}