import React, { useState, useEffect } from 'react';

interface AIContextBarProps {
  currentFile: File | null;
  selectedTool: string | null;
  onSuggestAction: (action: string) => void;
  className?: string;
}

interface ContextInsight {
  id: string;
  type: 'info' | 'warning' | 'suggestion' | 'analysis';
  title: string;
  description: string;
  actions?: { label: string; action: string }[];
}

export const AIContextBar: React.FC<AIContextBarProps> = ({
  currentFile,
  selectedTool,
  onSuggestAction,
  className = ''
}) => {
  const [insights, setInsights] = useState<ContextInsight[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Mock AI analysis based on current context
  useEffect(() => {
    if (!currentFile) {
      setInsights([]);
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate AI analysis delay
    const timer = setTimeout(() => {
      const mockInsights: ContextInsight[] = [
        {
          id: '1',
          type: 'analysis',
          title: 'Document Analysis Complete',
          description: `Analyzed ${currentFile.name} - Found 12 pages, 3 floor plans, 45 dimensions`,
          actions: [
            { label: 'View Details', action: 'view_analysis' },
            { label: 'Export Data', action: 'export_analysis' }
          ]
        },
        {
          id: '2',
          type: 'suggestion',
          title: 'Recommended Actions',
          description: selectedTool 
            ? `With ${selectedTool} tool selected, consider adding measurements to critical dimensions`
            : 'Select the Measure tool to capture critical dimensions',
          actions: [
            { label: 'Select Measure Tool', action: 'select_measure' },
            { label: 'Add Markup', action: 'add_markup' }
          ]
        },
        {
          id: '3',
          type: 'info',
          title: 'Collaboration Status',
          description: '2 team members viewing, 1 pending review',
          actions: [
            { label: 'View Activity', action: 'view_activity' },
            { label: 'Send Update', action: 'send_update' }
          ]
        }
      ];

      if (selectedTool === 'measure') {
        mockInsights.push({
          id: '4',
          type: 'warning',
          title: 'Measurement Guidelines',
          description: 'Ensure measurements follow project standards and include proper units',
          actions: [
            { label: 'View Standards', action: 'view_standards' },
            { label: 'Set Units', action: 'set_units' }
          ]
        });
      }

      setInsights(mockInsights);
      setIsAnalyzing(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [currentFile, selectedTool]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'info': return '💡';
      case 'warning': return '⚠️';
      case 'suggestion': return '🎯';
      case 'analysis': return '🤖';
      default: return '📋';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'info': return 'text-blue-400';
      case 'warning': return 'text-yellow-400';
      case 'suggestion': return 'text-green-400';
      case 'analysis': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  if (!currentFile) {
    return (
      <div className={`ai-context-bar empty ${className}`}>
        <div className="context-bar-content">
          <div className="ai-status">
            <span className="ai-icon">🤖</span>
            <span className="ai-text">AI Assistant ready - Load a document to begin analysis</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`ai-context-bar ${isExpanded ? 'expanded' : ''} ${className}`}>
      <div className="context-bar-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="ai-status">
          <span className="ai-icon">🤖</span>
          <span className="ai-text">
            {isAnalyzing ? 'Analyzing document...' : `${insights.length} insights available`}
          </span>
          {isAnalyzing && <div className="ai-spinner"></div>}
        </div>
        <div className="context-bar-controls">
          <span className="insight-count">{insights.length}</span>
          <button className="expand-toggle" title={isExpanded ? 'Collapse' : 'Expand'}>
            {isExpanded ? '▼' : '▲'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="context-bar-content">
          <div className="insights-grid">
            {insights.map((insight) => (
              <div key={insight.id} className={`insight-card ${insight.type}`}>
                <div className="insight-header">
                  <span className={`insight-icon ${getInsightColor(insight.type)}`}>
                    {getInsightIcon(insight.type)}
                  </span>
                  <h4 className="insight-title">{insight.title}</h4>
                </div>
                <p className="insight-description">{insight.description}</p>
                {insight.actions && insight.actions.length > 0 && (
                  <div className="insight-actions">
                    {insight.actions.map((action, index) => (
                      <button
                        key={index}
                        className="insight-action-btn"
                        onClick={() => onSuggestAction(action.action)}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="context-bar-footer">
            <button className="ai-action-btn primary">
              <span>🧠</span>
              Generate Report
            </button>
            <button className="ai-action-btn secondary">
              <span>💬</span>
              Ask AI
            </button>
            <button className="ai-action-btn secondary">
              <span>🔄</span>
              Refresh Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
};