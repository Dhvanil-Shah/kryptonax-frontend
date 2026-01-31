// import React, { useState, useEffect, useMemo } from 'react';
// import { 
//   PieChart, Pie, Cell, Tooltip, Legend, AreaChart, Area, XAxis, YAxis, 
//   CartesianGrid, ResponsiveContainer, ComposedChart, Line, Bar, Brush, ReferenceLine 
// } from 'recharts';
// import ReactGA from "react-ga4";

// // --- CONFIGURATION ---
// const API_BASE_URL = "https://kryptonax-backend.onrender.com";
// ReactGA.initialize("G-REEV9CZE52");

// // --- ICONS ---
// const BellIcon = ({ active, onClick }) => (
//   <svg onClick={onClick} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={active ? "#FFD700" : "none"} stroke={active ? "#FFD700" : "#787b86"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer', marginLeft: '10px', transition: 'all 0.2s' }}>
//     <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
//     <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
//   </svg>
// );

// const MoreIcon = ({ onClick }) => (
//   <svg onClick={onClick} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#787b86" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer', marginLeft: 'auto' }}>
//     <circle cx="12" cy="12" r="1"></circle>
//     <circle cx="12" cy="5" r="1"></circle>
//     <circle cx="12" cy="19" r="1"></circle>
//   </svg>
// );

// // --- CUSTOM SHAPE: CANDLESTICK ---
// const Candle = (props) => {
//   const { x, y, width, height, low, high, open, close } = props;
//   const isGreen = close > open;
//   const color = isGreen ? "#00e676" : "#ff1744";
//   const yBottom = y + height;
//   const yTop = y;
  
//   return (
//     <g stroke={color} fill={color} strokeWidth="2">
//       <path d={`M ${x + width / 2},${yTop} L ${x + width / 2},${yBottom}`} />
//       <rect x={x} y={y + height * 0.25} width={width} height={height * 0.5} fill={color} stroke="none" />
//     </g>
//   );
// };

// // --- HELPER: SIMULATE CANDLE DATA ---
// const simulateCandles = (data) => {
//     if (!data || data.length === 0) return [];
//     return data.map(d => {
//         const close = d.price;
//         const volatility = close * 0.02; 
//         const open = close + (Math.random() - 0.5) * volatility;
//         const high = Math.max(open, close) + Math.random() * volatility;
//         const low = Math.min(open, close) - Math.random() * volatility;
//         return { ...d, open, high, low, close };
//     });
// };

// // --- HELPER: GENERATE UNIQUE PREDICTIONS ---
// const generateUniquePrediction = (historyData, ticker) => {
//     if (!historyData || historyData.length === 0 || !ticker) return [];
//     let seed = 0;
//     for (let i = 0; i < ticker.length; i++) seed += ticker.charCodeAt(i);
    
//     const lastPoint = historyData[historyData.length - 1];
//     let lastPrice = lastPoint.price;
//     const futureData = [];
//     const trendDirection = (seed % 2 === 0) ? 1 : -1; 
    
//     let lastDate = new Date(lastPoint.date);
//     for (let i = 1; i <= 15; i++) {
//         const nextDate = new Date(lastDate);
//         nextDate.setDate(lastDate.getDate() + 1);
//         const wave = Math.sin(i * 0.5) * lastPrice * 0.02;
//         const trend = i * lastPrice * 0.005 * trendDirection;
//         const randomNoise = (Math.sin(seed * i) * lastPrice * 0.01);
//         const predictedPrice = lastPrice + wave + trend + randomNoise;
        
//         futureData.push({
//             date: nextDate.toISOString().split('T')[0],
//             predicted: predictedPrice,
//             upper: predictedPrice * (1.05 + (i * 0.01)), 
//             lower: predictedPrice * (0.95 - (i * 0.01)),
//             isPrediction: true
//         });
//         lastDate = nextDate;
//     }
//     const past = historyData.map(d => ({ ...d, predicted: d.price, upper: d.price, lower: d.price }));
//     return [...past, ...futureData];
// };

// // --- FLUID GAUGE ---
// const SentimentGauge = ({ data, newsCounts }) => {
//   const getFluidSentiment = () => {
//     if (!data || data.length < 5) return { rotation: 0, text: "Analyzing...", color: "#FFD700" };
//     const prices = data.map(d => d.price);
//     const current = prices[prices.length - 1];
//     const start = prices[0];
//     const changePct = ((current - start) / start) * 100; 
//     const pos = newsCounts.find(n => n.name === 'Positive')?.value || 0;
//     const neg = newsCounts.find(n => n.name === 'Negative')?.value || 0;
//     const newsScore = (pos - neg) * 2; 
//     let totalScore = (changePct * 10) + newsScore; 
//     const rotation = Math.max(-90, Math.min(90, totalScore * 3)); 
//     let text = "Neutral", color = "#FFD700";
//     if (rotation > 45) { text = "Strong Buy"; color = "#00e676"; }
//     else if (rotation > 10) { text = "Buy"; color = "#69f0ae"; }
//     else if (rotation < -45) { text = "Strong Sell"; color = "#ff1744"; }
//     else if (rotation < -10) { text = "Sell"; color = "#ff5252"; }
//     return { rotation, text, color };
//   };
//   const { rotation, text, color } = getFluidSentiment();
//   return (
//     <div style={{ backgroundColor: "#1e222d", padding: "20px", borderRadius: "4px", border: "1px solid #2a2e39", textAlign: "center", position: 'relative', height: '250px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
//       <h4 style={{ color: "#d1d4dc", marginBottom: "0px" }}>Technical Analysis</h4>
//       <p style={{ fontSize: "11px", color: "#787b86" }}>Fluid AI Calculation</p>
//       <svg viewBox="0 0 200 120" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
//         <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#2a2e39" strokeWidth="15" strokeLinecap="round" />
//         <path d="M 20 100 A 80 80 0 0 1 100 20" fill="none" stroke="url(#gradSell)" strokeWidth="15" strokeLinecap="round" />
//         <path d="M 100 20 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gradBuy)" strokeWidth="15" strokeLinecap="round" />
//         <defs>
//             <linearGradient id="gradSell" x1="0%" y1="0%" x2="100%" y2="0%"> <stop offset="0%" stopColor="#ff1744" /> <stop offset="100%" stopColor="#FFD700" /> </linearGradient>
//             <linearGradient id="gradBuy" x1="0%" y1="0%" x2="100%" y2="0%"> <stop offset="0%" stopColor="#FFD700" /> <stop offset="100%" stopColor="#00e676" /> </linearGradient>
//         </defs>
//         <g transform={`rotate(${rotation}, 100, 100)`} style={{ transition: 'transform 0.5s ease-out' }}>
//           <path d="M 100 100 L 100 25" stroke="white" strokeWidth="4" strokeLinecap="round" />
//           <circle cx="100" cy="100" r="8" fill="#1e222d" stroke="white" strokeWidth="2" />
//         </g>
//         <text x="100" y="80" textAnchor="middle" fill={color} fontSize="22" fontWeight="bold" style={{textShadow: `0 0 15px ${color}`}}>{text}</text>
//       </svg>
//     </div>
//   );
// };

// function App() {
//   useEffect(() => { ReactGA.send({ hitType: "pageview", page: window.location.pathname }); }, []);

//   const [view, setView] = useState("dashboard");
//   const [ticker, setTicker] = useState("");
//   const [searchedTicker, setSearchedTicker] = useState(""); 
//   const [news, setNews] = useState([]);
//   const [generalNews, setGeneralNews] = useState([]); 
//   const [mergedData, setMergedData] = useState([]); 
//   const [candleData, setCandleData] = useState([]); 
//   const [predictiveData, setPredictiveData] = useState([]); 
//   const [currentQuote, setCurrentQuote] = useState(null); 
//   const [currency, setCurrency] = useState("USD");
//   const [loading, setLoading] = useState(false); 
//   const [isAppLoading, setIsAppLoading] = useState(false);
//   const [chartRange, setChartRange] = useState("1mo"); 
//   const [timeRange, setTimeRange] = useState("30d");
//   const [compareTicker, setCompareTicker] = useState("");
//   const [activeComparison, setActiveComparison] = useState(null); 
//   const [trending, setTrending] = useState([]);
//   const [favorites, setFavorites] = useState([]);
//   const [suggestions, setSuggestions] = useState([]);
//   const [searchHistory, setSearchHistory] = useState([]); 
//   const [showSuggestions, setShowSuggestions] = useState(false);
//   const [pricesCache, setPricesCache] = useState({}); 
//   const [newFav, setNewFav] = useState(""); 
//   const [favSuggestions, setFavSuggestions] = useState([]);
//   const [showFavSuggestions, setShowFavSuggestions] = useState(false);

