import React, { useState, useEffect, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, Legend, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, ResponsiveContainer, ComposedChart, Line, Bar, Brush, ReferenceLine 
} from 'recharts';
import ReactGA from "react-ga4";
import ChatBot from './ChatBot';
import CompanyDetails from './CompanyDetails';
import RegionFilter from './RegionFilter';
import MarketDashboard from './MarketDashboard';
import TickerTape from './TickerTape';

// --- CONFIGURATION ---
// Prefer a local backend when developing (auto-detect via hostname)
const API_BASE_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? 'http://127.0.0.1:8000' : 'https://kryptonax-backend.onrender.com';
ReactGA.initialize("G-REEV9CZE52");

// --- ICONS ---
const BellIcon = ({ active, onClick }) => (
  <svg onClick={onClick} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={active ? "#FFD700" : "none"} stroke={active ? "#FFD700" : "#787b86"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer', marginLeft: '10px', transition: 'all 0.2s' }}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

const MoreIcon = ({ onClick }) => (
  <svg onClick={onClick} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#787b86" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer', marginLeft: 'auto' }}>
    <circle cx="12" cy="12" r="1"></circle>
    <circle cx="12" cy="5" r="1"></circle>
    <circle cx="12" cy="19" r="1"></circle>
  </svg>
);

// --- CUSTOM SHAPE: CANDLESTICK ---
const Candle = (props) => {
  const { x, y, width, height, low, high, open, close } = props;
  const isGreen = close > open;
  const color = isGreen ? "#00e676" : "#ff1744";
  const yBottom = y + height;
  const yTop = y;
  
  return (
    <g stroke={color} fill={color} strokeWidth="2">
      <path d={`M ${x + width / 2},${yTop} L ${x + width / 2},${yBottom}`} />
      <rect x={x} y={y + height * 0.25} width={width} height={height * 0.5} fill={color} stroke="none" />
    </g>
  );
};

// --- CUSTOM TOOLTIP FOR CANDLESTICK CHART ---
const CustomCandleTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload[0]) return null;
  const data = payload[0].payload;
  const isGreen = data.close >= data.open;
  const change = data.close - data.open;
  const changePercent = ((change / data.open) * 100).toFixed(2);
  
  return (
    <div style={{ backgroundColor: "#131722", border: "1px solid #2a2e39", borderRadius: "6px", padding: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
      <div style={{ color: "#d1d4dc", fontWeight: "bold", marginBottom: "8px", fontSize: "12px" }}>{data.date}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "11px" }}>
        <div><span style={{ color: "#787b86" }}>Open:</span> <span style={{ color: "#d1d4dc", fontWeight: "600" }}>${data.open?.toFixed(2)}</span></div>
        <div><span style={{ color: "#787b86" }}>High:</span> <span style={{ color: "#00e676", fontWeight: "600" }}>${data.high?.toFixed(2)}</span></div>
        <div><span style={{ color: "#787b86" }}>Low:</span> <span style={{ color: "#ff1744", fontWeight: "600" }}>${data.low?.toFixed(2)}</span></div>
        <div><span style={{ color: "#787b86" }}>Close:</span> <span style={{ color: "#d1d4dc", fontWeight: "600" }}>${data.close?.toFixed(2)}</span></div>
      </div>
      <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #2a2e39", fontSize: "11px" }}>
        <div><span style={{ color: "#787b86" }}>Change:</span> <span style={{ color: isGreen ? "#00e676" : "#ff1744", fontWeight: "bold" }}>{isGreen ? "+" : ""}{change.toFixed(2)} ({changePercent}%)</span></div>
        {data.volume && <div style={{ marginTop: "4px" }}><span style={{ color: "#787b86" }}>Volume:</span> <span style={{ color: "#2962ff", fontWeight: "600" }}>{data.volume?.toLocaleString()}</span></div>}
      </div>
    </div>
  );
};

// --- HELPER: CREATE REAL CANDLE DATA FROM PRICE HISTORY ---
const simulateCandles = (data) => {
    if (!data || data.length === 0) return [];
    return data.map((d, i) => {
        const close = d.price;
        // Use previous day's close as open (more realistic)
        const open = i > 0 ? data[i - 1].price : close;
        const volatility = close * 0.015; 
        // High is max of open/close + some volatility
        const high = Math.max(open, close) + Math.abs(volatility * Math.random());
        // Low is min of open/close - some volatility
        const low = Math.min(open, close) - Math.abs(volatility * Math.random());
        const volume = d.volume || 1000000;
        return { ...d, open, high, low, close, volume };
    });
};

// --- HELPER: GENERATE ACCURATE PREDICTIONS USING LINEAR REGRESSION + MOMENTUM ---
const generateUniquePrediction = (historyData, ticker) => {
    if (!historyData || historyData.length === 0 || !ticker) return { data: [], model: null };
    
    const prices = historyData.map(d => d.price);
    const len = prices.length;
    
    // Calculate linear regression trend
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < len; i++) {
        sumX += i;
        sumY += prices[i];
        sumXY += i * prices[i];
        sumX2 += i * i;
    }
    const slope = (len * sumXY - sumX * sumY) / (len * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / len;
    
    // Calculate momentum and volatility
    const recentPrices = prices.slice(-10);
    const avgRecent = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
    const momentum = ((prices[len - 1] - avgRecent) / avgRecent) * 100;
    
    // Calculate volatility (standard deviation)
    const avg = prices.reduce((a, b) => a + b, 0) / len;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - avg, 2), 0) / len;
    const volatility = Math.sqrt(variance);
    
    const lastPoint = historyData[historyData.length - 1];
    let lastPrice = lastPoint.price;
    const futureData = [];
    
    // Determine trend direction based on slope and momentum
    const trendStrength = slope / lastPrice; // Normalize slope
    const momentumWeight = momentum / 100;
    
    let lastDate = new Date(lastPoint.date);
    for (let i = 1; i <= 15; i++) {
        const nextDate = new Date(lastDate);
        nextDate.setDate(lastDate.getDate() + 1);
        
        // Linear trend component
        const trendComponent = slope * i;
        
        // Momentum component (decays over time)
        const momentumComponent = (momentumWeight * lastPrice * 0.5) * Math.exp(-i / 10);
        
        // Mean reversion component (prices tend to revert to mean)
        const meanReversionComponent = (avg - lastPrice) * 0.02 * i;
        
        // Predicted price
        const predictedPrice = lastPrice + trendComponent + momentumComponent + meanReversionComponent;
        
        // Confidence intervals based on volatility (wider as we go further)
        const confidenceMultiplier = 1 + (i * 0.08);
        const upperBound = predictedPrice + (volatility * confidenceMultiplier);
        const lowerBound = predictedPrice - (volatility * confidenceMultiplier);
        
        futureData.push({
            date: nextDate.toISOString().split('T')[0],
            predicted: predictedPrice,
            upper: upperBound,
            lower: lowerBound,
            isPrediction: true
        });
        lastDate = nextDate;
    }
    
    const past = historyData.map(d => ({ ...d, predicted: d.price, upper: d.price, lower: d.price }));
    
    // Model details for display
    const model = {
        trend: trendStrength > 0.001 ? 'Uptrend' : trendStrength < -0.001 ? 'Downtrend' : 'Sideways',
        slope: (slope / lastPrice * 100).toFixed(3),
        momentum: momentum.toFixed(2),
        volatility: volatility.toFixed(2),
        confidence: volatility < lastPrice * 0.05 ? 'High' : volatility < lastPrice * 0.1 ? 'Medium' : 'Low',
        avgPrice: avg.toFixed(2),
        lastPrice: lastPrice.toFixed(2),
        prediction15d: futureData[14].predicted.toFixed(2),
        expectedChange: (((futureData[14].predicted - lastPrice) / lastPrice) * 100).toFixed(2)
    };
    
    return { data: [...past, ...futureData], model };
};

