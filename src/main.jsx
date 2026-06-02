import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Premium developer diagnostic Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("FizzyTransit caught a rendering error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2.5rem',
          background: '#0c0301',
          backgroundImage: 'radial-gradient(circle at 50% 30%, #200502 0%, #060201 100%)',
          color: '#ff1e27',
          fontFamily: 'Share Tech Mono, monospace',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}>
          <span style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 10px rgba(255, 30, 39, 0.5))' }}>🚂⚠️</span>
          <h1 style={{ fontSize: '2.2rem', marginTop: '1rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>
            React Crash Caught
          </h1>
          <p style={{ color: '#c2ada7', margin: '0.8rem 0 2rem 0', maxWidth: '620px', lineHeight: 1.5, fontSize: '0.95rem' }}>
            A runtime JavaScript exception occurred inside the React rendering engine. Please copy the diagnostic trace details below to help debug the crash:
          </p>
          <pre style={{
            background: '#060201',
            border: '1px solid rgba(255, 30, 39, 0.3)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.8), inset 0 0 10px rgba(0,0,0,0.8)',
            padding: '1.2rem',
            borderRadius: '12px',
            textAlign: 'left',
            maxWidth: '750px',
            width: '100%',
            overflowX: 'auto',
            color: '#ff3c43',
            fontSize: '0.82rem',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
          }}>
            <strong>Error:</strong> {this.state.error && this.state.error.toString()}
            {"\n\n"}
            <strong>Stack Trace:</strong>{"\n"}
            {this.state.error && this.state.error.stack}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginTop: '2rem',
              background: 'linear-gradient(135deg, #ff1e27 0%, #aa0004 100%)',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(229, 9, 20, 0.4)'
            }}
          >
            🔄 Trigger Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
