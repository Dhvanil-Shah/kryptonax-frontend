import React, { useState, useEffect } from 'react';
import './MarketDashboard.css';

const MarketDashboard = ({ apiBaseUrl }) => {
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
    const interval = setInterval(fetchAllMarketData, 60000); // Refresh every 60 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAllMarketData = async () => {
    try {
      const [
        overviewRes,
        moversRes,
        sectorsRes,
        sentimentRes,
        week52Res,
        volumeRes,
        calendarRes,
        insiderRes,
        valuationRes
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
        overviewData,
        moversData,
        sectorsData,
        sentimentData,
        week52Data,
        volumeData,
        calendarData,
        insiderData,
        valuationData
      ] = await Promise.all([
        overviewRes.json(),
        moversRes.json(),
        sectorsRes.json(),
        sentimentRes.json(),
        week52Res.json(),
        volumeRes.json(),
        calendarRes.json(),
        insiderRes.json(),
        valuationRes.json()
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
      '^NSEI': 'Nifty 50',
      '^BSESN': 'Sensex',
      '^GSPC': 'S&P 500',
      '^DJI': 'Dow Jones',
      '^IXIC': 'Nasdaq',
      'GC=F': 'Gold',
      'CL=F': 'Crude Oil'
    };
    return names[symbol] || symbol;
  };

  if (loading) {
    return (
      <div className="market-dashboard">
        <div className="loading-skeleton">
          <div className="skeleton-box"></div>
          <div className="skeleton-box"></div>
          <div className="skeleton-box"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="market-dashboard">
      <div className="dashboard-header">
        <h2>📊 Live Market Intelligence</h2>
        <p className="subtitle">Real-time insights for long-term investors</p>
      </div>

      {/* Phase 1: Market Overview */}
      <section className="market-overview">
        <h3 className="section-title">Global Markets</h3>
        <div className="indices-grid">
          {overview && Object.entries(overview).map(([symbol, data]) => {
            if (!data) return null;
            const isPositive = data.percent >= 0;
            return (
              <div key={symbol} className={`index-card ${isPositive ? 'positive' : 'negative'}`}>
                <div className="index-name">{getIndexName(symbol)}</div>
                <div className="index-price">{data.price.toLocaleString()}</div>
                <div className="index-change">
                  <span className="change-value">{isPositive ? '+' : ''}{data.change.toFixed(2)}</span>
                  <span className="change-percent">({isPositive ? '+' : ''}{data.percent.toFixed(2)}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Phase 1: Top Movers */}
      <section className="market-movers">
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
      </section>

      {/* Phase 2: Sector Performance */}
      <section className="sector-performance">
        <h3 className="section-title">🏭 Sector Performance</h3>
        <div className="sectors-heatmap">
          {Object.entries(sectors).map(([sector, change]) => {
            const isPositive = change >= 0;
            const intensity = Math.min(Math.abs(change) / 5, 1);
            const bgColor = isPositive 
              ? `rgba(76, 175, 80, ${intensity})` 
              : `rgba(244, 67, 54, ${intensity})`;
            
            return (
              <div 
                key={sector} 
                className="sector-box" 
                style={{ backgroundColor: bgColor }}
              >
                <div className="sector-name">{sector}</div>
                <div className="sector-change">
                  {isPositive ? '+' : ''}{change.toFixed(2)}%
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Phase 3: Market Sentiment */}
      <section className="market-sentiment">
        <h3 className="section-title">🎯 Market Sentiment</h3>
        <div className="sentiment-container">
          <div className="sentiment-gauge">
            <div className="gauge-background">
              <div 
                className="gauge-fill" 
                style={{ 
                  width: `${sentiment?.score || 50}%`,
                  backgroundColor: sentiment?.color || '#ffd600'
                }}
              ></div>
            </div>
            <div className="sentiment-labels">
              <span>Extreme Fear</span>
              <span>Fear</span>
              <span>Neutral</span>
              <span>Greed</span>
              <span>Extreme Greed</span>
            </div>
          </div>
          <div className="sentiment-info">
            <div className="sentiment-score">{sentiment?.score || 50}</div>
            <div className="sentiment-level" style={{ color: sentiment?.color }}>
              {sentiment?.level || 'Neutral'}
            </div>
          </div>
        </div>
      </section>

      {/* Phase 2: 52-Week Scanner */}
      <section className="week52-scanner">
        <div className="scanner-container">
          <div className="near-high">
            <h3 className="section-title">📈 Near 52W High</h3>
            <div className="scanner-list">
              {week52.near_high.map((stock) => (
                <div key={stock.symbol} className="scanner-card">
                  <div className="scanner-symbol">{stock.symbol.replace('.NS', '')}</div>
                  <div className="scanner-details">
                    <span>₹{stock.price.toLocaleString()}</span>
                    <span className="scanner-pct">{stock.pct_of_high.toFixed(1)}% of high</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="near-low">
            <h3 className="section-title">📉 Near 52W Low</h3>
            <div className="scanner-list">
              {week52.near_low.map((stock) => (
                <div key={stock.symbol} className="scanner-card">
                  <div className="scanner-symbol">{stock.symbol.replace('.NS', '')}</div>
                  <div className="scanner-details">
                    <span>₹{stock.price.toLocaleString()}</span>
                    <span className="scanner-pct">{stock.pct_of_low.toFixed(1)}% of low</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Phase 2: Volume Leaders */}
      <section className="volume-leaders">
        <h3 className="section-title">📊 Volume Leaders</h3>
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
      </section>

      {/* Phase 3: Calendar Events */}
      <section className="market-calendar">
        <h3 className="section-title">📅 Market Calendar</h3>
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
      </section>

      {/* Phase 4: Insider Trading */}
      <section className="insider-trading">
        <h3 className="section-title">👔 Insider Activity</h3>
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
      </section>

      {/* Phase 4: Valuation Metrics */}
      <section className="valuation-metrics">
        <h3 className="section-title">💹 Valuation Snapshot</h3>
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
      </section>

      <div className="dashboard-footer">
        <p>🔄 Auto-refreshing every 60 seconds • Last updated: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
};

export default MarketDashboard;
