import './RepositoryForm.css';

interface RepositoryFormProps {
  userId: string;
  repo: string;
  branch: string;
  onUserIdChange: (userId: string) => void;
  onRepoChange: (repo: string) => void;
  onBranchChange: (branch: string) => void;
  onRefreshRules: () => void;
  onStartReview: () => void;
  isReviewing?: boolean;
}

export default function RepositoryForm({
  userId,
  repo,
  branch,
  onUserIdChange,
  onRepoChange,
  onBranchChange,
  onRefreshRules,
  onStartReview,
  isReviewing = false
}: RepositoryFormProps) {
  return (
    <div className="repository-form">
      <h2 className="form-title">Repository Configuration</h2>
      
      <div className="form-grid">
        <div className="input-group">
          <label htmlFor="userId" className="input-label">User ID</label>
          <input
            id="userId"
            type="text"
            placeholder="Enter your user ID"
            value={userId}
            onChange={(e) => onUserIdChange(e.target.value)}
            className="form-input"
            disabled={isReviewing}
          />
        </div>
        
        <div className="input-group">
          <label htmlFor="repository" className="input-label">Repository</label>
          <input
            id="repository"
            type="text"
            placeholder="owner/repository-name"
            value={repo}
            onChange={(e) => onRepoChange(e.target.value)}
            className="form-input"
            disabled={isReviewing}
          />
          <small className="input-hint">Format: owner/repository-name (e.g., facebook/react)</small>
        </div>
        
        <div className="input-group">
          <label htmlFor="branch" className="input-label">Branch</label>
          <div className="branch-input-group">
            <input
              id="branch"
              type="text"
              placeholder="main"
              value={branch}
              onChange={(e) => onBranchChange(e.target.value)}
              className="form-input"
              disabled={isReviewing}
            />
            <button
              onClick={onRefreshRules}
              className="btn btn-secondary"
              disabled={isReviewing}
              title="Refresh rules from server"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>
      
      <div className="form-actions">
        <button
          onClick={onStartReview}
          className={`btn btn-primary ${isReviewing ? 'btn-loading' : ''}`}
          disabled={isReviewing || !userId || !repo || !branch}
        >
          {isReviewing ? (
            <>
              <span className="spinner"></span>
              Reviewing...
            </>
          ) : (
            <>
              🚀 Start Review
            </>
          )}
        </button>
      </div>
    </div>
  );
}