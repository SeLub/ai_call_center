import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    document.body.className = darkMode ? 'dark-mode' : 'light-mode';
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (response.ok) {
        // Create session after successful login
        const sessionResponse = await fetch('http://localhost:3001/session/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username })
        });
        
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          localStorage.setItem('session_id', sessionData.session_id);
        }
        
        setIsAuthorized(true);
        setMessages([{ text: 'Authorization successful. Ask your question.', sender: 'bot' }]);
      } else {
        alert('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Server connection error');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      alert('Password must contain at least 6 characters');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:3001/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Registration successful! You can now log in.');
        setShowRegister(false);
        setPassword('');
      } else {
        alert(data.error || 'Registration error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Server connection error');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { text: input, sender: 'user' };
    setMessages([...messages, userMessage]);
    setInput('');

    try {
      const response = await fetch('http://localhost:3001/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: input,
          user_id: username || 'anonymous',
          session_id: localStorage.getItem('session_id') || 'anonymous'
        }),
      });

      const data = await response.json();
      
      let botResponse = data.response;
      if (data.search_performed && data.sources?.length > 0) {
        botResponse += `\n\n📄 Sources: ${data.sources.join(', ')}`;
      }
      
      const botMessage = { 
        text: botResponse, 
        sender: 'bot',
        model: data.model_used,
        responseTime: data.response_time
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Query error:', error);
      const errorMessage = { text: 'Error processing request', sender: 'bot' };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const clearHistory = async () => {
    const sessionId = localStorage.getItem('session_id');
    console.log('Clear history clicked, session_id:', sessionId);
    if (sessionId) {
      try {
        const response = await fetch(`http://localhost:3001/session/${sessionId}/history`, {
          method: 'DELETE'
        });
        console.log('Clear history response:', response.status);
        if (response.ok) {
          setMessages([{ text: 'History cleared. Ask your question.', sender: 'bot' }]);
        } else {
          console.error('Clear history failed:', response.status);
        }
      } catch (error) {
        console.error('Clear history error:', error);
      }
    } else {
      console.log('No session_id found, clearing local messages only');
      setMessages([{ text: 'History cleared. Ask your question.', sender: 'bot' }]);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  if (!isAuthorized) {
    return (
      <div className="App">
        <div className="main-content">
          <div className="login-container">
          <h1>AI Call Center</h1>
          
          {!showRegister ? (
            <>
              <form onSubmit={handleLogin} className="login-form">
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="submit">Login</button>
              </form>
              <p className="toggle-form">
                No account?{' '}
                <span onClick={() => setShowRegister(true)}>
                  Register
                </span>
              </p>
            </>
          ) : (
            <>
              <form onSubmit={handleRegister} className="login-form">
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength="3"
                />
                <input
                  type="password"
                  placeholder="Password (minimum 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength="6"
                />
                <button type="submit">Register</button>
              </form>
              <p className="toggle-form">
                Already have an account?{' '}
                <span onClick={() => setShowRegister(false)}>
                  Login
                </span>
              </p>
            </>
          )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="app-header">
        <div className="logo">
          <span className="logo-icon">🤖</span>
          <span className="logo-text">AI Call Center</span>
        </div>
        <div className="header-buttons">
          <button onClick={clearHistory} className="icon-btn" title="Clear History">
            ↻
          </button>
          <button onClick={toggleDarkMode} className="icon-btn" title="Toggle Dark Mode">
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button onClick={() => setIsAuthorized(false)} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
      <div className="main-content">
        <div className="chat-container">
          <div className="messages-container">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              <div className="message-bubble">
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="input-container">
          <button
            type="button"
            className={`voice-btn ${isRecording ? 'recording' : ''}`}
            onClick={toggleRecording}
          >
            🎤
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter your question..."
          />
          <button type="submit">Send</button>
        </form>
        </div>
      </div>
    </div>
  );
}

export default App;
