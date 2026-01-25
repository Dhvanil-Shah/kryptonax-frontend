import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ComposedChart, Line } from 'recharts';
import ReactGA from "react-ga4";

// --- 1. INITIALIZE ANALYTICS ---
ReactGA.initialize("G-REEV9CZE52");

// --- HELPER: SIMULATE PREDICTIVE BANDS (BOLINGER STYLE) ---
const addPredictiveBands = (data) => {
    if (!data || data.length === 0) return [];
    // Simple logic to create a "Prediction Channel" visual
    return data.map(d => ({
        ...d,
        upper: d.price * 1.02, // +2% Band
        lower: d.price * 0.98, // -2% Band
        predicted: d.price // Main line
    }));
};

// --- NEW COMPONENT: NUANCED Technical Sentiment Gauge ---
const SentimentGauge = ({ data, newsCounts }) => {
  const getNuancedSentiment = () => {
    if (!data || data.length < 5) return { rotation: 0, text: "Gathering Data...", color: "#FFD700" };
    
    // 1. MATH: Price Momentum (SMA Difference)
    const prices = data.map(d => d.price);
    const currentPrice = prices[prices.length - 1];
    const sma = prices.reduce((a, b) => a + b, 0) / prices.length;
    const priceScore = ((currentPrice - sma) / sma) * 100; // e.g., +1.5% or -0.8%

    // 2. AI: News Sentiment Score (-1 to +1)
    const pos = newsCounts.find(n => n.name === 'Positive')?.value || 0;
    const neg = newsCounts.find(n => n.name === 'Negative')?.value || 0;
    const total = pos + neg + (newsCounts.find(n => n.name === 'Neutral')?.value || 0);
    const newsScore = total > 0 ? (pos - neg) / total : 0; // Range: -1 (All Bad) to +1 (All Good)

    // 3. COMBINE: 60% Math, 40% News
    // We scale priceScore (usually small like 1-2) to match newsScore range
    const weightedScore = (priceScore * 0.6) + (newsScore * 20 * 0.4); 
    
    // 4. MAP TO ROTATION (-90 to +90 degrees)
    // weightedScore usually falls between -5 and +5. We clamp it.
    const clampedScore = Math.max(-5, Math.min(5, weightedScore)); 
    const rotation = (clampedScore / 5) * 90; // Map -5..5 to -90..90 deg

    // 5. DETERMINE TEXT & COLOR BASED ON NUANCE
    let text, color;
    if (rotation > 60) { text = "Strong Buy"; color = "#00e676"; }
    else if (rotation > 20) { text = "Buy"; color = "#69f0ae"; }
    else if (rotation < -60) { text = "Strong Sell"; color = "#ff1744"; }
    else if (rotation < -20) { text = "Sell"; color = "#ff5252"; }
    else { text = "Neutral"; color = "#FFD700"; }

    return { rotation, text, color };
  };

  const { rotation, text, color } = getNuancedSentiment();

  return (
    <div style={{ backgroundColor: "#1e222d", padding: "20px", borderRadius: "4px", border: "1px solid #2a2e39", textAlign: "center", position: 'relative', height: '250px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <h4 style={{ color: "#d1d4dc", marginBottom: "0px" }}>Technical Analysis</h4>
      <p style={{ fontSize: "11px", color: "#787b86", margin: "0 0 10px 0" }}>Multi-Factor Logic: Price Trend + AI News</p>
      
      <svg viewBox="0 0 200 120" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>

        {/* Gradient Arc Background */}
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#2a2e39" strokeWidth="15" strokeLinecap="round" />
        
        {/* Colorful Segments */}
        <path d="M 20 100 A 80 80 0 0 1 60 30.7" fill="none" stroke="#ff1744" strokeWidth="15" strokeLinecap="round" opacity="0.4" /> 
        <path d="M 145 33 A 80 80 0 0 1 180 100" fill="none" stroke="#00e676" strokeWidth="15" strokeLinecap="round" opacity="0.4" />

        {/* Needle */}
        <g transform={`rotate(${rotation}, 100, 100)`} style={{ transition: 'transform 1s cubic-bezier(0.25, 1, 0.5, 1)' }}>
          <path d="M 100 100 L 100 25" stroke="white" strokeWidth="4" strokeLinecap="round" filter="url(#glow)" />
          <circle cx="100" cy="100" r="8" fill="#1e222d" stroke="white" strokeWidth="2" />
        </g>

        {/* Text */}
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
  const [predictiveData, setPredictiveData] = useState([]); // FOR THE NEW GRAPH

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

  const COLORS = ['#00e676', '#ff1744', '#651fff']; 

  // --- CSS STYLES ---
  const styles = `
    .news-card { transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: default; }
    .news-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.3) !important; border-color: #2962ff !important; }
    .search-icon:hover { stroke: #2962ff !important; transform: translateY(-50%) scale(1.1); }
    .loading-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(19, 23, 34, 0.8); z-index: 9999; display: flex; justify-content: center; alignItems: center; backdrop-filter: blur(2px); }
    .spinner { width: 50px; height: 50px; border: 5px solid rgba(255, 255, 255, 0.1); border-left-color: #2962ff; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .custom-scroll::-webkit-scrollbar { width: 8px; }
    .custom-scroll::-webkit-scrollbar-track { background: #1e222d; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #2a2e39; border-radius: 4px; }
    .custom-scroll::-webkit-scrollbar-thumb:hover { background: #2962ff; }
  `;

  useEffect(() => {
    document.body.style.margin = "0"; document.body.style.padding = "0"; document.body.style.backgroundColor = "#131722"; document.body.style.boxSizing = "border-box";
    fetchTrending(); fetchGeneralNews();
    if (token) { setIsAppLoading(true); fetchFavorites().finally(() => setIsAppLoading(false)); }
    const savedHistory = localStorage.getItem("searchHistory");
    if (savedHistory) setSearchHistory(JSON.parse(savedHistory));
    const lastTicker = localStorage.getItem("lastTicker");
    if (lastTicker) { setTicker(lastTicker); handleSearch(lastTicker); }
  }, [token]);

  useEffect(() => {
    if (!token) { const timer = setTimeout(() => setShowAuthModal(true), 2000); return () => clearTimeout(timer); }
  }, [token]);

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
      const t = overrideTicker || ticker; 
      if (!t) return; 
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
      setPredictiveData(addPredictiveBands(finalData)); // GENERATE BANDS FOR PREDICTIVE CHART
  };
  const handleComparisonSearch = async () => { if (!compareTicker) return; setActiveComparison(compareTicker); await updateChart(searchedTicker, chartRange, compareTicker); };
  const clearComparison = () => { setActiveComparison(null); setCompareTicker(""); updateChart(searchedTicker, chartRange, null); };
  const onSearchFocus = () => { setShowSuggestions(true); if (searchHistory.length > 0) fetchBatchQuotes(searchHistory); };
  const fetchSuggestions = async (query, isFav = false) => { if (query.length < 2) { if (isFav) setFavSuggestions([]); else setSuggestions([]); return; } try { const res = await fetch(`https://kryptonax-backend.onrender.com/api/search/${query}`); const data = await res.json(); if (isFav) setFavSuggestions(data); else { setSuggestions(data); fetchBatchQuotes(data.map(s => s.symbol)); } } catch (e) { } };
  const fetchTrending = async () => { try { const res = await fetch(`https://kryptonax-backend.onrender.com/trending`); setTrending(await res.json()); } catch (e) {} };
  const fetchFavorites = async () => { try { const res = await fetch(`https://kryptonax-backend.onrender.com/favorites`, { headers: { "Authorization": `Bearer ${token}` } }); if (res.ok) setFavorites(await res.json()); } catch (e) {} };
  const toggleFavorite = async (t) => { if (!token) { setShowAuthModal(true); return; } if (!t) return; const isFav = favorites.some(f => f.ticker === t); const method = isFav ? "DELETE" : "POST"; await fetch(`https://kryptonax-backend.onrender.com/favorites/${t}`, { method, headers: { "Authorization": `Bearer ${token}` } }); fetchFavorites(); setNewFav(""); setShowFavSuggestions(false); };
  const getBorderColor = (s) => (s === "positive" ? "4px solid #00e676" : s === "negative" ? "4px solid #ff1744" : "1px solid #651fff");
  const sentimentCounts = [ { name: 'Positive', value: news.filter(n => n.sentiment === 'positive').length }, { name: 'Negative', value: news.filter(n => n.sentiment === 'negative').length }, { name: 'Neutral', value: news.filter(n => n.sentiment === 'neutral' || !n.sentiment).length } ];
  const activeData = sentimentCounts.filter(item => item.value > 0);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "#131722", minHeight: "100vh", color: "#d1d4dc", display: "flex", flexDirection: "column" }}>
      <style>{styles}</style>
      {(isAppLoading || loading) && ( <div className="loading-overlay"> <div className="spinner"></div> </div> )}

      <nav style={{ backgroundColor: "#1e222d", padding: "15px 40px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid #2a2e39", position: "sticky", top: 0, zIndex: 1000 }}>
        <div style={{ fontSize: "24px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "20px" }}><span onClick={() => setView("dashboard")} style={{cursor: "pointer"}}><span style={{ color: "#2962ff" }}>KRYPTONAX</span> | <span style={{fontSize: "16px", fontWeight: "normal", color: "#787b86"}}>Financial Intelligence</span></span>{searchedTicker && view === "dashboard" && <button onClick={handleReset} style={{ fontSize: "14px", padding: "5px 15px", backgroundColor: "#2a2e39", border: "1px solid #787b86", color: "#d1d4dc", borderRadius: "4px", cursor: "pointer" }}>← Back to Home</button>}</div>
        <div style={{display: "flex", alignItems: "center", gap: "25px"}}><span onClick={() => setView("about")} style={{cursor: "pointer", color: view === "about" ? "#2962ff" : "#d1d4dc", fontWeight: "bold", transition: "0.2s"}}>About Us</span>{userName && <span style={{color: "#00e676", fontWeight: "bold"}}>Hi, {userName}</span>}{token ? ( <button onClick={logout} style={{ background: "#ff1744", color: "white", padding: "8px 20px", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Logout</button> ) : ( <button onClick={() => setShowAuthModal(true)} style={{ background: "#2962ff", color: "white", padding: "8px 20px", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Login / Sign Up</button> )}</div>
      </nav>

      {/* MODAL PLACEHOLDER - FUNCTIONALITY INCLUDED ABOVE */}
      {showAuthModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
            <div style={{ backgroundColor: "#1e222d", padding: "40px", borderRadius: "8px", border: "1px solid #2a2e39", width: "400px", textAlign: "center", position: "relative" }}>
                <button onClick={() => {setShowAuthModal(false); setAuthMode("login");}} style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", color: "#787b86", fontSize: "20px", cursor: "pointer" }}>✕</button>
                <h2 style={{ color: "white", marginTop: 0 }}>{authMode === "login" ? "Welcome Back" : "Join Kryptonax"}</h2>
                {authError && <p style={{color: "#ff1744", fontSize: "14px"}}>{authError}</p>}
                {authSuccess && <p style={{color: "#00e676", fontSize: "14px"}}>{authSuccess}</p>}
                
                <input type="text" placeholder="Username / Email" value={username} onChange={e => setUsername(e.target.value)} style={{ width: "95%", padding: "10px", margin: "5px 0", backgroundColor: "#131722", border: "1px solid #2a2e39", color: "white", borderRadius: "4px" }} />
                <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: "95%", padding: "10px", backgroundColor: "#131722", border: "1px solid #2a2e39", color: "white", borderRadius: "4px", marginTop: "5px" }} />
                {authMode === "register" && (
                    <>
                        <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ width: "95%", padding: "10px", backgroundColor: "#131722", border: "1px solid #2a2e39", color: "white", borderRadius: "4px", marginTop: "5px" }} />
                        <div style={{display: "flex", gap: "10px", marginTop: "5px"}}>
                            <input type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} style={{ width: "50%", padding: "10px", backgroundColor: "#131722", border: "1px solid #2a2e39", color: "white", borderRadius: "4px" }} />
                            <input type="text" placeholder="Mobile" value={mobile} onChange={e => setMobile(e.target.value)} style={{ width: "50%", padding: "10px", backgroundColor: "#131722", border: "1px solid #2a2e39", color: "white", borderRadius: "4px" }} />
                        </div>
                    </>
                )}
                <button onClick={handleAuth} style={{ width: "100%", padding: "12px", background: "#2962ff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", marginTop: "20px" }}>{authMode === "login" ? "Login" : "Sign Up"}</button>
                <p style={{ fontSize: "12px", color: "#787b86", marginTop: "20px", cursor: "pointer" }} onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>{authMode === "login" ? "Create Account" : "Back to Login"}</p>
            </div>
        </div>
      )}

      {showAboutModal && ( <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 }}> <div style={{ backgroundColor: "#1e222d", padding: "50px", borderRadius: "12px", border: "1px solid #2a2e39", width: "700px", color: "#d1d4dc", position: "relative" }}> <button onClick={() => setShowAboutModal(false)} style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: "white", fontSize: "24px", cursor: "pointer" }}>✕</button> <h1 style={{ color: "#2962ff", textAlign: "center", marginBottom: "30px" }}>About Kryptonax</h1> <p style={{ lineHeight: "1.6", color: "#a1a1a1" }}> Kryptonax was built to democratize financial intelligence. </p> </div> </div> )}

      {view === "about" ? (
        <div style={{ flex: 1, color: "#d1d4dc", paddingBottom: "60px", textAlign: "center", padding: "80px 20px" }}>
            <h1 style={{ fontSize: "48px", marginBottom: "20px", color: "white" }}>Empowering Your <span style={{color: "#2962ff"}}>Financial Future</span></h1>
            <button onClick={() => setView("dashboard")} style={{ marginTop: "30px", padding: "12px 30px", background: "#2962ff", color: "white", border: "none", borderRadius: "4px", fontSize: "16px", cursor: "pointer", fontWeight: "bold" }}>Start Analyzing</button>
        </div>
      ) : (
        <div style={{ display: "flex", maxWidth: "1600px", margin: "30px auto", gap: "20px", padding: "0 20px", flex: 1, width: "100%", boxSizing: "border-box" }}>
            
            {/* SIDEBAR - HIDDEN WHEN SEARCHING */}
            {!searchedTicker && (
                <aside style={{ width: "300px", backgroundColor: "#1e222d", padding: "20px", borderRadius: "4px", border: "1px solid #2a2e39", height: "fit-content" }}>
                    <h3 style={{ borderBottom: "1px solid #2a2e39", paddingBottom: "10px", color: "#d1d4dc", fontSize: "16px" }}>⭐ My Watchlist</h3>
                    {!token && <p style={{fontSize: "12px", color: "#787b86"}}>Login to save your favorites.</p>}
                    <div style={{ display: "flex", gap: "5px", marginBottom: "20px", position: "relative" }}> <input type="text" placeholder="Add Ticker..." value={newFav} onChange={(e) => { setNewFav(e.target.value.toUpperCase()); setShowFavSuggestions(true); fetchSuggestions(e.target.value, true); }} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #2a2e39", backgroundColor: "#131722", color: "white" }} /> <button onClick={() => toggleFavorite(newFav)} style={{ background: "#2962ff", color: "white", border: "none", borderRadius: "4px", padding: "0 15px", cursor: "pointer" }}>+</button> {showFavSuggestions && favSuggestions.length > 0 && ( <div style={{ position: "absolute", top: "40px", left: 0, width: "100%", backgroundColor: "#1e222d", zIndex: 10, border: "1px solid #2a2e39", boxShadow: "0 4px 10px rgba(0,0,0,0.5)" }}> {favSuggestions.map(s => <div key={s.symbol} onClick={() => toggleFavorite(s.symbol)} style={{ padding: "8px", cursor: "pointer", borderBottom: "1px solid #2a2e39", fontSize: "13px" }}><span style={{fontWeight: "bold", color: "#2962ff"}}>{s.symbol}</span> <span style={{color: "#787b86"}}>({s.name})</span></div>)} </div> )} </div>
                    <ul style={{ listStyle: "none", padding: 0 }}> {favorites.map(fav => ( <li key={fav.ticker} style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", padding: "10px", backgroundColor: "#2a2e39", borderRadius: "4px" }}> <span style={{ cursor: "pointer", fontWeight: "bold", color: "#d1d4dc" }} onClick={() => handleSearch(fav.ticker)}>{fav.ticker}</span> <button onClick={(e) => { e.stopPropagation(); toggleFavorite(fav.ticker); }} style={{ border: "none", background: "none", color: "#ff1744", cursor: "pointer" }}>✕</button> </li> ))} </ul>
                    <h3 style={{ marginTop: "30px", borderBottom: "1px solid #2a2e39", paddingBottom: "10px", color: "#d1d4dc", fontSize: "16px" }}>🚀 Global Movers</h3> <ul style={{ listStyle: "none", padding: 0 }}> {trending.map((t, i) => ( <li key={t.ticker} style={{ marginBottom: "8px", paddingBottom: "8px", borderBottom: "1px solid #2a2e39" }}> <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}> <span style={{ cursor: "pointer", fontWeight: "bold", color: "#d1d4dc" }} onClick={() => handleSearch(t.ticker)}>{t.ticker}</span> <span style={{ color: t.change >= 0 ? "#00e676" : "#ff1744", fontWeight: "bold", fontSize: "14px" }}>{t.change > 0 ? "+" : ""}{t.change}%</span> </div> </li> ))} </ul>
                </aside>
            )}

            <main style={{ flex: 1 }}>
                <div style={{ backgroundColor: "#1e222d", padding: "20px", borderRadius: "4px", marginBottom: "20px", border: "1px solid #2a2e39" }}>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "center", position: "relative" }}>
                        <div style={{ flex: 1, position: "relative" }}>
                            <input type="text" placeholder="Search (e.g. BTC-USD, AAPL)..." value={ticker} onChange={(e) => { setTicker(e.target.value.toUpperCase()); setShowSuggestions(true); fetchSuggestions(e.target.value); }} onFocus={onSearchFocus} style={{ width: "100%", padding: "12px", paddingRight: "40px", borderRadius: "4px", border: "1px solid #2a2e39", backgroundColor: "#131722", color: "white", fontSize: "16px", boxSizing: "border-box" }} />
                            <svg onClick={() => handleSearch()} xmlns="http://www.w3.org/2000/svg" className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#787b86" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", transition: "0.2s" }}> <circle cx="11" cy="11" r="8"></circle> <line x1="21" y1="21" x2="16.65" y2="16.65"></line> </svg>
                        </div>
                        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} style={{ padding: "12px", borderRadius: "4px", border: "1px solid #2a2e39", backgroundColor: "#131722", color: "white", cursor: "pointer" }}><option value="1d">1 Day</option><option value="3d">3 Days</option><option value="5d">5 Days</option><option value="7d">7 Days</option><option value="15d">15 Days</option><option value="30d">30 Days</option></select>
                        <button onClick={() => handleSearch()} disabled={loading} style={{ padding: "12px 30px", background: "#2962ff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Search</button>
                        {showSuggestions && ( <div style={{ position: "absolute", top: "50px", left: 0, width: "60%", backgroundColor: "#1e222d", zIndex: 100, border: "1px solid #2a2e39", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}> {ticker.length < 2 && searchHistory.length > 0 && ( <div> <div style={{ padding: "5px 10px", fontSize: "11px", color: "#787b86", backgroundColor: "#131722", borderBottom: "1px solid #2a2e39" }}>RECENT SEARCHES</div> {searchHistory.map((h, i) => ( <div key={i} onClick={() => handleSearch(h)} style={{ padding: "10px", cursor: "pointer", borderBottom: "1px solid #2a2e39", display: "flex", justifyContent: "space-between" }}><span style={{color: "#d1d4dc"}}>🕒 {h}</span>{pricesCache[h] && (<span style={{ color: pricesCache[h].color, fontSize: "13px", fontWeight: "bold" }}>{pricesCache[h].price} ({pricesCache[h].percent}%)</span>)}</div> ))} </div> )} {ticker.length >= 2 && suggestions.map(s => ( <div key={s.symbol} onClick={() => handleSearch(s.symbol)} style={{ padding: "12px", cursor: "pointer", borderBottom: "1px solid #2a2e39", display: "flex", justifyContent: "space-between" }}><div><span style={{fontWeight: "bold", color: "#2962ff"}}>{s.symbol}</span><span style={{color: "#787b86", fontSize: "12px", marginLeft: "10px"}}>{s.name}</span></div>{pricesCache[s.symbol] && (<span style={{ color: pricesCache[s.symbol].color, fontSize: "13px", fontWeight: "bold" }}>{pricesCache[s.symbol].price} ({pricesCache[s.symbol].percent}%)</span>)}</div> ))} </div> )}
                    </div>
                </div>

                {searchedTicker ? (
                    <>
                        <div style={{ marginBottom: "20px", display: "flex", alignItems: "baseline", gap: "15px" }}> 
                            <h1 style={{ margin: 0, color: "white", fontSize: "36px" }}>{currentQuote?.price} <span style={{fontSize: "16px", color: "#787b86"}}>{currentQuote?.currency}</span></h1> 
                            <span style={{ fontSize: "20px", fontWeight: "bold", color: currentQuote?.change >= 0 ? "#00e676" : "#ff1744" }}>{currentQuote?.change > 0 ? "+" : ""}{currentQuote?.change} ({currentQuote?.percent}%)</span> 
                        </div>

                        {/* --- 3-COLUMN LAYOUT START --- */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "20px" }}>
                            
                            {/* COLUMN 1: GRAPHS */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                <div style={{ backgroundColor: "#1e222d", padding: "20px", borderRadius: "4px", border: "1px solid #2a2e39" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}> 
                                        <h4 style={{ margin: 0, color: "#d1d4dc" }}>{searchedTicker} Price Action</h4> 
                                        <div style={{ display: "flex", gap: "5px" }}> {!activeComparison ? ( <><input type="text" placeholder="VS (e.g. GLD)" value={compareTicker} onChange={(e) => setCompareTicker(e.target.value.toUpperCase())} style={{ padding: "6px", border: "1px solid #2a2e39", borderRadius: "4px", backgroundColor: "#131722", color: "white", width: "100px" }} /><button onClick={handleComparisonSearch} style={{ padding: "6px 12px", background: "#2a2e39", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>VS</button></> ) : ( <button onClick={clearComparison} style={{ padding: "6px 12px", background: "#ff1744", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Clear {activeComparison}</button> )} </div> 
                                    </div> 
                                    <ResponsiveContainer width="100%" height={300}> 
                                        {/* MAIN CHART WITH GLOW */}
                                        <AreaChart data={mergedData}> 
                                            <defs>
                                                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#2962ff" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#2962ff" stopOpacity={0}/>
                                                </linearGradient>
                                                <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                                                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                                    <feMerge>
                                                        <feMergeNode in="coloredBlur" />
                                                        <feMergeNode in="SourceGraphic" />
                                                    </feMerge>
                                                </filter>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2e39" opacity={0.5} /> 
                                            <XAxis dataKey="date" tick={{fontSize: 11, fill: "#787b86"}} axisLine={false} tickLine={false} /> 
                                            <YAxis yAxisId="left" domain={['auto', 'auto']} tick={{fontSize: 11, fill: "#787b86"}} axisLine={false} tickLine={false} /> 
                                            {activeComparison && <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} tick={{fontSize: 11, fill: "#ff9800"}} axisLine={false} tickLine={false} />} 
                                            <Tooltip contentStyle={{backgroundColor: "#131722", border: "1px solid #2a2e39", color: "#d1d4dc"}} /> 
                                            
                                            <Area yAxisId="left" type="monotone" dataKey="price" name={searchedTicker} stroke="#2962ff" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" filter="url(#neonGlow)" /> 
                                            {activeComparison && <Area yAxisId="right" type="monotone" dataKey="comparePrice" name={activeComparison} stroke="#ff9800" strokeWidth={2} fillOpacity={0} />} 
                                        </AreaChart> 
                                    </ResponsiveContainer>
                                    <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "20px" }}> {['1d', '5d', '1mo', '6mo', '1y'].map(r => <button key={r} onClick={() => setChartRange(r)} style={{ padding: "4px 12px", borderRadius: "4px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "bold", backgroundColor: chartRange === r ? "#2962ff" : "#2a2e39", color: chartRange === r ? "white" : "#787b86" }}>{r.toUpperCase()}</button>)} </div>
                                </div>
                                
                                {/* NEW: PREDICTIVE ANALYSIS GRAPH (FROM REFERENCE IMAGE) */}
                                <div style={{ backgroundColor: "#1e222d", padding: "20px", borderRadius: "4px", border: "1px solid #2a2e39", position: "relative" }}>
                                     <h4 style={{ color: "#d1d4dc", marginBottom: "15px" }}>📉 Predictive Analysis (Beta)</h4>
                                     <ResponsiveContainer width="100%" height={200}>
                                        <ComposedChart data={predictiveData}>
                                            <defs>
                                                <linearGradient id="bandGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#00e676" stopOpacity={0.2} />
                                                    <stop offset="100%" stopColor="#00e676" stopOpacity={0.05} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid stroke="#2a2e39" opacity={0.5} vertical={false} />
                                            <Tooltip contentStyle={{backgroundColor: "#131722", border: "1px solid #2a2e39"}} />
                                            
                                            {/* Upper Confidence Band */}
                                            <Area type="monotone" dataKey="upper" stroke="none" fill="url(#bandGradient)" />
                                            {/* Lower Confidence Band - trick to create 'channel' effect (stacking not used here, visually overlapping) */}
                                            
                                            {/* The Actual Price Line inside the bands */}
                                            <Line type="monotone" dataKey="predicted" stroke="#00e676" strokeWidth={2} dot={false} />
                                            
                                            {/* Upper/Lower Line Borders */}
                                            <Line type="monotone" dataKey="upper" stroke="#00e676" strokeWidth={1} strokeDasharray="3 3" dot={false} opacity={0.5} />
                                            <Line type="monotone" dataKey="lower" stroke="#00e676" strokeWidth={1} strokeDasharray="3 3" dot={false} opacity={0.5} />
                                        </ComposedChart>
                                     </ResponsiveContainer>
                                     <div style={{position: "absolute", bottom: "10px", right: "10px", fontSize: "10px", color: "#787b86"}}>AI Projection Model v2.1</div>
                                </div>
                            </div>

                            {/* COLUMN 2: NEWS (SCROLLABLE) */}
                            <div className="custom-scroll" style={{ backgroundColor: "#1e222d", padding: "20px", borderRadius: "4px", border: "1px solid #2a2e39", maxHeight: "800px", overflowY: "auto" }}>
                                <h3 style={{ borderLeft: "4px solid #2962ff", paddingLeft: "15px", color: "#d1d4dc", marginBottom: "20px", position: "sticky", top: 0, backgroundColor: "#1e222d", paddingBottom: "10px", zIndex: 10 }}>Latest News</h3>
                                {news.map((article, index) => ( 
                                    <div key={index} className="news-card" style={{ borderLeft: getBorderColor(article.sentiment), padding: "20px", marginBottom: "15px", backgroundColor: "#131722", borderRadius: "4px", border: "1px solid #2a2e39" }}> 
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}> 
                                            <span style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: article.sentiment === 'positive' ? '#00e676' : article.sentiment === 'negative' ? '#ff1744' : '#651fff' }}>{article.sentiment}</span> 
                                            <span style={{ fontSize: "12px", color: "#787b86" }}>{new Date(article.publishedAt).toLocaleDateString()}</span> 
                                        </div> 
                                        <h3 style={{ margin: "0 0 5px 0", fontSize: "16px" }}><a href={article.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "#d1d4dc" }}>{article.title}</a></h3> 
                                    </div> 
                                ))}
                            </div>

                            {/* COLUMN 3: SENTIMENT & PREDICTION */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                {/* Sentiment Pie */}
                                <div style={{ backgroundColor: "#1e222d", padding: "20px", borderRadius: "4px", border: "1px solid #2a2e39", textAlign: "center" }}> 
                                    <h4 style={{ color: "#d1d4dc", marginBottom: "20px" }}>News Sentiment</h4> 
                                    <div style={{display: "flex", justifyContent: "center"}}>
                                        <PieChart width={250} height={250}> 
                                            <Pie data={activeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"> {activeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)} </Pie> 
                                            <Tooltip contentStyle={{backgroundColor: "#1e222d", borderColor: "#2a2e39", color: "#ffffff"}} itemStyle={{color: "#ffffff"}} /> <Legend /> 
                                        </PieChart> 
                                    </div>
                                </div>
                                
                                {/* NEW Technical Sentiment Gauge (NUANCED) */}
                                <SentimentGauge data={mergedData} newsCounts={sentimentCounts} />
                            </div>

                        </div>
                        {/* --- 3-COLUMN LAYOUT END --- */}
                    </>
                ) : (
                    <div>
                        <h2 style={{color: "white", marginBottom: "20px", borderLeft: "4px solid #2962ff", paddingLeft: "15px"}}>🔥 Trending Market Headlines</h2>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "20px" }}>
                            {generalNews.map((article, index) => (
                                <div key={index} className="news-card" style={{ backgroundColor: "#1e222d", borderRadius: "8px", border: "1px solid #2a2e39", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                    <div>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                                            <span style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: getBorderColor(article.sentiment).split(' ')[2] }}>{article.sentiment}</span>
                                            <span style={{ fontSize: "12px", color: "#787b86" }}>{new Date(article.publishedAt).toLocaleDateString()}</span>
                                        </div>
                                        <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", lineHeight: "1.4" }}><a href={article.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "#d1d4dc" }}>{article.title}</a></h3>
                                        <p style={{ fontSize: "13px", color: "#787b86", lineHeight: "1.5" }}>{article.description ? article.description.substring(0, 100) + "..." : "Click to read more."}</p>
                                    </div>
                                    <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #2a2e39" }}><a href={article.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: "#2962ff", textDecoration: "none", fontWeight: "bold" }}>Read Full Story →</a></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
      )}
      <footer style={{ backgroundColor: "#1e222d", borderTop: "1px solid #2a2e39", padding: "60px 20px", marginTop: "auto" }}> <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "40px" }}> <div style={{ maxWidth: "300px" }}> <h2 style={{ fontSize: "24px", color: "#ffffff", marginBottom: "15px" }}><span style={{ color: "#2962ff" }}>KRYPTONAX</span></h2> <p style={{ color: "#787b86", fontSize: "14px", lineHeight: "1.6" }}>The #1 financial intelligence platform for students and professionals. Real-time data, AI sentiment analysis, and institutional-grade charting in one place.</p> </div> <div style={{ display: "flex", gap: "60px", flexWrap: "wrap" }}> <div> <h4 style={{ color: "white", marginBottom: "20px" }}>Product</h4> <ul style={{ listStyle: "none", padding: 0, color: "#787b86", fontSize: "14px", lineHeight: "2.5" }}> <li>Charting</li> <li>AI Sentiment</li> <li>Screeners</li> <li>Pricing</li> </ul> </div> </div> </div> <div style={{ textAlign: "center", borderTop: "1px solid #2a2e39", marginTop: "40px", paddingTop: "20px", color: "#555", fontSize: "12px" }}>&copy; 2024 Kryptonax Financial Inc. All rights reserved. Data provided by Yahoo Finance & NewsAPI.</div> </footer>
    </div>
  );
}

export default App;