//   // --- NEW FEATURES STATES ---
//   const [newsSearch, setNewsSearch] = useState(""); 
//   const [watchLater, setWatchLater] = useState([]); 
//   const [activeMenu, setActiveMenu] = useState(null); 
//   const [notifications, setNotifications] = useState([]); 

//   // --- AUTH STATES ---
//   const [token, setToken] = useState(localStorage.getItem("token"));
//   const [userName, setUserName] = useState(localStorage.getItem("userName") || "");
//   const [showAuthModal, setShowAuthModal] = useState(false);
//   const [authMode, setAuthMode] = useState("login"); 
//   const [forgotStep, setForgotStep] = useState(1); 
//   const [authError, setAuthError] = useState("");
//   const [authSuccess, setAuthSuccess] = useState(""); 

//   // --- FORM FIELDS ---
//   const [username, setUsername] = useState(""); 
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [firstName, setFirstName] = useState("");
//   const [lastName, setLastName] = useState("");
//   const [mobile, setMobile] = useState("");
//   const [otpCode, setOtpCode] = useState(""); 
  
//   const [showAboutModal, setShowAboutModal] = useState(false);

//   const COLORS = ['#00e676', '#ff1744', '#651fff']; 

//   const styles = `
//     .news-card { transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: default; position: relative; }
//     .news-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.3) !important; border-color: #2962ff !important; }
//     .search-icon:hover { stroke: #2962ff !important; transform: translateY(-50%) scale(1.1); }
//     .loading-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(19, 23, 34, 0.8); z-index: 9999; display: flex; justify-content: center; alignItems: center; backdrop-filter: blur(2px); }
//     .spinner { width: 50px; height: 50px; border: 5px solid rgba(255, 255, 255, 0.1); border-left-color: #2962ff; border-radius: 50%; animation: spin 1s linear infinite; }
//     @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
//     .custom-scroll::-webkit-scrollbar { width: 8px; }
//     .custom-scroll::-webkit-scrollbar-track { background: #1e222d; }
//     .custom-scroll::-webkit-scrollbar-thumb { background: #2a2e39; border-radius: 4px; }
//     .custom-scroll::-webkit-scrollbar-thumb:hover { background: #2962ff; }
//     .menu-dropdown { position: absolute; top: 30px; right: 10px; background: #2a2e39; border: 1px solid #787b86; border-radius: 4px; padding: 5px; z-index: 20; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
//     .menu-item { padding: 5px 10px; font-size: 12px; color: #d1d4dc; cursor: pointer; white-space: nowrap; }
//     .menu-item:hover { background: #2962ff; color: white; }
//   `;

//   useEffect(() => {
//     document.body.style.margin = "0"; 
//     document.body.style.padding = "0"; 
//     document.body.style.backgroundColor = "#131722"; 
//     document.body.style.boxSizing = "border-box";
//     fetchTrending(); 
//     fetchGeneralNews();
    
//     // Load local storage
//     const savedWatchLater = localStorage.getItem("watchLaterNews");
//     if (savedWatchLater) setWatchLater(JSON.parse(savedWatchLater));
//     const savedNotifs = localStorage.getItem("notifications");
//     if (savedNotifs) setNotifications(JSON.parse(savedNotifs));

//     const savedHistory = localStorage.getItem("searchHistory");
//     if (savedHistory) setSearchHistory(JSON.parse(savedHistory));
    
//     // Auto load last ticker if exists
//     const lastTicker = localStorage.getItem("lastTicker");
//     if (lastTicker) { 
//         setTicker(lastTicker); 
//         handleSearch(lastTicker); 
//     }
//   }, []); // Run once on mount

//   useEffect(() => {
//       if (token) { 
//           setIsAppLoading(true); 
//           fetchFavorites().finally(() => setIsAppLoading(false)); 
//       } else {
//           // Optional: Prompt login after a delay if desired
//           // const timer = setTimeout(() => setShowAuthModal(true), 5000); 
//           // return () => clearTimeout(timer);
//       }
//   }, [token]);

//   useEffect(() => {
//     let interval = null;
//     if (searchedTicker && view === "dashboard") { 
//         // Polling for real-time updates
//         interval = setInterval(() => { 
//             fetchQuote(searchedTicker); 
//             if (chartRange === "1d") updateChart(searchedTicker, "1d", activeComparison); 
//         }, 10000); // Increased to 10s to reduce load
//     }
//     return () => clearInterval(interval);
//   }, [searchedTicker, chartRange, activeComparison, view]);

//   useEffect(() => { 
//       if (searchedTicker && view === "dashboard") updateChart(searchedTicker, chartRange, activeComparison); 
//   }, [chartRange]); 

//   // --- FEATURE HANDLERS ---
//   const toggleWatchLater = (article) => {
//       const exists = watchLater.some(item => item.title === article.title);
//       const newlist = exists ? watchLater.filter(item => item.title !== article.title) : [...watchLater, article];
//       setWatchLater(newlist);
//       localStorage.setItem("watchLaterNews", JSON.stringify(newlist));
//       setActiveMenu(null);
//   };

// const toggleNotification = async (t) => {
//       // 1. LOGIC FIX: User must be logged in to get email alerts
//       if (!token) {
//           setShowAuthModal(true);
//           return;
//       }

//       const isSubscribed = notifications.includes(t);
//       let newNotifs;

//       if (isSubscribed) {
//           // --- UNSUBSCRIBE LOGIC (Fixed) ---
//           // Remove from local list
//           newNotifs = notifications.filter(item => item !== t);
          
//           // Call Backend to STOP emails
//           try {
//               await fetch(`${API_BASE_URL}/subscribe/${t}`, {
//                   method: "DELETE", // Standard REST practice for removing a resource
//                   headers: { "Authorization": `Bearer ${token}` }
//               });
//           } catch (e) { 
//               console.error("Unsubscribe failed", e); 
//               // Optional: Revert state if API fails
//               // setNotifications(notifications); 
//               // return;
//           }
//       } else {
//           // --- SUBSCRIBE LOGIC ---
//           // Add to local list
//           newNotifs = [...notifications, t];
          
//           // Call Backend to START emails
//           try {
//               await fetch(`${API_BASE_URL}/subscribe/${t}`, {
//                   method: "POST",
//                   headers: { "Authorization": `Bearer ${token}` }
//               });
//               alert(`Alerts enabled for ${t}! Check your email.`);
//           } catch (e) { 
//               console.error("Subscribe failed", e); 
//           }
//       }

//       // 2. Update State & Storage
//       setNotifications(newNotifs);
//       localStorage.setItem("notifications", JSON.stringify(newNotifs));
//   };

//   // --- API CALLS ---
//   const fetchGeneralNews = async () => { try { const res = await fetch(`${API_BASE_URL}/news/general`); setGeneralNews(await res.json()); } catch (e) { setGeneralNews([]); } };
  
//   const handleAuth = async () => {
//       setAuthError(""); setAuthSuccess(""); setIsAppLoading(true);
//       try {
//           // --- FORGOT PASSWORD FLOW ---
//           if (authMode === "forgot") {
//               if (forgotStep === 1) {
//                   if (!username) throw new Error("Please enter your email.");
//                   const res = await fetch(`${API_BASE_URL}/forgot-password`, { 
//                       method: "POST", 
//                       headers: {"Content-Type": "application/json"}, 
//                       body: JSON.stringify({username}) 
//                   });
//                   const data = await res.json();
//                   if (!res.ok) throw new Error(data.detail || "Error sending OTP");
//                   setAuthSuccess("OTP Sent! Check your Email & Mobile."); setForgotStep(2);
//               } else if (forgotStep === 2) {
//                   if (!otpCode || !password || !confirmPassword) throw new Error("Fill all fields.");
//                   if (password !== confirmPassword) throw new Error("Passwords do not match.");
//                   const res = await fetch(`${API_BASE_URL}/reset-password`, { 
//                       method: "POST", 
//                       headers: {"Content-Type": "application/json"}, 
//                       body: JSON.stringify({username, otp: otpCode, new_password: password}) 
//                   });
//                   if (!res.ok) throw new Error("Reset failed");
//                   setAuthSuccess("Password Reset! Please Login."); 
//                   setTimeout(() => { setAuthMode("login"); setForgotStep(1); setAuthSuccess(""); setPassword(""); setOtpCode(""); }, 2000);
//               }
//               setIsAppLoading(false); return;
//           }

//           // --- LOGIN & REGISTER FLOW ---
//           if (!username || !password) throw new Error("Please fill in all required fields.");
          
