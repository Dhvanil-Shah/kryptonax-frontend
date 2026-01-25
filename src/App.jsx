import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ComposedChart, Line, Bar, Brush, ReferenceLine } from 'recharts';
import ReactGA from "react-ga4";

// --- 1. INITIALIZE ANALYTICS ---
ReactGA.initialize("G-REEV9CZE52");

// --- CUSTOM SHAPE: CANDLESTICK ---
const Candle = (props) => {
  const { x, y, width, height, low, high, open, close } = props;
  const isGreen = close > open;
  // USING PALETTE: Up = Bright Blue (#587FFC), Down = Coral Pink (#FF8692)
  const color = isGreen ? "#587FFC" : "#FF8692"; 
  const yBottom = y + height;
  const yTop = y;
  
  return (
    <g stroke={color} fill={color} strokeWidth="2">
      <path d={`M ${x + width / 2},${yTop} L ${x + width / 2},${yBottom}`} />
      <rect x={x} y={y + height * 0.25} width={width} height={height * 0.5} fill={color} stroke="none" />
    </g>
  );
};

// --- HELPER: SIMULATE CANDLE DATA ---
const simulateCandles = (data) => {
    if (!data) return [];
    return data.map(d => {
        const close = d.price;
        const volatility = close * 0.02; 
        const open = close + (Math.random() - 0.5) * volatility;
        const high = Math.max(open, close) + Math.random() * volatility;
        const low = Math.min(open, close) - Math.random() * volatility;
        return { ...d, open, high, low, close };
    });
};

// --- HELPER: GENERATE UNIQUE PREDICTIONS ---
const generateUniquePrediction = (historyData, ticker) => {
    if (!historyData || historyData.length === 0) return [];
    let seed = 0;
    for (let i = 0; i < ticker.length; i++) seed += ticker.charCodeAt(i);
    
    const lastPoint = historyData[historyData.length - 1];
    let lastPrice = lastPoint.price;
    const futureData = [];
    const trendDirection = (seed % 2 === 0) ? 1 : -1; 
    
    let lastDate = new Date(lastPoint.date);
    for (let i = 1; i <= 15; i++) {
        const nextDate = new Date(lastDate);
        nextDate.setDate(lastDate.getDate() + 1);
        const wave = Math.sin(i * 0.5) * lastPrice * 0.02;
        const trend = i * lastPrice * 0.005 * trendDirection;
        const randomNoise = (Math.sin(seed * i) * lastPrice * 0.01);
        const predictedPrice = lastPrice + wave + trend + randomNoise;
        
        futureData.push({
            date: nextDate.toISOString().split('T')[0],
            predicted: predictedPrice,
            upper: predictedPrice * (1.05 + (i * 0.01)), 
            lower: predictedPrice * (0.95 - (i * 0.01)),
            isPrediction: true
        });
        lastDate = nextDate;
    }
    const past = historyData.map(d => ({ ...d, predicted: d.price, upper: d.price, lower: d.price }));
    return [...past, ...futureData];
};

