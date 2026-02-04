import React, { useState, useEffect } from 'react';
import './TradingAnalysis.css';
import QualityScore from './QualityScore';

const TradingAnalysis = ({ ticker, apiBaseUrl }) => {
  const [activeType, setActiveType] = useState('equity_longterm');
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const tradingTypes = [
    { 
      id: 'equity_longterm', 
      label: 'Equity / Long-term', 
      icon: '📈',
      description: '1-5+ years',
      color: '#00e676'
    },
    { 
      id: 'intraday', 
      label: 'Intraday Trading', 
      icon: '⚡',
      description: 'Same day',
      color: '#ff9800'
    },
    { 
      id: 'swing', 
      label: 'Swing Trading', 
      icon: '🔄',
      description: '3-10 days',
      color: '#2196f3'
    },
    { 
      id: 'positional', 
      label: 'Positional Trading', 
      icon: '📊',
      description: '2 weeks - 3 months',
      color: '#9c27b0'
    },
    { 
      id: 'scalping', 
      label: 'Scalping', 
      icon: '⚡💨',
      description: 'Seconds - Minutes',
      color: '#f44336'
    },
    { 
      id: 'options', 
      label: 'Options Trading', 
      icon: '🎯',
      description: 'Varies',
      color: '#00bcd4'
    }
  ];

  useEffect(() => {
    fetchAnalysis(activeType);
  }, [ticker, activeType]);

  const fetchAnalysis = async (type) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${apiBaseUrl}/trading-analysis/${ticker}/${type}`);
      
      if (response.ok) {
        const data = await response.json();
        setAnalysisData(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.detail || "Analysis not available");
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching trading analysis:', err);
      setError("Unable to load analysis");
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    if (!action) return '#787b86';
    const actionLower = action.toLowerCase();
    if (actionLower.includes('buy') || actionLower === 'scalp') return '#00e676';
    if (actionLower.includes('sell')) return '#ff1744';
    if (actionLower.includes('hold') || actionLower.includes('watch')) return '#ffc107';
    return '#787b86';
  };

  const getCurrency = () => {
    if (!ticker) return '$';
    if (ticker.endsWith('.NS') || ticker.endsWith('.BO')) return '₹';
    if (ticker.endsWith('.L')) return '£';
    if (ticker.endsWith('.T')) return '¥';
    if (ticker.endsWith('.HK')) return 'HK$';
    return '$';
  };

  const currencySymbol = getCurrency();

  const renderAnalysisContent = () => {
    if (loading) {
      return (
        <div className="analysis-loading">
          <div className="spinner"></div>
          <p>Analyzing {tradingTypes.find(t => t.id === activeType)?.label}...</p>
        </div>
      );
    }

    if (error || !analysisData) {
      return (
        <div className="analysis-error">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
        </div>
      );
    }

    return (
      <div className="analysis-content">
        {/* Header Section */}
        <div className="analysis-header">
          <div className="analysis-type-badge" style={{ borderColor: tradingTypes.find(t => t.id === activeType)?.color }}>
            <span className="type-icon">{tradingTypes.find(t => t.id === activeType)?.icon}</span>
            <div className="type-info">
              <h3>{analysisData.type}</h3>
              <p className="timeframe">⏱️ {analysisData.timeframe}</p>
            </div>
          </div>

          <div className="analysis-score-card">
            <div className="score-circle" style={{ borderColor: analysisData.score >= 70 ? '#00e676' : analysisData.score >= 50 ? '#ffc107' : '#ff1744' }}>
              <span className="score-value">{analysisData.score}</span>
              <span className="score-label">/100</span>
            </div>
            <div className="verdict-info">
              <p className="verdict-label">Analysis Verdict</p>
              <p className="verdict-text" style={{ color: getActionColor(analysisData.action) }}>
                {analysisData.verdict}
              </p>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="action-panel">
          <div className="action-badge" style={{ backgroundColor: getActionColor(analysisData.action) + '20', borderColor: getActionColor(analysisData.action) }}>
            <span className="action-label">Recommended Action:</span>
            <span className="action-value" style={{ color: getActionColor(analysisData.action) }}>
              {analysisData.action?.toUpperCase()}
            </span>
          </div>

          <div className="price-grid">
            <div className="price-item">
              <span className="price-label">Current Price</span>
              <span className="price-value">{currencySymbol}{analysisData.current_price}</span>
            </div>
            
            {analysisData.entry_price && (
              <div className="price-item">
                <span className="price-label">Entry Price</span>
                <span className="price-value entry">{currencySymbol}{analysisData.entry_price}</span>
              </div>
            )}
            
            {analysisData.stop_loss && (
              <div className="price-item">
                <span className="price-label">Stop Loss</span>
                <span className="price-value stop-loss">{currencySymbol}{analysisData.stop_loss}</span>
              </div>
            )}
            
            {analysisData.target && (
              <div className="price-item">
                <span className="price-label">Target</span>
                <span className="price-value target">{currencySymbol}{analysisData.target}</span>
              </div>
            )}

            {analysisData.targets && (
              <>
                {Object.entries(analysisData.targets).map(([key, value]) => (
                  <div key={key} className="price-item">
                    <span className="price-label">{key.replace(/_/g, ' ')}</span>
                    <span className="price-value target">{currencySymbol}{value}</span>
                  </div>
                ))}
              </>
            )}

            {analysisData.risk_reward > 0 && (
              <div className="price-item highlight">
                <span className="price-label">Risk:Reward</span>
                <span className="price-value rr">1:{analysisData.risk_reward}</span>
              </div>
            )}
          </div>
        </div>

        {/* Technical Indicators / Fundamentals */}
        {analysisData.technical_indicators && (
          <div className="indicators-section">
            <h4>📊 Technical Indicators</h4>
            <div className="indicators-grid">
              {Object.entries(analysisData.technical_indicators).map(([key, value]) => (
                <div key={key} className="indicator-item">
                  <span className="indicator-label">{key.replace(/_/g, ' ').toUpperCase()}</span>
                  <span className="indicator-value">
                    {typeof value === 'number' ? value.toFixed(2) : value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {analysisData.fundamentals && (
          <div className="indicators-section">
            <h4>💼 Fundamental Metrics</h4>
            <div className="indicators-grid">
              {Object.entries(analysisData.fundamentals).map(([key, value]) => {
                if (key === 'market_cap') {
                  const displayValue = typeof value === 'number' 
                    ? `${currencySymbol}${(value / 1e9).toFixed(2)}B` 
                    : value;
                  return (
                    <div key={key} className="indicator-item">
                      <span className="indicator-label">{key.replace(/_/g, ' ').toUpperCase()}</span>
                      <span className="indicator-value">{displayValue}</span>
                    </div>
                  );
                }
                return (
                  <div key={key} className="indicator-item">
                    <span className="indicator-label">{key.replace(/_/g, ' ').toUpperCase()}</span>
                    <span className="indicator-value">
                      {typeof value === 'number' ? value.toFixed(2) : value}
                      {key.includes('yield') || key.includes('margin') || key.includes('growth') || key.includes('roe') ? '%' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Specific Analysis Sections */}
        {analysisData.fundamental_metrics && (
          <div className="indicators-section">
            <h4>📈 Fundamental Metrics</h4>
            <div className="indicators-grid">
              {Object.entries(analysisData.fundamental_metrics).map(([key, value]) => (
                <div key={key} className="indicator-item">
                  <span className="indicator-label">{key.replace(/_/g, ' ').toUpperCase()}</span>
                  <span className="indicator-value">
                    {typeof value === 'number' ? value.toFixed(2) : value}
                    {key.includes('growth') || key.includes('margin') ? '%' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {analysisData.scalping_metrics && (
          <div className="indicators-section">
            <h4>⚡ Scalping Metrics</h4>
            <div className="indicators-grid">
              {Object.entries(analysisData.scalping_metrics).map(([key, value]) => (
                <div key={key} className="indicator-item">
                  <span className="indicator-label">{key.replace(/_/g, ' ').toUpperCase()}</span>
                  <span className="indicator-value">
                    {typeof value === 'number' ? value.toFixed(3) : value}
                    {key.includes('volatility') || key.includes('spread') ? '%' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {analysisData.volatility_metrics && (
          <div className="indicators-section">
            <h4>📉 Volatility Metrics</h4>
            <div className="indicators-grid">
              {Object.entries(analysisData.volatility_metrics).map(([key, value]) => (
                <div key={key} className="indicator-item">
                  <span className="indicator-label">{key.replace(/_/g, ' ').toUpperCase()}</span>
                  <span className="indicator-value">
                    {typeof value === 'number' ? value.toFixed(2) : value}
                    {key.includes('volatility') ? '%' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Levels */}
        {analysisData.key_levels && (
          <div className="levels-section">
            <h4>🎯 Key Levels</h4>
            <div className="levels-grid">
              {analysisData.key_levels.support && Array.isArray(analysisData.key_levels.support) && (
                <div className="level-group">
                  <span className="level-label">Support Levels</span>
                  <div className="level-values">
                    {analysisData.key_levels.support.map((level, idx) => (
                      <span key={idx} className="level-value support">{currencySymbol}{level}</span>
                    ))}
                  </div>
                </div>
              )}
              {analysisData.key_levels.resistance && Array.isArray(analysisData.key_levels.resistance) && (
                <div className="level-group">
                  <span className="level-label">Resistance Levels</span>
                  <div className="level-values">
                    {analysisData.key_levels.resistance.map((level, idx) => (
                      <span key={idx} className="level-value resistance">{currencySymbol}{level}</span>
                    ))}
                  </div>
                </div>
              )}
              {typeof analysisData.key_levels.support === 'number' && (
                <div className="level-group">
                  <span className="level-label">Support</span>
                  <span className="level-value support">{currencySymbol}{analysisData.key_levels.support}</span>
                </div>
              )}
              {typeof analysisData.key_levels.resistance === 'number' && (
                <div className="level-group">
                  <span className="level-label">Resistance</span>
                  <span className="level-value resistance">{currencySymbol}{analysisData.key_levels.resistance}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Strategy Details */}
        {analysisData.strategy_details && (
          <div className="strategy-section">
            <h4>💡 Strategy Details</h4>
            <div className="strategy-grid">
              {Object.entries(analysisData.strategy_details).map(([key, value]) => (
                <div key={key} className="strategy-item">
                  <span className="strategy-label">{key.replace(/_/g, ' ').toUpperCase()}</span>
                  <span className="strategy-value">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Strategy */}
        {analysisData.recommended_strategy && (
          <div className="strategy-section">
            <h4>💡 {analysisData.recommended_strategy}</h4>
            {analysisData.rationale && <p className="strategy-rationale">{analysisData.rationale}</p>}
            {analysisData.expected_return && (
              <p className="strategy-return">Expected Return: <strong>{analysisData.expected_return}</strong></p>
            )}
          </div>
        )}

        {/* Greeks Estimate (Options) */}
        {analysisData.greeks_estimate && (
          <div className="greeks-section">
            <h4>🔢 Greeks Estimate</h4>
            <div className="greeks-grid">
              {Object.entries(analysisData.greeks_estimate).map(([key, value]) => (
                <div key={key} className="greek-item">
                  <span className="greek-label">{key.toUpperCase()}</span>
                  <span className="greek-value">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations & Insights */}
        {analysisData.key_strengths && analysisData.key_strengths.length > 0 && (
          <div className="insights-section strengths">
            <h4>✅ Key Strengths</h4>
            <ul>
              {analysisData.key_strengths.map((strength, idx) => (
                <li key={idx}>{strength}</li>
              ))}
            </ul>
          </div>
        )}

        {analysisData.risks && analysisData.risks.length > 0 && (
          <div className="insights-section risks">
            <h4>⚠️ Key Risks</h4>
            <ul>
              {analysisData.risks.map((risk, idx) => (
                <li key={idx}>{risk}</li>
              ))}
            </ul>
          </div>
        )}

        {analysisData.recommendation && (
          <div className="recommendation-box">
            <h4>📝 Recommendation</h4>
            <p>{analysisData.recommendation}</p>
          </div>
        )}

        {analysisData.trading_strategy && (
          <div className="recommendation-box">
            <h4>📝 Trading Strategy</h4>
            <p>{analysisData.trading_strategy}</p>
          </div>
        )}

        {analysisData.strategy && (
          <div className="recommendation-box">
            <h4>📝 Strategy</h4>
            <p>{analysisData.strategy}</p>
          </div>
        )}

        {analysisData.strategy_notes && (
          <div className="recommendation-box">
            <h4>📝 Strategy Notes</h4>
            <p>{analysisData.strategy_notes}</p>
          </div>
        )}

        {/* Warnings */}
        {analysisData.warning && (
          <div className="warning-box">
            <p>{analysisData.warning}</p>
          </div>
        )}

        {analysisData.risk_warning && (
          <div className="warning-box">
            <p>{analysisData.risk_warning}</p>
          </div>
        )}

        {analysisData.note && (
          <div className="note-box">
            <p>{analysisData.note}</p>
          </div>
        )}

        {analysisData.recommended && (
          <div className="note-box">
            <p>{analysisData.recommended}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="trading-analysis-container">
      <div className="trading-analysis-header">
        <h2>📊 Professional Trading Analysis</h2>
        <p className="subtitle">Real-time analysis for multiple trading strategies</p>
      </div>

      {/* Trading Type Buttons */}
      <div className="trading-types-buttons">
        {tradingTypes.map((type) => (
          <button
            key={type.id}
            className={`trading-type-btn ${activeType === type.id ? 'active' : ''}`}
            onClick={() => setActiveType(type.id)}
            style={{
              borderColor: activeType === type.id ? type.color : '#2a2e39',
              backgroundColor: activeType === type.id ? type.color + '15' : 'transparent'
            }}
          >
            <span className="btn-icon">{type.icon}</span>
            <div className="btn-content">
              <span className="btn-label">{type.label}</span>
              <span className="btn-desc">{type.description}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Analysis Content */}
      {renderAnalysisContent()}

      {/* Quality Score Section */}
      {analysisData && !error && (
        <div className="quality-score-wrapper">
          <QualityScore 
            ticker={ticker} 
            apiBaseUrl={apiBaseUrl} 
            tradingType={activeType}
          />
        </div>
      )}
    </div>
  );
};

export default TradingAnalysis;
