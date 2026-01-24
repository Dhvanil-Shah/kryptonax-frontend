import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
// import logo from './assets/Kryptonaxlogo.png';
import { useEffect } from "react";
import ReactGA from "react-ga4";

// 2. INITIALIZE IT RIGHT HERE (Outside the function)
ReactGA.initialize("G-REEV9CZE52");

function App() {

  // 3. PASTE THIS INSIDE YOUR COMPONENT FUNCTION
  useEffect(() => {
    // This sends a signal to Google every time the page loads
    ReactGA.send({ hitType: "pageview", page: window.location.pathname });
  }, []);

  return (
    // ... Keep your existing code down here ...
    <div className="App">
       {/* Your Navbar, Routes, etc. */}
    </div>
  );
}

function App() {
  const [view, setView] = useState("dashboard");
  const [ticker, setTicker] = useState("");
  const [searchedTicker, setSearchedTicker] = useState(""); 
  const [news, setNews] = useState([]);
  const [generalNews, setGeneralNews] = useState([]); 
  const [mergedData, setMergedData] = useState([]); 
  const [currentQuote, setCurrentQuote] = useState(null); 
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);
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

  // --- AUTH & FORGOT PASSWORD STATES ---
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [userName, setUserName] = useState(localStorage.getItem("userName") || "");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // 'login', 'register', 'forgot'
  const [forgotStep, setForgotStep] = useState(1); // 1 = Email, 2 = OTP/New Pass
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState(""); // Green success messages

  // --- FORM FIELDS ---
  const [username, setUsername] = useState(""); 
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [otpCode, setOtpCode] = useState(""); // For reset
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const COLORS = ['#00e676', '#ff1744', '#651fff']; 

  const styles = `
    .news-card { transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: default; }
    .news-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.3) !important; border-color: #2962ff !important; }
    .search-icon:hover { stroke: #2962ff !important; transform: translateY(-50%) scale(1.1); }
  `;

  useEffect(() => {
    document.body.style.margin = "0"; document.body.style.padding = "0"; document.body.style.backgroundColor = "#131722"; document.body.style.boxSizing = "border-box";
    fetchTrending(); fetchGeneralNews();
    if (token) fetchFavorites(); 
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

  // --- AUTH HANDLERS ---
  const handleAuth = async () => {
      setAuthError(""); setAuthSuccess("");
      
      // FORGOT PASSWORD FLOW
      if (authMode === "forgot") {
          if (forgotStep === 1) {
              // Send OTP
              if (!username) { setAuthError("Please enter your email."); return; }
              try {
                  const res = await fetch("https://kryptonax-backend.onrender.com/forgot-password", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({username}) });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.detail || "Error sending OTP");
                  setAuthSuccess("OTP Sent! Check your Email & Mobile.");
                  setForgotStep(2);
              } catch (e) { setAuthError(e.message); }
              return;
          }
          if (forgotStep === 2) {
              // Reset Password
              if (!otpCode || !password || !confirmPassword) { setAuthError("Fill all fields."); return; }
              if (password !== confirmPassword) { setAuthError("Passwords do not match."); return; }
              try {
                  const res = await fetch("https://kryptonax-backend.onrender.com/reset-password", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({username, otp: otpCode, new_password: password}) });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.detail || "Reset failed");
                  setAuthSuccess("Password Reset! Please Login.");
                  setTimeout(() => { setAuthMode("login"); setForgotStep(1); setAuthSuccess(""); setPassword(""); setOtpCode(""); }, 2000);
              } catch (e) { setAuthError(e.message); }
              return;
          }
      }

      // LOGIN / REGISTER FLOW
      if (!username || !password) { setAuthError("Please fill in all required fields."); return; }
      if (authMode === "register") {
          if (password !== confirmPassword) { setAuthError("Passwords do not match!"); return; }
          if (!firstName || !lastName || !mobile) { setAuthError("Name and Mobile are required."); return; }
      }
      const url = authMode === "login" ? "https://kryptonax-backend.onrender.com/token" : "https://kryptonax-backend.onrender.com/register";
      try {
          if (authMode === "register") {
             const payload = { username, password, first_name: firstName, last_name: lastName, mobile: mobile };
             const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
             const data = await res.json();
             if (!res.ok) throw new Error(data.detail || "Registration failed");
             setAuthMode("login"); setAuthSuccess("Account created! Please log in."); return;
          }
          const formData = new FormData(); formData.append("username", username); formData.append("password", password);
          const res = await fetch(url, { method: "POST", body: formData });
          const data = await res.json();
          if (!res.ok) throw new Error(data.detail || "Invalid Credentials");
          setToken(data.access_token); setUserName(data.user_name);
          localStorage.setItem("token", data.access_token); localStorage.setItem("userName", data.user_name);
          setShowAuthModal(false); setUsername(""); setPassword(""); setConfirmPassword(""); setFirstName(""); setLastName(""); setMobile("");
      } catch (e) { setAuthError(e.message); }
  };

  const logout = () => { setToken(null); setUserName(""); localStorage.removeItem("token"); localStorage.removeItem("userName"); setFavorites([]); };
  const handleReset = () => { setTicker(""); setSearchedTicker(""); setNews([]); setMergedData([]); setCurrentQuote(null); setCompareTicker(""); setActiveComparison(null); localStorage.removeItem("lastTicker"); setView("dashboard"); };
  const saveSearchHistory = (t) => { const newHistory = [t, ...searchHistory.filter(item => item !== t)].slice(0, 5); setSearchHistory(newHistory); localStorage.setItem("searchHistory", JSON.stringify(newHistory)); };
  const fetchBatchQuotes = async (tickersList) => { if (!tickersList?.length) return; try { const res = await fetch(`https://kryptonax-backend.onrender.com/api/quotes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(tickersList) }); const data = await res.json(); setPricesCache(prev => ({ ...prev, ...data })); } catch (e) {} };
  const handleSearch = async (overrideTicker = null) => { const t = overrideTicker || ticker; if (!t) return; setShowSuggestions(false); setTicker(t); setSearchedTicker(t); setLoading(true); setNews([]); setMergedData([]); setActiveComparison(null); setCompareTicker(""); setCurrentQuote(null); localStorage.setItem("lastTicker", t); saveSearchHistory(t); setView("dashboard"); try { fetchQuote(t); const newsRes = await fetch(`https://kryptonax-backend.onrender.com/news/${t}?period=${timeRange}`); setNews(await newsRes.json()); setChartRange("1mo"); await updateChart(t, "1mo", null); } catch (error) { console.error(error); } setLoading(false); };
  const fetchQuote = async (symbol) => { try { const res = await fetch(`https://kryptonax-backend.onrender.com/quote/${symbol}`); setCurrentQuote(await res.json()); } catch (e) {} };
  const fetchHistoryData = async (symbol, range) => { try { const res = await fetch(`https://kryptonax-backend.onrender.com/history/${symbol}?period=${range}`); return await res.json(); } catch (e) { return {currency: "", data: []}; } };
  const updateChart = async (mainSym, range, compSym) => { const mainRes = await fetchHistoryData(mainSym, range); setCurrency(mainRes.currency); let finalData = mainRes.data; if (compSym) { const compRes = await fetchHistoryData(compSym, range); const dataMap = new Map(); mainRes.data.forEach(item => dataMap.set(item.date, { date: item.date, price: item.price })); compRes.data.forEach(item => { if (dataMap.has(item.date)) dataMap.get(item.date).comparePrice = item.price; else dataMap.set(item.date, { date: item.date, comparePrice: item.price }); }); finalData = Array.from(dataMap.values()).sort((a,b) => a.date.localeCompare(b.date)); } setMergedData(finalData); };
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
      <nav style={{ backgroundColor: "#1e222d", padding: "15px 40px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid #2a2e39", position: "sticky", top: 0, zIndex: 1000 }}>
        <div style={{ fontSize: "24px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "20px" }}><span onClick={() => setView("dashboard")} style={{cursor: "pointer"}}><span style={{ color: "#2962ff" }}>KRYPTONAX</span> | <span style={{fontSize: "16px", fontWeight: "normal", color: "#787b86"}}>Financial Intelligence</span></span>{searchedTicker && view === "dashboard" && <button onClick={handleReset} style={{ fontSize: "14px", padding: "5px 15px", backgroundColor: "#2a2e39", border: "1px solid #787b86", color: "#d1d4dc", borderRadius: "4px", cursor: "pointer" }}>← Back to Home</button>}</div>
     
        <div style={{display: "flex", alignItems: "center", gap: "25px"}}><span onClick={() => setView("about")} style={{cursor: "pointer", color: view === "about" ? "#2962ff" : "#d1d4dc", fontWeight: "bold", transition: "0.2s"}}>About Us</span>{userName && <span style={{color: "#00e676", fontWeight: "bold"}}>Hi, {userName}</span>}{token ? ( <button onClick={logout} style={{ background: "#ff1744", color: "white", padding: "8px 20px", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Logout</button> ) : ( <button onClick={() => setShowAuthModal(true)} style={{ background: "#2962ff", color: "white", padding: "8px 20px", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Login / Sign Up</button> )}</div>
      </nav>

      {/* LOGIN / FORGOT / REGISTER MODAL */}
      {showAuthModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
            <div style={{ backgroundColor: "#1e222d", padding: "40px", borderRadius: "8px", border: "1px solid #2a2e39", width: "400px", textAlign: "center", position: "relative" }}>
                <button onClick={() => {setShowAuthModal(false); setAuthMode("login"); setForgotStep(1);}} style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", color: "#787b86", fontSize: "20px", cursor: "pointer" }}>✕</button>
                <h2 style={{ color: "white", marginTop: 0 }}>
                    {authMode === "login" ? "Welcome Back" : authMode === "register" ? "Create Account" : "Reset Password"}
                </h2>
                {authError && <p style={{color: "#ff1744", fontSize: "14px"}}>{authError}</p>}
                {authSuccess && <p style={{color: "#00e676", fontSize: "14px"}}>{authSuccess}</p>}
                
                {authMode === "forgot" ? (
                    <>
                        {forgotStep === 1 ? (
                            <>
                                <p style={{color: "#787b86", fontSize: "13px"}}>Enter your email to receive an OTP.</p>
                                <input type="text" placeholder="Email Address" value={username} onChange={e => setUsername(e.target.value)} style={{ width: "95%", padding: "10px", margin: "5px 0", backgroundColor: "#131722", border: "1px solid #2a2e39", color: "white", borderRadius: "4px" }} />
                                <button onClick={handleAuth} style={{ width: "100%", padding: "12px", background: "#2962ff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", marginTop: "15px" }}>Send OTP</button>
                            </>
                        ) : (
                            <>
                                <input type="text" placeholder="Enter 6-Digit OTP" value={otpCode} onChange={e => setOtpCode(e.target.value)} style={{ width: "95%", padding: "10px", margin: "5px 0", backgroundColor: "#131722", border: "1px solid #2a2e39", color: "white", borderRadius: "4px", textAlign: "center", letterSpacing: "5px", fontWeight: "bold" }} />
                                <div style={{ position: "relative", width: "100%", margin: "5px 0" }}>
                                    <input type={showPassword ? "text" : "password"} placeholder="New Password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: "95%", padding: "10px", backgroundColor: "#131722", border: "1px solid #2a2e39", color: "white", borderRadius: "4px" }} />
                                </div>
                                <div style={{ position: "relative", width: "100%", margin: "5px 0" }}>
                                    <input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ width: "95%", padding: "10px", backgroundColor: "#131722", border: "1px solid #2a2e39", color: "white", borderRadius: "4px" }} />
                                </div>
                                <button onClick={handleAuth} style={{ width: "100%", padding: "12px", background: "#2962ff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", marginTop: "15px" }}>Reset Password</button>
                            </>
                        )}
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
                        <div style={{ position: "relative", width: "100%", margin: "5px 0" }}>
                            <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: "95%", padding: "10px", backgroundColor: "#131722", border: "1px solid #2a2e39", color: "white", borderRadius: "4px" }} />
                            <span onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "20px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", fontSize: "18px" }}>{showPassword ? "🙈" : "👁️"}</span>
                        </div>
                        {authMode === "register" && (
                            <div style={{ position: "relative", width: "100%", margin: "5px 0" }}>
                                <input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ width: "95%", padding: "10px", backgroundColor: "#131722", border: "1px solid #2a2e39", color: "white", borderRadius: "4px" }} />
                                <span onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: "absolute", right: "20px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", fontSize: "18px" }}>{showConfirmPassword ? "🙈" : "👁️"}</span>
                            </div>
                        )}
                        {authMode === "login" && (
                            <p style={{ fontSize: "12px", color: "#2962ff", cursor: "pointer", textAlign: "right", marginTop: "5px" }} onClick={() => { setAuthMode("forgot"); setAuthError(""); }}>Forgot Password?</p>
                        )}
                        <button onClick={handleAuth} style={{ width: "100%", padding: "12px", background: "#2962ff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", marginTop: "15px" }}>{authMode === "login" ? "Login" : "Sign Up"}</button>
                        <p style={{ fontSize: "12px", color: "#787b86", marginTop: "20px", cursor: "pointer" }} onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthError(""); }}>{authMode === "login" ? "Don't have an account? Sign Up" : "Already have an account? Login"}</p>
                    </>
                )}
            </div>
        </div>
      )}

      {showAboutModal && ( <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 }}> <div style={{ backgroundColor: "#1e222d", padding: "50px", borderRadius: "12px", border: "1px solid #2a2e39", width: "700px", color: "#d1d4dc", position: "relative" }}> <button onClick={() => setShowAboutModal(false)} style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: "white", fontSize: "24px", cursor: "pointer" }}>✕</button> <h1 style={{ color: "#2962ff", textAlign: "center", marginBottom: "30px" }}>About Kryptonax</h1> <div style={{ display: "flex", gap: "40px", marginBottom: "30px" }}> <div style={{ flex: 1 }}> <h3 style={{ color: "white" }}>Our Mission</h3> <p style={{ lineHeight: "1.6", color: "#a1a1a1" }}> Kryptonax was built to democratize financial intelligence. We believe that real-time market data, AI-driven sentiment analysis, and professional charting tools should be accessible to everyone. </p> </div> </div> <div style={{ borderTop: "1px solid #2a2e39", paddingTop: "20px", textAlign: "center" }}> <h3 style={{ color: "white", marginBottom: "10px" }}>Built for the Modern Investor</h3> <p style={{ fontSize: "14px", color: "#787b86" }}>© 2024 Kryptonax Financial Inc. All rights reserved.</p> </div> </div> </div> )}

      {view === "about" ? (
        <div style={{ flex: 1, color: "#d1d4dc", paddingBottom: "60px" }}>
            <div style={{ textAlign: "center", padding: "80px 20px", background: "linear-gradient(180deg, #1e222d 0%, #131722 100%)", borderBottom: "1px solid #2a2e39" }}> <h1 style={{ fontSize: "48px", marginBottom: "20px", color: "white" }}>Empowering Your <span style={{color: "#2962ff"}}>Financial Future</span></h1> <p style={{ fontSize: "18px", color: "#787b86", maxWidth: "700px", margin: "0 auto", lineHeight: "1.6" }}> Kryptonax is built to democratize financial intelligence. We believe that real-time market data, AI-driven sentiment analysis, and professional tools should be accessible to everyone. </p> <button onClick={() => setView("dashboard")} style={{ marginTop: "30px", padding: "12px 30px", background: "#2962ff", color: "white", border: "none", borderRadius: "4px", fontSize: "16px", cursor: "pointer", fontWeight: "bold" }}>Start Analyzing</button> </div>
            <div style={{ maxWidth: "1200px", margin: "60px auto", padding: "0 20px" }}> <h2 style={{ textAlign: "center", fontSize: "32px", marginBottom: "40px", color: "white" }}>Why Investors Choose Kryptonax</h2> <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "30px" }}> <div style={{ padding: "30px", backgroundColor: "#1e222d", borderRadius: "8px", border: "1px solid #2a2e39" }}><div style={{ fontSize: "30px", marginBottom: "15px" }}>⚡</div><h3 style={{ color: "white", marginBottom: "10px" }}>Real-Time Precision</h3><p style={{ color: "#787b86", lineHeight: "1.5" }}>Access live market data for stocks, crypto, and commodities. Never miss a beat with our millisecond-latency feeds.</p></div> <div style={{ padding: "30px", backgroundColor: "#1e222d", borderRadius: "8px", border: "1px solid #2a2e39" }}><div style={{ fontSize: "30px", marginBottom: "15px" }}>🤖</div><h3 style={{ color: "white", marginBottom: "10px" }}>AI Sentiment Engine</h3><p style={{ color: "#787b86", lineHeight: "1.5" }}>Our proprietary NLP algorithms analyze thousands of news articles instantly to tell you if the market mood is Bullish or Bearish.</p></div> <div style={{ padding: "30px", backgroundColor: "#1e222d", borderRadius: "8px", border: "1px solid #2a2e39" }}><div style={{ fontSize: "30px", marginBottom: "15px" }}>🛡️</div><h3 style={{ color: "white", marginBottom: "10px" }}>Institutional Grade</h3><p style={{ color: "#787b86", lineHeight: "1.5" }}>Built with the same security and reliability standards as major hedge funds. Your data and watchlist are secure.</p></div> </div> </div>
        </div>
      ) : (
        <div style={{ display: "flex", maxWidth: "1600px", margin: "30px auto", gap: "20px", padding: "0 20px", flex: 1, width: "100%", boxSizing: "border-box" }}>
            <aside style={{ width: "300px", backgroundColor: "#1e222d", padding: "20px", borderRadius: "4px", border: "1px solid #2a2e39", height: "fit-content" }}>
                <h3 style={{ borderBottom: "1px solid #2a2e39", paddingBottom: "10px", color: "#d1d4dc", fontSize: "16px" }}>⭐ My Watchlist</h3>
                {!token && <p style={{fontSize: "12px", color: "#787b86"}}>Login to save your favorites.</p>}
                <div style={{ display: "flex", gap: "5px", marginBottom: "20px", position: "relative" }}> <input type="text" placeholder="Add Ticker..." value={newFav} onChange={(e) => { setNewFav(e.target.value.toUpperCase()); setShowFavSuggestions(true); fetchSuggestions(e.target.value, true); }} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #2a2e39", backgroundColor: "#131722", color: "white" }} /> <button onClick={() => toggleFavorite(newFav)} style={{ background: "#2962ff", color: "white", border: "none", borderRadius: "4px", padding: "0 15px", cursor: "pointer" }}>+</button> {showFavSuggestions && favSuggestions.length > 0 && ( <div style={{ position: "absolute", top: "40px", left: 0, width: "100%", backgroundColor: "#1e222d", zIndex: 10, border: "1px solid #2a2e39", boxShadow: "0 4px 10px rgba(0,0,0,0.5)" }}> {favSuggestions.map(s => <div key={s.symbol} onClick={() => toggleFavorite(s.symbol)} style={{ padding: "8px", cursor: "pointer", borderBottom: "1px solid #2a2e39", fontSize: "13px" }}><span style={{fontWeight: "bold", color: "#2962ff"}}>{s.symbol}</span> <span style={{color: "#787b86"}}>({s.name})</span></div>)} </div> )} </div>
                <ul style={{ listStyle: "none", padding: 0 }}> {favorites.map(fav => ( <li key={fav.ticker} style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", padding: "10px", backgroundColor: "#2a2e39", borderRadius: "4px" }}> <span style={{ cursor: "pointer", fontWeight: "bold", color: "#d1d4dc" }} onClick={() => handleSearch(fav.ticker)}>{fav.ticker}</span> <button onClick={(e) => { e.stopPropagation(); toggleFavorite(fav.ticker); }} style={{ border: "none", background: "none", color: "#ff1744", cursor: "pointer" }}>✕</button> </li> ))} </ul>
                <h3 style={{ marginTop: "30px", borderBottom: "1px solid #2a2e39", paddingBottom: "10px", color: "#d1d4dc", fontSize: "16px" }}>🚀 Global Movers</h3> <ul style={{ listStyle: "none", padding: 0 }}> {trending.map((t, i) => ( <li key={t.ticker} style={{ marginBottom: "8px", paddingBottom: "8px", borderBottom: "1px solid #2a2e39" }}> <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}> <span style={{ cursor: "pointer", fontWeight: "bold", color: "#d1d4dc" }} onClick={() => handleSearch(t.ticker)}>{t.ticker}</span> <span style={{ color: t.change >= 0 ? "#00e676" : "#ff1744", fontWeight: "bold", fontSize: "14px" }}>{t.change > 0 ? "+" : ""}{t.change}%</span> </div> </li> ))} </ul>
            </aside>

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
                        <div style={{ marginBottom: "20px", display: "flex", alignItems: "baseline", gap: "15px" }}> <h1 style={{ margin: 0, color: "white", fontSize: "36px" }}>{currentQuote?.price} <span style={{fontSize: "16px", color: "#787b86"}}>{currentQuote?.currency}</span></h1> <span style={{ fontSize: "20px", fontWeight: "bold", color: currentQuote?.change >= 0 ? "#00e676" : "#ff1744" }}>{currentQuote?.change > 0 ? "+" : ""}{currentQuote?.change} ({currentQuote?.percent}%)</span> <span style={{ color: "#787b86", fontSize: "14px" }}>Latest Quote</span> </div>
                        {(news.length > 0 || mergedData.length > 0) && ( <div> <div style={{ display: "flex", gap: "20px", marginBottom: "20px", flexWrap: "wrap" }}> {news.length > 0 && ( <div style={{ flex: 1, backgroundColor: "#1e222d", padding: "20px", borderRadius: "4px", border: "1px solid #2a2e39", textAlign: "center" }}> <h4 style={{ color: "#d1d4dc", marginBottom: "20px" }}>AI Sentiment</h4> <PieChart width={250} height={250}> <Pie data={activeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"> {activeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)} </Pie> <Tooltip contentStyle={{backgroundColor: "#1e222d", borderColor: "#2a2e39", color: "#ffffff"}} itemStyle={{color: "#ffffff"}} /> <Legend /> </PieChart> </div> )} {mergedData.length > 0 && ( <div style={{ flex: 2, backgroundColor: "#1e222d", padding: "20px", borderRadius: "4px", border: "1px solid #2a2e39" }}> <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}> <h4 style={{ margin: 0, color: "#d1d4dc" }}>{searchedTicker} Price Action</h4> <div style={{ display: "flex", gap: "5px" }}> {!activeComparison ? ( <><input type="text" placeholder="VS (e.g. GLD)" value={compareTicker} onChange={(e) => setCompareTicker(e.target.value.toUpperCase())} style={{ padding: "6px", border: "1px solid #2a2e39", borderRadius: "4px", backgroundColor: "#131722", color: "white", width: "100px" }} /><button onClick={handleComparisonSearch} style={{ padding: "6px 12px", background: "#2a2e39", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>VS</button></> ) : ( <button onClick={clearComparison} style={{ padding: "6px 12px", background: "#ff1744", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Clear {activeComparison}</button> )} </div> </div> <ResponsiveContainer width="100%" height={300}> <LineChart data={mergedData}> <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2e39" /> <XAxis dataKey="date" tick={{fontSize: 11, fill: "#787b86"}} axisLine={false} tickLine={false} /> <YAxis yAxisId="left" domain={['auto', 'auto']} tick={{fontSize: 11, fill: "#787b86"}} axisLine={false} tickLine={false} /> {activeComparison && <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} tick={{fontSize: 11, fill: "#ff9800"}} axisLine={false} tickLine={false} />} <Tooltip contentStyle={{backgroundColor: "#131722", border: "1px solid #2a2e39", color: "#d1d4dc"}} /> <Line yAxisId="left" type="monotone" dataKey="price" name={searchedTicker} stroke="#2962ff" strokeWidth={2} dot={false} /> {activeComparison && <Line yAxisId="right" type="monotone" dataKey="comparePrice" name={activeComparison} stroke="#ff9800" strokeWidth={2} dot={false} />} </LineChart> </ResponsiveContainer> <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "20px" }}> {['1d', '5d', '1mo', '6mo', '1y'].map(r => <button key={r} onClick={() => setChartRange(r)} style={{ padding: "4px 12px", borderRadius: "4px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "bold", backgroundColor: chartRange === r ? "#2962ff" : "#2a2e39", color: chartRange === r ? "white" : "#787b86" }}>{r.toUpperCase()}</button>)} </div> </div> )} </div> <h3 style={{ borderLeft: "4px solid #2962ff", paddingLeft: "15px", color: "#d1d4dc" }}>Latest Intelligence</h3> {news.map((article, index) => ( <div key={index} className="news-card" style={{ borderLeft: getBorderColor(article.sentiment), padding: "20px", marginBottom: "15px", backgroundColor: "#1e222d", borderRadius: "4px", border: "1px solid #2a2e39" }}> <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}> <span style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: article.sentiment === 'positive' ? '#00e676' : article.sentiment === 'negative' ? '#ff1744' : '#651fff' }}>{article.sentiment}</span> <span style={{ fontSize: "12px", color: "#787b86" }}>{new Date(article.publishedAt).toLocaleDateString()}</span> </div> <h3 style={{ margin: "0 0 5px 0", fontSize: "18px" }}><a href={article.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "#d1d4dc" }}>{article.title}</a></h3> </div> ))} </div> )}
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
                                        <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", lineHeight: "1.4" }}>
                                            <a href={article.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "#d1d4dc" }}>{article.title}</a>
                                        </h3>
                                        <p style={{ fontSize: "13px", color: "#787b86", lineHeight: "1.5" }}>{article.description ? article.description.substring(0, 100) + "..." : "Click to read more."}</p>
                                    </div>
                                    <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #2a2e39" }}>
                                        <a href={article.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: "#2962ff", textDecoration: "none", fontWeight: "bold" }}>Read Full Story →</a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
      )}
      <footer style={{ backgroundColor: "#1e222d", borderTop: "1px solid #2a2e39", padding: "60px 20px", marginTop: "auto" }}> <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "40px" }}> <div style={{ maxWidth: "300px" }}> <h2 style={{ fontSize: "24px", color: "#ffffff", marginBottom: "15px" }}><span style={{ color: "#2962ff" }}>KRYPTONAX</span></h2> <p style={{ color: "#787b86", fontSize: "14px", lineHeight: "1.6" }}>The #1 financial intelligence platform for students and professionals. Real-time data, AI sentiment analysis, and institutional-grade charting in one place.</p> <div style={{ display: "flex", gap: "15px", marginTop: "20px" }}> <span style={{ color: "#d1d4dc", cursor: "pointer", fontSize: "20px" }}>𝕏</span> <span style={{ color: "#d1d4dc", cursor: "pointer", fontSize: "20px" }}>in</span> <span style={{ color: "#d1d4dc", cursor: "pointer", fontSize: "20px" }}>📸</span> </div> </div> <div style={{ display: "flex", gap: "60px", flexWrap: "wrap" }}> <div> <h4 style={{ color: "white", marginBottom: "20px" }}>Product</h4> <ul style={{ listStyle: "none", padding: 0, color: "#787b86", fontSize: "14px", lineHeight: "2.5" }}> <li style={{ cursor: "pointer" }}>Charting</li> <li style={{ cursor: "pointer" }}>AI Sentiment</li> <li style={{ cursor: "pointer" }}>Screeners</li> <li style={{ cursor: "pointer" }}>Pricing</li> </ul> </div> <div> <h4 style={{ color: "white", marginBottom: "20px" }}>Company</h4> <ul style={{ listStyle: "none", padding: 0, color: "#787b86", fontSize: "14px", lineHeight: "2.5" }}> <li style={{ cursor: "pointer" }} onClick={() => setView("about")}>About Us</li> <li style={{ cursor: "pointer" }}>Careers</li> <li style={{ cursor: "pointer" }}>Blog</li> <li style={{ cursor: "pointer" }}>Contact</li> </ul> </div> <div> <h4 style={{ color: "white", marginBottom: "20px" }}>Legal</h4> <ul style={{ listStyle: "none", padding: 0, color: "#787b86", fontSize: "14px", lineHeight: "2.5" }}> <li style={{ cursor: "pointer" }}>Terms of Service</li> <li style={{ cursor: "pointer" }}>Privacy Policy</li> <li style={{ cursor: "pointer" }}>Disclaimer</li> </ul> </div> </div> </div> <div style={{ textAlign: "center", borderTop: "1px solid #2a2e39", marginTop: "40px", paddingTop: "20px", color: "#555", fontSize: "12px" }}>&copy; 2024 Kryptonax Financial Inc. All rights reserved. Data provided by Yahoo Finance & NewsAPI.</div> </footer>
    </div>
  );
}

export default App;