// --- FLUID GAUGE ---
const SentimentGauge = ({ data, newsCounts }) => {
  const getFluidSentiment = () => {
    if (!data || data.length < 5) return { rotation: 0, text: "Analyzing...", color: "#E5EAF5" };
    const prices = data.map(d => d.price);
    const current = prices[prices.length - 1];
    const start = prices[0];
    const changePct = ((current - start) / start) * 100; 
    const pos = newsCounts.find(n => n.name === 'Positive')?.value || 0;
    const neg = newsCounts.find(n => n.name === 'Negative')?.value || 0;
    const newsScore = (pos - neg) * 2; 
    let totalScore = (changePct * 10) + newsScore; 
    const rotation = Math.max(-90, Math.min(90, totalScore * 3)); 
    let text = "Neutral", color = "#E5EAF5";
    
    // Using Palette for Sentiment Colors
    if (rotation > 45) { text = "Strong Buy"; color = "#587FFC"; }
    else if (rotation > 10) { text = "Buy"; color = "#92A5FD"; }
    else if (rotation < -45) { text = "Strong Sell"; color = "#FF8692"; }
    else if (rotation < -10) { text = "Sell"; color = "#ffb3ba"; }
    return { rotation, text, color };
  };
  const { rotation, text, color } = getFluidSentiment();
  return (
    <div style={{ backgroundColor: "#25256E", padding: "20px", borderRadius: "12px", border: "1px solid #587FFC", textAlign: "center", position: 'relative', height: '250px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <h4 style={{ color: "#E5EAF5", marginBottom: "0px" }}>Technical Analysis</h4>
      <p style={{ fontSize: "11px", color: "#92A5FD" }}>Fluid AI Calculation</p>
      <svg viewBox="0 0 200 120" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#1E1E5D" strokeWidth="15" strokeLinecap="round" />
        <path d="M 20 100 A 80 80 0 0 1 100 20" fill="none" stroke="url(#gradSell)" strokeWidth="15" strokeLinecap="round" />
        <path d="M 100 20 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gradBuy)" strokeWidth="15" strokeLinecap="round" />
        <defs>
            <linearGradient id="gradSell" x1="0%" y1="0%" x2="100%" y2="0%"> <stop offset="0%" stopColor="#FF8692" /> <stop offset="100%" stopColor="#E5EAF5" /> </linearGradient>
            <linearGradient id="gradBuy" x1="0%" y1="0%" x2="100%" y2="0%"> <stop offset="0%" stopColor="#E5EAF5" /> <stop offset="100%" stopColor="#587FFC" /> </linearGradient>
        </defs>
        <g transform={`rotate(${rotation}, 100, 100)`} style={{ transition: 'transform 0.5s ease-out' }}>
          <path d="M 100 100 L 100 25" stroke="white" strokeWidth="4" strokeLinecap="round" />
          <circle cx="100" cy="100" r="8" fill="#1E1E5D" stroke="white" strokeWidth="2" />
        </g>
        <text x="100" y="80" textAnchor="middle" fill={color} fontSize="22" fontWeight="bold" style={{textShadow: `0 0 15px ${color}`}}>{text}</text>
      </svg>
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
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  // PALETTE COLORS MAPPING
  // Pink, Blue, Light
  const COLORS = ['#587FFC', '#FF8692', '#E5EAF5']; 

  const styles = `
    .news-card { transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: default; }
    .news-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.3) !important; border-color: #FF8692 !important; }
    .search-icon:hover { stroke: #FF8692 !important; transform: translateY(-50%) scale(1.1); }
    .loading-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(30, 30, 93, 0.9); z-index: 9999; display: flex; justify-content: center; alignItems: center; backdrop-filter: blur(4px); }
    .spinner { width: 50px; height: 50px; border: 5px solid rgba(255, 255, 255, 0.1); border-left-color: #FF8692; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .custom-scroll::-webkit-scrollbar { width: 8px; }
    .custom-scroll::-webkit-scrollbar-track { background: #1E1E5D; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #587FFC; border-radius: 4px; }
    .custom-scroll::-webkit-scrollbar-thumb:hover { background: #FF8692; }
  `;

  useEffect(() => {
    document.body.style.margin = "0"; document.body.style.padding = "0"; document.body.style.backgroundColor = "#1E1E5D"; document.body.style.boxSizing = "border-box";
    fetchTrending(); fetchGeneralNews();
    if (token) { setIsAppLoading(true); fetchFavorites().finally(() => setIsAppLoading(false)); }
    const savedHistory = localStorage.getItem("searchHistory");
    if (savedHistory) setSearchHistory(JSON.parse(savedHistory));
    const lastTicker = localStorage.getItem("lastTicker");
    if (lastTicker) { setTicker(lastTicker); handleSearch(lastTicker); }
  }, [token]);

  useEffect(() => { if (!token) { const timer = setTimeout(() => setShowAuthModal(true), 2000); return () => clearTimeout(timer); } }, [token]);

  useEffect(() => {
    let interval = null;
    if (searchedTicker && view === "dashboard") { interval = setInterval(() => { fetchQuote(searchedTicker); if (chartRange === "1d") updateChart(searchedTicker, "1d", activeComparison); }, 5000); }
    return () => clearInterval(interval);
  }, [searchedTicker, chartRange, activeComparison, view]);

  useEffect(() => { if (searchedTicker && view === "dashboard") updateChart(searchedTicker, chartRange, activeComparison); }, [chartRange]); 

  // --- API CALLS ---
  const fetchGeneralNews = async () => { try { const res = await fetch(`https://kryptonax-backend.onrender.com/news/general`); setGeneralNews(await res.json()); } catch (e) {} };
  const handleAuth = async () => {
      setAuthError(""); setAuthSuccess(""); setIsAppLoading(true);
      try {
          if (authMode === "forgot") {
              if (forgotStep === 1) {
                  if (!username) throw new Error("Please enter your email.");
                  const res = await fetch("https://kryptonax-backend.onrender.com/forgot-password", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({username}) });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.detail || "Error sending OTP");
                  setAuthSuccess("OTP Sent! Check your Email & Mobile."); setForgotStep(2);
              } else if (forgotStep === 2) {
                  if (!otpCode || !password || !confirmPassword) throw new Error("Fill all fields.");
                  if (password !== confirmPassword) throw new Error("Passwords do not match.");
                  const res = await fetch("https://kryptonax-backend.onrender.com/reset-password", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({username, otp: otpCode, new_password: password}) });
                  if (!res.ok) throw new Error("Reset failed");
                  setAuthSuccess("Password Reset! Please Login."); setTimeout(() => { setAuthMode("login"); setForgotStep(1); setAuthSuccess(""); setPassword(""); setOtpCode(""); }, 2000);
              }
              setIsAppLoading(false); return;
          }
          if (!username || !password) throw new Error("Please fill in all required fields.");
          if (authMode === "register" && (password !== confirmPassword || !firstName || !mobile)) throw new Error("Check all fields.");
          const url = authMode === "login" ? "https://kryptonax-backend.onrender.com/token" : "https://kryptonax-backend.onrender.com/register";
          if (authMode === "register") {
             const payload = { username, password, first_name: firstName, last_name: lastName, mobile: mobile };
             const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
             if (!res.ok) throw new Error("Registration failed");
             setAuthMode("login"); setAuthSuccess("Account created!"); 
          } else {
              const formData = new FormData(); formData.append("username", username); formData.append("password", password);
              const res = await fetch(url, { method: "POST", body: formData });
              const data = await res.json();
              if (!res.ok) throw new Error("Invalid Credentials");
              setToken(data.access_token); setUserName(data.user_name);
              localStorage.setItem("token", data.access_token); localStorage.setItem("userName", data.user_name);
              setShowAuthModal(false); setUsername(""); setPassword("");
          }
      } catch (e) { setAuthError(e.message); } finally { setIsAppLoading(false); }
  };

  const logout = () => { setToken(null); setUserName(""); localStorage.removeItem("token"); localStorage.removeItem("userName"); setFavorites([]); };
  const handleReset = () => { setTicker(""); setSearchedTicker(""); setNews([]); setMergedData([]); setCurrentQuote(null); setCompareTicker(""); setActiveComparison(null); localStorage.removeItem("lastTicker"); setView("dashboard"); };
  const saveSearchHistory = (t) => { const newHistory = [t, ...searchHistory.filter(item => item !== t)].slice(0, 5); setSearchHistory(newHistory); localStorage.setItem("searchHistory", JSON.stringify(newHistory)); };
  const fetchBatchQuotes = async (tickersList) => { if (!tickersList?.length) return; try { const res = await fetch(`https://kryptonax-backend.onrender.com/api/quotes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(tickersList) }); const data = await res.json(); setPricesCache(prev => ({ ...prev, ...data })); } catch (e) {} };
  
  const handleSearch = async (overrideTicker = null) => { 
      const t = overrideTicker || ticker; if (!t) return; 
      setShowSuggestions(false); setTicker(t); setSearchedTicker(t); setLoading(true); setNews([]); setMergedData([]); setActiveComparison(null); setCompareTicker(""); setCurrentQuote(null); localStorage.setItem("lastTicker", t); saveSearchHistory(t); setView("dashboard"); 
      try { 
          fetchQuote(t); 
          const newsRes = await fetch(`https://kryptonax-backend.onrender.com/news/${t}?period=${timeRange}`); 
          setNews(await newsRes.json()); 
          setChartRange("1mo"); 
          await updateChart(t, "1mo", null); 
      } catch (error) { console.error(error); } 
      setLoading(false); 
  };
  const fetchQuote = async (symbol) => { try { const res = await fetch(`https://kryptonax-backend.onrender.com/quote/${symbol}`); setCurrentQuote(await res.json()); } catch (e) {} };
  const fetchHistoryData = async (symbol, range) => { try { const res = await fetch(`https://kryptonax-backend.onrender.com/history/${symbol}?period=${range}`); return await res.json(); } catch (e) { return {currency: "", data: []}; } };
  
  const updateChart = async (mainSym, range, compSym) => { 
      const mainRes = await fetchHistoryData(mainSym, range); setCurrency(mainRes.currency); 
      let finalData = mainRes.data; 
      if (compSym) { 
          const compRes = await fetchHistoryData(compSym, range); 
          const dataMap = new Map(); mainRes.data.forEach(item => dataMap.set(item.date, { date: item.date, price: item.price })); 
          compRes.data.forEach(item => { if (dataMap.has(item.date)) dataMap.get(item.date).comparePrice = item.price; else dataMap.set(item.date, { date: item.date, comparePrice: item.price }); }); 
          finalData = Array.from(dataMap.values()).sort((a,b) => a.date.localeCompare(b.date)); 
      } 
      setMergedData(finalData);
      setCandleData(simulateCandles(finalData)); 
      setPredictiveData(generateUniquePrediction(finalData, mainSym)); 
  };
  const handleComparisonSearch = async () => { if (!compareTicker) return; setActiveComparison(compareTicker); await updateChart(searchedTicker, chartRange, compareTicker); };
  const clearComparison = () => { setActiveComparison(null); setCompareTicker(""); updateChart(searchedTicker, chartRange, null); };
  const onSearchFocus = () => { setShowSuggestions(true); if (searchHistory.length > 0) fetchBatchQuotes(searchHistory); };
  const fetchSuggestions = async (query, isFav = false) => { if (query.length < 2) { if (isFav) setFavSuggestions([]); else setSuggestions([]); return; } try { const res = await fetch(`https://kryptonax-backend.onrender.com/api/search/${query}`); const data = await res.json(); if (isFav) setFavSuggestions(data); else { setSuggestions(data); fetchBatchQuotes(data.map(s => s.symbol)); } } catch (e) { } };
  const fetchTrending = async () => { try { const res = await fetch(`https://kryptonax-backend.onrender.com/trending`); setTrending(await res.json()); } catch (e) {} };
  const fetchFavorites = async () => { try { const res = await fetch(`https://kryptonax-backend.onrender.com/favorites`, { headers: { "Authorization": `Bearer ${token}` } }); if (res.ok) setFavorites(await res.json()); } catch (e) {} };
  const toggleFavorite = async (t) => { if (!token) { setShowAuthModal(true); return; } if (!t) return; const isFav = favorites.some(f => f.ticker === t); const method = isFav ? "DELETE" : "POST"; await fetch(`https://kryptonax-backend.onrender.com/favorites/${t}`, { method, headers: { "Authorization": `Bearer ${token}` } }); fetchFavorites(); setNewFav(""); setShowFavSuggestions(false); };
  const getBorderColor = (s) => (s === "positive" ? "4px solid #587FFC" : s === "negative" ? "4px solid #FF8692" : "1px solid #E5EAF5");
  const sentimentCounts = [ { name: 'Positive', value: news.filter(n => n.sentiment === 'positive').length }, { name: 'Negative', value: news.filter(n => n.sentiment === 'negative').length }, { name: 'Neutral', value: news.filter(n => n.sentiment === 'neutral' || !n.sentiment).length } ];
  const activeData = sentimentCounts.filter(item => item.value > 0);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "#1E1E5D", minHeight: "100vh", color: "#E5EAF5", display: "flex", flexDirection: "column" }}>
      <style>{styles}</style>
      {(isAppLoading || loading) && ( <div className="loading-overlay"> <div className="spinner"></div> </div> )}

      <nav style={{ backgroundColor: "#25256E", padding: "15px 40px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid #587FFC", position: "sticky", top: 0, zIndex: 1000 }}>
        <div style={{ fontSize: "24px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "20px" }}><span onClick={() => setView("dashboard")} style={{cursor: "pointer"}}><span style={{ color: "#FF8692" }}>KRYPTONAX</span> | <span style={{fontSize: "16px", fontWeight: "normal", color: "#92A5FD"}}>Financial Intelligence</span></span>{searchedTicker && view === "dashboard" && <button onClick={handleReset} style={{ fontSize: "14px", padding: "5px 15px", backgroundColor: "#1E1E5D", border: "1px solid #92A5FD", color: "#E5EAF5", borderRadius: "4px", cursor: "pointer" }}>← Back to Home</button>}</div>
        <div style={{display: "flex", alignItems: "center", gap: "25px"}}><span onClick={() => setView("about")} style={{cursor: "pointer", color: view === "about" ? "#FF8692" : "#E5EAF5", fontWeight: "bold", transition: "0.2s"}}>About Us</span>{userName && <span style={{color: "#587FFC", fontWeight: "bold"}}>Hi, {userName}</span>}{token ? ( <button onClick={logout} style={{ background: "#FF8692", color: "white", padding: "8px 20px", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Logout</button> ) : ( <button onClick={() => setShowAuthModal(true)} style={{ background: "#587FFC", color: "white", padding: "8px 20px", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Login / Sign Up</button> )}</div>
      </nav>

      {/* --- AUTH MODAL --- */}
      {showAuthModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(30, 30, 93, 0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
            <div style={{ backgroundColor: "#25256E", padding: "40px", borderRadius: "8px", border: "1px solid #587FFC", width: "400px", textAlign: "center", position: "relative" }}>
                <button onClick={() => {setShowAuthModal(false); setAuthMode("login"); setForgotStep(1);}} style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", color: "#92A5FD", fontSize: "20px", cursor: "pointer" }}>✕</button>
                <h2 style={{ color: "#E5EAF5", marginTop: 0 }}>{authMode === "login" ? "Welcome Back" : authMode === "register" ? "Create Account" : "Reset Password"}</h2>
                {authError && <p style={{color: "#FF8692", fontSize: "14px"}}>{authError}</p>}
                {authSuccess && <p style={{color: "#587FFC", fontSize: "14px"}}>{authSuccess}</p>}
                
                {authMode === "forgot" ? (
                    <>
                        {forgotStep === 1 ? ( <><input type="text" placeholder="Email Address" value={username} onChange={e => setUsername(e.target.value)} style={{ width: "95%", padding: "10px", margin: "5px 0", backgroundColor: "#1E1E5D", border: "1px solid #587FFC", color: "#E5EAF5", borderRadius: "4px" }} /><button onClick={handleAuth} style={{ width: "100%", padding: "12px", background: "#FF8692", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", marginTop: "15px" }}>Send OTP</button></> ) : ( <><input type="text" placeholder="Enter 6-Digit OTP" value={otpCode} onChange={e => setOtpCode(e.target.value)} style={{ width: "95%", padding: "10px", margin: "5px 0", backgroundColor: "#1E1E5D", border: "1px solid #587FFC", color: "#E5EAF5", borderRadius: "4px", textAlign: "center", letterSpacing: "5px", fontWeight: "bold" }} /><input type="password" placeholder="New Password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: "95%", padding: "10px", backgroundColor: "#1E1E5D", border: "1px solid #587FFC", color: "#E5EAF5", borderRadius: "4px", marginTop: "5px" }} /><input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ width: "95%", padding: "10px", backgroundColor: "#1E1E5D", border: "1px solid #587FFC", color: "#E5EAF5", borderRadius: "4px", marginTop: "5px" }} /><button onClick={handleAuth} style={{ width: "100%", padding: "12px", background: "#FF8692", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", marginTop: "15px" }}>Reset Password</button></> )}
                        <p style={{ fontSize: "12px", color: "#92A5FD", marginTop: "15px", cursor: "pointer" }} onClick={() => { setAuthMode("login"); setForgotStep(1); }}>Back to Login</p>
                    </>
                ) : (
                    <>
                        {authMode === "register" && ( 
                            <>
                                <div style={{display: "flex", gap: "10px"}}>
                                    <input type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} style={{ width: "50%", padding: "10px", margin: "5px 0", backgroundColor: "#1E1E5D", border: "1px solid #587FFC", color: "#E5EAF5", borderRadius: "4px" }} />
                                    <input type="text" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} style={{ width: "50%", padding: "10px", margin: "5px 0", backgroundColor: "#1E1E5D", border: "1px solid #587FFC", color: "#E5EAF5", borderRadius: "4px" }} />
                                </div>
                                <input type="text" placeholder="Mobile Number" value={mobile} onChange={e => setMobile(e.target.value)} style={{ width: "95%", padding: "10px", margin: "5px 0", backgroundColor: "#1E1E5D", border: "1px solid #587FFC", color: "#E5EAF5", borderRadius: "4px" }} />
                            </>
                        )}
                        <input type="text" placeholder="Email (Username)" value={username} onChange={e => setUsername(e.target.value)} style={{ width: "95%", padding: "10px", margin: "5px 0", backgroundColor: "#1E1E5D", border: "1px solid #587FFC", color: "#E5EAF5", borderRadius: "4px" }} />
                        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: "95%", padding: "10px", backgroundColor: "#1E1E5D", border: "1px solid #587FFC", color: "#E5EAF5", borderRadius: "4px", marginTop: "5px" }} />
                        {authMode === "register" && <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ width: "95%", padding: "10px", backgroundColor: "#1E1E5D", border: "1px solid #587FFC", color: "#E5EAF5", borderRadius: "4px", marginTop: "5px" }} />}
                        
                        {authMode === "login" && <p style={{ fontSize: "12px", color: "#FF8692", cursor: "pointer", textAlign: "right", marginTop: "5px" }} onClick={() => { setAuthMode("forgot"); setAuthError(""); }}>Forgot Password?</p>}
                        
                        <button onClick={handleAuth} style={{ width: "100%", padding: "12px", background: "#FF8692", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", marginTop: "15px" }}>{authMode === "login" ? "Login" : "Sign Up"}</button>
                        <p style={{ fontSize: "12px", color: "#92A5FD", marginTop: "20px", cursor: "pointer" }} onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthError(""); }}>{authMode === "login" ? "Don't have an account? Sign Up" : "Already have an account? Login"}</p>
                    </>
                )}
            </div>
        </div>
      )}

      {showAboutModal && ( <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(30, 30, 93, 0.9)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 }}> <div style={{ backgroundColor: "#25256E", padding: "50px", borderRadius: "12px", border: "1px solid #587FFC", width: "700px", color: "#E5EAF5", position: "relative" }}> <button onClick={() => setShowAboutModal(false)} style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: "#E5EAF5", fontSize: "24px", cursor: "pointer" }}>✕</button> <h1 style={{ color: "#FF8692", textAlign: "center", marginBottom: "30px" }}>About Kryptonax</h1> <p style={{ lineHeight: "1.6", color: "#92A5FD" }}> Kryptonax was built to democratize financial intelligence. </p> </div> </div> )}

      {view === "about" ? (
        <div style={{ flex: 1, color: "#E5EAF5", paddingBottom: "60px", textAlign: "center", padding: "80px 20px" }}>
            <h1 style={{ fontSize: "48px", marginBottom: "20px", color: "#E5EAF5" }}>Empowering Your <span style={{color: "#FF8692"}}>Financial Future</span></h1>
            <button onClick={() => setView("dashboard")} style={{ marginTop: "30px", padding: "12px 30px", background: "#FF8692", color: "white", border: "none", borderRadius: "4px", fontSize: "16px", cursor: "pointer", fontWeight: "bold" }}>Start Analyzing</button>
        </div>
      ) : (
        <div style={{ display: "flex", maxWidth: "1600px", margin: "30px auto", gap: "20px", padding: "0 20px", flex: 1, width: "100%", boxSizing: "border-box" }}>
            
            {!searchedTicker && (
                <aside style={{ width: "300px", backgroundColor: "#25256E", padding: "20px", borderRadius: "4px", border: "1px solid #587FFC", height: "fit-content" }}>
                    <h3 style={{ borderBottom: "1px solid #587FFC", paddingBottom: "10px", color: "#E5EAF5", fontSize: "16px" }}>⭐ My Watchlist</h3>
                    {!token && <p style={{fontSize: "12px", color: "#92A5FD"}}>Login to save your favorites.</p>}
                    <div style={{ display: "flex", gap: "5px", marginBottom: "20px", position: "relative" }}> <input type="text" placeholder="Add Ticker..." value={newFav} onChange={(e) => { setNewFav(e.target.value.toUpperCase()); setShowFavSuggestions(true); fetchSuggestions(e.target.value, true); }} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #587FFC", backgroundColor: "#1E1E5D", color: "#E5EAF5" }} /> <button onClick={() => toggleFavorite(newFav)} style={{ background: "#FF8692", color: "white", border: "none", borderRadius: "4px", padding: "0 15px", cursor: "pointer" }}>+</button> {showFavSuggestions && favSuggestions.length > 0 && ( <div style={{ position: "absolute", top: "40px", left: 0, width: "100%", backgroundColor: "#25256E", zIndex: 10, border: "1px solid #587FFC", boxShadow: "0 4px 10px rgba(0,0,0,0.5)" }}> {favSuggestions.map(s => <div key={s.symbol} onClick={() => toggleFavorite(s.symbol)} style={{ padding: "8px", cursor: "pointer", borderBottom: "1px solid #587FFC", fontSize: "13px" }}><span style={{fontWeight: "bold", color: "#FF8692"}}>{s.symbol}</span> <span style={{color: "#92A5FD"}}>({s.name})</span></div>)} </div> )} </div>
                    <ul style={{ listStyle: "none", padding: 0 }}> {favorites.map(fav => ( <li key={fav.ticker} style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", padding: "10px", backgroundColor: "#1E1E5D", borderRadius: "4px" }}> <span style={{ cursor: "pointer", fontWeight: "bold", color: "#E5EAF5" }} onClick={() => handleSearch(fav.ticker)}>{fav.ticker}</span> <button onClick={(e) => { e.stopPropagation(); toggleFavorite(fav.ticker); }} style={{ border: "none", background: "none", color: "#FF8692", cursor: "pointer" }}>✕</button> </li> ))} </ul>
                    <h3 style={{ marginTop: "30px", borderBottom: "1px solid #587FFC", paddingBottom: "10px", color: "#E5EAF5", fontSize: "16px" }}>🚀 Global Movers</h3> <ul style={{ listStyle: "none", padding: 0 }}> {trending.map((t, i) => ( <li key={t.ticker} style={{ marginBottom: "8px", paddingBottom: "8px", borderBottom: "1px solid #587FFC" }}> <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}> <span style={{ cursor: "pointer", fontWeight: "bold", color: "#E5EAF5" }} onClick={() => handleSearch(t.ticker)}>{t.ticker}</span> <span style={{ color: t.change >= 0 ? "#587FFC" : "#FF8692", fontWeight: "bold", fontSize: "14px" }}>{t.change > 0 ? "+" : ""}{t.change}%</span> </div> </li> ))} </ul>
                </aside>
            )}

            <main style={{ flex: 1 }}>
                <div style={{ backgroundColor: "#25256E", padding: "20px", borderRadius: "12px", marginBottom: "20px", border: "1px solid #587FFC" }}>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "center", position: "relative" }}>
                        <div style={{ flex: 1, position: "relative" }}>
                            {/* --- ROUNDED SEARCH BOX --- */}
                            <input type="text" placeholder="Search (e.g. BTC-USD, AAPL)..." value={ticker} onChange={(e) => { setTicker(e.target.value.toUpperCase()); setShowSuggestions(true); fetchSuggestions(e.target.value); }} onFocus={onSearchFocus} style={{ width: "100%", padding: "12px", paddingRight: "40px", borderRadius: "30px", border: "1px solid #587FFC", backgroundColor: "#1E1E5D", color: "#E5EAF5", fontSize: "16px", boxSizing: "border-box" }} />
                            <svg onClick={() => handleSearch()} xmlns="http://www.w3.org/2000/svg" className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#587FFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", transition: "0.2s" }}> <circle cx="11" cy="11" r="8"></circle> <line x1="21" y1="21" x2="16.65" y2="16.65"></line> </svg>
                        </div>
                        {/* --- ROUNDED DROPDOWN --- */}
                        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} style={{ padding: "12px", borderRadius: "30px", border: "1px solid #587FFC", backgroundColor: "#1E1E5D", color: "#E5EAF5", cursor: "pointer" }}><option value="1d">1 Day</option><option value="3d">3 Days</option><option value="5d">5 Days</option><option value="7d">7 Days</option><option value="15d">15 Days</option><option value="30d">30 Days</option></select>
                        {/* --- ROUNDED BUTTON --- */}
                        <button onClick={() => handleSearch()} disabled={loading} style={{ padding: "12px 30px", background: "#FF8692", color: "white", border: "none", borderRadius: "30px", cursor: "pointer", fontWeight: "bold" }}>Search</button>
                        {showSuggestions && ( <div style={{ position: "absolute", top: "50px", left: 0, width: "60%", backgroundColor: "#25256E", zIndex: 100, border: "1px solid #587FFC", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}> {ticker.length < 2 && searchHistory.length > 0 && ( <div> <div style={{ padding: "5px 10px", fontSize: "11px", color: "#92A5FD", backgroundColor: "#1E1E5D", borderBottom: "1px solid #587FFC" }}>RECENT SEARCHES</div> {searchHistory.map((h, i) => ( <div key={i} onClick={() => handleSearch(h)} style={{ padding: "10px", cursor: "pointer", borderBottom: "1px solid #587FFC", display: "flex", justifyContent: "space-between" }}><span style={{color: "#E5EAF5"}}>🕒 {h}</span>{pricesCache[h] && (<span style={{ color: pricesCache[h].color, fontSize: "13px", fontWeight: "bold" }}>{pricesCache[h].price} ({pricesCache[h].percent}%)</span>)}</div> ))} </div> )} {ticker.length >= 2 && suggestions.map(s => ( <div key={s.symbol} onClick={() => handleSearch(s.symbol)} style={{ padding: "12px", cursor: "pointer", borderBottom: "1px solid #587FFC", display: "flex", justifyContent: "space-between" }}><div><span style={{fontWeight: "bold", color: "#FF8692"}}>{s.symbol}</span><span style={{color: "#92A5FD", fontSize: "12px", marginLeft: "10px"}}>{s.name}</span></div>{pricesCache[s.symbol] && (<span style={{ color: pricesCache[s.symbol].color, fontSize: "13px", fontWeight: "bold" }}>{pricesCache[s.symbol].price} ({pricesCache[s.symbol].percent}%)</span>)}</div> ))} </div> )}
                    </div>
                </div>

                {searchedTicker ? (
                    <>
                        <div style={{ marginBottom: "20px", display: "flex", alignItems: "baseline", gap: "15px" }}> 
                            <h1 style={{ margin: 0, color: "#E5EAF5", fontSize: "36px" }}>{currentQuote?.price} <span style={{fontSize: "16px", color: "#92A5FD"}}>{currentQuote?.currency}</span></h1> 
                            <span style={{ fontSize: "20px", fontWeight: "bold", color: currentQuote?.change >= 0 ? "#587FFC" : "#FF8692" }}>{currentQuote?.change > 0 ? "+" : ""}{currentQuote?.change} ({currentQuote?.percent}%)</span> 
                        </div>

                        {/* --- 3-COLUMN LAYOUT --- */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "20px" }}>
                            
                            {/* COLUMN 1: GRAPHS */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                <div style={{ backgroundColor: "#25256E", padding: "20px", borderRadius: "12px", border: "1px solid #587FFC" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}> 
                                        <h4 style={{ margin: 0, color: "#E5EAF5" }}>{searchedTicker} Price Action</h4> 
                                        <div style={{ display: "flex", gap: "5px" }}> {['1d', '5d', '1mo', '6mo', '1y'].map(r => <button key={r} onClick={() => setChartRange(r)} style={{ padding: "4px 12px", borderRadius: "4px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "bold", backgroundColor: chartRange === r ? "#587FFC" : "#1E1E5D", color: chartRange === r ? "white" : "#92A5FD" }}>{r.toUpperCase()}</button>)} </div>
                                    </div> 
                                    <ResponsiveContainer width="100%" height={300}> 
                                        {/* CANDLESTICK CHART */}
                                        <ComposedChart data={candleData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E1E5D" opacity={0.8} />
                                            <XAxis dataKey="date" tick={{fontSize: 11, fill: "#92A5FD"}} axisLine={false} tickLine={false} />
                                            <YAxis domain={['auto', 'auto']} tick={{fontSize: 11, fill: "#92A5FD"}} axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={{backgroundColor: "#25256E", border: "1px solid #587FFC"}} labelStyle={{color: '#E5EAF5'}} />
                                            <Bar dataKey="close" shape={<Candle />} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                    <div style={{ textAlign: 'center', fontSize: '11px', color: '#92A5FD', marginTop: '10px' }}>*Candles are simulated for visual demo.</div>
                                </div>
                                
                                {/* PREDICTIVE ANALYSIS GRAPH */}
                                <div style={{ backgroundColor: "#25256E", padding: "20px", borderRadius: "12px", border: "1px solid #587FFC", position: "relative" }}>
                                     <h4 style={{ color: "#E5EAF5", marginBottom: "15px" }}>📉 Predictive Analysis (Forecast +15 Days)</h4>
                                     <ResponsiveContainer width="100%" height={250}>
                                        <ComposedChart data={predictiveData}>
                                            <defs>
                                                <linearGradient id="bandGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#587FFC" stopOpacity={0.3} />
                                                    <stop offset="100%" stopColor="#587FFC" stopOpacity={0.05} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid stroke="#1E1E5D" opacity={0.8} vertical={false} />
                                            <XAxis dataKey="date" tick={{fontSize: 10, fill: "#92A5FD"}} minTickGap={30} />
                                            <YAxis domain={['auto', 'auto']} tick={{fontSize: 10, fill: "#92A5FD"}} />
                                            <Tooltip contentStyle={{backgroundColor: "#25256E", border: "1px solid #587FFC"}} labelStyle={{color: '#E5EAF5'}} />
                                            
                                            <Area type="monotone" dataKey="upper" stroke="none" fill="url(#bandGradient)" />
                                            <Line type="monotone" dataKey="predicted" stroke="#587FFC" strokeWidth={2} dot={false} />
                                            <Line type="monotone" dataKey="upper" stroke="#587FFC" strokeWidth={1} strokeDasharray="3 3" dot={false} opacity={0.5} />
                                            <Line type="monotone" dataKey="lower" stroke="#587FFC" strokeWidth={1} strokeDasharray="3 3" dot={false} opacity={0.5} />
                                            
                                            <ReferenceLine x={predictiveData.find(d => d.isPrediction)?.date} stroke="#FF8692" strokeDasharray="3 3" label={{ value: 'TODAY', position: 'insideTopRight', fill: '#FF8692', fontSize: 10 }} />
                                            <Brush dataKey="date" height={30} stroke="#587FFC" fill="#1E1E5D" tickFormatter={() => ''} />
                                        </ComposedChart>
                                     </ResponsiveContainer>
                                </div>
                            </div>

                            {/* COLUMN 2: NEWS */}
                            <div className="custom-scroll" style={{ backgroundColor: "#25256E", padding: "20px", borderRadius: "12px", border: "1px solid #587FFC", maxHeight: "800px", overflowY: "auto" }}>
                                <h3 style={{ borderLeft: "4px solid #FF8692", paddingLeft: "15px", color: "#E5EAF5", marginBottom: "20px", position: "sticky", top: 0, backgroundColor: "#25256E", paddingBottom: "10px", zIndex: 10 }}>Latest News</h3>
                                {news.map((article, index) => ( 
                                    <div key={index} className="news-card" style={{ borderLeft: getBorderColor(article.sentiment), padding: "20px", marginBottom: "15px", backgroundColor: "#1E1E5D", borderRadius: "8px", border: "1px solid #587FFC" }}> 
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}> 
                                            <span style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: article.sentiment === 'positive' ? '#587FFC' : article.sentiment === 'negative' ? '#FF8692' : '#92A5FD' }}>{article.sentiment}</span> 
                                            <span style={{ fontSize: "12px", color: "#92A5FD" }}>{new Date(article.publishedAt).toLocaleDateString()}</span> 
                                        </div> 
                                        <h3 style={{ margin: "0 0 5px 0", fontSize: "16px" }}><a href={article.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "#E5EAF5" }}>{article.title}</a></h3> 
                                    </div> 
                                ))}
                            </div>

                            {/* COLUMN 3: SENTIMENT */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                <div style={{ backgroundColor: "#25256E", padding: "20px", borderRadius: "12px", border: "1px solid #587FFC", textAlign: "center" }}> 
                                    <h4 style={{ color: "#E5EAF5", marginBottom: "20px" }}>News Sentiment</h4> 
                                    <div style={{display: "flex", justifyContent: "center"}}>
                                        <PieChart width={250} height={250}> 
                                            <Pie data={activeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"> {activeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)} </Pie> 
                                            <Tooltip contentStyle={{backgroundColor: "#25256E", borderColor: "#587FFC", color: "#E5EAF5"}} itemStyle={{color: "#E5EAF5"}} /> <Legend /> 
                                        </PieChart> 
                                    </div>
                                </div>
                                <SentimentGauge data={mergedData} newsCounts={sentimentCounts} />
                            </div>

                        </div>
                    </>
                ) : (
                    <div>
                        <h2 style={{color: "#E5EAF5", marginBottom: "20px", borderLeft: "4px solid #FF8692", paddingLeft: "15px"}}>🔥 Trending Market Headlines</h2>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "20px" }}>
                            {generalNews.map((article, index) => (
                                <div key={index} className="news-card" style={{ backgroundColor: "#25256E", borderRadius: "8px", border: "1px solid #587FFC", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                    <div>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                                            <span style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: getBorderColor(article.sentiment).split(' ')[2] }}>{article.sentiment}</span>
                                            <span style={{ fontSize: "12px", color: "#92A5FD" }}>{new Date(article.publishedAt).toLocaleDateString()}</span>
                                        </div>
                                        <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", lineHeight: "1.4" }}><a href={article.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "#E5EAF5" }}>{article.title}</a></h3>
                                        <p style={{ fontSize: "13px", color: "#92A5FD", lineHeight: "1.5" }}>{article.description ? article.description.substring(0, 100) + "..." : "Click to read more."}</p>
                                    </div>
                                    <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #587FFC" }}><a href={article.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: "#FF8692", textDecoration: "none", fontWeight: "bold" }}>Read Full Story →</a></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
      )}
      <footer style={{ backgroundColor: "#25256E", borderTop: "1px solid #587FFC", padding: "60px 20px", marginTop: "auto" }}> <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "40px" }}> <div style={{ maxWidth: "300px" }}> <h2 style={{ fontSize: "24px", color: "#E5EAF5", marginBottom: "15px" }}><span style={{ color: "#FF8692" }}>KRYPTONAX</span></h2> <p style={{ color: "#92A5FD", fontSize: "14px", lineHeight: "1.6" }}>The #1 financial intelligence platform for students and professionals. Real-time data, AI sentiment analysis, and institutional-grade charting in one place.</p> </div> <div style={{ display: "flex", gap: "60px", flexWrap: "wrap" }}> <div> <h4 style={{ color: "#E5EAF5", marginBottom: "20px" }}>Product</h4> <ul style={{ listStyle: "none", padding: 0, color: "#92A5FD", fontSize: "14px", lineHeight: "2.5" }}> <li>Charting</li> <li>AI Sentiment</li> <li>Screeners</li> <li>Pricing</li> </ul> </div> </div> </div> <div style={{ textAlign: "center", borderTop: "1px solid #587FFC", marginTop: "40px", paddingTop: "20px", color: "#92A5FD", fontSize: "12px" }}>&copy; 2024 Kryptonax Financial Inc. All rights reserved. Data provided by Yahoo Finance & NewsAPI.</div> </footer>
    </div>
  );
}

export default App;