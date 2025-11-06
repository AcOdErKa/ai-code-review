import { useState } from 'react';
import './RulesEditor.css';

interface RulesEditorProps {
  rules: string;
  existingRules: string[];
  onRulesChange: (rules: string) => void;
  onSaveRules: () => void;
  isLoading?: boolean;
}

export default function RulesEditor({
  rules,
  existingRules,
  onRulesChange,
  onSaveRules,
  isLoading = false
}: RulesEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveRules();
    } finally {
      setIsSaving(false);
    }
  };

  const isValidJson = () => {
    try {
      JSON.parse(rules);
      return true;
    } catch {
      return false;
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(rules);
      onRulesChange(JSON.stringify(parsed, null, 2));
    } catch {
      // Invalid JSON, do nothing
    }
  };

  return (
    <div className="rules-editor">
      <div className="rules-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h2 className="rules-title">
          <span className="rules-icon">⚙️</span>
          Custom Rules
          <span className="rules-count">({existingRules.length} active)</span>
        </h2>
        <button className="expand-btn" aria-label={isExpanded ? 'Collapse' : 'Expand'}>
          {isExpanded ? '🔽' : '▶️'}
        </button>
      </div>

      {isExpanded && (
        <div className="rules-content">
          {existingRules.length > 0 && (
            <div className="current-rules">
              <h3 className="current-rules-title">Current Active Rules</h3>
              <div className="rules-list">
                {existingRules.map((rule, index) => (
                  <div key={index} className="rule-item">
                    <span className="rule-number">{index + 1}</span>
                    <span className="rule-text">{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rules-editor-section">
            <div className="editor-header">
              <h3 className="editor-title">Edit Rules (JSON Format)</h3>
              <div className="editor-actions">
                <button
                  onClick={formatJson}
                  className="btn btn-small btn-secondary"
                  disabled={!isValidJson()}
                  title="Format JSON"
                >
                  ✨ Format
                </button>
                <div className={`json-status ${isValidJson() ? 'valid' : 'invalid'}`}>
                  {isValidJson() ? '✅ Valid JSON' : '❌ Invalid JSON'}
                </div>
              </div>
            </div>

            <textarea
              value={rules}
              onChange={(e) => onRulesChange(e.target.value)}
              className={`rules-textarea ${!isValidJson() ? 'invalid' : ''}`}
              placeholder='[\n  "Always use TypeScript interfaces for type definitions",\n  "Prefer functional components over class components",\n  "Include proper error handling in async functions"\n]'
              rows={8}
              disabled={isLoading || isSaving}
            />

            <div className="editor-footer">
              <button
                onClick={handleSave}
                className={`btn btn-primary ${isSaving ? 'btn-loading' : ''}`}
                disabled={!isValidJson() || isLoading || isSaving}
              >
                {isSaving ? (
                  <>
                    <span className="spinner"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    💾 Save Rules
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}