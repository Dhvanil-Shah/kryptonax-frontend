import React, { useState, useEffect } from 'react';
import './QualityScore.css';

const QualityScore = ({ ticker, apiBaseUrl }) => {
  const [qualityData, setQualityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQualityScore = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${apiBaseUrl}/quality-score/${ticker}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.error) {
            setError(data.error);
          } else {
            setQualityData(data);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.detail || "Quality score not available for this stock");
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching quality score:', err);
        setError("Unable to load quality score");
        setLoading(false);
      }
    };

    if (ticker) {
      fetchQualityScore();
    }
  }, [ticker, apiBaseUrl]);

  if (loading) {
    return (
      <div className="quality-score-container">
        <div className="loading-spinner">Analyzing long-term potential...</div>
      </div>
    );
  }

  if (error || !qualityData) {
    return (
      <div className="quality-score-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  const { overall_score, grade, verdict, risks, target, current_price, details } = qualityData;

  // Detect currency based on ticker (use the prop, not from API response)
  const getCurrency = () => {
    if (!ticker) return '$';
    if (ticker.endsWith('.NS') || ticker.endsWith('.BO')) return '₹'; // Indian stocks
    if (ticker.endsWith('.L')) return '£'; // London
    if (ticker.endsWith('.T')) return '¥'; // Tokyo
    if (ticker.endsWith('.HK')) return 'HK$'; // Hong Kong
    return '$'; // Default USD
  };
  
  const currencySymbol = getCurrency();

  // Determine color based on score
  const getScoreColor = (score) => {
    if (score >= 70) return '#00e676';
    if (score >= 55) return '#ffc107';
    return '#ff1744';
  };

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return '#00e676';
    if (grade.startsWith('B')) return '#4caf50';
    if (grade.startsWith('C')) return '#ffc107';
    return '#ff1744';
  };

  return (
    <div className="quality-score-container">
      <div className="quality-header">
        <h2>🎯 Long-Term Quality Score</h2>
        <p className="subtitle">Buy & Forget Analysis for {qualityData.company_name}</p>
      </div>

      {/* Overall Score Card */}
      <div className="score-card-main">
        <div className="score-display">
          <div className="score-circle" style={{ borderColor: getScoreColor(overall_score) }}>
            <span className="score-number">{overall_score}</span>
            <span className="score-max">/100</span>
          </div>
          <div className="grade-badge" style={{ backgroundColor: getGradeColor(grade) }}>
            {grade}
          </div>
        </div>

        <div className="verdict-section">
          <h3 className="verdict-text">
            <span className="verdict-emoji">{verdict.emoji}</span>
            {verdict.text}
          </h3>
          <p className="verdict-recommendation">💡 {verdict.recommendation}</p>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="score-breakdown">
        <h3>📊 Score Breakdown</h3>
        
        <div className="score-item">
          <div className="score-item-header">
            <span className="score-item-label">📈 Fundamental Strength</span>
            <span className="score-item-value">{qualityData.fundamental_score}/100</span>
          </div>
          <div className="score-bar">
            <div 
              className="score-bar-fill" 
              style={{ 
                width: `${qualityData.fundamental_score}%`,
                backgroundColor: getScoreColor(qualityData.fundamental_score)
              }}
            ></div>
          </div>
          <ul className="detail-list">
            {details.fundamental.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="score-item">
          <div className="score-item-header">
            <span className="score-item-label">💰 Dividend Reliability</span>
            <span className="score-item-value">{qualityData.dividend_score}/100</span>
          </div>
          <div className="score-bar">
            <div 
              className="score-bar-fill" 
              style={{ 
                width: `${qualityData.dividend_score}%`,
                backgroundColor: getScoreColor(qualityData.dividend_score)
              }}
            ></div>
          </div>
          <ul className="detail-list">
            {details.dividend.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="score-item">
          <div className="score-item-header">
            <span className="score-item-label">🏆 Management Quality</span>
            <span className="score-item-value">{qualityData.management_score}/100</span>
          </div>
          <div className="score-bar">
            <div 
              className="score-bar-fill" 
              style={{ 
                width: `${qualityData.management_score}%`,
                backgroundColor: getScoreColor(qualityData.management_score)
              }}
            ></div>
          </div>
          <ul className="detail-list">
            {details.management.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="score-item">
          <div className="score-item-header">
            <span className="score-item-label">🛡️ Business Moat</span>
            <span className="score-item-value">{qualityData.moat_score}/100</span>
          </div>
          <div className="score-bar">
            <div 
              className="score-bar-fill" 
              style={{ 
                width: `${qualityData.moat_score}%`,
                backgroundColor: getScoreColor(qualityData.moat_score)
              }}
            ></div>
          </div>
          <ul className="detail-list">
            {details.moat.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Price Target Projection */}
      {target && target.cagr !== "N/A" && (
        <div className="target-section">
          <h3>🎯 10-Year Wealth Projection</h3>
          <div className="target-grid">
            <div className="target-card">
              <span className="target-label">Current Price</span>
              <span className="target-value">₹{current_price.toFixed(2)}</span>
            </div>
            <div className="target-card">
              <span className="target-label">5 Year Target</span>
              <span className="target-value green">₹{target.years_5}</span>
              <span className="target-subtext">{target.cagr}% CAGR</span>
            </div>
            <div className="target-card">
              <span className="target-label">10 Year Target</span>
              <span className="target-value green">₹{target.years_10}</span>
              <span className="target-subtext">{target.multiple}x returns</span>
            </div>
          </div>
          <p className="target-note">
            💡 Based on historical performance. Conservative projection using {target.cagr}% annual growth.
          </p>
        </div>
      )}

      {/* Risk Assessment */}
      <div className="risk-section">
        <h3>⚠️ Risk Assessment</h3>
        <div className="risk-level">
          <span className="risk-badge" style={{
            backgroundColor: risks.level === 'Low' ? '#00e676' : 
                           risks.level === 'Moderate' ? '#ffc107' : '#ff1744'
          }}>
            {risks.level} Risk
          </span>
        </div>
        <ul className="risk-list">
          {risks.factors.map((risk, idx) => (
            <li key={idx}>{risk}</li>
          ))}
        </ul>
      </div>

      {/* Final Recommendation Box */}
      <div className="final-recommendation">
        <h4>📌 Bottom Line</h4>
        <p>
          With a quality score of <strong>{overall_score}/100</strong> and grade <strong>{grade}</strong>, 
          this stock is {overall_score >= 70 ? "suitable" : overall_score >= 55 ? "moderately suitable" : "not recommended"} for long-term buy-and-hold strategy.
        </p>
        {overall_score >= 70 && (
          <p className="recommendation-highlight">
            ✅ This stock passes the quality test for a 5-10 year holding period.
          </p>
        )}
        {overall_score >= 55 && overall_score < 70 && (
          <p className="recommendation-highlight">
            ⚠️ Consider this as part of a diversified portfolio, not as a core holding.
          </p>
        )}
        {overall_score < 55 && (
          <p className="recommendation-highlight">
            ❌ Look for better alternatives with stronger fundamentals for long-term wealth creation.
          </p>
        )}
      </div>
    </div>
  );
};

export default QualityScore;
