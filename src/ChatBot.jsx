import React, { useState, useRef, useEffect } from 'react';

const ChatBot = ({ isOpen, onClose, apiBaseUrl, ticker = null }) => {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      message: `👋 Hi! I'm your Kryptonax AI Assistant. I can help you discuss company news, board members, market trends, and financial insights. ${ticker ? `I see you're interested in ${ticker} - feel free to ask me anything about it!` : "What would you like to know?"}`
    }
  ]);
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
        backgroundColor: '#1e222d',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        border: '1px solid #2962ff'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid #2962ff',
          backgroundColor: '#131722'
        }}>
          <h2 style={{
            margin: 0,
            color: '#d1d4dc',
            fontSize: '18px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>🤖</span> Kryptonax AI
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: '#d1d4dc',
              cursor: 'pointer',
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Messages Container */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '8px'
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: msg.role === 'user' ? '#2962ff' : '#2a2e38',
                  color: '#d1d4dc',
                  fontSize: '14px',
                  lineHeight: '1.4',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                }}
              >
                {msg.message}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-start'
            }}>
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: '#2a2e38',
                color: '#d1d4dc',
                fontSize: '14px'
              }}>
                <span>⏳ Thinking</span>
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
          padding: '16px 20px',
          borderTop: '1px solid #2962ff',
          backgroundColor: '#131722'
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
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #2962ff',
                backgroundColor: '#1e222d',
                color: '#d1d4dc',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'none',
                minHeight: '44px',
                maxHeight: '100px',
                outline: 'none',
                transition: 'border-color 0.2s',
                ':focus': {
                  borderColor: '#4a90e2'
                }
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#4a90e2';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#2962ff';
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              style={{
                padding: '10px 16px',
                borderRadius: '6px',
                backgroundColor: loading || !input.trim() ? '#1e4a7a' : '#2962ff',
                color: '#d1d4dc',
                border: 'none',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'background-color 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                if (!loading && input.trim()) {
                  e.target.style.backgroundColor = '#4a90e2';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && input.trim()) {
                  e.target.style.backgroundColor = '#2962ff';
                }
              }}
            >
              📤 Send
            </button>
          </div>
          <p style={{
            margin: '8px 0 0 0',
            fontSize: '12px',
            color: '#787b86'
          }}>
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