//           if (authMode === "register") {
//              if (password !== confirmPassword || !firstName || !mobile) throw new Error("Check all fields.");
//              const payload = { username, password, first_name: firstName, last_name: lastName, mobile: mobile };
//              const res = await fetch(`${API_BASE_URL}/register`, { 
//                  method: "POST", 
//                  headers: { "Content-Type": "application/json" }, 
//                  body: JSON.stringify(payload) 
//              });
//              if (!res.ok) throw new Error("Registration failed");
//              setAuthMode("login"); setAuthSuccess("Account created! Please login."); 
//           } else {
//              // LOGIN (Standard OAuth2 Form Data)
//              const formData = new FormData(); 
//              formData.append("username", username); 
//              formData.append("password", password);
//              const res = await fetch(`${API_BASE_URL}/token`, { method: "POST", body: formData });
//              const data = await res.json();
             
//              if (!res.ok) throw new Error(data.detail || "Invalid Credentials");
             
//              setToken(data.access_token); setUserName(data.user_name || username.split('@')[0]);
//              localStorage.setItem("token", data.access_token); 
//              localStorage.setItem("userName", data.user_name || username.split('@')[0]);
//              setShowAuthModal(false); setUsername(""); setPassword("");
//           }
//       } catch (e) { setAuthError(e.message); } finally { setIsAppLoading(false); }
//   };

//   const logout = () => { setToken(null); setUserName(""); localStorage.removeItem("token"); localStorage.removeItem("userName"); setFavorites([]); };
  
//   const handleReset = () => { 
//       setTicker(""); setSearchedTicker(""); setNews([]); setMergedData([]); 
//       setCurrentQuote(null); setCompareTicker(""); setActiveComparison(null); 
//       localStorage.removeItem("lastTicker"); setView("dashboard"); 
//       setCandleData([]); setPredictiveData([]);
//   };

//   const saveSearchHistory = (t) => { 
//       if(!t) return;
//       const newHistory = [t, ...searchHistory.filter(item => item !== t)].slice(0, 5); 
//       setSearchHistory(newHistory); 
//       localStorage.setItem("searchHistory", JSON.stringify(newHistory)); 
//   };

//   const fetchBatchQuotes = async (tickersList) => { 
//       if (!tickersList?.length) return; 
//       try { 
//           const res = await fetch(`${API_BASE_URL}/api/quotes`, { 
//               method: "POST", 
//               headers: { "Content-Type": "application/json" }, 
//               body: JSON.stringify(tickersList) 
//           }); 
//           const data = await res.json(); 
//           setPricesCache(prev => ({ ...prev, ...data })); 
//       } catch (e) {} 
//   };
  
//   const handleSearch = async (overrideTicker = null) => { 
//       const t = overrideTicker || ticker; if (!t) return; 
//       setShowSuggestions(false); setTicker(t); setSearchedTicker(t); setLoading(true); 
//       setNews([]); setMergedData([]); setActiveComparison(null); setCompareTicker(""); 
//       setCurrentQuote(null); localStorage.setItem("lastTicker", t); saveSearchHistory(t); setView("dashboard"); 
      
//       try { 
//           await fetchQuote(t); 
//           const newsRes = await fetch(`${API_BASE_URL}/news/${t}?period=${timeRange}`); 
//           const newsData = await newsRes.json();
//           setNews(Array.isArray(newsData) ? newsData : []); 
//           setChartRange("1mo"); 
//           await updateChart(t, "1mo", null); 
//       } catch (error) { console.error(error); } 
//       setLoading(false); 
//   };

//   const fetchQuote = async (symbol) => { 
//       try { 
//           const res = await fetch(`${API_BASE_URL}/quote/${symbol}`); 
//           if(res.ok) setCurrentQuote(await res.json()); 
//       } catch (e) {} 
//   };

//   const fetchHistoryData = async (symbol, range) => { 
//       try { 
//           const res = await fetch(`${API_BASE_URL}/history/${symbol}?period=${range}`); 
//           const json = await res.json();
//           return json.data ? json : {currency: "", data: []}; 
//       } catch (e) { return {currency: "", data: []}; } 
//   };
  
//   const updateChart = async (mainSym, range, compSym) => { 
//       const mainRes = await fetchHistoryData(mainSym, range); 
//       setCurrency(mainRes.currency); 
//       let finalData = mainRes.data || []; 
      
//       if (compSym) { 
//           const compRes = await fetchHistoryData(compSym, range); 
//           const dataMap = new Map(); 
//           finalData.forEach(item => dataMap.set(item.date, { date: item.date, price: item.price })); 
//           (compRes.data || []).forEach(item => { 
//               if (dataMap.has(item.date)) dataMap.get(item.date).comparePrice = item.price; 
//               else dataMap.set(item.date, { date: item.date, comparePrice: item.price }); 
//           }); 
//           finalData = Array.from(dataMap.values()).sort((a,b) => a.date.localeCompare(b.date)); 
//       } 
//       setMergedData(finalData);
//       setCandleData(simulateCandles(finalData)); 
//       setPredictiveData(generateUniquePrediction(finalData, mainSym)); 
//   };

//   const onSearchFocus = () => { setShowSuggestions(true); if (searchHistory.length > 0) fetchBatchQuotes(searchHistory); };
  
//   const fetchSuggestions = async (query, isFav = false) => { 
//       if (query.length < 2) { 
//           if (isFav) setFavSuggestions([]); else setSuggestions([]); 
//           return; 
//       } 
//       try { 
//           const res = await fetch(`${API_BASE_URL}/api/search/${query}`); 
//           const data = await res.json(); 
//           if (isFav) setFavSuggestions(data); 
//           else { 
//               setSuggestions(data); 
//               fetchBatchQuotes(data.map(s => s.symbol)); 
//           } 
//       } catch (e) { } 
//   };

//   const fetchTrending = async () => { try { const res = await fetch(`${API_BASE_URL}/trending`); setTrending(await res.json()); } catch (e) {} };
  
//   const fetchFavorites = async () => { 
//       try { 
//           const res = await fetch(`${API_BASE_URL}/favorites`, { headers: { "Authorization": `Bearer ${token}` } }); 
//           if (res.ok) setFavorites(await res.json()); 
//       } catch (e) {} 
//   };

//   const toggleFavorite = async (t) => { 
//       if (!token) { setShowAuthModal(true); return; } 
//       if (!t) return; 
//       const isFav = favorites.some(f => f.ticker === t); 
//       const method = isFav ? "DELETE" : "POST"; 
//       await fetch(`${API_BASE_URL}/favorites/${t}`, { method, headers: { "Authorization": `Bearer ${token}` } }); 
//       fetchFavorites(); setNewFav(""); setShowFavSuggestions(false); 
//   };

//   const getBorderColor = (s) => (s === "positive" ? "4px solid #00e676" : s === "negative" ? "4px solid #ff1744" : "1px solid #651fff");
  
//   // --- DERIVED STATE ---
//   const filteredNews = useMemo(() => news.filter(n => n.title?.toLowerCase().includes(newsSearch.toLowerCase())), [news, newsSearch]);
//   const filteredGeneralNews = useMemo(() => generalNews.filter(n => n.title?.toLowerCase().includes(newsSearch.toLowerCase())), [generalNews, newsSearch]);

//   const sentimentCounts = useMemo(() => [ 
//       { name: 'Positive', value: news.filter(n => n.sentiment === 'positive').length }, 
//       { name: 'Negative', value: news.filter(n => n.sentiment === 'negative').length }, 
//       { name: 'Neutral', value: news.filter(n => n.sentiment === 'neutral' || !n.sentiment).length } 
//   ], [news]);
  
//   const activeData = sentimentCounts.filter(item => item.value > 0);

//   return (
//     <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "#131722", minHeight: "100vh", color: "#d1d4dc", display: "flex", flexDirection: "column" }}>
//       <style>{styles}</style>
//       {(isAppLoading || loading) && ( <div className="loading-overlay"> <div className="spinner"></div> </div> )}

//       <nav style={{ backgroundColor: "#1e222d", padding: "15px 40px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid #2a2e39", position: "sticky", top: 0, zIndex: 1000 }}>
//         <div style={{ fontSize: "24px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "20px" }}><span onClick={() => setView("dashboard")} style={{cursor: "pointer"}}><span style={{ color: "#2962ff" }}>KRYPTONAX</span> | <span style={{fontSize: "16px", fontWeight: "normal", color: "#787b86"}}>Financial Intelligence</span></span>{searchedTicker && view === "dashboard" && <button onClick={handleReset} style={{ fontSize: "14px", padding: "5px 15px", backgroundColor: "#2a2e39", border: "1px solid #787b86", color: "#d1d4dc", borderRadius: "4px", cursor: "pointer" }}>← Back to Home</button>}</div>
//         <div style={{display: "flex", alignItems: "center", gap: "25px"}}><span onClick={() => setView("about")} style={{cursor: "pointer", color: view === "about" ? "#2962ff" : "#d1d4dc", fontWeight: "bold", transition: "0.2s"}}>About Us</span>{userName && <span style={{color: "#00e676", fontWeight: "bold"}}>Hi, {userName}</span>}{token ? ( <button onClick={logout} style={{ background: "#ff1744", color: "white", padding: "8px 20px", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Logout</button> ) : ( <button onClick={() => setShowAuthModal(true)} style={{ background: "#2962ff", color: "white", padding: "8px 20px", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Login / Sign Up</button> )}</div>
//       </nav>

