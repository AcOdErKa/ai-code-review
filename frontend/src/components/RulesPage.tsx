import { useState } from 'react';
import './RulesPage.css';

interface RulesPageProps {
  userId: string;
  repo: string;
  rules: string;
  onRulesChange: (rules: string) => void;
  onSaveRules: () => void;
  onClose: () => void;
  isLoading: boolean;
}

export default function RulesPage({
  userId,
  repo,
  rules,
  onRulesChange,
  onSaveRules,
  onClose,
  isLoading
}: RulesPageProps) {
  const [newRule, setNewRule] = useState('');

  const addRule = () => {
    if (!newRule.trim()) return;
    
    try {
      const currentRules = JSON.parse(rules);
      const updatedRules = [...currentRules, newRule.trim()];
      onRulesChange(JSON.stringify(updatedRules, null, 2));
      setNewRule('');
    } catch {
      alert('Invalid JSON format in rules. Please check the syntax.');
    }
  };

  const removeRule = (index: number) => {
    try {
      const currentRules = JSON.parse(rules);
      currentRules.splice(index, 1);
      onRulesChange(JSON.stringify(currentRules, null, 2));
    } catch {
      alert('Invalid JSON format in rules. Please check the syntax.');
    }
  };

  const exampleRules = [
    "Check for proper error handling in try-catch blocks",
    "Ensure all functions have proper TypeScript type annotations",
    "Verify that all API endpoints have proper validation",
    "Check for memory leaks in React components (useEffect cleanup)",
    "Ensure proper security practices (no hardcoded secrets)",
    "Verify proper logging and monitoring implementation"
  ];

  const addExampleRule = (rule: string) => {
    setNewRule(rule);
  };

  let parsedRules: string[] = [];
  try {
    parsedRules = JSON.parse(rules);
  } catch {
    // Invalid JSON, show empty array
  }

  return (
    <div className="rules-page-overlay">
      <div className="rules-page">
        <div className="rules-page-header">
          <h2>Custom Review Rules</h2>
          <div className="rules-page-info">
            <span className="user-repo">
              {userId} / {repo.split('/')[1] || repo}
            </span>
          </div>
          <button className="close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        <div className="rules-page-content">
          <div className="existing-rules-section">
            <h3>Current Rules ({parsedRules.length})</h3>
            {parsedRules.length === 0 ? (
              <div className="no-rules">
                <p>No custom rules defined yet. Add some rules below to customize your code review.</p>
              </div>
            ) : (
              <div className="rules-list">
                {parsedRules.map((rule, index) => (
                  <div key={index} className="rule-item">
                    <span className="rule-text">{rule}</span>
                    <button 
                      className="remove-rule-btn" 
                      onClick={() => removeRule(index)}
                      title="Remove rule"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="add-rule-section">
            <h3>Add New Rule</h3>
            <div className="add-rule-form">
              <textarea
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                placeholder="Example: Check for proper error handling in try-catch blocks"
                className="rule-input"
                rows={3}
              />
              <button 
                onClick={addRule} 
                className="add-rule-btn"
                disabled={!newRule.trim()}
              >
                Add Rule
              </button>
            </div>
          </div>

          <div className="example-rules-section">
            <h3>Example Rules</h3>
            <p>Click on any example rule to add it:</p>
            <div className="example-rules-grid">
              {exampleRules.map((rule, index) => (
                <div 
                  key={index} 
                  className="example-rule"
                  onClick={() => addExampleRule(rule)}
                >
                  {rule}
                </div>
              ))}
            </div>
          </div>

          <div className="raw-json-section">
            <h3>Raw JSON (Advanced)</h3>
            <textarea
              value={rules}
              onChange={(e) => onRulesChange(e.target.value)}
              className="rules-textarea"
              rows={8}
              placeholder='["Add your custom review rules here", "Each rule should be a clear instruction for the AI reviewer"]'
            />
          </div>
        </div>

        <div className="rules-page-footer">
          <button 
            onClick={onSaveRules} 
            className="save-rules-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Rules'}
          </button>
          <button onClick={onClose} className="cancel-btn">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}