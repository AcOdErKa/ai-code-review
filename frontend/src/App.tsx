import { useState, useEffect } from 'react';
import Header from './components/Header';
import RepositoryForm from './components/RepositoryForm';
import RulesPage from './components/RulesPage';
import ReviewPanel from './components/ReviewPanel';
import LogPanel from './components/LogPanel';
import ProgressPanel from './components/ProgressPanel';
import HistoryPanel from './components/HistoryPanel';
import './App.css';

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

export default function App() {
  const [userId, setUserId] = useState('user1');
  const [repo, setRepo] = useState('facebook/react');
  const [branch, setBranch] = useState('main');
  const [log, setLog] = useState('');
  const [review, setReview] = useState('');
  const [rules, setRules] = useState('[]');
  const [isReviewing, setIsReviewing] = useState(false);
  const [isLoadingRules, setIsLoadingRules] = useState(false);
  const [showRulesPage, setShowRulesPage] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [agentProgress, setAgentProgress] = useState<AgentProgress | null>(null);

  const API = 'http://localhost:8000';

  const loadRules = async () => {
    setIsLoadingRules(true);
    try {
      const [, repoName] = repo.split('/');
      const res = await fetch(`${API}/rules/${userId}/${repoName}`);
      const data = await res.json();
      setRules(JSON.stringify(data.rules || [], null, 2));
    } catch (error) {
      console.error('Failed to load rules:', error);
    } finally {
      setIsLoadingRules(false);
    }
  };

  const saveRules = async () => {
    let parsed;
    try { 
      parsed = JSON.parse(rules); 
    } catch { 
      alert("Invalid JSON format. Please check your rules syntax."); 
      return; 
    }
    
    try {
      const [, repoName] = repo.split('/');
      await fetch(`${API}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, repo_name: repoName, rules: parsed })
      });
      alert('Rules saved successfully!');
    } catch (error) {
      console.error('Failed to save rules:', error);
      alert('Failed to save rules. Please try again.');
    }
  };

  const startReview = () => {
    setLog(''); 
    setReview('');
    setIsReviewing(true);
    setAgentProgress(null);
    
    const es = new EventSource(`${API}/review`);
    let sessionId = '';
    
    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      
      if (data.sessionId) {
        sessionId = data.sessionId;
        // Set initial progress if provided
        if (data.progress) {
          setAgentProgress(data.progress);
        }
        // Now that we have the session ID, start the review
        fetch(`${API}/review`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, repo, branch, sessionId })
        }).catch(error => {
          console.error('Failed to start review:', error);
          setIsReviewing(false);
          es.close();
        });
      } else if (data.type === 'progress') {
        // Update agent progress
        setAgentProgress(data.progress);
      } else if (data.type === 'log' && data.log) {
        setLog(p => p + data.log + '\n');
      } else if (data.type === 'review' && data.review) {
        setReview(data.review);
        // Mark progress as completed
        setAgentProgress((prev: AgentProgress | null) => prev ? {
          ...prev,
          currentStep: prev.totalSteps,
          checkpoints: prev.checkpoints.map((cp: Checkpoint) => 
            cp.status === 'in-progress' ? { ...cp, status: 'completed' as const, endTime: new Date().toISOString() } : cp
          )
        } : null);
        setIsReviewing(false);
        es.close();
      } else if (data.type === 'done') {
        // Finalize progress when done
        setAgentProgress((prev: AgentProgress | null) => prev ? {
          ...prev,
          currentStep: prev.totalSteps,
          checkpoints: prev.checkpoints.map((cp: Checkpoint) => 
            cp.status === 'in-progress' ? { ...cp, status: 'completed' as const, endTime: new Date().toISOString() } : cp
          )
        } : null);
        setIsReviewing(false);
        es.close();
      } else if (data.type === 'error') {
        setLog(p => p + `Error: ${data.error}\n`);
        // Mark any in-progress checkpoints as error
        setAgentProgress((prev: AgentProgress | null) => prev ? {
          ...prev,
          checkpoints: prev.checkpoints.map((cp: Checkpoint) => 
            cp.status === 'in-progress' ? { ...cp, status: 'error' as const, endTime: new Date().toISOString() } : cp
          )
        } : null);
        setIsReviewing(false);
        es.close();
      }
      // Legacy support for old message format
      else if (data.log) {
        setLog(p => p + data.log + '\n');
      } else if (data.review) {
        setReview(data.review);
        // Mark progress as completed for legacy format
        setAgentProgress((prev: AgentProgress | null) => prev ? {
          ...prev,
          currentStep: prev.totalSteps,
          checkpoints: prev.checkpoints.map((cp: Checkpoint) => 
            cp.status === 'in-progress' ? { ...cp, status: 'completed' as const, endTime: new Date().toISOString() } : cp
          )
        } : null);
        setIsReviewing(false);
        es.close();
      } else if (data.done) {
        // Finalize progress for legacy format
        setAgentProgress((prev: AgentProgress | null) => prev ? {
          ...prev,
          currentStep: prev.totalSteps,
          checkpoints: prev.checkpoints.map((cp: Checkpoint) => 
            cp.status === 'in-progress' ? { ...cp, status: 'completed' as const, endTime: new Date().toISOString() } : cp
          )
        } : null);
        setIsReviewing(false);
        es.close();
      } else if (data.error) {
        setLog(p => p + `Error: ${data.error}\n`);
        // Mark checkpoints as error for legacy format
        setAgentProgress((prev: AgentProgress | null) => prev ? {
          ...prev,
          checkpoints: prev.checkpoints.map((cp: Checkpoint) => 
            cp.status === 'in-progress' ? { ...cp, status: 'error' as const, endTime: new Date().toISOString() } : cp
          )
        } : null);
        setIsReviewing(false);
        es.close();
      }
    };

    es.onerror = () => {
      // Mark any in-progress checkpoints as error on connection failure
      setAgentProgress((prev: AgentProgress | null) => prev ? {
        ...prev,
        checkpoints: prev.checkpoints.map((cp: Checkpoint) => 
          cp.status === 'in-progress' ? { ...cp, status: 'error' as const, endTime: new Date().toISOString() } : cp
        )
      } : null);
      setIsReviewing(false);
      es.close();
    };
  };

  useEffect(() => { 
    loadRules(); 
  }, [userId, repo]);

  return (
    <div className="app">
      <div className="app-container">
        <Header 
          onRulesClick={() => setShowRulesPage(true)}
          onHistoryClick={() => setShowHistoryPanel(true)}
        />
        
        <main className="main-content">
          <div className="top-section">
            <RepositoryForm
              userId={userId}
              repo={repo}
              branch={branch}
              onUserIdChange={setUserId}
              onRepoChange={setRepo}
              onBranchChange={setBranch}
              onRefreshRules={loadRules}
              onStartReview={startReview}
              isReviewing={isReviewing}
            />
          </div>

          <div className="panels-grid">
            <ProgressPanel 
              progress={agentProgress}
              isActive={isReviewing}
            />
            
            <LogPanel 
              log={log} 
              isActive={isReviewing}
            />
          </div>
          
          <div className="review-section">
            <ReviewPanel 
              review={review}
              isLoading={isReviewing && !review}
            />
          </div>
        </main>

        {showRulesPage && (
          <RulesPage
            userId={userId}
            repo={repo}
            rules={rules}
            onRulesChange={setRules}
            onSaveRules={saveRules}
            onClose={() => setShowRulesPage(false)}
            isLoading={isLoadingRules}
          />
        )}

        {showHistoryPanel && (
          <HistoryPanel
            userId={userId}
            repo={repo}
            onSelectReview={(review: string) => setReview(review)}
            onClose={() => setShowHistoryPanel(false)}
          />
        )}
      </div>
    </div>
  );
}