//       {/* --- AUTH MODAL --- */}
//       {showAuthModal && (
//         <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
//             <div style={{ backgroundColor: "#1e222d", padding: "40px", borderRadius: "8px", border: "1px solid #2a2e39", width: "400px", textAlign: "center", position: "relative" }}>
//                 <button onClick={() => {setShowAuthModal(false); setAuthMode("login"); setForgotStep(1);}} style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", color: "#787b86", fontSize: "20px", cursor: "pointer" }}>✕</button>
//                 <h2 style={{ color: "white", marginTop: 0 }}>{authMode === "login" ? "Welcome Back" : authMode === "register" ? "Create Account" : "Reset Password"}</h2>
//                 {authError && <p style={{color: "#ff1744", fontSize: "14px"}}>{authError}</p>}
//                 {authSuccess && <p style={{color: "#00e676", fontSize: "14px"}}>{authSuccess}</p>}
                
//                 {authMode === "forgot" ? (
//                     <>
//                         {forgotStep === 1 ? ( <><input type="text" placeholder="Email Address" value={username} onChange={e => setUsername(e.target.value)} style={{ width: "95%", padding: "10px", margin: "5px 0", backgroundColor: "#131722", border: "1px solid #2a2e39", color: "white", borderRadius: "4px" }} /><button onClick={handleAuth} style={{ width: "100%", padding: "12px", background: "#2962ff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", marginTop: "15px" }}>Send OTP</button></> ) : ( <><input type="text" placeholder="Enter 6-Digit OTP" value={otpCode} onChange={e => setOtpCode(e.target.value)} style={{ width: "95%", padding: "10px", margin: "5px 0", backgroundColor: "#131722", border: "1px solid #2a2e39", color: "white", borderRadius: "4px", textAlign: "center", letterSpacing: "5px", fontWeight: "bold" }} /><input type="password" placeholder="New Password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: "95%", padding: "10px", backgroundColor: "#131722", border: "1px solid #2a2e39", color: "white", borderRadius: "4px", marginTop: "5px" }} /><input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ width: "95%", padding: "10px", backgroundColor: "#131722", border: "1px solid #2a2e39", color: "white", borderRadius: "4px", marginTop: "5px" }} /><button onClick={handleAuth} style={{ width: "100%", padding: "12px", background: "#2962ff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", marginTop: "15px" }}>Reset Password</button></> )}
//                         <p style={{ fontSize: "12px", color: "#787b86", marginTop: "15px", cursor: "pointer" }} onClick={() => { setAuthMode("login"); setForgotStep(1); }}>Back to Login</p>
//                     </>
//                 ) : (
//                     <>
//                         {authMode === "register" && ( 
//                             <>
//                                 <div style={{display: "flex", gap: "10px"}}>
//                                     <input type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} style={{ width: "50%", padding: "10px", margin: "5px 0", backgroundColor: "#131722", border: "1px solid #2a2e39", color: "white", borderRadius: "4px" }} />
//                                     <input type="text" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} style={{ width: "50%", padding: "10px", margin: "5px 0", backgroundColor: "#131722", border: "1px solid #2a2e39", color: "white", borderRadius: "4px" }} />
//                                 </div>
//                                 <input type="text" placeholder="Mobile Number" value={mobile} onChange={e => setMobile(e.target.value)} style={{ width: "95%", padding: "10px", margin: "5px 0", backgroundColor: "#131722", border: "1px solid #2a2e39", color: "white", borderRadius: "4px" }} />
//                             </>
//                         )}
//                         <input type="text" placeholder="Email (Username)" value={username} onChange={e => setUsername(e.target.value)} style={{ width: "95%", padding: "10px", margin: "5px 0", backgroundColor: "#131722", border: "1px solid #2a2e39", color: "white", borderRadius: "4px" }} />
//                         <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: "95%", padding: "10px", backgroundColor: "#131722", border: "1px solid #2a2e39", color: "white", borderRadius: "4px", marginTop: "5px" }} />
//                         {authMode === "register" && <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ width: "95%", padding: "10px", backgroundColor: "#131722", border: "1px solid #2a2e39", color: "white", borderRadius: "4px", marginTop: "5px" }} />}
                        
//                         {authMode === "login" && <p style={{ fontSize: "12px", color: "#2962ff", cursor: "pointer", textAlign: "right", marginTop: "5px" }} onClick={() => { setAuthMode("forgot"); setAuthError(""); }}>Forgot Password?</p>}
                        
//                         <button onClick={handleAuth} style={{ width: "100%", padding: "12px", background: "#2962ff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", marginTop: "15px" }}>{authMode === "login" ? "Login" : "Sign Up"}</button>
//                         <p style={{ fontSize: "12px", color: "#787b86", marginTop: "20px", cursor: "pointer" }} onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthError(""); }}>{authMode === "login" ? "Don't have an account? Sign Up" : "Already have an account? Login"}</p>
//                     </>
//                 )}
//             </div>
//         </div>
//       )}

//       {showAboutModal && ( <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 }}> <div style={{ backgroundColor: "#1e222d", padding: "50px", borderRadius: "12px", border: "1px solid #2a2e39", width: "700px", color: "#d1d4dc", position: "relative" }}> <button onClick={() => setShowAboutModal(false)} style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: "white", fontSize: "24px", cursor: "pointer" }}>✕</button> <h1 style={{ color: "#2962ff", textAlign: "center", marginBottom: "30px" }}>About Kryptonax</h1> <p style={{ lineHeight: "1.6", color: "#a1a1a1" }}> Kryptonax was built to democratize financial intelligence. </p> </div> </div> )}

//       {view === "about" ? (
//         <div style={{ flex: 1, color: "#d1d4dc", paddingBottom: "60px", textAlign: "center", padding: "80px 20px" }}>
//             <h1 style={{ fontSize: "48px", marginBottom: "20px", color: "white" }}>Empowering Your <span style={{color: "#2962ff"}}>Financial Future</span></h1>
//             <button onClick={() => setView("dashboard")} style={{ marginTop: "30px", padding: "12px 30px", background: "#2962ff", color: "white", border: "none", borderRadius: "4px", fontSize: "16px", cursor: "pointer", fontWeight: "bold" }}>Start Analyzing</button>
//         </div>
//       ) : (
//         <div style={{ display: "flex", maxWidth: "1600px", margin: "30px auto", gap: "20px", padding: "0 20px", flex: 1, width: "100%", boxSizing: "border-box" }}>
            
//             {/* SIDEBAR - NOW WITH WATCH LATER */}
//             {!searchedTicker && (
//                 <aside style={{ width: "300px", backgroundColor: "#1e222d", padding: "20px", borderRadius: "4px", border: "1px solid #2a2e39", height: "fit-content" }}>
//                     <h3 style={{ borderBottom: "1px solid #2a2e39", paddingBottom: "10px", color: "#d1d4dc", fontSize: "16px" }}>⭐ My Watchlist</h3>
//                     {!token && <p style={{fontSize: "12px", color: "#787b86"}}>Login to save your favorites.</p>}
//                     <div style={{ display: "flex", gap: "5px", marginBottom: "20px", position: "relative" }}> <input type="text" placeholder="Add Ticker..." value={newFav} onChange={(e) => { setNewFav(e.target.value.toUpperCase()); setShowFavSuggestions(true); fetchSuggestions(e.target.value, true); }} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #2a2e39", backgroundColor: "#131722", color: "white" }} /> <button onClick={() => toggleFavorite(newFav)} style={{ background: "#2962ff", color: "white", border: "none", borderRadius: "4px", padding: "0 15px", cursor: "pointer" }}>+</button> {showFavSuggestions && favSuggestions.length > 0 && ( <div style={{ position: "absolute", top: "40px", left: 0, width: "100%", backgroundColor: "#1e222d", zIndex: 10, border: "1px solid #2a2e39", boxShadow: "0 4px 10px rgba(0,0,0,0.5)" }}> {favSuggestions.map(s => <div key={s.symbol} onClick={() => toggleFavorite(s.symbol)} style={{ padding: "8px", cursor: "pointer", borderBottom: "1px solid #2a2e39", fontSize: "13px" }}><span style={{fontWeight: "bold", color: "#2962ff"}}>{s.symbol}</span> <span style={{color: "#787b86"}}>({s.name})</span></div>)} </div> )} </div>
//                     <ul style={{ listStyle: "none", padding: 0 }}> {favorites.map(fav => ( <li key={fav.ticker} style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", padding: "10px", backgroundColor: "#2a2e39", borderRadius: "4px" }}> <span style={{ cursor: "pointer", fontWeight: "bold", color: "#d1d4dc" }} onClick={() => handleSearch(fav.ticker)}>{fav.ticker}</span> <button onClick={(e) => { e.stopPropagation(); toggleFavorite(fav.ticker); }} style={{ border: "none", background: "none", color: "#ff1744", cursor: "pointer" }}>✕</button> </li> ))} </ul>
                    