// --- FLUID GAUGE ---
const SentimentGauge = ({ data, newsCounts }) => {
  const getFluidSentiment = () => {
    if (!data || data.length < 14) return { 
      rotation: 0, text: "Analyzing...", color: "#FFD700", 
      breakdown: null 
    };
    
    const prices = data.map(d => d.price);
    const volumes = data.map(d => d.volume || 0);
    const len = prices.length;
    
    // Calculate RSI (14-period)
    const calculateRSI = () => {
      let gains = 0, losses = 0;
      for (let i = len - 14; i < len; i++) {
        const change = prices[i] - prices[i - 1];
        if (change > 0) gains += change;
        else losses -= change;
      }
      const avgGain = gains / 14;
      const avgLoss = losses / 14;
      if (avgLoss === 0) return 100;
      const rs = avgGain / avgLoss;
      return 100 - (100 / (1 + rs));
    };
    
    // Calculate Moving Averages
    const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, prices.length);
    const sma50 = prices.slice(-50).reduce((a, b) => a + b, 0) / Math.min(50, prices.length);
    const current = prices[len - 1];
    
    // Calculate MACD
    const ema12 = prices.slice(-12).reduce((a, b) => a + b, 0) / Math.min(12, prices.length);
    const ema26 = prices.slice(-26).reduce((a, b) => a + b, 0) / Math.min(26, prices.length);
    const macd = ema12 - ema26;
    
    // Calculate momentum
    const momentum = ((current - prices[Math.max(0, len - 10)]) / prices[Math.max(0, len - 10)]) * 100;
    
    // Volume trend
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, volumes.length);
    const currentVolume = volumes[len - 1];
    const volumeTrend = currentVolume > avgVolume ? 1 : -1;
    
    // News sentiment (increased weight)
    const pos = newsCounts.find(n => n.name === 'Positive')?.value || 0;
    const neg = newsCounts.find(n => n.name === 'Negative')?.value || 0;
    const totalNews = pos + neg;
    const newsRatio = totalNews > 0 ? (pos - neg) / totalNews : 0;
    const newsScore = newsRatio * 25;
    
    // Calculate technical score with breakdown
    const rsi = calculateRSI();
    let score = 0;
    let breakdown = {
      rsi: { value: rsi.toFixed(1), score: 0, signal: "" },
      ma: { sma20: sma20.toFixed(2), sma50: sma50.toFixed(2), score: 0, signal: "" },
      macd: { value: macd.toFixed(2), score: 0, signal: "" },
      momentum: { value: momentum.toFixed(2), score: 0, signal: "" },
      volume: { trend: volumeTrend > 0 ? "High" : "Low", score: 0, signal: "" },
      news: { pos, neg, score: 0, signal: "" }
    };
    
    // RSI signals
    if (rsi > 70) { breakdown.rsi.score = -15; breakdown.rsi.signal = "Overbought"; score -= 15; }
    else if (rsi > 60) { breakdown.rsi.score = 3; breakdown.rsi.signal = "Slightly High"; score += 3; }
    else if (rsi < 30) { breakdown.rsi.score = 15; breakdown.rsi.signal = "Oversold"; score += 15; }
    else if (rsi < 40) { breakdown.rsi.score = -3; breakdown.rsi.signal = "Slightly Low"; score -= 3; }
    else { breakdown.rsi.score = 5; breakdown.rsi.signal = "Neutral"; score += 5; }
    
    // Moving average signals
    let maScore = 0;
    if (current > sma20) maScore += 10;
    if (current > sma50) maScore += 8;
    if (sma20 > sma50) maScore += 7;
    if (current < sma20) maScore -= 10;
    if (current < sma50) maScore -= 8;
    breakdown.ma.score = maScore;
    breakdown.ma.signal = maScore > 10 ? "Bullish" : maScore < -10 ? "Bearish" : "Neutral";
    score += maScore;
    
    // MACD signal
    const macdScore = macd > 0 ? 8 : -8;
    breakdown.macd.score = macdScore;
    breakdown.macd.signal = macd > 0 ? "Bullish" : "Bearish";
    score += macdScore;
    
    // Momentum
    const momentumScore = momentum * 1.5;
    breakdown.momentum.score = momentumScore.toFixed(1);
    breakdown.momentum.signal = momentum > 2 ? "Strong Up" : momentum > 0 ? "Up" : momentum < -2 ? "Strong Down" : "Down";
    score += momentumScore;
    
    // Volume
    const volumeScore = volumeTrend * 3;
    breakdown.volume.score = volumeScore;
    breakdown.volume.signal = volumeTrend > 0 ? "Increasing" : "Decreasing";
    score += volumeScore;
    
    // News sentiment
    breakdown.news.score = newsScore.toFixed(1);
    breakdown.news.signal = newsScore > 10 ? "Very Positive" : newsScore > 0 ? "Positive" : newsScore < -10 ? "Very Negative" : "Negative";
    score += newsScore;
    
    // Convert to rotation (-90 to 90)
    const rotation = Math.max(-90, Math.min(90, score * 1.5));
    
    let text = "Neutral", color = "#FFD700";
    if (rotation > 50) { text = "Strong Buy"; color = "#00e676"; }
    else if (rotation > 15) { text = "Buy"; color = "#69f0ae"; }
    else if (rotation < -50) { text = "Strong Sell"; color = "#ff1744"; }
    else if (rotation < -15) { text = "Sell"; color = "#ff5252"; }
    
    breakdown.total = score.toFixed(1);
    
    return { rotation, text, color, breakdown };
  };
  
  const { rotation, text, color, breakdown } = getFluidSentiment();
  
  return (
    <div style={{ backgroundColor: "#1e222d", padding: "20px", borderRadius: "4px", border: "1px solid #2a2e39" }}>
      <div style={{ textAlign: "center", position: 'relative', height: '250px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h4 style={{ color: "#d1d4dc", marginBottom: "0px" }}>Technical Analysis</h4>
        <p style={{ fontSize: "11px", color: "#787b86" }}>Fluid AI Calculation</p>
        <svg viewBox="0 0 200 120" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#2a2e39" strokeWidth="15" strokeLinecap="round" />
          <path d="M 20 100 A 80 80 0 0 1 100 20" fill="none" stroke="url(#gradSell)" strokeWidth="15" strokeLinecap="round" />
          <path d="M 100 20 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gradBuy)" strokeWidth="15" strokeLinecap="round" />
          <defs>
              <linearGradient id="gradSell" x1="0%" y1="0%" x2="100%" y2="0%"> <stop offset="0%" stopColor="#ff1744" /> <stop offset="100%" stopColor="#FFD700" /> </linearGradient>
              <linearGradient id="gradBuy" x1="0%" y1="0%" x2="100%" y2="0%"> <stop offset="0%" stopColor="#FFD700" /> <stop offset="100%" stopColor="#00e676" /> </linearGradient>
          </defs>
          <g transform={`rotate(${rotation}, 100, 100)`} style={{ transition: 'transform 0.5s ease-out' }}>
            <path d="M 100 100 L 100 25" stroke="white" strokeWidth="4" strokeLinecap="round" />
            <circle cx="100" cy="100" r="8" fill="#1e222d" stroke="white" strokeWidth="2" />
          </g>
          <text x="100" y="80" textAnchor="middle" fill={color} fontSize="22" fontWeight="bold" style={{textShadow: `0 0 15px ${color}`}}>{text}</text>
        </svg>
      </div>
      
      {breakdown && (
        <div style={{ marginTop: "20px", borderTop: "1px solid #2a2e39", paddingTop: "15px" }}>
          <h5 style={{ color: "#d1d4dc", fontSize: "14px", marginBottom: "12px", fontWeight: "600" }}>📊 Analysis Breakdown</h5>
          <div style={{ display: "grid", gap: "8px", fontSize: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", backgroundColor: "#131722", borderRadius: "4px", borderLeft: `3px solid ${breakdown.rsi.score > 0 ? '#00e676' : breakdown.rsi.score < 0 ? '#ff1744' : '#FFD700'}` }}>
              <span style={{ color: "#787b86" }}>RSI (14): <span style={{ color: "#d1d4dc", fontWeight: "500" }}>{breakdown.rsi.value}</span></span>
              <span style={{ color: breakdown.rsi.score > 0 ? '#00e676' : breakdown.rsi.score < 0 ? '#ff1744' : '#FFD700', fontWeight: "600" }}>{breakdown.rsi.signal} ({breakdown.rsi.score > 0 ? '+' : ''}{breakdown.rsi.score})</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", backgroundColor: "#131722", borderRadius: "4px", borderLeft: `3px solid ${breakdown.ma.score > 0 ? '#00e676' : breakdown.ma.score < 0 ? '#ff1744' : '#FFD700'}` }}>
              <span style={{ color: "#787b86" }}>Moving Avg: <span style={{ color: "#d1d4dc", fontWeight: "500" }}>SMA20: {breakdown.ma.sma20}</span></span>
              <span style={{ color: breakdown.ma.score > 0 ? '#00e676' : breakdown.ma.score < 0 ? '#ff1744' : '#FFD700', fontWeight: "600" }}>{breakdown.ma.signal} ({breakdown.ma.score > 0 ? '+' : ''}{breakdown.ma.score})</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", backgroundColor: "#131722", borderRadius: "4px", borderLeft: `3px solid ${breakdown.macd.score > 0 ? '#00e676' : '#ff1744'}` }}>
              <span style={{ color: "#787b86" }}>MACD: <span style={{ color: "#d1d4dc", fontWeight: "500" }}>{breakdown.macd.value}</span></span>
              <span style={{ color: breakdown.macd.score > 0 ? '#00e676' : '#ff1744', fontWeight: "600" }}>{breakdown.macd.signal} ({breakdown.macd.score > 0 ? '+' : ''}{breakdown.macd.score})</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", backgroundColor: "#131722", borderRadius: "4px", borderLeft: `3px solid ${parseFloat(breakdown.momentum.score) > 0 ? '#00e676' : '#ff1744'}` }}>
              <span style={{ color: "#787b86" }}>Momentum: <span style={{ color: "#d1d4dc", fontWeight: "500" }}>{breakdown.momentum.value}%</span></span>
              <span style={{ color: parseFloat(breakdown.momentum.score) > 0 ? '#00e676' : '#ff1744', fontWeight: "600" }}>{breakdown.momentum.signal} ({parseFloat(breakdown.momentum.score) > 0 ? '+' : ''}{breakdown.momentum.score})</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", backgroundColor: "#131722", borderRadius: "4px", borderLeft: `3px solid ${breakdown.volume.score > 0 ? '#00e676' : '#ff1744'}` }}>
              <span style={{ color: "#787b86" }}>Volume: <span style={{ color: "#d1d4dc", fontWeight: "500" }}>{breakdown.volume.trend}</span></span>
              <span style={{ color: breakdown.volume.score > 0 ? '#00e676' : '#ff1744', fontWeight: "600" }}>{breakdown.volume.signal} ({breakdown.volume.score > 0 ? '+' : ''}{breakdown.volume.score})</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", backgroundColor: "#131722", borderRadius: "4px", borderLeft: `3px solid ${parseFloat(breakdown.news.score) > 0 ? '#00e676' : parseFloat(breakdown.news.score) < 0 ? '#ff1744' : '#FFD700'}` }}>
              <span style={{ color: "#787b86" }}>News: <span style={{ color: "#00e676", fontWeight: "500" }}>{breakdown.news.pos}↑</span> <span style={{ color: "#ff1744", fontWeight: "500" }}>{breakdown.news.neg}↓</span></span>
              <span style={{ color: parseFloat(breakdown.news.score) > 0 ? '#00e676' : parseFloat(breakdown.news.score) < 0 ? '#ff1744' : '#FFD700', fontWeight: "600" }}>{breakdown.news.signal} ({parseFloat(breakdown.news.score) > 0 ? '+' : ''}{breakdown.news.score})</span>
            </div>
          </div>
          <div style={{ marginTop: "12px", padding: "10px", backgroundColor: "#2962ff15", borderRadius: "4px", border: "1px solid #2962ff50", textAlign: "center" }}>
            <span style={{ color: "#787b86", fontSize: "11px" }}>Total Score: </span>
            <span style={{ color: "#2962ff", fontWeight: "700", fontSize: "16px" }}>{breakdown.total}</span>
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  useEffect(() => { ReactGA.send({ hitType: "pageview", page: window.location.pathname }); }, []);

  const [view, setView] = useState("dashboard");
  const [ticker, setTicker] = useState("");
  const [searchedTicker, setSearchedTicker] = useState(""); 
  const [news, setNews] = useState([]);
  const [generalNews, setGeneralNews] = useState([]); 
  const [mergedData, setMergedData] = useState([]); 
  const [candleData, setCandleData] = useState([]); 
  const [predictiveData, setPredictiveData] = useState([]); 
  const [predictionModel, setPredictionModel] = useState(null);
  const [currentQuote, setCurrentQuote] = useState(null); 
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false); 
  const [isAppLoading, setIsAppLoading] = useState(false);
  const [chartRange, setChartRange] = useState("1mo"); 
  const [timeRange, setTimeRange] = useState("30d");
  const [compareTicker, setCompareTicker] = useState("");
  const [activeComparison, setActiveComparison] = useState(null); 
  const [trending, setTrending] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]); 
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pricesCache, setPricesCache] = useState({}); 
  const [newFav, setNewFav] = useState(""); 
  const [favSuggestions, setFavSuggestions] = useState([]);
  const [showFavSuggestions, setShowFavSuggestions] = useState(false);

  // --- NEW FEATURES STATES ---
  const [newsSearch, setNewsSearch] = useState(""); 
  const [watchLater, setWatchLater] = useState([]); 
  const [activeMenu, setActiveMenu] = useState(null); 
  const [notifications, setNotifications] = useState([]); 
    const [moverRegion, setMoverRegion] = useState("all");
    const [newsCategory, setNewsCategory] = useState("all");
  const [selectedRegions, setSelectedRegions] = useState(['all']);
  const [selectedStates, setSelectedStates] = useState({});
  const [showAdvancedChart, setShowAdvancedChart] = useState(false);

  // --- AUTH STATES ---
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [userName, setUserName] = useState(localStorage.getItem("userName") || "");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login"); 
  const [forgotStep, setForgotStep] = useState(1); 
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState(""); 

  // --- FORM FIELDS ---
  const [username, setUsername] = useState(""); 
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [otpCode, setOtpCode] = useState(""); 
  
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showChatBot, setShowChatBot] = useState(false);
  const [showNewsReader, setShowNewsReader] = useState(false);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [fullPageNewsView, setFullPageNewsView] = useState(false);
  const [newsReaderRegions, setNewsReaderRegions] = useState(['all']);
  const [newsReaderStates, setNewsReaderStates] = useState({});

  const COLORS = ['#00e676', '#ff1744', '#651fff']; 

  const styles = `
    .news-card { transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: default; position: relative; }
    .news-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.3) !important; border-color: #2962ff !important; }
    .search-icon:hover { stroke: #2962ff !important; transform: translateY(-50%) scale(1.1); }
    .loading-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(19, 23, 34, 0.8); z-index: 9999; display: flex; justify-content: center; alignItems: center; backdrop-filter: blur(2px); }
    .spinner { width: 50px; height: 50px; border: 5px solid rgba(255, 255, 255, 0.1); border-left-color: #2962ff; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .custom-scroll::-webkit-scrollbar { width: 8px; }
    .custom-scroll::-webkit-scrollbar-track { background: #1e222d; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #2a2e39; border-radius: 4px; }
    .custom-scroll::-webkit-scrollbar-thumb:hover { background: #2962ff; }
    .menu-dropdown { position: absolute; top: 30px; right: 10px; background: #2a2e39; border: 1px solid #787b86; border-radius: 4px; padding: 5px; z-index: 20; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
    .menu-item { padding: 5px 10px; font-size: 12px; color: #d1d4dc; cursor: pointer; white-space: nowrap; }
    .menu-item:hover { background: #2962ff; color: white; }
  `;

  useEffect(() => {
    document.body.style.margin = "0"; 
    document.body.style.padding = "0"; 
    document.body.style.backgroundColor = "#131722"; 
    document.body.style.boxSizing = "border-box";
        fetchTrending(selectedRegions, selectedStates); 
    fetchGeneralNews(selectedRegions, selectedStates);
    
    // Load local storage
    const savedWatchLater = localStorage.getItem("watchLaterNews");
    if (savedWatchLater) setWatchLater(JSON.parse(savedWatchLater));
    const savedNotifs = localStorage.getItem("notifications");
    if (savedNotifs) setNotifications(JSON.parse(savedNotifs));

    const savedHistory = localStorage.getItem("searchHistory");
    if (savedHistory) setSearchHistory(JSON.parse(savedHistory));
    
    // Auto load last ticker if exists
    const lastTicker = localStorage.getItem("lastTicker");
    if (lastTicker) { 
        setTicker(lastTicker); 
        handleSearch(lastTicker); 
    }
  }, []); // Run once on mount

  // Update trending data when region filters change
  useEffect(() => {
    fetchTrending(selectedRegions, selectedStates);
    fetchGeneralNews(selectedRegions, selectedStates);
  }, [selectedRegions, selectedStates]);

  useEffect(() => {
      if (token) { 
          setIsAppLoading(true); 
          fetchFavorites().finally(() => setIsAppLoading(false)); 
      } else {
          // Optional: Prompt login after a delay if desired
          // const timer = setTimeout(() => setShowAuthModal(true), 5000); 
          // return () => clearTimeout(timer);
      }
  }, [token]);

  useEffect(() => {
    let interval = null;
    if (searchedTicker && view === "dashboard") { 
        // Polling for real-time updates
        interval = setInterval(() => { 
            fetchQuote(searchedTicker); 
            if (chartRange === "1d") updateChart(searchedTicker, "1d", activeComparison); 
        }, 10000); // Increased to 10s to reduce load
    }
    return () => clearInterval(interval);
  }, [searchedTicker, chartRange, activeComparison, view]);

  useEffect(() => { 
            if (searchedTicker && view === "dashboard") updateChart(searchedTicker, chartRange, activeComparison); 
  }, [chartRange]); 

    // Re-fetch trending when moverRegion changes and poll periodically
    useEffect(() => {
        let id = null;
        fetchTrending([moverRegion]);
        try {
            id = setInterval(() => fetchTrending([moverRegion]), 15000); // refresh every 15s
        } catch (e) { }
        return () => { if (id) clearInterval(id); };
    }, [moverRegion]);

  // --- FEATURE HANDLERS ---
  const toggleWatchLater = (article) => {
      const exists = watchLater.some(item => item.title === article.title);
      const newlist = exists ? watchLater.filter(item => item.title !== article.title) : [...watchLater, article];
      setWatchLater(newlist);
      localStorage.setItem("watchLaterNews", JSON.stringify(newlist));
      setActiveMenu(null);
  };

const toggleNotification = async (t) => {
      // 1. LOGIC FIX: User must be logged in to get email alerts
      if (!token) {
          setShowAuthModal(true);
          return;
      }

      const isSubscribed = notifications.includes(t);
      let newNotifs;

      if (isSubscribed) {
          // --- UNSUBSCRIBE LOGIC (Fixed) ---
          // Remove from local list
          newNotifs = notifications.filter(item => item !== t);
          
          // Call Backend to STOP emails
          try {
              await fetch(`${API_BASE_URL}/subscribe/${t}`, {
                  method: "DELETE", // Standard REST practice for removing a resource
                  headers: { "Authorization": `Bearer ${token}` }
              });
          } catch (e) { 
              console.error("Unsubscribe failed", e); 
              // Optional: Revert state if API fails
              // setNotifications(notifications); 
              // return;
          }
      } else {
          // --- SUBSCRIBE LOGIC ---
          // Add to local list
          newNotifs = [...notifications, t];
          
          // Call Backend to START emails
          try {
              await fetch(`${API_BASE_URL}/subscribe/${t}`, {
                  method: "POST",
                  headers: { "Authorization": `Bearer ${token}` }
              });
              alert(`Alerts enabled for ${t}! Check your email.`);
          } catch (e) { 
              console.error("Subscribe failed", e); 
          }
      }

      // 2. Update State & Storage
      setNotifications(newNotifs);
      localStorage.setItem("notifications", JSON.stringify(newNotifs));
  };

  // --- API CALLS ---
  const fetchGeneralNews = async (regions = ['all'], states = {}) => { 
    try { 
      const regionsParam = regions.join(',');
      const statesParam = Object.keys(states).length > 0 ? encodeURIComponent(JSON.stringify(states)) : '';
      const url = statesParam 
        ? `${API_BASE_URL}/news/general?regions=${regionsParam}&states=${statesParam}`
        : `${API_BASE_URL}/news/general?regions=${regionsParam}`;
      const res = await fetch(url); 
      setGeneralNews(await res.json()); 
    } catch (e) { 
      setGeneralNews([]); 
    } 
  };
  
  const handleAuth = async () => {
      setAuthError(""); setAuthSuccess(""); setIsAppLoading(true);
      try {
          // --- FORGOT PASSWORD FLOW ---
          if (authMode === "forgot") {
              if (forgotStep === 1) {
                  if (!username) throw new Error("Please enter your email.");
                  const res = await fetch(`${API_BASE_URL}/forgot-password`, { 
                      method: "POST", 
                      headers: {"Content-Type": "application/json"}, 
                      body: JSON.stringify({username}) 
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.detail || "Error sending OTP");
                  setAuthSuccess("OTP Sent! Check your Email & Mobile."); setForgotStep(2);
              } else if (forgotStep === 2) {
                  if (!otpCode || !password || !confirmPassword) throw new Error("Fill all fields.");
                  if (password !== confirmPassword) throw new Error("Passwords do not match.");
                  const res = await fetch(`${API_BASE_URL}/reset-password`, { 
                      method: "POST", 
                      headers: {"Content-Type": "application/json"}, 
                      body: JSON.stringify({username, otp: otpCode, new_password: password}) 
                  });
                  if (!res.ok) throw new Error("Reset failed");
                  setAuthSuccess("Password Reset! Please Login."); 
                  setTimeout(() => { setAuthMode("login"); setForgotStep(1); setAuthSuccess(""); setPassword(""); setOtpCode(""); }, 2000);
              }
              setIsAppLoading(false); return;
          }

          // --- LOGIN & REGISTER FLOW ---
          if (!username || !password) throw new Error("Please fill in all required fields.");
          
          if (authMode === "register") {
             if (password !== confirmPassword || !firstName || !mobile) throw new Error("Check all fields.");
             const payload = { username, password, first_name: firstName, last_name: lastName, mobile: mobile };
             const res = await fetch(`${API_BASE_URL}/register`, { 
                 method: "POST", 
                 headers: { "Content-Type": "application/json" }, 
                 body: JSON.stringify(payload) 
             });
             if (!res.ok) throw new Error("Registration failed");
             setAuthMode("login"); setAuthSuccess("Account created! Please login."); 
          } else {
             // LOGIN (Standard OAuth2 Form Data)
             const formData = new FormData(); 
             formData.append("username", username); 
             formData.append("password", password);
             const res = await fetch(`${API_BASE_URL}/token`, { method: "POST", body: formData });
             const data = await res.json();
             
             if (!res.ok) throw new Error(data.detail || "Invalid Credentials");
             
             setToken(data.access_token); setUserName(data.user_name || username.split('@')[0]);
             localStorage.setItem("token", data.access_token); 
             localStorage.setItem("userName", data.user_name || username.split('@')[0]);
             setShowAuthModal(false); setUsername(""); setPassword("");
          }
      } catch (e) { setAuthError(e.message); } finally { setIsAppLoading(false); }
  };

  const logout = () => { setToken(null); setUserName(""); localStorage.removeItem("token"); localStorage.removeItem("userName"); setFavorites([]); };
  
  const handleReset = () => { 
      setTicker(""); setSearchedTicker(""); setNews([]); setMergedData([]); 
      setCurrentQuote(null); setCompareTicker(""); setActiveComparison(null); 
      localStorage.removeItem("lastTicker"); setView("dashboard"); 
      setCandleData([]); setPredictiveData([]);
  };

  const saveSearchHistory = (t) => { 
      if(!t) return;
      const newHistory = [t, ...searchHistory.filter(item => item !== t)].slice(0, 5); 
      setSearchHistory(newHistory); 
      localStorage.setItem("searchHistory", JSON.stringify(newHistory)); 
  };

  const fetchBatchQuotes = async (tickersList) => { 
      if (!tickersList?.length) return; 
      try { 
          const res = await fetch(`${API_BASE_URL}/api/quotes`, { 
              method: "POST", 
              headers: { "Content-Type": "application/json" }, 
              body: JSON.stringify(tickersList) 
          }); 
          const data = await res.json(); 
          setPricesCache(prev => ({ ...prev, ...data })); 
      } catch (e) {} 
  };
  
  const handleSearch = async (overrideTicker = null) => { 
      const t = overrideTicker || ticker; if (!t) return; 
      setShowSuggestions(false); setTicker(t); setSearchedTicker(t); setLoading(true); 
      setNews([]); setMergedData([]); setActiveComparison(null); setCompareTicker(""); 
      setCurrentQuote(null); localStorage.setItem("lastTicker", t); saveSearchHistory(t); setView("dashboard"); 
      
      try { 
          await fetchQuote(t); 
          const newsRes = await fetch(`${API_BASE_URL}/news/${t}?period=${timeRange}`); 
          const newsData = await newsRes.json();
          setNews(Array.isArray(newsData) ? newsData : []); 
          setChartRange("1mo"); 
          await updateChart(t, "1mo", null); 
      } catch (error) { console.error(error); } 
      setLoading(false); 
  };

  const fetchQuote = async (symbol) => { 
      try { 
          const res = await fetch(`${API_BASE_URL}/quote/${symbol}`); 
          if(res.ok) setCurrentQuote(await res.json()); 
      } catch (e) {} 
  };

  const fetchHistoryData = async (symbol, range) => { 
      try { 
          const res = await fetch(`${API_BASE_URL}/history/${symbol}?period=${range}`); 
          const json = await res.json();
          return json.data ? json : {currency: "", data: []}; 
      } catch (e) { return {currency: "", data: []}; } 
  };
  
  const updateChart = async (mainSym, range, compSym) => { 
      const mainRes = await fetchHistoryData(mainSym, range); 
      setCurrency(mainRes.currency); 
      let finalData = mainRes.data || []; 
      
      if (compSym) { 
          const compRes = await fetchHistoryData(compSym, range); 
          const dataMap = new Map(); 
          finalData.forEach(item => dataMap.set(item.date, { date: item.date, price: item.price })); 
          (compRes.data || []).forEach(item => { 
              if (dataMap.has(item.date)) dataMap.get(item.date).comparePrice = item.price; 
              else dataMap.set(item.date, { date: item.date, comparePrice: item.price }); 
          }); 
          finalData = Array.from(dataMap.values()).sort((a,b) => a.date.localeCompare(b.date)); 
      } 
      setMergedData(finalData);
      setCandleData(simulateCandles(finalData)); 
      const prediction = generateUniquePrediction(finalData, mainSym);
      setPredictiveData(prediction.data);
      setPredictionModel(prediction.model);
  };

  const onSearchFocus = () => { setShowSuggestions(true); if (searchHistory.length > 0) fetchBatchQuotes(searchHistory); };
  
  const fetchSuggestions = async (query, isFav = false) => { 
      if (query.length < 2) { 
          if (isFav) setFavSuggestions([]); else setSuggestions([]); 
          return; 
      } 
      try { 
          const res = await fetch(`${API_BASE_URL}/api/search/${query}`); 
          const data = await res.json(); 
          if (isFav) setFavSuggestions(data); 
          else { 
              setSuggestions(data); 
              fetchBatchQuotes(data.map(s => s.symbol)); 
          } 
      } catch (e) { } 
  };

    const fetchTrending = async (regions = ['all'], states = {}) => { 
        try {
            const regionsParam = regions.join(',');
            const statesParam = Object.keys(states).length > 0 ? encodeURIComponent(JSON.stringify(states)) : '';
            const url = statesParam 
                ? `${API_BASE_URL}/trending?regions=${regionsParam}&states=${statesParam}`
                : `${API_BASE_URL}/trending?regions=${regionsParam}`;
            const res = await fetch(url); 
            const data = await res.json(); 
            setTrending(data);
        } catch (e) { console.error('fetchTrending failed', e); } 
    };
  
  const fetchFavorites = async () => { 
      try { 
          const res = await fetch(`${API_BASE_URL}/favorites`, { headers: { "Authorization": `Bearer ${token}` } }); 
          if (res.ok) setFavorites(await res.json()); 
      } catch (e) {} 
  };

  const toggleFavorite = async (t) => { 
      if (!token) { setShowAuthModal(true); return; } 
      if (!t) return; 
      const isFav = favorites.some(f => f.ticker === t); 
      const method = isFav ? "DELETE" : "POST"; 
      await fetch(`${API_BASE_URL}/favorites/${t}`, { method, headers: { "Authorization": `Bearer ${token}` } }); 
      fetchFavorites(); setNewFav(""); setShowFavSuggestions(false); 
  };

  const getBorderColor = (s) => (s === "positive" ? "4px solid #00e676" : s === "negative" ? "4px solid #ff1744" : "1px solid #651fff");
  
  // --- DERIVED STATE ---
    const filteredNews = useMemo(() => news.filter(n => n.title?.toLowerCase().includes(newsSearch.toLowerCase())), [news, newsSearch]);

    const getCategoryBadge = (category) => {
    const badges = {
      gold: { icon: '🏆', label: 'Gold', color: '#FFD700', bg: 'rgba(255, 215, 0, 0.15)' },
      stocks: { icon: '📈', label: 'Stocks', color: '#00e676', bg: 'rgba(0, 230, 118, 0.15)' },
      mutual_fund: { icon: '💼', label: 'Mutual Funds', color: '#2196F3', bg: 'rgba(33, 150, 243, 0.15)' },
      crypto: { icon: '₿', label: 'Crypto', color: '#FF9800', bg: 'rgba(255, 152, 0, 0.15)' },
      real_estate: { icon: '🏘️', label: 'Real Estate', color: '#9C27B0', bg: 'rgba(156, 39, 176, 0.15)' },
      all: { icon: '📰', label: 'General', color: '#787b86', bg: 'rgba(120, 123, 134, 0.15)' }
    };
    return badges[category] || badges.all;
  };

  const classifyArticleCategory = (article) => {
        const txt = ((article.title || "") + " " + (article.description || "")).toLowerCase();
        if (/gold/.test(txt)) return "gold";
        if (/crypto|bitcoin|ethereum|btc|eth|coin\b/.test(txt)) return "crypto";
        if (/mutual fund|mutual funds|sip|nav|aum|fund house|mf\b/.test(txt)) return "mutual_fund";
        if (/real estate|property|mortgage|housing|realty|reits?/i.test(txt)) return "real_estate";
        if (/stock|shares|ipo|earnings|revenue|acquisition|merger|tcs|reliance|infy|hdfc|nifty|sensex|nasdaq|nyse|dow\b/.test(txt)) return "stocks";
        return "all";
    };

    const inferEntityInfo = (article, cat) => {
        const txt = ((article.title || "") + " " + (article.description || "")).toLowerCase();
        if (cat === 'stocks') {
            if (/bank|hdfc|banking/.test(txt)) return 'Sector: Banking';
            if (/oil|energy|exxon|bp|chevron|bp\b/.test(txt)) return 'Sector: Energy';
            if (/tech|software|microsoft|apple|google|tcs|infosys|technology/.test(txt)) return 'Sector: Technology';
            if (/auto|tesla|ford|gm|vehicle/.test(txt)) return 'Sector: Automotive';
            return '';
        }
        if (cat === 'mutual_fund') {
            if (/equity|large cap|large-cap/.test(txt)) return 'Fund Type: Equity / Large Cap';
            if (/debt|bond/.test(txt)) return 'Fund Type: Debt';
            if (/hybrid/.test(txt)) return 'Fund Type: Hybrid';
            if (/sip/.test(txt)) return 'Fund Feature: SIP';
            return '';
        }
        return '';
    };

    const filteredGeneralNews = useMemo(() => {
        return generalNews
            .filter(n => n.title?.toLowerCase().includes(newsSearch.toLowerCase()))
            .filter(a => {
                if (newsCategory === 'all') return true;
                return classifyArticleCategory(a) === newsCategory;
            });
    }, [generalNews, newsSearch, newsCategory]);

    const filteredTrending = useMemo(() => {
        // Backend now handles all region filtering
        return trending || [];
    }, [trending]);

  const sentimentCounts = useMemo(() => [ 
      { name: 'Positive', value: news.filter(n => n.sentiment === 'positive').length }, 
      { name: 'Negative', value: news.filter(n => n.sentiment === 'negative').length }, 
      { name: 'Neutral', value: news.filter(n => n.sentiment === 'neutral' || !n.sentiment).length } 
  ], [news]);
  
  const activeData = sentimentCounts.filter(item => item.value > 0);

  // Keyboard navigation for news reader - AFTER filteredGeneralNews is defined
  useEffect(() => {
    if (!showNewsReader && !fullPageNewsView) return;

    const handleKeyDown = (e) => {
      const maxIndex = fullPageNewsView ? generalNews.length - 1 : filteredGeneralNews.length - 1;
      
      if (e.key === 'Escape' && showNewsReader) {
        setShowNewsReader(false);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentNewsIndex > 0) {
          setCurrentNewsIndex(currentNewsIndex - 1);
          if (fullPageNewsView) window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentNewsIndex < maxIndex) {
          setCurrentNewsIndex(currentNewsIndex + 1);
          if (fullPageNewsView) window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else if (fullPageNewsView && e.key >= '1' && e.key <= '9') {
        // Jump to page number (1-9)
        const pageNum = parseInt(e.key) - 1;
        if (pageNum <= maxIndex) {
          setCurrentNewsIndex(pageNum);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showNewsReader, fullPageNewsView, currentNewsIndex, filteredGeneralNews.length, generalNews.length]);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "#131722", minHeight: "100vh", color: "#d1d4dc", display: "flex", flexDirection: "column" }}>
      <style>{styles}</style>
      {(isAppLoading || loading) && ( <div className="loading-overlay"> <div className="spinner"></div> </div> )}

      <nav style={{ backgroundColor: "#1e222d", padding: "15px 40px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid #2a2e39", position: "sticky", top: 0, zIndex: 1000 }}>
        <div style={{ fontSize: "24px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "20px" }}>
          <span onClick={() => { setView("dashboard"); setFullPageNewsView(false); handleReset(); }} style={{cursor: "pointer"}}>
            <span style={{ color: "#2962ff" }}>KRYPTONAX</span> | <span style={{fontSize: "16px", fontWeight: "normal", color: "#787b86"}}>Financial Intelligence</span>
          </span>
          {searchedTicker && view === "dashboard" && !fullPageNewsView && <button onClick={handleReset} style={{ fontSize: "14px", padding: "5px 15px", backgroundColor: "#2a2e39", border: "1px solid #787b86", color: "#d1d4dc", borderRadius: "4px", cursor: "pointer" }}>← Back to Home</button>}
        </div>
        <div style={{display: "flex", alignItems: "center", gap: "25px"}}>
          {fullPageNewsView && <button onClick={() => { setView("dashboard"); setFullPageNewsView(false); handleReset(); }} style={{ fontSize: "14px", padding: "8px 16px", backgroundColor: "#2a2e39", border: "1px solid #787b86", color: "#d1d4dc", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.3s" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#2962ff"; e.currentTarget.style.borderColor = "#2962ff"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#2a2e39"; e.currentTarget.style.borderColor = "#787b86"; }}>🏠 Home</button>}
          <span onClick={() => { setFullPageNewsView(true); setView("dashboard"); setCurrentNewsIndex(0); }} style={{cursor: "pointer", color: fullPageNewsView ? "#2962ff" : "#d1d4dc", fontWeight: "bold", transition: "0.2s", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px"}}>📰 Read Top Trending News</span>
          <span onClick={() => setShowChatBot(true)} style={{cursor: "pointer", color: "#d1d4dc", fontWeight: "bold", transition: "0.2s", fontSize: "14px"}}>💬 Chat with Bot</span>
          <span onClick={() => { setView("about"); setFullPageNewsView(false); }} style={{cursor: "pointer", color: view === "about" ? "#2962ff" : "#d1d4dc", fontWeight: "bold", transition: "0.2s"}}>About Us</span>
          {userName && <span style={{color: "#00e676", fontWeight: "bold"}}>Hi, {userName}</span>}
          {token ? ( <button onClick={logout} style={{ background: "#ff1744", color: "white", padding: "8px 20px", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Logout</button> ) : ( <button onClick={() => setShowAuthModal(true)} style={{ background: "#2962ff", color: "white", padding: "8px 20px", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Login / Sign Up</button> )}</div>
      </nav>

      {/* --- AUTH MODAL --- */}
      {showAuthModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
            <div style={{ backgroundColor: "#1e222d", padding: "40px", borderRadius: "8px", border: "1px solid #2a2e39", width: "400px", textAlign: "center", position: "relative" }}>
                <button onClick={() => {setShowAuthModal(false); setAuthMode("login"); setForgotStep(1);}} style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", color: "#787b86", fontSize: "20px", cursor: "pointer" }}>✕</button>
                <h2 style={{ color: "white", marginTop: 0 }}>{authMode === "login" ? "Welcome Back" : authMode === "register" ? "Create Account" : "Reset Password"}</h2>
                {authError && <p style={{color: "#ff1744", fontSize: "14px"}}>{authError}</p>}
                {authSuccess && <p style={{color: "#00e676", fontSize: "14px"}}>{authSuccess}</p>}
                
                {authMode === "forgot" ? (
                    <>
                        {forgotStep === 1 ? ( <><input type="text" placeholder="Email Address" value={username} onChange={e => setUsername(e.target.value)} style={{ width: "95%", padding: "10px", margin: "5px 0", backgroundColor: "#131722", border: "1px solid #2a2e39", color: "white", borderRadius: "4px" }} /><button onClick={handleAuth} style={{ width: "100%", padding: "12px", background: "#2962ff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", marginTop: "15px" }}>Send OTP</button></> ) : ( <><input type="text" placeholder="Enter 6-Digit OTP" value={otpCode} onChange={e => setOtpCode(e.target.value)} style={{ width: "95%", padding: "10px", margin: "5px 0", backgroundColor: "#131722", border: "1px solid #2a2e39", color: "white", borderRadius: "4px", textAlign: "center", letterSpacing: "5px", fontWeight: "bold" }} /><input type="password" placeholder="New Password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: "95%", padding: "10px", backgroundColor: "#131722", border: "1px solid #2a2e39", color: "white", borderRadius: "4px", marginTop: "5px" }} /><input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ width: "95%", padding: "10px", backgroundColor: "#131722", border: "1px solid #2a2e39", color: "white", borderRadius: "4px", marginTop: "5px" }} /><button onClick={handleAuth} style={{ width: "100%", padding: "12px", background: "#2962ff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", marginTop: "15px" }}>Reset Password</button></> )}
                        <p style={{ fontSize: "12px", color: "#787b86", marginTop: "15px", cursor: "pointer" }} onClick={() => { setAuthMode("login"); setForgotStep(1); }}>Back to Login</p>
                    </>
                ) : (
                    <>
                        {authMode === "register" && ( 
                            <>
                                <div style={{display: "flex", gap: "10px"}}>
                                    <input type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} style={{ width: "50%", padding: "10px", margin: "5px 0", backgroundColor: "#131722", border: "1px solid #2a2e39", color: "white", borderRadius: "4px" }} />
                                    <input type="text" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} style={{ width: "50%", padding: "10px", margin: "5px 0", backgroundColor: "#131722", border: "1px solid #2a2e39", color: "white", borderRadius: "4px" }} />
                                </div>
                                <input type="text" placeholder="Mobile Number" value={mobile} onChange={e => setMobile(e.target.value)} style={{ width: "95%", padding: "10px", margin: "5px 0", backgroundColor: "#131722", border: "1px solid #2a2e39", color: "white", borderRadius: "4px" }} />
                            </>
                        )}
                        <input type="text" placeholder="Email (Username)" value={username} onChange={e => setUsername(e.target.value)} style={{ width: "95%", padding: "10px", margin: "5px 0", backgroundColor: "#131722", border: "1px solid #2a2e39", color: "white", borderRadius: "4px" }} />
                        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: "95%", padding: "10px", backgroundColor: "#131722", border: "1px solid #2a2e39", color: "white", borderRadius: "4px", marginTop: "5px" }} />
                        {authMode === "register" && <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ width: "95%", padding: "10px", backgroundColor: "#131722", border: "1px solid #2a2e39", color: "white", borderRadius: "4px", marginTop: "5px" }} />}
                        
                        {authMode === "login" && <p style={{ fontSize: "12px", color: "#2962ff", cursor: "pointer", textAlign: "right", marginTop: "5px" }} onClick={() => { setAuthMode("forgot"); setAuthError(""); }}>Forgot Password?</p>}
                        
                        <button onClick={handleAuth} style={{ width: "100%", padding: "12px", background: "#2962ff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", marginTop: "15px" }}>{authMode === "login" ? "Login" : "Sign Up"}</button>
                        <p style={{ fontSize: "12px", color: "#787b86", marginTop: "20px", cursor: "pointer" }} onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthError(""); }}>{authMode === "login" ? "Don't have an account? Sign Up" : "Already have an account? Login"}</p>
                    </>
                )}
            </div>
        </div>
      )}

      {showAboutModal && ( <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 }}> <div style={{ backgroundColor: "#1e222d", padding: "50px", borderRadius: "12px", border: "1px solid #2a2e39", width: "700px", color: "#d1d4dc", position: "relative" }}> <button onClick={() => setShowAboutModal(false)} style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: "white", fontSize: "24px", cursor: "pointer" }}>✕</button> <h1 style={{ color: "#2962ff", textAlign: "center", marginBottom: "30px" }}>About Kryptonax</h1> <p style={{ lineHeight: "1.6", color: "#a1a1a1" }}> Kryptonax was built to democratize financial intelligence. </p> </div> </div> )}

      {view === "about" ? (
        <div style={{ flex: 1, color: "#d1d4dc", paddingBottom: "60px", textAlign: "center", padding: "80px 20px" }}>
            <h1 style={{ fontSize: "48px", marginBottom: "20px", color: "white" }}>Empowering Your <span style={{color: "#2962ff"}}>Financial Future</span></h1>
            <button onClick={() => setView("dashboard")} style={{ marginTop: "30px", padding: "12px 30px", background: "#2962ff", color: "white", border: "none", borderRadius: "4px", fontSize: "16px", cursor: "pointer", fontWeight: "bold" }}>Start Analyzing</button>
        </div>
      ) : fullPageNewsView ? (
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "40px 20px", minHeight: "calc(100vh - 200px)" }}>
          {/* Region Filter */}
          <div style={{ marginBottom: "30px" }}>
            <RegionFilter
              selectedRegions={newsReaderRegions}
              selectedStates={newsReaderStates}
              onRegionsChange={setNewsReaderRegions}
              onStatesChange={setNewsReaderStates}
            />
          </div>

          {/* Full Page News Reader */}
          {(() => {
            const newsToShow = generalNews
              .filter(n => {
                if (newsReaderRegions.includes('all')) return true;
                // Simple region filtering - you can enhance this
                return true;
              });
            
            if (newsToShow.length === 0) {
              return (
                <div style={{ textAlign: 'center', padding: '100px 20px', color: '#787b86' }}>
                  <div style={{ fontSize: '72px', marginBottom: '20px' }}>📰</div>
                  <h2 style={{ color: '#d1d4dc', marginBottom: '10px' }}>No News Available</h2>
                  <p>Try adjusting your region filters</p>
                </div>
              );
            }

            const currentArticle = newsToShow[currentNewsIndex] || newsToShow[0];
            const articleCat = classifyArticleCategory(currentArticle);
            const categoryBadge = getCategoryBadge(articleCat);
            const entityInfo = inferEntityInfo(currentArticle, articleCat);

            return (
              <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                {/* Article Counter */}
                <div style={{ backgroundColor: '#1e222d', borderRadius: '12px', padding: '15px 25px', border: '1px solid #2a2e39', marginBottom: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px' }}>
                  <div style={{ fontSize: '13px', color: '#787b86', textTransform: 'uppercase', letterSpacing: '1px' }}>Article</div>
                  <div style={{ fontSize: '24px', color: '#2962ff', fontWeight: 'bold' }}>
                    {currentNewsIndex + 1} <span style={{ fontSize: '16px', color: '#787b86' }}>/ {newsToShow.length}</span>
                  </div>
                </div>

                {/* Main Content */}
                <div style={{ backgroundColor: '#1e222d', borderRadius: '12px', padding: '40px', border: '1px solid #2a2e39' }}>
                  {/* Category and Sentiment Badges */}
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '25px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', padding: '8px 16px', borderRadius: '25px', backgroundColor: categoryBadge.bg, color: categoryBadge.color, border: `1.5px solid ${categoryBadge.color}50`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>{categoryBadge.icon}</span>
                      <span>{categoryBadge.label}</span>
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: "600", padding: "8px 16px", borderRadius: "25px", backgroundColor: getBorderColor(currentArticle.sentiment).split(' ')[2] === '#00e676' ? 'rgba(0, 230, 118, 0.2)' : getBorderColor(currentArticle.sentiment).split(' ')[2] === '#ff1744' ? 'rgba(255, 23, 68, 0.2)' : 'rgba(255, 215, 0, 0.2)', color: getBorderColor(currentArticle.sentiment).split(' ')[2], border: `1.5px solid ${getBorderColor(currentArticle.sentiment).split(' ')[2]}50` }}>
                      {currentArticle.sentiment === 'positive' ? '📈' : currentArticle.sentiment === 'negative' ? '📉' : '➖'} {currentArticle.sentiment.toUpperCase()}
                    </span>
                    <span style={{ fontSize: "13px", color: "#787b86", padding: "8px 16px", backgroundColor: "#2a2e39", borderRadius: "25px", marginLeft: 'auto' }}>
                      🗓️ {new Date(currentArticle.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Title */}
                  <h1 style={{ color: "#ffffff", fontSize: "36px", lineHeight: "1.3", margin: "0 0 25px 0", fontWeight: "700" }}>
                    {currentArticle.title}
                  </h1>

                  {/* Entity Info */}
                  {entityInfo && (
                    <div style={{ marginBottom: '30px', padding: '16px 20px', backgroundColor: 'rgba(41, 98, 255, 0.15)', borderLeft: '4px solid #2962ff', borderRadius: '8px' }}>
                      <div style={{ fontSize: '14px', color: '#9fb3ff', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px' }}>📊</span>
                        <span>{entityInfo}</span>
                      </div>
                    </div>
                  )}

                  {/* Image */}
                  {currentArticle.urlToImage && (
                    <div style={{ marginBottom: '35px', borderRadius: '16px', overflow: 'hidden', border: '1px solid #2a2e39', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
                      <img 
                        src={currentArticle.urlToImage} 
                        alt={currentArticle.title}
                        style={{ width: '100%', height: 'auto', maxHeight: '500px', objectFit: 'cover', display: 'block' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}

                  {/* Description */}
                  <div style={{ fontSize: '18px', color: '#d1d4dc', lineHeight: '1.9', marginBottom: '30px', fontFamily: 'Georgia, serif' }}>
                    <p style={{ marginBottom: '20px' }}>{currentArticle.description || currentArticle.content || 'No additional details available.'}</p>
                    {currentArticle.content && currentArticle.content !== currentArticle.description && (
                      <p style={{ color: '#a1a7b4' }}>{currentArticle.content}</p>
                    )}
                  </div>

                  {/* Source Card */}
                  {currentArticle.source?.name && (
                    <div style={{ padding: '20px', backgroundColor: '#131722', borderRadius: '12px', marginBottom: '30px', border: '1px solid #2a2e39', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#787b86', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Published By</div>
                        <div style={{ fontSize: '16px', color: '#d1d4dc', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '20px' }}>📰</span>
                          <span>{currentArticle.source.name}</span>
                        </div>
                      </div>
                      {currentArticle.author && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '12px', color: '#787b86', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Author</div>
                          <div style={{ fontSize: '14px', color: '#d1d4dc', fontWeight: '600' }}>{currentArticle.author}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Read Full Article Button */}
                  <a 
                    href={currentArticle.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gap: '12px',
                      padding: '18px 32px', 
                      borderRadius: '12px', 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white', 
                      fontSize: '16px', 
                      fontWeight: 'bold',
                      textDecoration: 'none',
                      transition: 'all 0.3s',
                      boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => { 
                      e.currentTarget.style.transform = 'translateY(-3px)'; 
                      e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.6)';
                    }}
                    onMouseLeave={(e) => { 
                      e.currentTarget.style.transform = 'translateY(0)'; 
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>🔗</span>
                    <span>Read Full Article on {currentArticle.source?.name || 'Publisher\'s Website'}</span>
                    <span style={{ fontSize: '20px' }}>→</span>
                  </a>

                  {/* Bottom Navigation */}
                  <div style={{ marginTop: '50px', paddingTop: '40px', borderTop: '2px solid #2a2e39' }}>
                    {/* Previous/Next Buttons */}
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                      <button 
                        onClick={() => { setCurrentNewsIndex(Math.max(0, currentNewsIndex - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        disabled={currentNewsIndex === 0}
                        style={{ 
                          flex: 1,
                          padding: "18px 32px", 
                          borderRadius: "10px", 
                          border: "none", 
                          background: currentNewsIndex === 0 ? "#2a2e39" : "linear-gradient(135deg, #2962ff 0%, #1e4ba8 100%)",
                          color: currentNewsIndex === 0 ? "#787b86" : "white",
                          fontSize: "16px", 
                          fontWeight: "700",
                          cursor: currentNewsIndex === 0 ? "not-allowed" : "pointer",
                          transition: "all 0.3s",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "12px",
                          boxShadow: currentNewsIndex === 0 ? 'none' : '0 4px 15px rgba(41, 98, 255, 0.3)'
                        }}
                        onMouseEnter={(e) => { if (currentNewsIndex !== 0) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(41, 98, 255, 0.5)'; } }}
                        onMouseLeave={(e) => { if (currentNewsIndex !== 0) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(41, 98, 255, 0.3)'; } }}
                      >
                        <span style={{ fontSize: '20px' }}>←</span>
                        <span>Previous Article</span>
                      </button>

                      <button 
                        onClick={() => { setCurrentNewsIndex(Math.min(newsToShow.length - 1, currentNewsIndex + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        disabled={currentNewsIndex === newsToShow.length - 1}
                        style={{ 
                          flex: 1,
                          padding: "18px 32px", 
                          borderRadius: "10px", 
                          border: "none", 
                          background: currentNewsIndex === newsToShow.length - 1 ? "#2a2e39" : "linear-gradient(135deg, #2962ff 0%, #1e4ba8 100%)",
                          color: currentNewsIndex === newsToShow.length - 1 ? "#787b86" : "white",
                          fontSize: "16px", 
                          fontWeight: "700",
                          cursor: currentNewsIndex === newsToShow.length - 1 ? "not-allowed" : "pointer",
                          transition: "all 0.3s",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "12px",
                          boxShadow: currentNewsIndex === newsToShow.length - 1 ? 'none' : '0 4px 15px rgba(41, 98, 255, 0.3)'
                        }}
                        onMouseEnter={(e) => { if (currentNewsIndex !== newsToShow.length - 1) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(41, 98, 255, 0.5)'; } }}
                        onMouseLeave={(e) => { if (currentNewsIndex !== newsToShow.length - 1) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(41, 98, 255, 0.3)'; } }}
                      >
                        <span>Next Article</span>
                        <span style={{ fontSize: '20px' }}>→</span>
                      </button>
                    </div>

                    {/* Professional Pagination */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', flexWrap: 'wrap', padding: '20px', backgroundColor: '#131722', borderRadius: '12px', border: '1px solid #2a2e39' }}>
                        {/* Previous Button */}
                        <button
                          onClick={() => { setCurrentNewsIndex(Math.max(0, currentNewsIndex - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          disabled={currentNewsIndex === 0}
                          style={{
                            padding: '10px 16px',
                            borderRadius: '8px',
                            border: '1px solid #2a2e39',
                            backgroundColor: currentNewsIndex === 0 ? '#1e222d' : '#2962ff',
                            color: currentNewsIndex === 0 ? '#787b86' : 'white',
                            cursor: currentNewsIndex === 0 ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            fontSize: '14px',
                            transition: 'all 0.2s',
                            opacity: currentNewsIndex === 0 ? 0.5 : 1
                          }}
                          onMouseEnter={(e) => { if (currentNewsIndex !== 0) e.currentTarget.style.backgroundColor = '#1e4ba8'; }}
                          onMouseLeave={(e) => { if (currentNewsIndex !== 0) e.currentTarget.style.backgroundColor = '#2962ff'; }}
                        >
                          Previous
                        </button>

                      {/* Page Numbers */}
                      {(() => {
                        const totalPages = newsToShow.length;
                        const currentPage = currentNewsIndex + 1;
                        const pageNumbers = [];
                        
                        // Always show first page
                        if (totalPages > 0) pageNumbers.push(1);
                        
                        // Show dots if needed
                        if (currentPage > 4) pageNumbers.push('...');
                        
                        // Show pages around current
                        for (let i = Math.max(2, currentPage - 2); i <= Math.min(totalPages - 1, currentPage + 2); i++) {
                          pageNumbers.push(i);
                        }
                        
                        // Show dots if needed
                        if (currentPage < totalPages - 3) pageNumbers.push('...');
                        
                        // Always show last page
                        if (totalPages > 1) pageNumbers.push(totalPages);
                        
                        return pageNumbers.map((page, idx) => {
                          if (page === '...') {
                            return (
                              <span key={`dots-${idx}`} style={{ padding: '0 8px', color: '#787b86', fontSize: '18px' }}>...</span>
                            );
                          }
                          
                          const isActive = page === currentPage;
                          return (
                            <button
                              key={page}
                              onClick={() => { setCurrentNewsIndex(page - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                              style={{
                                minWidth: '40px',
                                height: '40px',
                                borderRadius: '8px',
                                border: isActive ? '2px solid #2962ff' : '1px solid #2a2e39',
                                backgroundColor: isActive ? '#2962ff' : '#1e222d',
                                color: isActive ? 'white' : '#d1d4dc',
                                cursor: 'pointer',
                                fontWeight: isActive ? '700' : '500',
                                fontSize: '14px',
                                transition: 'all 0.2s',
                                boxShadow: isActive ? '0 0 15px rgba(41, 98, 255, 0.4)' : 'none'
                              }}
                              onMouseEnter={(e) => {
                                if (!isActive) {
                                  e.currentTarget.style.backgroundColor = '#2a2e39';
                                  e.currentTarget.style.borderColor = '#2962ff';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isActive) {
                                  e.currentTarget.style.backgroundColor = '#1e222d';
                                  e.currentTarget.style.borderColor = '#2a2e39';
                                }
                              }}
                            >
                              {page}
                            </button>
                          );
                        });
                      })()}

                      {/* Next Button */}
                      <button
                        onClick={() => { setCurrentNewsIndex(Math.min(newsToShow.length - 1, currentNewsIndex + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        disabled={currentNewsIndex === newsToShow.length - 1}
                        style={{
                          padding: '10px 16px',
                          borderRadius: '8px',
                          border: '1px solid #2a2e39',
                          backgroundColor: currentNewsIndex === newsToShow.length - 1 ? '#1e222d' : '#2962ff',
                          color: currentNewsIndex === newsToShow.length - 1 ? '#787b86' : 'white',
                          cursor: currentNewsIndex === newsToShow.length - 1 ? 'not-allowed' : 'pointer',
                          fontWeight: '600',
                          fontSize: '14px',
                          transition: 'all 0.2s',
                          opacity: currentNewsIndex === newsToShow.length - 1 ? 0.5 : 1
                        }}
                        onMouseEnter={(e) => { if (currentNewsIndex !== newsToShow.length - 1) e.currentTarget.style.backgroundColor = '#1e4ba8'; }}
                        onMouseLeave={(e) => { if (currentNewsIndex !== newsToShow.length - 1) e.currentTarget.style.backgroundColor = '#2962ff'; }}
                      >
                        Next
                      </button>
                    </div>

                      {/* Direct Page Jump */}
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', padding: '20px', backgroundColor: '#1e222d', borderRadius: '12px', border: '1px solid #2a2e39' }}>
                        <label style={{ fontSize: '14px', color: '#d1d4dc', fontWeight: '600' }}>
                          Go to Article:
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={newsToShow.length}
                          placeholder={`1-${newsToShow.length}`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const pageNum = parseInt(e.target.value);
                              if (pageNum >= 1 && pageNum <= newsToShow.length) {
                                setCurrentNewsIndex(pageNum - 1);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                e.target.value = '';
                              }
                            }
                          }}
                          style={{
                            width: '80px',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid #2a2e39',
                            backgroundColor: '#131722',
                            color: '#d1d4dc',
                            fontSize: '14px',
                            fontWeight: '600',
                            textAlign: 'center',
                            outline: 'none',
                            transition: 'all 0.2s'
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#2962ff';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(41, 98, 255, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#2a2e39';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        />
                        <button
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling;
                            const pageNum = parseInt(input.value);
                            if (pageNum >= 1 && pageNum <= newsToShow.length) {
                              setCurrentNewsIndex(pageNum - 1);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                              input.value = '';
                            } else {
                              alert(`Please enter a number between 1 and ${newsToShow.length}`);
                            }
                          }}
                          style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#2962ff',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 8px rgba(41, 98, 255, 0.3)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#1e4ba8';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(41, 98, 255, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#2962ff';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(41, 98, 255, 0.3)';
                          }}
                        >
                          Go
                        </button>
                      </div>
                    </div>

                    {/* Keyboard Shortcuts Info */}
                    <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#1e222d', borderRadius: '8px', border: '1px solid #2a2e39', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#787b86', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Keyboard Shortcuts</div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '12px', color: '#9fb3ff', flexWrap: 'wrap' }}>
                        <span>← / → Navigate</span>
                        <span>🏠 Home</span>
                        <span>1-9 Jump to page</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        <div style={{ display: "flex", maxWidth: "1600px", margin: "30px auto", gap: "20px", padding: "0 20px", flex: 1, width: "100%", boxSizing: "border-box" }}>
            
            {/* SIDEBAR - NOW WITH WATCH LATER */}
            {!searchedTicker && (
                <aside style={{ width: "300px", backgroundColor: "#1e222d", padding: "20px", borderRadius: "4px", border: "1px solid #2a2e39", height: "fit-content" }}>
                    <h3 style={{ borderBottom: "1px solid #2a2e39", paddingBottom: "10px", color: "#d1d4dc", fontSize: "16px" }}>⭐ My Watchlist</h3>
                    {!token && <p style={{fontSize: "12px", color: "#787b86"}}>Login to save your favorites.</p>}
                    <div style={{ display: "flex", gap: "5px", marginBottom: "20px", position: "relative" }}> <input type="text" placeholder="Add Ticker..." value={newFav} onChange={(e) => { setNewFav(e.target.value.toUpperCase()); setShowFavSuggestions(true); fetchSuggestions(e.target.value, true); }} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #2a2e39", backgroundColor: "#131722", color: "white" }} /> <button onClick={() => toggleFavorite(newFav)} style={{ background: "#2962ff", color: "white", border: "none", borderRadius: "4px", padding: "0 15px", cursor: "pointer" }}>+</button> {showFavSuggestions && favSuggestions.length > 0 && ( <div style={{ position: "absolute", top: "40px", left: 0, width: "100%", backgroundColor: "#1e222d", zIndex: 10, border: "1px solid #2a2e39", boxShadow: "0 4px 10px rgba(0,0,0,0.5)" }}> {favSuggestions.map(s => <div key={s.symbol} onClick={() => toggleFavorite(s.symbol)} style={{ padding: "8px", cursor: "pointer", borderBottom: "1px solid #2a2e39", fontSize: "13px" }}><span style={{fontWeight: "bold", color: "#2962ff"}}>{s.symbol}</span> <span style={{color: "#787b86"}}>({s.name})</span></div>)} </div> )} </div>
                    <ul style={{ listStyle: "none", padding: 0 }}> {favorites.map(fav => ( <li key={fav.ticker} style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", padding: "10px", backgroundColor: "#2a2e39", borderRadius: "4px" }}> <span style={{ cursor: "pointer", fontWeight: "bold", color: "#d1d4dc" }} onClick={() => handleSearch(fav.ticker)}>{fav.ticker}</span> <button onClick={(e) => { e.stopPropagation(); toggleFavorite(fav.ticker); }} style={{ border: "none", background: "none", color: "#ff1744", cursor: "pointer" }}>✕</button> </li> ))} </ul>
                    
                    {/* NEW: WATCH LATER NEWS SECTION */}
                    {watchLater.length > 0 && (
                        <>
                            <h3 style={{ marginTop: "30px", borderBottom: "1px solid #2a2e39", paddingBottom: "10px", color: "#d1d4dc", fontSize: "16px" }}>🔖 Watch Later News</h3>
                            <ul style={{ listStyle: "none", padding: 0 }}>
                                {watchLater.map((article, i) => (
                                    <li key={i} style={{ marginBottom: "10px", padding: "10px", backgroundColor: "#2a2e39", borderRadius: "4px", fontSize: "12px", position: 'relative' }}>
                                        <div style={{fontWeight: 'bold', marginBottom: '5px'}}><a href={article.url} target="_blank" rel="noopener noreferrer" style={{color: '#d1d4dc', textDecoration: 'none'}}>{article.title.substring(0, 40)}...</a></div>
                                        <button onClick={() => toggleWatchLater(article)} style={{ position: 'absolute', top: '5px', right: '5px', background: 'none', border: 'none', color: '#ff1744', cursor: 'pointer' }}>✕</button>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}

                                        <h3 style={{ marginTop: "30px", borderBottom: "1px solid #2a2e39", paddingBottom: "10px", color: "#d1d4dc", fontSize: "16px" }}>🚀 Top Movers</h3>
                                        <ul style={{ listStyle: "none", padding: 0 }}>
                                            {filteredTrending.map((t, i) => (
                                                <li key={t.ticker || i} style={{ marginBottom: "8px", paddingBottom: "8px", borderBottom: "1px solid #2a2e39" }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                        <span style={{ cursor: "pointer", fontWeight: "bold", color: "#d1d4dc" }} onClick={() => handleSearch(t.ticker)}>{t.ticker}</span>
                                                        <span style={{ color: t.change >= 0 ? "#00e676" : "#ff1744", fontWeight: "bold", fontSize: "14px" }}>{t.change > 0 ? "+" : ""}{t.change}%</span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                </aside>
            )}

            <main style={{ flex: "1 1 auto", minWidth: 0, width: "100%" }}>
                {/* REGION FILTER - Prominent position at top */}
                <RegionFilter
                    selectedRegions={selectedRegions}
                    selectedStates={selectedStates}
                    onRegionsChange={setSelectedRegions}
                    onStatesChange={setSelectedStates}
                />
                
                {/* Active Filter Banner - Only show when filters are active */}
                {!selectedRegions.includes('all') && (
                    <RegionFilter
                        selectedRegions={selectedRegions}
                        selectedStates={selectedStates}
                        onRegionsChange={setSelectedRegions}
                        onStatesChange={setSelectedStates}
                        isCompact={true}
                    />
                )}

                <div style={{ backgroundColor: "#1e222d", padding: "20px", borderRadius: "4px", marginBottom: "20px", border: "1px solid #2a2e39" }}>
                    <div style={{ display: "flex", flexDirection: "row", gap: "10px", alignItems: "center", width: "100%", flexWrap: "nowrap", overflow: "visible" }}>
                        <div style={{ flex: "10", position: "relative", minWidth: "400px", maxWidth: "900px" }}>
                            <input 
                                type="text" 
                                placeholder="Search (e.g. BTC-USD, AAPL)..." 
                                value={ticker} 
                                onChange={(e) => { setTicker(e.target.value.toUpperCase()); setShowSuggestions(true); fetchSuggestions(e.target.value); }} 
                                onFocus={onSearchFocus} 
                                style={{ 
                                    width: "100%", 
                                    padding: "16px 50px 16px 20px", 
                                    borderRadius: "30px", 
                                    border: "1px solid #2a2e39", 
                                    backgroundColor: "#131722", 
                                    color: "white", 
                                    fontSize: "16px", 
                                    boxSizing: "border-box",
                                    display: "block"
                                }} 
                            />
                            <svg 
                                onClick={() => handleSearch()} 
                                xmlns="http://www.w3.org/2000/svg" 
                                width="22" 
                                height="22" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="#787b86" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                style={{ 
                                    position: "absolute", 
                                    right: "18px", 
                                    top: "50%", 
                                    transform: "translateY(-50%)", 
                                    cursor: "pointer", 
                                    transition: "0.2s",
                                    pointerEvents: "auto"
                                }}
                            > 
                                <circle cx="11" cy="11" r="8"></circle> 
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line> 
                            </svg>
                            {showSuggestions && ( <div style={{ position: "absolute", top: "55px", left: 0, width: "100%", backgroundColor: "#1e222d", zIndex: 100, border: "1px solid #2a2e39", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}> {ticker.length < 2 && searchHistory.length > 0 && ( <div> <div style={{ padding: "5px 10px", fontSize: "11px", color: "#787b86", backgroundColor: "#131722", borderBottom: "1px solid #2a2e39" }}>RECENT SEARCHES</div> {searchHistory.map((h, i) => ( <div key={i} onClick={() => handleSearch(h)} style={{ padding: "10px", cursor: "pointer", borderBottom: "1px solid #2a2e39", display: "flex", justifyContent: "space-between" }}><span style={{color: "#d1d4dc"}}>🕒 {h}</span>{pricesCache[h] && (<span style={{ color: pricesCache[h].color, fontSize: "13px", fontWeight: "bold" }}>{pricesCache[h].price} ({pricesCache[h].percent}%)</span>)}</div> ))} </div> )} {ticker.length >= 2 && suggestions.map(s => ( <div key={s.symbol} onClick={() => handleSearch(s.symbol)} style={{ padding: "12px", cursor: "pointer", borderBottom: "1px solid #2a2e39", display: "flex", justifyContent: "space-between" }}><div><span style={{fontWeight: "bold", color: "#2962ff"}}>{s.symbol}</span><span style={{color: "#787b86", fontSize: "12px", marginLeft: "10px"}}>{s.name}</span></div>{pricesCache[s.symbol] && (<span style={{ color: pricesCache[s.symbol].color, fontSize: "13px", fontWeight: "bold" }}>{pricesCache[s.symbol].price} ({pricesCache[s.symbol].percent}%)</span>)}</div> ))} </div> )}
                        </div>
                        {/* --- ROUNDED DROPDOWN --- */}
                        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} style={{ flex: "0 0 auto", padding: "14px 24px 14px 10px", borderRadius: "30px", border: "1px solid #2a2e39", backgroundColor: "#131722", color: "white", cursor: "pointer", fontSize: "13px", fontWeight: "500", appearance: "none", backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"10\" height=\"10\" viewBox=\"0 0 12 12\"><path fill=\"%23787b86\" d=\"M6 9L1 4h10z\"/></svg>')", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", width: "105px" }}><option value="1d">1 Day</option><option value="3d">3 Days</option><option value="5d">5 Days</option><option value="7d">7 Days</option><option value="15d">15 Days</option><option value="30d">30 Days</option></select>
                        {/* --- ROUNDED BUTTON --- */}
                        <button onClick={() => handleSearch()} disabled={loading} style={{ flex: "0 0 auto", padding: "14px 28px", background: "#2962ff", color: "white", border: "none", borderRadius: "30px", cursor: "pointer", fontWeight: "bold", fontSize: "14px", whiteSpace: "nowrap" }}>Search</button>
                    </div>
                </div>

                {/* Live Stock Ticker Tape */}
                <TickerTape 
                    region={selectedRegions.includes('INDIA') ? 'INDIA' : selectedRegions.includes('USA') ? 'USA' : 'INDIA'} 
                    onStockClick={(symbol) => {
                        setTicker(symbol);
                        setSearchedTicker(symbol);
                        setShowSuggestions(false);
                        setLoading(true);
                        setView("dashboard");
                    }} 
                />

                {/* Market Dashboard - Shown on homepage only */}
                {!searchedTicker && (
                    <div style={{ marginBottom: "30px" }}>
                        <MarketDashboard apiBaseUrl={API_BASE_URL} />
                    </div>
                )}

                {searchedTicker ? (
                    <>
                        <div style={{ marginBottom: "20px", display: "flex", alignItems: "baseline", gap: "15px" }}> 
                            <h1 style={{ margin: 0, color: "white", fontSize: "36px" }}>{currentQuote?.price} <span style={{fontSize: "16px", color: "#787b86"}}>{currentQuote?.currency}</span></h1> 
                            <span style={{ fontSize: "20px", fontWeight: "bold", color: currentQuote?.change >= 0 ? "#00e676" : "#ff1744" }}>{currentQuote?.change > 0 ? "+" : ""}{currentQuote?.change} ({currentQuote?.percent}%)</span> 
                            {/* --- BELL ICON FEATURE --- */}
                            <BellIcon active={notifications.includes(searchedTicker)} onClick={() => toggleNotification(searchedTicker)} />
                        </div>

                        {/* --- 3-COLUMN LAYOUT --- */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "20px" }}>
                            
                            {/* COLUMN 1: GRAPHS */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                <div style={{ backgroundColor: "#1e222d", padding: "20px", borderRadius: "4px", border: "1px solid #2a2e39", position: "relative", cursor: "pointer", transition: "all 0.3s ease" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#2962ff"; e.currentTarget.style.boxShadow = "0 0 20px rgba(41, 98, 255, 0.3)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2a2e39"; e.currentTarget.style.boxShadow = "none"; }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}> 
                                        <div>
                                            <h4 style={{ margin: 0, color: "#d1d4dc", display: "flex", alignItems: "center", gap: "8px" }}>
                                                📊 {searchedTicker} Price Action
                                                {currentQuote && (
                                                    <span style={{ fontSize: "14px", fontWeight: "normal", color: currentQuote.changePercent >= 0 ? "#00e676" : "#ff1744" }}>
                                                        {currentQuote.changePercent >= 0 ? "▲" : "▼"} {Math.abs(currentQuote.changePercent).toFixed(2)}%
                                                    </span>
                                                )}
                                            </h4>
                                            <p style={{ fontSize: "10px", color: "#787b86", margin: "4px 0 0 0" }}>Click chart or button for advanced view</p>
                                        </div>
                                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}> 
                                            <div style={{ display: "flex", gap: "5px" }}> 
                                                {['1d', '5d', '1mo', '6mo', '1y'].map(r => <button key={r} onClick={(e) => { e.stopPropagation(); setChartRange(r); }} style={{ padding: "4px 12px", borderRadius: "4px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "bold", backgroundColor: chartRange === r ? "#2962ff" : "#2a2e39", color: chartRange === r ? "white" : "#787b86", transition: "all 0.2s" }}>{r.toUpperCase()}</button>)} 
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); setShowAdvancedChart(true); }} style={{ padding: "8px 16px", borderRadius: "4px", border: "1px solid #2962ff", cursor: "pointer", fontSize: "12px", fontWeight: "bold", backgroundColor: "transparent", color: "#2962ff", transition: "all 0.3s", display: "flex", alignItems: "center", gap: "6px" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#2962ff"; e.currentTarget.style.color = "white"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#2962ff"; }}>
                                                📈 Advanced Chart
                                            </button>
                                        </div>
                                    </div> 
                                    <div onClick={() => setShowAdvancedChart(true)}>
                                        <ResponsiveContainer width="100%" height={300}> 
                                            <ComposedChart data={candleData}>
                                                <defs>
                                                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#2962ff" stopOpacity={0.3} />
                                                        <stop offset="100%" stopColor="#2962ff" stopOpacity={0.05} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2e39" opacity={0.5} />
                                                <XAxis dataKey="date" tick={{fontSize: 11, fill: "#787b86"}} axisLine={false} tickLine={false} tickFormatter={(value) => { const date = new Date(value); return `${date.getMonth() + 1}/${date.getDate()}`; }} />
                                                <YAxis domain={['auto', 'auto']} tick={{fontSize: 11, fill: "#787b86"}} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value.toFixed(0)}`} />
                                                <Tooltip content={<CustomCandleTooltip />} />
                                                <Bar dataKey="close" shape={<Candle />} />
                                                {candleData.length > 0 && <Line type="monotone" dataKey="close" stroke="#2962ff" strokeWidth={1.5} dot={false} strokeOpacity={0.3} />}
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", padding: "8px 12px", backgroundColor: "#131722", borderRadius: "4px" }}>
                                        <div style={{ fontSize: '11px', color: '#787b86' }}>
                                            💡 Real-time OHLC data • Volume analysis • Technical indicators
                                        </div>
                                        {candleData.length > 0 && (
                                            <div style={{ fontSize: '11px', color: '#d1d4dc', fontWeight: "bold" }}>
                                                {candleData.length} candles
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* PREDICTIVE ANALYSIS GRAPH */}
                                <div style={{ backgroundColor: "#1e222d", padding: "20px", borderRadius: "4px", border: "1px solid #2a2e39", position: "relative" }}>
                                     <h4 style={{ color: "#d1d4dc", marginBottom: "15px" }}>📈 Predictive Analysis (Forecast +15 Days)</h4>
                                     <ResponsiveContainer width="100%" height={280}>
                                        <ComposedChart data={predictiveData}>
                                            <defs>
                                                <linearGradient id="bandGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#00e676" stopOpacity={0.25} />
                                                    <stop offset="100%" stopColor="#00e676" stopOpacity={0.05} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid stroke="#2a2e39" opacity={0.3} vertical={false} strokeDasharray="3 3" />
                                            <XAxis 
                                                dataKey="date" 
                                                tick={{fontSize: 10, fill: "#787b86"}} 
                                                tickFormatter={(value) => {
                                                    const date = new Date(value);
                                                    return `${date.getMonth() + 1}/${date.getDate()}`;
                                                }}
                                                minTickGap={40}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis 
                                                domain={['auto', 'auto']} 
                                                tick={{fontSize: 10, fill: "#787b86"}}
                                                axisLine={false}
                                                tickLine={false}
                                                tickFormatter={(value) => value.toFixed(2)}
                                            />
                                            <Tooltip 
                                                contentStyle={{backgroundColor: "#131722", border: "1px solid #2a2e39", borderRadius: "4px"}} 
                                                labelStyle={{color: '#d1d4dc', fontWeight: "bold"}}
                                                formatter={(value, name) => {
                                                    if (name === 'predicted') return [value?.toFixed(2), 'Predicted'];
                                                    if (name === 'upper') return [value?.toFixed(2), 'Upper Bound'];
                                                    if (name === 'lower') return [value?.toFixed(2), 'Lower Bound'];
                                                    return [value?.toFixed(2), name];
                                                }}
                                            />
                                            <Legend 
                                                verticalAlign="top" 
                                                height={36}
                                                iconType="line"
                                                wrapperStyle={{fontSize: "11px"}}
                                            />
                                            
                                            <Area type="monotone" dataKey="upper" stroke="none" fill="url(#bandGradient)" fillOpacity={0.4} />
                                            <Line type="monotone" dataKey="predicted" stroke="#00e676" strokeWidth={2.5} dot={false} name="Prediction" />
                                            <Line type="monotone" dataKey="upper" stroke="#69f0ae" strokeWidth={1.5} strokeDasharray="5 5" dot={false} opacity={0.6} name="Upper" />
                                            <Line type="monotone" dataKey="lower" stroke="#69f0ae" strokeWidth={1.5} strokeDasharray="5 5" dot={false} opacity={0.6} name="Lower" />
                                            
                                            <ReferenceLine 
                                                x={predictiveData.find(d => d.isPrediction)?.date} 
                                                stroke="#ff1744" 
                                                strokeWidth={2}
                                                strokeDasharray="3 3" 
                                                label={{ value: 'TODAY', position: 'top', fill: '#ff1744', fontSize: 11, fontWeight: "bold" }} 
                                            />
                                        </ComposedChart>
                                     </ResponsiveContainer>
                                     
                                     {predictionModel && (
                                        <div style={{ marginTop: "15px", borderTop: "1px solid #2a2e39", paddingTop: "15px" }}>
                                            <h5 style={{ color: "#d1d4dc", fontSize: "13px", marginBottom: "10px", fontWeight: "600" }}>🔮 Model Analysis</h5>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "11px" }}>
                                                <div style={{ padding: "8px", backgroundColor: "#131722", borderRadius: "4px", borderLeft: `3px solid ${predictionModel.trend === 'Uptrend' ? '#00e676' : predictionModel.trend === 'Downtrend' ? '#ff1744' : '#FFD700'}` }}>
                                                    <span style={{ color: "#787b86" }}>Trend:</span>
                                                    <div style={{ color: predictionModel.trend === 'Uptrend' ? '#00e676' : predictionModel.trend === 'Downtrend' ? '#ff1744' : '#FFD700', fontWeight: "bold", fontSize: "13px" }}>{predictionModel.trend}</div>
                                                </div>
                                                <div style={{ padding: "8px", backgroundColor: "#131722", borderRadius: "4px", borderLeft: `3px solid ${parseFloat(predictionModel.momentum) > 0 ? '#00e676' : '#ff1744'}` }}>
                                                    <span style={{ color: "#787b86" }}>Momentum:</span>
                                                    <div style={{ color: parseFloat(predictionModel.momentum) > 0 ? '#00e676' : '#ff1744', fontWeight: "bold", fontSize: "13px" }}>{predictionModel.momentum}%</div>
                                                </div>
                                                <div style={{ padding: "8px", backgroundColor: "#131722", borderRadius: "4px", borderLeft: "3px solid #2962ff" }}>
                                                    <span style={{ color: "#787b86" }}>Confidence:</span>
                                                    <div style={{ color: "#2962ff", fontWeight: "bold", fontSize: "13px" }}>{predictionModel.confidence}</div>
                                                </div>
                                                <div style={{ padding: "8px", backgroundColor: "#131722", borderRadius: "4px", borderLeft: "3px solid #787b86" }}>
                                                    <span style={{ color: "#787b86" }}>Volatility:</span>
                                                    <div style={{ color: "#d1d4dc", fontWeight: "bold", fontSize: "13px" }}>${predictionModel.volatility}</div>
                                                </div>
                                            </div>
                                            <div style={{ marginTop: "10px", padding: "10px", backgroundColor: "#2962ff15", borderRadius: "4px", border: "1px solid #2962ff50" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                                                    <span style={{ color: "#787b86", fontSize: "11px" }}>15-Day Forecast:</span>
                                                    <span style={{ color: "#2962ff", fontWeight: "700", fontSize: "15px" }}>${predictionModel.prediction15d}</span>
                                                </div>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <span style={{ color: "#787b86", fontSize: "11px" }}>Expected Change:</span>
                                                    <span style={{ color: parseFloat(predictionModel.expectedChange) > 0 ? '#00e676' : '#ff1744', fontWeight: "700", fontSize: "15px" }}>
                                                        {parseFloat(predictionModel.expectedChange) > 0 ? '+' : ''}{predictionModel.expectedChange}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div style={{ marginTop: "8px", textAlign: "center", fontSize: "10px", color: "#787b86" }}>
                                                📊 Based on Linear Regression + Momentum + Mean Reversion
                                            </div>
                                        </div>
                                     )}
                                </div>
                            </div>

                            {/* COLUMN 2: NEWS (WITH SEARCH & WATCH LATER) */}
                            <div className="custom-scroll" style={{ backgroundColor: "#1e222d", padding: "20px", borderRadius: "4px", border: "1px solid #2a2e39", maxHeight: "800px", overflowY: "auto" }}>
                                <div style={{position: "sticky", top: 0, backgroundColor: "#1e222d", zIndex: 10, paddingBottom: '10px'}}>
                                    <h3 style={{ borderLeft: "4px solid #2962ff", paddingLeft: "15px", color: "#d1d4dc", marginBottom: "10px" }}>Latest News</h3>
                                    {/* NEWS SEARCH BAR */}
                                    <input type="text" placeholder="Filter News..." value={newsSearch} onChange={(e) => setNewsSearch(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #2a2e39', backgroundColor: '#131722', color: 'white', marginBottom: '10px' }} />
                                </div>
                                {filteredNews.map((article, index) => ( 
                                    <div key={index} className="news-card" style={{ borderLeft: getBorderColor(article.sentiment), padding: "20px", marginBottom: "15px", backgroundColor: "#131722", borderRadius: "4px", border: "1px solid #2a2e39" }}> 
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}> 
                                            <span style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: article.sentiment === 'positive' ? '#00e676' : article.sentiment === 'negative' ? '#ff1744' : '#651fff' }}>{article.sentiment}</span> 
                                            <span style={{ fontSize: "12px", color: "#787b86" }}>{new Date(article.publishedAt).toLocaleDateString()}</span> 
                                            {/* THREE DOTS MENU */}
                                            <div style={{position: 'relative'}}>
                                                <MoreIcon onClick={() => setActiveMenu(activeMenu === index ? null : index)} />
                                                {activeMenu === index && (
                                                    <div className="menu-dropdown">
                                                        <div className="menu-item" onClick={() => toggleWatchLater(article)}>
                                                            {watchLater.some(w => w.title === article.title) ? "Remove Watch Later" : "Watch Later"}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div> 
                                        <h3 style={{ margin: "0 0 5px 0", fontSize: "16px" }}><a href={article.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "#d1d4dc" }}>{article.title}</a></h3> 
                                    </div> 
                                ))}
                            </div>

                            {/* COLUMN 3: SENTIMENT */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                <div style={{ backgroundColor: "#1e222d", padding: "20px", borderRadius: "4px", border: "1px solid #2a2e39", textAlign: "center" }}> 
                                    <h4 style={{ color: "#d1d4dc", marginBottom: "20px" }}>News Sentiment</h4> 
                                    <div style={{display: "flex", justifyContent: "center"}}>
                                        <PieChart width={250} height={250}> 
                                            <Pie data={activeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"> {activeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)} </Pie> 
                                            <Tooltip contentStyle={{backgroundColor: "#1e222d", borderColor: "#2a2e39", color: "#ffffff"}} itemStyle={{color: "#ffffff"}} /> <Legend /> 
                                        </PieChart> 
                                    </div>
                                </div>
                                <SentimentGauge data={mergedData} newsCounts={sentimentCounts} />
                            </div>

                        </div>
                    </>
                ) : (
                    <div>
                        <h2 style={{color: "white", marginBottom: "20px", borderLeft: "4px solid #2962ff", paddingLeft: "15px"}}>🔥 Trending Market Headlines</h2>
                        {/* GENERAL NEWS SEARCH + CATEGORY FILTERS */}
                        <div style={{ marginBottom: '14px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                {[
                                    { key: 'all', label: 'All (Main Mix)' },
                                    { key: 'gold', label: 'Gold' },
                                    { key: 'stocks', label: 'Stocks' },
                                    { key: 'mutual_fund', label: 'Mutual Funds' },
                                    { key: 'crypto', label: 'Crypto Currencies' },
                                    { key: 'real_estate', label: 'Real Estate' },
                                ].map(c => (
                                    <button key={c.key} onClick={() => setNewsCategory(c.key)} style={{ padding: '8px 12px', borderRadius: '20px', border: newsCategory === c.key ? '1px solid #2962ff' : '1px solid #2a2e39', background: newsCategory === c.key ? '#233759' : '#1e222d', color: 'white', cursor: 'pointer', fontSize: '13px' }}>{c.label}</button>
                                ))}
                            </div>
                            <div style={{ marginLeft: 'auto' }}>
                                <input type="text" placeholder="Search Headlines..." value={newsSearch} onChange={(e) => setNewsSearch(e.target.value)} style={{ padding: '10px', width: '300px', borderRadius: '30px', border: '1px solid #2a2e39', backgroundColor: '#1e222d', color: 'white' }} />
                            </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "20px" }}>
                            {filteredGeneralNews.map((article, index) => {
                                const articleCat = classifyArticleCategory(article);
                                const entityInfo = inferEntityInfo(article, articleCat);
                                const categoryBadge = getCategoryBadge(articleCat);
                                return (
                                    <div key={index} className="news-card" style={{ backgroundColor: "#1e222d", borderRadius: "8px", border: "1px solid #2a2e39", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                        <div>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", padding: "4px 8px", borderRadius: "4px", backgroundColor: getBorderColor(article.sentiment).split(' ')[2] === '#00e676' ? 'rgba(0, 230, 118, 0.2)' : getBorderColor(article.sentiment).split(' ')[2] === '#ff1744' ? 'rgba(255, 23, 68, 0.2)' : 'rgba(255, 215, 0, 0.2)', color: getBorderColor(article.sentiment).split(' ')[2] }}>{article.sentiment}</span>
                                                    <span style={{ fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '12px', backgroundColor: categoryBadge.bg, color: categoryBadge.color, border: `1px solid ${categoryBadge.color}40`, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <span>{categoryBadge.icon}</span>
                                                        <span>{categoryBadge.label}</span>
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <span style={{ fontSize: "11px", color: "#787b86" }}>{new Date(article.publishedAt).toLocaleDateString()}</span>
                                                    <div style={{position: 'relative'}}>
                                                        <MoreIcon onClick={() => setActiveMenu(activeMenu === `gen-${index}` ? null : `gen-${index}`)} />
                                                        {activeMenu === `gen-${index}` && (
                                                            <div className="menu-dropdown">
                                                                <div className="menu-item" onClick={() => toggleWatchLater(article)}>
                                                                    {watchLater.some(w => w.title === article.title) ? "Remove Watch Later" : "Watch Later"}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <h3 style={{ margin: "0 0 10px 0", fontSize: "17px", lineHeight: "1.5", fontWeight: "600" }}>
                                                <span style={{ color: "#d1d4dc" }}>{article.title}</span>
                                            </h3>
                                            <p style={{ fontSize: "13px", color: "#9ca3af", lineHeight: "1.6", marginBottom: "10px" }}>{article.description ? article.description.substring(0, 150) + "..." : "Click to read more."}</p>
                                            {entityInfo && ( <div style={{ marginTop: '10px', fontSize: '12px', padding: '6px 10px', backgroundColor: 'rgba(41, 98, 255, 0.1)', borderLeft: '3px solid #2962ff', borderRadius: '4px', color: '#9fb3ff' }}>📊 {entityInfo}</div> )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px', marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #2a2e39" }}>
                                            <button onClick={() => { setCurrentNewsIndex(index); setShowNewsReader(true); }} style={{ flex: 1, padding: "10px 20px", borderRadius: "6px", border: "none", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", fontSize: "13px", fontWeight: "bold", cursor: "pointer", transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                                                <span>📖</span>
                                                <span>Read Now</span>
                                            </button>
                                            <a href={article.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "10px 20px", borderRadius: "6px", border: "1px solid #2962ff", background: "transparent", color: "#2962ff", fontSize: "13px", fontWeight: "bold", textDecoration: "none", textAlign: "center", transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2962ff'; e.currentTarget.style.color = 'white'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#2962ff'; }}>
                                                <span>🔗</span>
                                                <span>Full Article</span>
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                
                {/* COMPANY DETAILS SECTION - SHOWS BELOW SEARCH RESULTS */}
                {searchedTicker && (
                    <CompanyDetails ticker={searchedTicker} apiBaseUrl={API_BASE_URL} />
                )}
            </main>
        </div>
      )}
      <footer style={{ backgroundColor: "#1e222d", borderTop: "1px solid #2a2e39", padding: "60px 20px", marginTop: "auto" }}> 
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "40px" }}> 
          <div style={{ maxWidth: "300px" }}> 
            <h2 style={{ fontSize: "24px", color: "#ffffff", marginBottom: "15px" }}><span style={{ color: "#2962ff" }}>KRYPTONAX</span></h2> 
            <p style={{ color: "#787b86", fontSize: "14px", lineHeight: "1.6" }}>The #1 financial intelligence platform for students and professionals. Real-time data, AI sentiment analysis, and institutional-grade charting in one place.</p> 
          </div> 
          <div style={{ display: "flex", gap: "60px", flexWrap: "wrap" }}> 
            <div> 
              <h4 style={{ color: "white", marginBottom: "20px" }}>Product</h4> 
              <ul style={{ listStyle: "none", padding: 0, color: "#787b86", fontSize: "14px", lineHeight: "2.5" }}> 
                <li>Charting</li> 
                <li>AI Sentiment</li> 
                <li>Screeners</li> 
                <li>Pricing</li> 
              </ul> 
            </div> 
          </div> 
        </div>

        <div style={{ textAlign: "center", borderTop: "1px solid #2a2e39", marginTop: "40px", paddingTop: "20px", color: "#555", fontSize: "12px" }}>
          &copy; 2024 Kryptonax Financial Inc. All rights reserved. Data provided by Yahoo Finance & NewsAPI.
        </div> 
      </footer>

      {/* --- FLOATING ACTION BUTTON (ChatBot FAB) --- */}
      <button
        onClick={() => setShowChatBot(true)}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #4FACFE 0%, #00B4DB 100%)',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          boxShadow: '0 6px 25px rgba(79, 172, 254, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.boxShadow = '0 8px 35px rgba(79, 172, 254, 0.7)';
          e.target.style.transform = 'scale(1.1) translateY(-3px)';
        }}
        onMouseLeave={(e) => {
          e.target.style.boxShadow = '0 6px 25px rgba(79, 172, 254, 0.5)';
          e.target.style.transform = 'scale(1) translateY(0)';
        }}
      >
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="white"/>
          <circle cx="8" cy="10" r="1.5" fill="#4FACFE"/>
          <circle cx="12" cy="10" r="1.5" fill="#4FACFE"/>
          <circle cx="16" cy="10" r="1.5" fill="#4FACFE"/>
        </svg>
      </button>

      {/* --- CHATBOT MODAL --- */}
      <ChatBot
        isOpen={showChatBot}
        onClose={() => setShowChatBot(false)}
        apiBaseUrl={API_BASE_URL}
        ticker={searchedTicker}
      />

      {/* --- NEWS READER MODAL --- */}
      {showNewsReader && filteredGeneralNews[currentNewsIndex] && (
        <div onClick={() => setShowNewsReader(false)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.9)", zIndex: 10001, display: "flex", justifyContent: "center", alignItems: "center", padding: "20px", backdropFilter: "blur(5px)" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "#1e222d", borderRadius: "16px", width: "100%", maxWidth: "800px", maxHeight: "90vh", position: "relative", overflow: "hidden", boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)", border: "1px solid #2a2e39" }}>
            {/* Header */}
            <div style={{ backgroundColor: "#131722", padding: "20px 30px", borderBottom: "1px solid #2a2e39", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <div style={{ fontSize: "28px" }}>📰</div>
                <div>
                  <h3 style={{ margin: 0, color: "#d1d4dc", fontSize: "18px", fontWeight: "600" }}>
                    News Reader
                  </h3>
                  <p style={{ margin: "3px 0 0 0", fontSize: "12px", color: "#787b86" }}>
                    Article {currentNewsIndex + 1} of {filteredGeneralNews.length}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowNewsReader(false)} style={{ background: "none", border: "none", color: "#787b86", fontSize: "32px", cursor: "pointer", padding: "0", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "4px", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#2a2e39"; e.currentTarget.style.color = "#ffffff"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#787b86"; }}>
                ×
              </button>
            </div>
            
            {/* Content */}
            <div style={{ padding: "30px", maxHeight: "calc(90vh - 200px)", overflowY: "auto" }}>
              {(() => {
                const article = filteredGeneralNews[currentNewsIndex];
                const articleCat = classifyArticleCategory(article);
                const categoryBadge = getCategoryBadge(articleCat);
                const entityInfo = inferEntityInfo(article, articleCat);
                
                return (
                  <>
                    {/* Category and Sentiment Badges */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', padding: '6px 14px', borderRadius: '20px', backgroundColor: categoryBadge.bg, color: categoryBadge.color, border: `1px solid ${categoryBadge.color}40`, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{categoryBadge.icon}</span>
                        <span>{categoryBadge.label}</span>
                      </span>
                      <span style={{ fontSize: "12px", fontWeight: "600", padding: "6px 14px", borderRadius: "20px", backgroundColor: getBorderColor(article.sentiment).split(' ')[2] === '#00e676' ? 'rgba(0, 230, 118, 0.2)' : getBorderColor(article.sentiment).split(' ')[2] === '#ff1744' ? 'rgba(255, 23, 68, 0.2)' : 'rgba(255, 215, 0, 0.2)', color: getBorderColor(article.sentiment).split(' ')[2] }}>
                        {article.sentiment === 'positive' ? '📈' : article.sentiment === 'negative' ? '📉' : '➖'} {article.sentiment}
                      </span>
                      <span style={{ fontSize: "12px", color: "#787b86", padding: "6px 14px", backgroundColor: "#2a2e39", borderRadius: "20px" }}>
                        🗓️ {new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 style={{ color: "#ffffff", fontSize: "24px", lineHeight: "1.4", margin: "0 0 20px 0", fontWeight: "700" }}>
                      {article.title}
                    </h2>

                    {/* Entity Info */}
                    {entityInfo && (
                      <div style={{ marginBottom: '20px', padding: '12px 16px', backgroundColor: 'rgba(41, 98, 255, 0.1)', borderLeft: '4px solid #2962ff', borderRadius: '6px' }}>
                        <div style={{ fontSize: '13px', color: '#9fb3ff', fontWeight: '500' }}>
                          📊 {entityInfo}
                        </div>
                      </div>
                    )}

                    {/* Image */}
                    {article.urlToImage && (
                      <div style={{ marginBottom: '25px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #2a2e39' }}>
                        <img 
                          src={article.urlToImage} 
                          alt={article.title}
                          style={{ width: '100%', height: 'auto', maxHeight: '400px', objectFit: 'cover' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    )}

                    {/* Description with more detail */}
                    <div style={{ fontSize: '16px', color: '#d1d4dc', lineHeight: '1.8', marginBottom: '25px' }}>
                      <p style={{ marginBottom: '15px', fontSize: '17px', fontWeight: '500' }}>{article.description || 'No description available.'}</p>
                      {article.content && article.content !== article.description && (
                        <p style={{ color: '#a1a7b4', fontSize: '15px', lineHeight: '1.7' }}>{article.content}</p>
                      )}
                      {!article.description && !article.content && (
                        <p style={{ color: '#787b86', fontStyle: 'italic' }}>Click "Read Full Article" below to view the complete story on the publisher's website.</p>
                      )}
                    </div>

                    {/* Additional Meta Info */}
                    {article.author && (
                      <div style={{ padding: '12px', backgroundColor: '#131722', borderRadius: '8px', marginBottom: '15px', border: '1px solid #2a2e39', fontSize: '13px' }}>
                        <span style={{ color: '#787b86' }}>Author: </span>
                        <span style={{ color: '#d1d4dc', fontWeight: '600' }}>{article.author}</span>
                      </div>
                    )}

                    {/* Source */}
                    {article.source?.name && (
                      <div style={{ padding: '15px', backgroundColor: '#131722', borderRadius: '8px', marginBottom: '20px', border: '1px solid #2a2e39' }}>
                        <div style={{ fontSize: '12px', color: '#787b86', marginBottom: '4px' }}>Source</div>
                        <div style={{ fontSize: '14px', color: '#d1d4dc', fontWeight: '600' }}>
                          📰 {article.source.name}
                        </div>
                      </div>
                    )}

                    {/* Read More Button */}
                    <a 
                      href={article.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '10px',
                        padding: '16px 24px', 
                        borderRadius: '10px', 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white', 
                        fontSize: '15px', 
                        fontWeight: 'bold',
                        textDecoration: 'none',
                        transition: 'all 0.3s',
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => { 
                        e.currentTarget.style.transform = 'translateY(-2px)'; 
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
                      }}
                      onMouseLeave={(e) => { 
                        e.currentTarget.style.transform = 'translateY(0)'; 
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                      }}
                    >
                      <span>🔗</span>
                      <span>Read Full Article on {article.source?.name || 'Publisher\'s Website'}</span>
                      <span>→</span>
                    </a>
                  </>
                );
              })()}
            </div>

            {/* Navigation Footer */}
            <div style={{ backgroundColor: "#131722", padding: "20px 30px", borderTop: "1px solid #2a2e39", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button 
                onClick={() => setCurrentNewsIndex(Math.max(0, currentNewsIndex - 1))}
                disabled={currentNewsIndex === 0}
                style={{ 
                  padding: "12px 24px", 
                  borderRadius: "8px", 
                  border: "1px solid #2962ff", 
                  background: currentNewsIndex === 0 ? "#2a2e39" : "transparent",
                  color: currentNewsIndex === 0 ? "#787b86" : "#2962ff",
                  fontSize: "14px", 
                  fontWeight: "600",
                  cursor: currentNewsIndex === 0 ? "not-allowed" : "pointer",
                  transition: "all 0.3s",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
                onMouseEnter={(e) => { if (currentNewsIndex !== 0) { e.currentTarget.style.backgroundColor = '#2962ff'; e.currentTarget.style.color = 'white'; } }}
                onMouseLeave={(e) => { if (currentNewsIndex !== 0) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#2962ff'; } }}
              >
                <span>←</span>
                <span>Previous</span>
              </button>

              <div style={{ fontSize: "13px", color: "#787b86", fontWeight: "500" }}>
                Swipe or use arrow keys to navigate
              </div>

              <button 
                onClick={() => setCurrentNewsIndex(Math.min(filteredGeneralNews.length - 1, currentNewsIndex + 1))}
                disabled={currentNewsIndex === filteredGeneralNews.length - 1}
                style={{ 
                  padding: "12px 24px", 
                  borderRadius: "8px", 
                  border: "1px solid #2962ff", 
                  background: currentNewsIndex === filteredGeneralNews.length - 1 ? "#2a2e39" : "transparent",
                  color: currentNewsIndex === filteredGeneralNews.length - 1 ? "#787b86" : "#2962ff",
                  fontSize: "14px", 
                  fontWeight: "600",
                  cursor: currentNewsIndex === filteredGeneralNews.length - 1 ? "not-allowed" : "pointer",
                  transition: "all 0.3s",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
                onMouseEnter={(e) => { if (currentNewsIndex !== filteredGeneralNews.length - 1) { e.currentTarget.style.backgroundColor = '#2962ff'; e.currentTarget.style.color = 'white'; } }}
                onMouseLeave={(e) => { if (currentNewsIndex !== filteredGeneralNews.length - 1) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#2962ff'; } }}
              >
                <span>Next</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADVANCED CHART MODAL --- */}
      {showAdvancedChart && (
        <div onClick={() => setShowAdvancedChart(false)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.85)", zIndex: 10000, display: "flex", justifyContent: "center", alignItems: "center", padding: "20px", backdropFilter: "blur(5px)" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "#131722", borderRadius: "8px", width: "100%", maxWidth: "1400px", height: "90vh", maxHeight: "900px", position: "relative", overflow: "hidden", boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)", border: "1px solid #2a2e39" }}>
            {/* Header */}
            <div style={{ backgroundColor: "#1e222d", padding: "20px", borderBottom: "1px solid #2a2e39", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, color: "#d1d4dc", fontSize: "20px", fontWeight: "600" }}>
                  \ud83d\udcc8 Advanced Chart - {searchedTicker}
                </h3>
                <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#787b86" }}>
                  Real-time professional charting powered by TradingView
                </p>
              </div>
              <button onClick={() => setShowAdvancedChart(false)} style={{ background: "none", border: "none", color: "#787b86", fontSize: "32px", cursor: "pointer", padding: "0", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "4px", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#2a2e39"; e.currentTarget.style.color = "#ffffff"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#787b86"; }}>
                \u00d7
              </button>
            </div>
            
            {/* TradingView Widget Container */}
            <div style={{ height: "calc(100% - 80px)", width: "100%", position: "relative" }}>
              <iframe
                src={`https://www.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${searchedTicker}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en&utm_source=www.tradingview.com&utm_medium=widget&utm_campaign=chart&utm_term=${searchedTicker}`}
                style={{ width: "100%", height: "100%", border: "none" }}
                title="TradingView Advanced Chart"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;





