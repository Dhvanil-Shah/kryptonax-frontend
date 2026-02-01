import React, { useState, useEffect } from 'react';
import './MarketDashboard.css';

const MarketDashboard = ({ apiBaseUrl }) => {
  const [activeTab, setActiveTab] = useState('global');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [movers, setMovers] = useState({ gainers: [], losers: [] });
  const [sectors, setSectors] = useState({});
  const [sentiment, setSentiment] = useState(null);
  const [week52, setWeek52] = useState({ near_high: [], near_low: [] });
  const [volume, setVolume] = useState([]);
  const [calendar, setCalendar] = useState({ ipos: [], dividends: [], economic: [] });
  const [insider, setInsider] = useState([]);
  const [valuation, setValuation] = useState([]);

  useEffect(() => {
    fetchAllMarketData();
    const interval = setInterval(fetchAllMarketData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllMarketData = async () => {
    try {
      const [
        overviewRes, moversRes, sectorsRes, sentimentRes,
        week52Res, volumeRes, calendarRes, insiderRes, valuationRes
      ] = await Promise.all([
        fetch(`${apiBaseUrl}/market/overview`),
        fetch(`${apiBaseUrl}/market/movers?market=india&limit=5`),
        fetch(`${apiBaseUrl}/market/sectors`),
        fetch(`${apiBaseUrl}/market/sentiment`),
        fetch(`${apiBaseUrl}/market/52week?market=india`),
        fetch(`${apiBaseUrl}/market/volume?market=india&limit=5`),
        fetch(`${apiBaseUrl}/market/calendar`),
        fetch(`${apiBaseUrl}/market/insider`),
        fetch(`${apiBaseUrl}/market/valuation?market=india`)
      ]);

      const [
        overviewData, moversData, sectorsData, sentimentData,
        week52Data, volumeData, calendarData, insiderData, valuationData
      ] = await Promise.all([
        overviewRes.json(), moversRes.json(), sectorsRes.json(), sentimentRes.json(),
        week52Res.json(), volumeRes.json(), calendarRes.json(), insiderRes.json(), valuationRes.json()
      ]);

      setOverview(overviewData.data);
      setMovers(moversData.data);
      setSectors(sectorsData.data);
      setSentiment(sentimentData.data);
      setWeek52(week52Data.data);
      setVolume(volumeData.data);
      setCalendar(calendarData.data);
      setInsider(insiderData.data);
      setValuation(valuationData.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching market data:', error);
      setLoading(false);
    }
  };

  const getIndexName = (symbol) => {
    const names = {
      '^NSEI': 'Nifty 50', '^BSESN': 'Sensex', '^GSPC': 'S&P 500',
      '^DJI': 'Dow Jones', '^IXIC': 'Nasdaq', 'GC=F': 'Gold', 'CL=F': 'Crude Oil'
    };
    return names[symbol] || symbol;
  };

  const getCurrency = (symbol) => {
    if (symbol.includes('NSEI') || symbol.includes('BSESN')) return '₹';
    return '$';
  };

  const tabs = [
    { id: 'global', label: 'Global Markets', icon: '🌍' },
    { id: 'movers', label: 'Top Gainers & Losers', icon: '🚀' },
    { id: 'sectors', label: 'Sector Analysis', icon: '🏭' },
    { id: 'sentiment', label: 'Market Sentiment', icon: '🎯' },
    { id: '52week', label: '52 Week High/Low', icon: '📈' },
    { id: 'volume', label: 'Most Active Stocks', icon: '📊' },
    { id: 'calendar', label: 'Market Calendar', icon: '📅' },
    { id: 'insider', label: 'Insider Trading', icon: '👔' },
    { id: 'valuation', label: 'Valuation Metrics', icon: '💹' }
  ];

  if (loading) {
    return (
      <div className="market-dashboard">
        <div className="loading-skeleton">
          <div className="skeleton-box"></div>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch(activeTab) {
      case 'global':
        return (
          <div className="tab-content">
            <div className="indices-grid">
              {overview && Object.entries(overview).map(([symbol, data]) => {
                if (!data) return null;
                const isPositive = data.percent >= 0;
                const currency = getCurrency(symbol);
                return (
                  <div key={symbol} className={`index-card ${isPositive ? 'positive' : 'negative'}`}>
                    <div className="index-name">{getIndexName(symbol)}</div>
                    <div className="index-price">
                      <span className="currency">{currency}</span>
                      {data.price.toLocaleString()}
                    </div>
                    <div className="index-change">
                      <span className="change-value">{isPositive ? '+' : ''}{data.change.toFixed(2)}</span>
                      <span className="change-percent">({isPositive ? '+' : ''}{data.percent.toFixed(2)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      
      case 'movers':
        return (
          <div className="tab-content">
            <div className="movers-container">
              <div className="gainers">
                <h3 className="section-title">🚀 Top Gainers</h3>
                <div className="movers-list">
                  {movers.gainers.map((stock, idx) => (
                    <div key={stock.symbol} className="mover-card gain">
                      <div className="rank-badge">#{idx + 1}</div>
                      <div className="mover-info">
                        <div className="mover-symbol">{stock.name}</div>
                        <div className="mover-price">₹{stock.price.toLocaleString()}</div>
                      </div>
                      <div className="mover-change">+{stock.change_percent.toFixed(2)}%</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="losers">
                <h3 className="section-title">📉 Top Losers</h3>
                <div className="movers-list">
                  {movers.losers.map((stock, idx) => (
                    <div key={stock.symbol} className="mover-card loss">
                      <div className="rank-badge">#{idx + 1}</div>
                      <div className="mover-info">
                        <div className="mover-symbol">{stock.name}</div>
                        <div className="mover-price">₹{stock.price.toLocaleString()}</div>
                      </div>
                      <div className="mover-change">{stock.change_percent.toFixed(2)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'sectors':
        return (
          <div className="tab-content">
            <div className="sectors-heatmap">
              {Object.entries(sectors).map(([sector, change]) => {
                const isPositive = change >= 0;
                const intensity = Math.min(Math.abs(change) / 5, 1);
                const bgColor = isPositive 
                  ? `rgba(34, 197, 94, ${0.1 + intensity * 0.3})` 
                  : `rgba(239, 68, 68, ${0.1 + intensity * 0.3})`;
                
                return (
                  <div key={sector} className="sector-box" style={{ backgroundColor: bgColor }}>
                    <div className="sector-name">{sector}</div>
                    <div className={`sector-change ${isPositive ? 'positive' : 'negative'}`}>
                      {isPositive ? '+' : ''}{change.toFixed(2)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      
      case 'sentiment':
        const sentimentScore = sentiment?.score || 50;
        const sentimentLevel = sentiment?.level || 'Neutral';
        const sentimentColor = sentiment?.color || '#fbbf24';
        
        // Determine sentiment description and investment suggestion
        let sentimentDesc = '';
        let investmentAdvice = '';
        let sentimentIcon = '';
        
        if (sentimentScore <= 25) {
          sentimentDesc = 'Market participants are extremely fearful. High selling pressure.';
          investmentAdvice = 'Potential buying opportunity for long-term investors';
          sentimentIcon = '😨';
        } else if (sentimentScore <= 45) {
          sentimentDesc = 'Market showing signs of uncertainty and caution.';
          investmentAdvice = 'Monitor closely, consider selective buying';
          sentimentIcon = '😟';
        } else if (sentimentScore <= 55) {
          sentimentDesc = 'Market is balanced with no strong directional bias.';
          investmentAdvice = 'Normal market conditions, trade with caution';
          sentimentIcon = '😐';
        } else if (sentimentScore <= 75) {
          sentimentDesc = 'Optimism in the market with increasing buying interest.';
          investmentAdvice = 'Consider profit booking on gains';
          sentimentIcon = '😊';
        } else {
          sentimentDesc = 'Market showing excessive optimism. Potential overheating.';
          investmentAdvice = 'High risk of correction, book profits';
          sentimentIcon = '🤑';
        }
        
        return (
          <div className="tab-content">
            <div className="sentiment-container">
              <div className="sentiment-header">
                <div className="sentiment-main">
                  <div className="sentiment-icon">{sentimentIcon}</div>
                  <div>
                    <div className="sentiment-score-large">{sentimentScore}</div>
                    <div className="sentiment-level-text" style={{ color: sentimentColor }}>
                      {sentimentLevel}
                    </div>
                  </div>
                </div>
                <div className="sentiment-gauge">
                  <div className="gauge-track">
                    <div className="gauge-fill" style={{ 
                      width: `${sentimentScore}%`,
                      backgroundColor: sentimentColor
                    }}></div>
                    <div className="gauge-marker" style={{ left: `${sentimentScore}%` }}></div>
                  </div>
                  <div className="gauge-labels">
                    <span>0<br/>Extreme Fear</span>
                    <span>25<br/>Fear</span>
                    <span>50<br/>Neutral</span>
                    <span>75<br/>Greed</span>
                    <span>100<br/>Extreme Greed</span>
                  </div>
                </div>
              </div>
              <div className="sentiment-insights">
                <div className="insight-card">
                  <div className="insight-label">Market Analysis</div>
                  <div className="insight-value">{sentimentDesc}</div>
                </div>
                <div className="insight-card">
                  <div className="insight-label">Investment Strategy</div>
                  <div className="insight-value">{investmentAdvice}</div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case '52week':
        const nearHigh = week52?.near_high || [];
        const nearLow = week52?.near_low || [];
        
        return (
          <div className="tab-content">
            <div className="scanner-container">
              <div className="near-high">
                <h3 className="section-title">📈 Near 52W High</h3>
                <div className="scanner-list">
                  {nearHigh.length > 0 ? (
                    nearHigh.map((stock) => (
                      <div key={stock.symbol} className="scanner-card">
                        <div className="scanner-symbol">{stock.symbol.replace('.NS', '').replace('.BO', '')}</div>
                        <div className="scanner-details">
                          <span className="scanner-price">₹{stock.price.toLocaleString()}</span>
                          <span className="scanner-pct">{stock.pct_of_high.toFixed(1)}% of high</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-data">No stocks currently near 52-week high</div>
                  )}
                </div>
              </div>
              <div className="near-low">
                <h3 className="section-title">📉 Near 52W Low</h3>
                <div className="scanner-list">
                  {nearLow.length > 0 ? (
                    nearLow.map((stock) => (
                      <div key={stock.symbol} className="scanner-card">
                        <div className="scanner-symbol">{stock.symbol.replace('.NS', '').replace('.BO', '')}</div>
                        <div className="scanner-details">
                          <span className="scanner-price">₹{stock.price.toLocaleString()}</span>
                          <span className="scanner-pct">{stock.pct_of_low.toFixed(1)}% of low</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-data">No stocks currently near 52-week low</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'volume':
        return (
          <div className="tab-content">
            <div className="volume-list">
              {volume.map((stock, idx) => (
                <div key={stock.symbol} className="volume-card">
                  <div className="volume-rank">#{idx + 1}</div>
                  <div className="volume-info">
                    <div className="volume-symbol">{stock.symbol.replace('.NS', '')}</div>
                    <div className="volume-data">
                      <span className="volume-amount">{stock.volume_display}</span>
                      <span className="volume-price">₹{stock.price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'calendar':
        return (
          <div className="tab-content">
            <div className="calendar-grid">
              <div className="calendar-section">
                <h4>Upcoming IPOs</h4>
                <div className="calendar-list">
                  {calendar.ipos.map((ipo, idx) => (
                    <div key={idx} className="calendar-item">
                      <div className="calendar-icon">🆕</div>
                      <div className="calendar-details">
                        <div className="calendar-name">{ipo.company}</div>
                        <div className="calendar-meta">
                          <span>{ipo.date}</span>
                          <span>{ipo.price_range}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="calendar-section">
                <h4>Upcoming Dividends</h4>
                <div className="calendar-list">
                  {calendar.dividends.map((div, idx) => (
                    <div key={idx} className="calendar-item">
                      <div className="calendar-icon">💰</div>
                      <div className="calendar-details">
                        <div className="calendar-name">{div.company.replace('.NS', '')}</div>
                        <div className="calendar-meta">
                          <span>Ex: {div.ex_date}</span>
                          <span>{div.dividend}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="calendar-section">
                <h4>Economic Events</h4>
                <div className="calendar-list">
                  {calendar.economic.map((event, idx) => (
                    <div key={idx} className="calendar-item">
                      <div className={`calendar-icon impact-${event.impact}`}>
                        {event.impact === 'high' ? '🔴' : '🟡'}
                      </div>
                      <div className="calendar-details">
                        <div className="calendar-name">{event.event}</div>
                        <div className="calendar-meta">
                          <span>{event.date}</span>
                          <span className={`impact-${event.impact}`}>{event.impact} impact</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'insider':
        return (
          <div className="tab-content">
            <div className="insider-list">
              {insider.map((trade, idx) => (
                <div key={idx} className={`insider-card ${trade.transaction.toLowerCase()}`}>
                  <div className="insider-company">{trade.company.replace('.NS', '')}</div>
                  <div className="insider-details">
                    <div className="insider-name">{trade.insider}</div>
                    <div className="insider-transaction">
                      <span className={`transaction-type ${trade.transaction.toLowerCase()}`}>
                        {trade.transaction}
                      </span>
                      <span>{trade.shares.toLocaleString()} shares</span>
                      <span className="insider-date">{trade.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'valuation':
        return (
          <div className="tab-content">
            <div className="valuation-table">
              <div className="table-header">
                <div>Stock</div>
                <div>P/E Ratio</div>
                <div>P/B Ratio</div>
                <div>Div Yield</div>
              </div>
              {valuation.map((stock) => (
                <div key={stock.symbol} className="table-row">
                  <div className="stock-name">{stock.name}</div>
                  <div className="metric-value">{stock.pe_ratio}</div>
                  <div className="metric-value">{stock.pb_ratio}</div>
                  <div className="metric-value">{stock.div_yield}%</div>
                </div>
              ))}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="market-dashboard">
      <div className="tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {renderTabContent()}
    </div>
  );
};

export default MarketDashboard;