//                     {/* NEW: WATCH LATER NEWS SECTION */}
//                     {watchLater.length > 0 && (
//                         <>
//                             <h3 style={{ marginTop: "30px", borderBottom: "1px solid #2a2e39", paddingBottom: "10px", color: "#d1d4dc", fontSize: "16px" }}>🔖 Watch Later News</h3>
//                             <ul style={{ listStyle: "none", padding: 0 }}>
//                                 {watchLater.map((article, i) => (
//                                     <li key={i} style={{ marginBottom: "10px", padding: "10px", backgroundColor: "#2a2e39", borderRadius: "4px", fontSize: "12px", position: 'relative' }}>
//                                         <div style={{fontWeight: 'bold', marginBottom: '5px'}}><a href={article.url} target="_blank" rel="noopener noreferrer" style={{color: '#d1d4dc', textDecoration: 'none'}}>{article.title.substring(0, 40)}...</a></div>
//                                         <button onClick={() => toggleWatchLater(article)} style={{ position: 'absolute', top: '5px', right: '5px', background: 'none', border: 'none', color: '#ff1744', cursor: 'pointer' }}>✕</button>
//                                     </li>
//                                 ))}
//                             </ul>
//                         </>
//                     )}

//                     <h3 style={{ marginTop: "30px", borderBottom: "1px solid #2a2e39", paddingBottom: "10px", color: "#d1d4dc", fontSize: "16px" }}>🚀 Global Movers</h3> <ul style={{ listStyle: "none", padding: 0 }}> {trending.map((t, i) => ( <li key={t.ticker} style={{ marginBottom: "8px", paddingBottom: "8px", borderBottom: "1px solid #2a2e39" }}> <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}> <span style={{ cursor: "pointer", fontWeight: "bold", color: "#d1d4dc" }} onClick={() => handleSearch(t.ticker)}>{t.ticker}</span> <span style={{ color: t.change >= 0 ? "#00e676" : "#ff1744", fontWeight: "bold", fontSize: "14px" }}>{t.change > 0 ? "+" : ""}{t.change}%</span> </div> </li> ))} </ul>
//                 </aside>
//             )}

//             <main style={{ flex: 1 }}>
//                 <div style={{ backgroundColor: "#1e222d", padding: "20px", borderRadius: "4px", marginBottom: "20px", border: "1px solid #2a2e39" }}>
//                     <div style={{ display: "flex", gap: "10px", justifyContent: "center", position: "relative" }}>
//                         <div style={{ flex: 1, position: "relative" }}>
//                             {/* --- ROUNDED SEARCH BOX --- */}
//                             <input type="text" placeholder="Search (e.g. BTC-USD, AAPL)..." value={ticker} onChange={(e) => { setTicker(e.target.value.toUpperCase()); setShowSuggestions(true); fetchSuggestions(e.target.value); }} onFocus={onSearchFocus} style={{ width: "100%", padding: "12px", paddingRight: "40px", borderRadius: "30px", border: "1px solid #2a2e39", backgroundColor: "#131722", color: "white", fontSize: "16px", boxSizing: "border-box" }} />
//                             <svg onClick={() => handleSearch()} xmlns="http://www.w3.org/2000/svg" className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#787b86" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", transition: "0.2s" }}> <circle cx="11" cy="11" r="8"></circle> <line x1="21" y1="21" x2="16.65" y2="16.65"></line> </svg>
//                         </div>
//                         {/* --- ROUNDED DROPDOWN --- */}
//                         <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} style={{ padding: "12px", borderRadius: "30px", border: "1px solid #2a2e39", backgroundColor: "#131722", color: "white", cursor: "pointer" }}><option value="1d">1 Day</option><option value="3d">3 Days</option><option value="5d">5 Days</option><option value="7d">7 Days</option><option value="15d">15 Days</option><option value="30d">30 Days</option></select>
//                         {/* --- ROUNDED BUTTON --- */}
//                         <button onClick={() => handleSearch()} disabled={loading} style={{ padding: "12px 30px", background: "#2962ff", color: "white", border: "none", borderRadius: "30px", cursor: "pointer", fontWeight: "bold" }}>Search</button>
//                         {showSuggestions && ( <div style={{ position: "absolute", top: "50px", left: 0, width: "60%", backgroundColor: "#1e222d", zIndex: 100, border: "1px solid #2a2e39", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}> {ticker.length < 2 && searchHistory.length > 0 && ( <div> <div style={{ padding: "5px 10px", fontSize: "11px", color: "#787b86", backgroundColor: "#131722", borderBottom: "1px solid #2a2e39" }}>RECENT SEARCHES</div> {searchHistory.map((h, i) => ( <div key={i} onClick={() => handleSearch(h)} style={{ padding: "10px", cursor: "pointer", borderBottom: "1px solid #2a2e39", display: "flex", justifyContent: "space-between" }}><span style={{color: "#d1d4dc"}}>🕒 {h}</span>{pricesCache[h] && (<span style={{ color: pricesCache[h].color, fontSize: "13px", fontWeight: "bold" }}>{pricesCache[h].price} ({pricesCache[h].percent}%)</span>)}</div> ))} </div> )} {ticker.length >= 2 && suggestions.map(s => ( <div key={s.symbol} onClick={() => handleSearch(s.symbol)} style={{ padding: "12px", cursor: "pointer", borderBottom: "1px solid #2a2e39", display: "flex", justifyContent: "space-between" }}><div><span style={{fontWeight: "bold", color: "#2962ff"}}>{s.symbol}</span><span style={{color: "#787b86", fontSize: "12px", marginLeft: "10px"}}>{s.name}</span></div>{pricesCache[s.symbol] && (<span style={{ color: pricesCache[s.symbol].color, fontSize: "13px", fontWeight: "bold" }}>{pricesCache[s.symbol].price} ({pricesCache[s.symbol].percent}%)</span>)}</div> ))} </div> )}
//                     </div>
//                 </div>

//                 {searchedTicker ? (
//                     <>
//                         <div style={{ marginBottom: "20px", display: "flex", alignItems: "baseline", gap: "15px" }}> 
//                             <h1 style={{ margin: 0, color: "white", fontSize: "36px" }}>{currentQuote?.price} <span style={{fontSize: "16px", color: "#787b86"}}>{currentQuote?.currency}</span></h1> 
//                             <span style={{ fontSize: "20px", fontWeight: "bold", color: currentQuote?.change >= 0 ? "#00e676" : "#ff1744" }}>{currentQuote?.change > 0 ? "+" : ""}{currentQuote?.change} ({currentQuote?.percent}%)</span> 
//                             {/* --- BELL ICON FEATURE --- */}
//                             <BellIcon active={notifications.includes(searchedTicker)} onClick={() => toggleNotification(searchedTicker)} />
//                         </div>

//                         {/* --- 3-COLUMN LAYOUT --- */}
//                         <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "20px" }}>
                            
//                             {/* COLUMN 1: GRAPHS */}
//                             <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
//                                 <div style={{ backgroundColor: "#1e222d", padding: "20px", borderRadius: "4px", border: "1px solid #2a2e39" }}>
//                                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}> 
//                                         <h4 style={{ margin: 0, color: "#d1d4dc" }}>{searchedTicker} Price Action</h4> 
//                                         <div style={{ display: "flex", gap: "5px" }}> {['1d', '5d', '1mo', '6mo', '1y'].map(r => <button key={r} onClick={() => setChartRange(r)} style={{ padding: "4px 12px", borderRadius: "4px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "bold", backgroundColor: chartRange === r ? "#2962ff" : "#2a2e39", color: chartRange === r ? "white" : "#787b86" }}>{r.toUpperCase()}</button>)} </div>
//                                     </div> 
//                                     <ResponsiveContainer width="100%" height={300}> 
//                                         {/* CANDLESTICK CHART */}
//                                         <ComposedChart data={candleData}>
//                                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2e39" opacity={0.5} />
//                                             <XAxis dataKey="date" tick={{fontSize: 11, fill: "#787b86"}} axisLine={false} tickLine={false} />
//                                             <YAxis domain={['auto', 'auto']} tick={{fontSize: 11, fill: "#787b86"}} axisLine={false} tickLine={false} />
//                                             <Tooltip contentStyle={{backgroundColor: "#131722", border: "1px solid #2a2e39"}} labelStyle={{color: '#d1d4dc'}} />
//                                             <Bar dataKey="close" shape={<Candle />} />
//                                         </ComposedChart>
//                                     </ResponsiveContainer>
//                                     <div style={{ textAlign: 'center', fontSize: '11px', color: '#787b86', marginTop: '10px' }}>*Candles are simulated for visual demo.</div>
//                                 </div>
                                
