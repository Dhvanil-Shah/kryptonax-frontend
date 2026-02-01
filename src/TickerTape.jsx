import React, { useState, useEffect, useRef } from 'react';
import './TickerTape.css';

const TickerTape = ({ region, onStockClick }) => {
  const [stocks, setStocks] = useState([]);
  const [isHovered, setIsHovered] = useState(false);
  const scrollContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Stock symbols based on region
  const stockSymbols = {
    INDIA: [
      'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS',
      'HINDUNILVR.NS', 'BHARTIARTL.NS', 'ITC.NS', 'SBIN.NS', 'LT.NS',
      'AXISBANK.NS', 'KOTAKBANK.NS', 'ASIANPAINT.NS', 'MARUTI.NS', 'BAJFINANCE.NS',
      'HCLTECH.NS', 'TITAN.NS', 'WIPRO.NS', 'ULTRACEMCO.NS', 'NESTLEIND.NS'
    ],
    USA: [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK-B',
      'V', 'JPM', 'JNJ', 'WMT', 'PG', 'MA', 'HD', 'DIS', 'PYPL',
      'NFLX', 'ADBE', 'CRM', 'INTC', 'AMD', 'CSCO', 'PFE'
    ]
  };

  const symbols = stockSymbols[region] || stockSymbols.INDIA;

  useEffect(() => {
    fetchStockData();
    const interval = setInterval(fetchStockData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [region]);

  const fetchStockData = async () => {
    try {
      const promises = symbols.map(async (symbol) => {
        const response = await fetch(`https://kryptonax-backend.onrender.com/stock-price/${symbol}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        return {
          symbol: symbol,
          displaySymbol: symbol.replace('.NS', '').replace('.BO', ''),
          price: data.price,
          change: data.change,
          changePercent: data.change_percent
        };
      });

      const results = await Promise.allSettled(promises);
      const validStocks = results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value)
        .filter(stock => stock.price !== null);

      setStocks(validStocks);
    } catch (error) {
      console.error('Error fetching ticker data:', error);
    }
  };

  const handleStockClick = (symbol) => {
    if (!isDragging) {
      onStockClick(symbol);
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const scrollManual = (direction) => {
    const container = scrollContainerRef.current;
    const scrollAmount = 300;
    if (direction === 'left') {
      container.scrollLeft -= scrollAmount;
    } else {
      container.scrollLeft += scrollAmount;
    }
  };

  const getCurrency = (symbol) => {
    return symbol.includes('.NS') || symbol.includes('.BO') ? '₹' : '$';
  };

  // Duplicate stocks for seamless loop
  const displayStocks = [...stocks, ...stocks, ...stocks];

  return (
    <div className="ticker-tape-wrapper">
      <button 
        className="scroll-button scroll-left" 
        onClick={() => scrollManual('left')}
        aria-label="Scroll left"
      >
        ‹
      </button>
      
      <div 
        className={`ticker-tape-container ${isHovered ? 'paused' : ''}`}
        ref={scrollContainerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          handleMouseLeave();
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div className="ticker-tape-track">
          {displayStocks.map((stock, index) => (
            <div
              key={`${stock.symbol}-${index}`}
              className={`ticker-item ${stock.change >= 0 ? 'positive' : 'negative'}`}
              onClick={() => handleStockClick(stock.symbol)}
            >
              <span className="ticker-symbol">{stock.displaySymbol}</span>
              <span className="ticker-price">
                {getCurrency(stock.symbol)}{stock.price?.toFixed(2)}
              </span>
              <span className="ticker-change">
                {stock.change >= 0 ? '▲' : '▼'} {Math.abs(stock.changePercent).toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <button 
        className="scroll-button scroll-right" 
        onClick={() => scrollManual('right')}
        aria-label="Scroll right"
      >
        ›
      </button>
    </div>
  );
};

export default TickerTape;
