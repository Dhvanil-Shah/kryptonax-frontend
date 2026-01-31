import React, { useState, useRef, useEffect } from 'react';

const ChatBot = ({ isOpen, onClose, apiBaseUrl, ticker = null }) => {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      message: `👋 Hi! I'm your Kryptonax AI Assistant. I can help you discuss company news, board members, market trends, and financial insights. ${ticker ? `I see you're interested in ${ticker} - feel free to ask me anything about it!` : "What would you like to know?"}`
    }
  ]);
  const [logoError, setLogoError] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message to chat
    const userMessage = { role: 'user', message: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Prepare context for the API
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        message: msg.message
      }));

      const response = await fetch(`${apiBaseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_message: input,
          ticker: ticker,
          history: chatHistory.slice(-10) // Keep last 10 messages for context
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const botMessage = { role: 'bot', message: data.response };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        role: 'bot',
        message: `❌ Sorry, I couldn't process your request. ${error.message || 'Please try again later.'}`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    }}>
      <div style={{
        width: '90%',
        maxWidth: '500px',
        height: '600px',
        background: 'linear-gradient(135deg, #1a1f2e 0%, #16213e 100%)',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(79, 172, 254, 0.3)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 24px',
          borderBottom: '1px solid rgba(79, 172, 254, 0.2)',
          background: 'linear-gradient(90deg, rgba(79, 172, 254, 0.1) 0%, rgba(0, 180, 219, 0.1) 100%)',
          backdropFilter: 'blur(10px)'
        }}>
          <h2 style={{
            margin: 0,
            color: '#ffffff',
            fontSize: '18px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            letterSpacing: '0.3px'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="6" y="4" width="12" height="14" rx="2" fill="#4FACFE"/>
              <circle cx="9" cy="9" r="1.5" fill="white"/>
              <circle cx="15" cy="9" r="1.5" fill="white"/>
              <path d="M9 13h6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <rect x="4" y="6" width="2" height="4" rx="1" fill="#4FACFE"/>
              <rect x="18" y="6" width="2" height="4" rx="1" fill="#4FACFE"/>
              <path d="M8 18v2M16 18v2" stroke="#4FACFE" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Kryptonax AI
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '20px',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          >
            ✕
          </button>
        </div>

        {/* Messages Container */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          position: 'relative',
          backgroundImage: !logoError ? 'url(/favicon.ico)' : 'none',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '120px 120px',
          backgroundAttachment: 'local'
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(22, 33, 62, 0.85)',
            pointerEvents: 'none',
            zIndex: 0
          }} />
          <img 
            src="/favicon.ico" 
            style={{ display: 'none' }}
            onError={() => setLogoError(true)}
            alt=""
          />
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '8px',
                position: 'relative',
                zIndex: 1
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: msg.role === 'user' 
                    ? 'linear-gradient(135deg, #4FACFE 0%, #00B4DB 100%)'
                    : 'rgba(255, 255, 255, 0.08)',
                  border: msg.role === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  boxShadow: msg.role === 'user' 
                    ? '0 4px 15px rgba(79, 172, 254, 0.3)'
                    : '0 2px 10px rgba(0, 0, 0, 0.2)'
                }}
              >
                {msg.message}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-start',
              position: 'relative',
              zIndex: 1
            }}>
              <div style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#4FACFE',
                fontSize: '14px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
              }}>
                <span>🔄 Analyzing</span>
                <span style={{
                  animation: 'blink 1.4s infinite',
                  marginLeft: '2px'
                }}>
                  ...
                </span>
                <style>{`
                  @keyframes blink {
                    0%, 20%, 50%, 80%, 100% { opacity: 1; }
                    40% { opacity: 0.3; }
                    60% { opacity: 0.5; }
                  }
                `}</style>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{
          padding: '18px 24px',
          borderTop: '1px solid rgba(79, 172, 254, 0.2)',
          background: 'linear-gradient(90deg, rgba(79, 172, 254, 0.05) 0%, rgba(0, 180, 219, 0.05) 100%)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            display: 'flex',
            gap: '8px'
          }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me about stocks, news, companies..."
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(79, 172, 254, 0.3)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'none',
                minHeight: '48px',
                maxHeight: '100px',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#4FACFE';
                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                e.target.style.boxShadow = '0 4px 12px rgba(79, 172, 254, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(79, 172, 254, 0.3)';
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              style={{
                padding: '12px 20px',
                borderRadius: '10px',
                background: loading || !input.trim() 
                  ? 'rgba(79, 172, 254, 0.3)'
                  : 'linear-gradient(135deg, #4FACFE 0%, #00B4DB 100%)',
                color: '#ffffff',
                border: 'none',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '700',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                boxShadow: loading || !input.trim() 
                  ? 'none'
                  : '0 4px 15px rgba(79, 172, 254, 0.4)',
                letterSpacing: '0.3px'
              }}
              onMouseEnter={(e) => {
                if (!loading && input.trim()) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(79, 172, 254, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && input.trim()) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(79, 172, 254, 0.4)';
                }
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }}>
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/>
              </svg>
              Send
            </button>
          </div>
          <p style={{
            margin: '10px 0 0 0',
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.4)',
            letterSpacing: '0.2px'
          }}>
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