//                                 {/* PREDICTIVE ANALYSIS GRAPH */}
//                                 <div style={{ backgroundColor: "#1e222d", padding: "20px", borderRadius: "4px", border: "1px solid #2a2e39", position: "relative" }}>
//                                      <h4 style={{ color: "#d1d4dc", marginBottom: "15px" }}>📉 Predictive Analysis (Forecast +15 Days)</h4>
//                                      <ResponsiveContainer width="100%" height={250}>
//                                         <ComposedChart data={predictiveData}>
//                                             <defs>
//                                                 <linearGradient id="bandGradient" x1="0" y1="0" x2="0" y2="1">
//                                                     <stop offset="0%" stopColor="#00e676" stopOpacity={0.2} />
//                                                     <stop offset="100%" stopColor="#00e676" stopOpacity={0.05} />
//                                                 </linearGradient>
//                                             </defs>
//                                             <CartesianGrid stroke="#2a2e39" opacity={0.5} vertical={false} />
//                                             <XAxis dataKey="date" tick={{fontSize: 10, fill: "#787b86"}} minTickGap={30} />
//                                             <YAxis domain={['auto', 'auto']} tick={{fontSize: 10, fill: "#787b86"}} />
//                                             <Tooltip contentStyle={{backgroundColor: "#131722", border: "1px solid #2a2e39"}} labelStyle={{color: '#d1d4dc'}} />
                                            
//                                             <Area type="monotone" dataKey="upper" stroke="none" fill="url(#bandGradient)" />
//                                             <Line type="monotone" dataKey="predicted" stroke="#00e676" strokeWidth={2} dot={false} />
//                                             <Line type="monotone" dataKey="upper" stroke="#00e676" strokeWidth={1} strokeDasharray="3 3" dot={false} opacity={0.5} />
//                                             <Line type="monotone" dataKey="lower" stroke="#00e676" strokeWidth={1} strokeDasharray="3 3" dot={false} opacity={0.5} />
                                            
//                                             <ReferenceLine x={predictiveData.find(d => d.isPrediction)?.date} stroke="#ff1744" strokeDasharray="3 3" label={{ value: 'TODAY', position: 'insideTopRight', fill: '#ff1744', fontSize: 10 }} />
//                                             <Brush dataKey="date" height={30} stroke="#2962ff" fill="#1e222d" tickFormatter={() => ''} />
//                                         </ComposedChart>
//                                      </ResponsiveContainer>
//                                 </div>
//                             </div>

//                             {/* COLUMN 2: NEWS (WITH SEARCH & WATCH LATER) */}
//                             <div className="custom-scroll" style={{ backgroundColor: "#1e222d", padding: "20px", borderRadius: "4px", border: "1px solid #2a2e39", maxHeight: "800px", overflowY: "auto" }}>
//                                 <div style={{position: "sticky", top: 0, backgroundColor: "#1e222d", zIndex: 10, paddingBottom: '10px'}}>
//                                     <h3 style={{ borderLeft: "4px solid #2962ff", paddingLeft: "15px", color: "#d1d4dc", marginBottom: "10px" }}>Latest News</h3>
//                                     {/* NEWS SEARCH BAR */}
//                                     <input type="text" placeholder="Filter News..." value={newsSearch} onChange={(e) => setNewsSearch(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #2a2e39', backgroundColor: '#131722', color: 'white', marginBottom: '10px' }} />
//                                 </div>
//                                 {filteredNews.map((article, index) => ( 
//                                     <div key={index} className="news-card" style={{ borderLeft: getBorderColor(article.sentiment), padding: "20px", marginBottom: "15px", backgroundColor: "#131722", borderRadius: "4px", border: "1px solid #2a2e39" }}> 
//                                         <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}> 
//                                             <span style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: article.sentiment === 'positive' ? '#00e676' : article.sentiment === 'negative' ? '#ff1744' : '#651fff' }}>{article.sentiment}</span> 
//                                             <span style={{ fontSize: "12px", color: "#787b86" }}>{new Date(article.publishedAt).toLocaleDateString()}</span> 
//                                             {/* THREE DOTS MENU */}
//                                             <div style={{position: 'relative'}}>
//                                                 <MoreIcon onClick={() => setActiveMenu(activeMenu === index ? null : index)} />
//                                                 {activeMenu === index && (
//                                                     <div className="menu-dropdown">
//                                                         <div className="menu-item" onClick={() => toggleWatchLater(article)}>
//                                                             {watchLater.some(w => w.title === article.title) ? "Remove Watch Later" : "Watch Later"}
//                                                         </div>
//                                                     </div>
//                                                 )}
//                                             </div>
//                                         </div> 
//                                         <h3 style={{ margin: "0 0 5px 0", fontSize: "16px" }}><a href={article.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "#d1d4dc" }}>{article.title}</a></h3> 
//                                     </div> 
//                                 ))}
//                             </div>

//                             {/* COLUMN 3: SENTIMENT */}
//                             <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
//                                 <div style={{ backgroundColor: "#1e222d", padding: "20px", borderRadius: "4px", border: "1px solid #2a2e39", textAlign: "center" }}> 
//                                     <h4 style={{ color: "#d1d4dc", marginBottom: "20px" }}>News Sentiment</h4> 
//                                     <div style={{display: "flex", justifyContent: "center"}}>
//                                         <PieChart width={250} height={250}> 
//                                             <Pie data={activeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"> {activeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)} </Pie> 
//                                             <Tooltip contentStyle={{backgroundColor: "#1e222d", borderColor: "#2a2e39", color: "#ffffff"}} itemStyle={{color: "#ffffff"}} /> <Legend /> 
//                                         </PieChart> 
//                                     </div>
//                                 </div>
//                                 <SentimentGauge data={mergedData} newsCounts={sentimentCounts} />
//                             </div>

//                         </div>
//                     </>
//                 ) : (
//                     <div>
//                         <h2 style={{color: "white", marginBottom: "20px", borderLeft: "4px solid #2962ff", paddingLeft: "15px"}}>🔥 Trending Market Headlines</h2>
//                         {/* GENERAL NEWS SEARCH */}
//                         <div style={{marginBottom: '20px'}}>
//                             <input type="text" placeholder="Search Headlines..." value={newsSearch} onChange={(e) => setNewsSearch(e.target.value)} style={{ padding: '10px', width: '300px', borderRadius: '30px', border: '1px solid #2a2e39', backgroundColor: '#1e222d', color: 'white' }} />
//                         </div>
//                         <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "20px" }}>
//                             {filteredGeneralNews.map((article, index) => (
//                                 <div key={index} className="news-card" style={{ backgroundColor: "#1e222d", borderRadius: "8px", border: "1px solid #2a2e39", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
//                                     <div>
//                                         <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
//                                             <span style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: getBorderColor(article.sentiment).split(' ')[2] }}>{article.sentiment}</span>
//                                             <span style={{ fontSize: "12px", color: "#787b86" }}>{new Date(article.publishedAt).toLocaleDateString()}</span>
//                                             <div style={{position: 'relative'}}>
//                                                 <MoreIcon onClick={() => setActiveMenu(activeMenu === `gen-${index}` ? null : `gen-${index}`)} />
//                                                 {activeMenu === `gen-${index}` && (
//                                                     <div className="menu-dropdown">
//                                                         <div className="menu-item" onClick={() => toggleWatchLater(article)}>
//                                                             {watchLater.some(w => w.title === article.title) ? "Remove Watch Later" : "Watch Later"}
//                                                         </div>
//                                                     </div>
//                                                 )}
//                                             </div>
//                                         </div>
//                                         <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", lineHeight: "1.4" }}><a href={article.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "#d1d4dc" }}>{article.title}</a></h3>
//                                         <p style={{ fontSize: "13px", color: "#787b86", lineHeight: "1.5" }}>{article.description ? article.description.substring(0, 100) + "..." : "Click to read more."}</p>
//                                     </div>
//                                     <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #2a2e39" }}><a href={article.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: "#2962ff", textDecoration: "none", fontWeight: "bold" }}>Read Full Story →</a></div>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>
//                 )}
//             </main>
//         </div>
//       )}
//       <footer style={{ backgroundColor: "#1e222d", borderTop: "1px solid #2a2e39", padding: "60px 20px", marginTop: "auto" }}> <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "40px" }}> <div style={{ maxWidth: "300px" }}> <h2 style={{ fontSize: "24px", color: "#ffffff", marginBottom: "15px" }}><span style={{ color: "#2962ff" }}>KRYPTONAX</span></h2> <p style={{ color: "#787b86", fontSize: "14px", lineHeight: "1.6" }}>The #1 financial intelligence platform for students and professionals. Real-time data, AI sentiment analysis, and institutional-grade charting in one place.</p> </div> <div style={{ display: "flex", gap: "60px", flexWrap: "wrap" }}> <div> <h4 style={{ color: "white", marginBottom: "20px" }}>Product</h4> <ul style={{ listStyle: "none", padding: 0, color: "#787b86", fontSize: "14px", lineHeight: "2.5" }}> <li>Charting</li> <li>AI Sentiment</li> <li>Screeners</li> <li>Pricing</li> </ul> </div> </div> </div> <div style={{ textAlign: "center", borderTop: "1px solid #2a2e39", marginTop: "40px", paddingTop: "20px", color: "#555", fontSize: "12px" }}>&copy; 2024 Kryptonax Financial Inc. All rights reserved. Data provided by Yahoo Finance & NewsAPI.</div> </footer>
//     </div>
//   );
// }

// export default App;



import React, { useState, useEffect, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, Legend, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, ResponsiveContainer, ComposedChart, Line, Bar, Brush, ReferenceLine 
} from 'recharts';
import ReactGA from "react-ga4";
import ChatBot from './ChatBot';

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

// --- HELPER: SIMULATE CANDLE DATA ---
const simulateCandles = (data) => {
    if (!data || data.length === 0) return [];
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
    if (!historyData || historyData.length === 0 || !ticker) return [];
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
    if (!data || data.length < 5) return { rotation: 0, text: "Analyzing...", color: "#FFD700" };
    const prices = data.map(d => d.price);
    const current = prices[prices.length - 1];
    const start = prices[0];
    const changePct = ((current - start) / start) * 100; 
    const pos = newsCounts.find(n => n.name === 'Positive')?.value || 0;
    const neg = newsCounts.find(n => n.name === 'Negative')?.value || 0;
    const newsScore = (pos - neg) * 2; 
    let totalScore = (changePct * 10) + newsScore; 
    const rotation = Math.max(-90, Math.min(90, totalScore * 3)); 
    let text = "Neutral", color = "#FFD700";
    if (rotation > 45) { text = "Strong Buy"; color = "#00e676"; }
    else if (rotation > 10) { text = "Buy"; color = "#69f0ae"; }
    else if (rotation < -45) { text = "Strong Sell"; color = "#ff1744"; }
    else if (rotation < -10) { text = "Sell"; color = "#ff5252"; }
    return { rotation, text, color };
  };
  const { rotation, text, color } = getFluidSentiment();
  return (
    <div style={{ backgroundColor: "#1e222d", padding: "20px", borderRadius: "4px", border: "1px solid #2a2e39", textAlign: "center", position: 'relative', height: '250px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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

  // --- NEW FEATURES STATES ---
  const [newsSearch, setNewsSearch] = useState(""); 
  const [watchLater, setWatchLater] = useState([]); 
  const [activeMenu, setActiveMenu] = useState(null); 
  const [notifications, setNotifications] = useState([]); 
    const [moverRegion, setMoverRegion] = useState("all");
    const [newsCategory, setNewsCategory] = useState("all");

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
        fetchTrending(moverRegion); 
    fetchGeneralNews();
    
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
        fetchTrending(moverRegion);
        try {
            id = setInterval(() => fetchTrending(moverRegion), 15000); // refresh every 15s
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
  const fetchGeneralNews = async () => { try { const res = await fetch(`${API_BASE_URL}/news/general`); setGeneralNews(await res.json()); } catch (e) { setGeneralNews([]); } };
  
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
      setPredictiveData(generateUniquePrediction(finalData, mainSym)); 
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

    const fetchTrending = async (region = 'all') => { 
        try { 
            const res = await fetch(`${API_BASE_URL}/trending?region=${region}`); 
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
        if (!trending || trending.length === 0) return [];
        if (moverRegion === 'all') return trending;
        return trending.filter(t => {
            const s = (t.ticker || '').toUpperCase();
            if (moverRegion === 'india') return /\.NS|\.BO|RELIANCE|TCS|INFY|HDFCBANK/.test(s);
            if (moverRegion === 'us') return !(/\.NS|\.BO/.test(s));
            return true;
        });
    }, [trending, moverRegion]);

  const sentimentCounts = useMemo(() => [ 
      { name: 'Positive', value: news.filter(n => n.sentiment === 'positive').length }, 
      { name: 'Negative', value: news.filter(n => n.sentiment === 'negative').length }, 
      { name: 'Neutral', value: news.filter(n => n.sentiment === 'neutral' || !n.sentiment).length } 
  ], [news]);
  
  const activeData = sentimentCounts.filter(item => item.value > 0);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "#131722", minHeight: "100vh", color: "#d1d4dc", display: "flex", flexDirection: "column" }}>
      <style>{styles}</style>
      {(isAppLoading || loading) && ( <div className="loading-overlay"> <div className="spinner"></div> </div> )}

      <nav style={{ backgroundColor: "#1e222d", padding: "15px 40px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid #2a2e39", position: "sticky", top: 0, zIndex: 1000 }}>
        <div style={{ fontSize: "24px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "20px" }}><span onClick={() => setView("dashboard")} style={{cursor: "pointer"}}><span style={{ color: "#2962ff" }}>KRYPTONAX</span> | <span style={{fontSize: "16px", fontWeight: "normal", color: "#787b86"}}>Financial Intelligence</span></span>{searchedTicker && view === "dashboard" && <button onClick={handleReset} style={{ fontSize: "14px", padding: "5px 15px", backgroundColor: "#2a2e39", border: "1px solid #787b86", color: "#d1d4dc", borderRadius: "4px", cursor: "pointer" }}>← Back to Home</button>}</div>
        <div style={{display: "flex", alignItems: "center", gap: "25px"}}><span onClick={() => setShowChatBot(true)} style={{cursor: "pointer", color: "#d1d4dc", fontWeight: "bold", transition: "0.2s", fontSize: "14px"}}>Chat with Bot</span><span onClick={() => setView("about")} style={{cursor: "pointer", color: view === "about" ? "#2962ff" : "#d1d4dc", fontWeight: "bold", transition: "0.2s"}}>About Us</span>{userName && <span style={{color: "#00e676", fontWeight: "bold"}}>Hi, {userName}</span>}{token ? ( <button onClick={logout} style={{ background: "#ff1744", color: "white", padding: "8px 20px", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Logout</button> ) : ( <button onClick={() => setShowAuthModal(true)} style={{ background: "#2962ff", color: "white", padding: "8px 20px", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Login / Sign Up</button> )}</div>
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
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px' }}>
                                                <select value={moverRegion} onChange={(e) => setMoverRegion(e.target.value)} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #2a2e39", backgroundColor: "#131722", color: "white", cursor: "pointer" }}>
                                                        <option value="all">All (Main Mix)</option>
                                                        <option value="india">India</option>
                                                        <option value="us">US</option>
                                                </select>
                                        </div>
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

            <main style={{ flex: 1 }}>
                <div style={{ backgroundColor: "#1e222d", padding: "20px", borderRadius: "4px", marginBottom: "20px", border: "1px solid #2a2e39" }}>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "center", position: "relative" }}>
                        <div style={{ flex: 1, position: "relative" }}>
                            {/* --- ROUNDED SEARCH BOX --- */}
                            <input type="text" placeholder="Search (e.g. BTC-USD, AAPL)..." value={ticker} onChange={(e) => { setTicker(e.target.value.toUpperCase()); setShowSuggestions(true); fetchSuggestions(e.target.value); }} onFocus={onSearchFocus} style={{ width: "100%", padding: "12px", paddingRight: "40px", borderRadius: "30px", border: "1px solid #2a2e39", backgroundColor: "#131722", color: "white", fontSize: "16px", boxSizing: "border-box" }} />
                            <svg onClick={() => handleSearch()} xmlns="http://www.w3.org/2000/svg" className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#787b86" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", transition: "0.2s" }}> <circle cx="11" cy="11" r="8"></circle> <line x1="21" y1="21" x2="16.65" y2="16.65"></line> </svg>
                        </div>
                        {/* --- ROUNDED DROPDOWN --- */}
                        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} style={{ padding: "12px", borderRadius: "30px", border: "1px solid #2a2e39", backgroundColor: "#131722", color: "white", cursor: "pointer" }}><option value="1d">1 Day</option><option value="3d">3 Days</option><option value="5d">5 Days</option><option value="7d">7 Days</option><option value="15d">15 Days</option><option value="30d">30 Days</option></select>
                        {/* --- ROUNDED BUTTON --- */}
                        <button onClick={() => handleSearch()} disabled={loading} style={{ padding: "12px 30px", background: "#2962ff", color: "white", border: "none", borderRadius: "30px", cursor: "pointer", fontWeight: "bold" }}>Search</button>
                        {showSuggestions && ( <div style={{ position: "absolute", top: "50px", left: 0, width: "60%", backgroundColor: "#1e222d", zIndex: 100, border: "1px solid #2a2e39", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}> {ticker.length < 2 && searchHistory.length > 0 && ( <div> <div style={{ padding: "5px 10px", fontSize: "11px", color: "#787b86", backgroundColor: "#131722", borderBottom: "1px solid #2a2e39" }}>RECENT SEARCHES</div> {searchHistory.map((h, i) => ( <div key={i} onClick={() => handleSearch(h)} style={{ padding: "10px", cursor: "pointer", borderBottom: "1px solid #2a2e39", display: "flex", justifyContent: "space-between" }}><span style={{color: "#d1d4dc"}}>🕒 {h}</span>{pricesCache[h] && (<span style={{ color: pricesCache[h].color, fontSize: "13px", fontWeight: "bold" }}>{pricesCache[h].price} ({pricesCache[h].percent}%)</span>)}</div> ))} </div> )} {ticker.length >= 2 && suggestions.map(s => ( <div key={s.symbol} onClick={() => handleSearch(s.symbol)} style={{ padding: "12px", cursor: "pointer", borderBottom: "1px solid #2a2e39", display: "flex", justifyContent: "space-between" }}><div><span style={{fontWeight: "bold", color: "#2962ff"}}>{s.symbol}</span><span style={{color: "#787b86", fontSize: "12px", marginLeft: "10px"}}>{s.name}</span></div>{pricesCache[s.symbol] && (<span style={{ color: pricesCache[s.symbol].color, fontSize: "13px", fontWeight: "bold" }}>{pricesCache[s.symbol].price} ({pricesCache[s.symbol].percent}%)</span>)}</div> ))} </div> )}
                    </div>
                </div>

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
                                <div style={{ backgroundColor: "#1e222d", padding: "20px", borderRadius: "4px", border: "1px solid #2a2e39" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}> 
                                        <h4 style={{ margin: 0, color: "#d1d4dc" }}>{searchedTicker} Price Action</h4> 
                                        <div style={{ display: "flex", gap: "5px" }}> {['1d', '5d', '1mo', '6mo', '1y'].map(r => <button key={r} onClick={() => setChartRange(r)} style={{ padding: "4px 12px", borderRadius: "4px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "bold", backgroundColor: chartRange === r ? "#2962ff" : "#2a2e39", color: chartRange === r ? "white" : "#787b86" }}>{r.toUpperCase()}</button>)} </div>
                                    </div> 
                                    <ResponsiveContainer width="100%" height={300}> 
                                        {/* CANDLESTICK CHART */}
                                        <ComposedChart data={candleData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2e39" opacity={0.5} />
                                            <XAxis dataKey="date" tick={{fontSize: 11, fill: "#787b86"}} axisLine={false} tickLine={false} />
                                            <YAxis domain={['auto', 'auto']} tick={{fontSize: 11, fill: "#787b86"}} axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={{backgroundColor: "#131722", border: "1px solid #2a2e39"}} labelStyle={{color: '#d1d4dc'}} />
                                            <Bar dataKey="close" shape={<Candle />} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                    <div style={{ textAlign: 'center', fontSize: '11px', color: '#787b86', marginTop: '10px' }}>*Candles are simulated for visual demo.</div>
                                </div>
                                
                                {/* PREDICTIVE ANALYSIS GRAPH */}
                                <div style={{ backgroundColor: "#1e222d", padding: "20px", borderRadius: "4px", border: "1px solid #2a2e39", position: "relative" }}>
                                     <h4 style={{ color: "#d1d4dc", marginBottom: "15px" }}>📉 Predictive Analysis (Forecast +15 Days)</h4>
                                     <ResponsiveContainer width="100%" height={250}>
                                        <ComposedChart data={predictiveData}>
                                            <defs>
                                                <linearGradient id="bandGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#00e676" stopOpacity={0.2} />
                                                    <stop offset="100%" stopColor="#00e676" stopOpacity={0.05} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid stroke="#2a2e39" opacity={0.5} vertical={false} />
                                            <XAxis dataKey="date" tick={{fontSize: 10, fill: "#787b86"}} minTickGap={30} />
                                            <YAxis domain={['auto', 'auto']} tick={{fontSize: 10, fill: "#787b86"}} />
                                            <Tooltip contentStyle={{backgroundColor: "#131722", border: "1px solid #2a2e39"}} labelStyle={{color: '#d1d4dc'}} />
                                            
                                            <Area type="monotone" dataKey="upper" stroke="none" fill="url(#bandGradient)" />
                                            <Line type="monotone" dataKey="predicted" stroke="#00e676" strokeWidth={2} dot={false} />
                                            <Line type="monotone" dataKey="upper" stroke="#00e676" strokeWidth={1} strokeDasharray="3 3" dot={false} opacity={0.5} />
                                            <Line type="monotone" dataKey="lower" stroke="#00e676" strokeWidth={1} strokeDasharray="3 3" dot={false} opacity={0.5} />
                                            
                                            <ReferenceLine x={predictiveData.find(d => d.isPrediction)?.date} stroke="#ff1744" strokeDasharray="3 3" label={{ value: 'TODAY', position: 'insideTopRight', fill: '#ff1744', fontSize: 10 }} />
                                            <Brush dataKey="date" height={30} stroke="#2962ff" fill="#1e222d" tickFormatter={() => ''} />
                                        </ComposedChart>
                                     </ResponsiveContainer>
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
                                const displayCatLabel = articleCat === 'all' ? '' : (articleCat === 'mutual_fund' ? 'Mutual Fund' : articleCat === 'real_estate' ? 'Real Estate' : articleCat === 'crypto' ? 'Crypto' : articleCat === 'gold' ? 'Gold' : 'Stocks');
                                return (
                                    <div key={index} className="news-card" style={{ backgroundColor: "#1e222d", borderRadius: "8px", border: "1px solid #2a2e39", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                        <div>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                                                <span style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: getBorderColor(article.sentiment).split(' ')[2] }}>{article.sentiment}</span>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <span style={{ fontSize: "12px", color: "#787b86" }}>{new Date(article.publishedAt).toLocaleDateString()}</span>
                                                    {displayCatLabel && <span style={{ fontSize: '11px', background: '#2a2e39', padding: '4px 8px', borderRadius: '12px', color: '#d1d4dc', border: '1px solid #2a2e39' }}>{displayCatLabel}</span>}
                                                </div>
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
                                            <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", lineHeight: "1.4" }}><a href={article.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "#d1d4dc" }}>{article.title}</a></h3>
                                            <p style={{ fontSize: "13px", color: "#787b86", lineHeight: "1.5" }}>{article.description ? article.description.substring(0, 100) + "..." : "Click to read more."}</p>
                                            {entityInfo && ( <div style={{ marginTop: '8px', fontSize: '12px', color: '#9fb3ff' }}>{entityInfo}</div> )}
                                        </div>
                                        <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #2a2e39" }}><a href={article.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: "#2962ff", textDecoration: "none", fontWeight: "bold" }}>Read Full Story →</a></div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>
        </div>
      )}
      <footer style={{ backgroundColor: "#1e222d", borderTop: "1px solid #2a2e39", padding: "60px 20px", marginTop: "auto" }}> <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "40px" }}> <div style={{ maxWidth: "300px" }}> <h2 style={{ fontSize: "24px", color: "#ffffff", marginBottom: "15px" }}><span style={{ color: "#2962ff" }}>KRYPTONAX</span></h2> <p style={{ color: "#787b86", fontSize: "14px", lineHeight: "1.6" }}>The #1 financial intelligence platform for students and professionals. Real-time data, AI sentiment analysis, and institutional-grade charting in one place.</p> </div> <div style={{ display: "flex", gap: "60px", flexWrap: "wrap" }}> <div> <h4 style={{ color: "white", marginBottom: "20px" }}>Product</h4> <ul style={{ listStyle: "none", padding: 0, color: "#787b86", fontSize: "14px", lineHeight: "2.5" }}> <li>Charting</li> <li>AI Sentiment</li> <li>Screeners</li> <li>Pricing</li> </ul> </div> </div> </div> <div style={{ textAlign: "center", borderTop: "1px solid #2a2e39", marginTop: "40px", paddingTop: "20px", color: "#555", fontSize: "12px" }}>&copy; 2024 Kryptonax Financial Inc. All rights reserved. Data provided by Yahoo Finance & NewsAPI.</div> </footer>

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
    </div>
  );
}

export default App;


