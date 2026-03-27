import React, { useState } from 'react';
import axios from 'axios';
import { Lock, Mail, ArrowRight, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import './Login.css';

const API_URL = 'http://localhost:8000';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/login`, { email, password });
      if (res.data.success) {
        // slight delay for animation effect
        setTimeout(() => {
          onLoginSuccess(res.data.user);
        }, 800);
      }
    } catch (err: any) {
      if (err.message === 'Network Error') {
        setError('Connection failed. Backend may not be running.');
      } else {
        setError(err.response?.data?.detail || 'Invalid credentials. Use demo@example.com / password');
      }
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Animated background blobs */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      <motion.div 
        className="login-card"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="login-header">
          <motion.div 
            className="logo-icon pulse-circle"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
          >
            <Activity size={28} color="var(--accent-color)" />
          </motion.div>
          <h2>AlphaEngine</h2>
          <p>Access AI-powered trading intelligence.</p>
        </div>
        
        <AnimatePresence>
          {error && (
            <motion.div 
              className="login-error"
              initial={{ opacity: 0, height: 0, scale: 0.9 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.9 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="login-form">
          <motion.div className="input-group" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
            <label>Email Address</label>
            <div className="input-wrapper">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="demo@example.com"
              />
              <Mail size={18} className="input-icon" />
            </div>
          </motion.div>
          
          <motion.div className="input-group" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
            <label>Password</label>
            <div className="input-wrapper">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
              <Lock size={18} className="input-icon" />
            </div>
          </motion.div>
          
          <motion.button 
            type="submit" 
            className="btn-glow" 
            disabled={loading}
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? 'Authenticating System...' : (
              <>
                Enter Dashboard <ArrowRight size={18} style={{ marginLeft: '8px' }} />
              </>
            )}
          </motion.button>
        </form>
        
        <motion.div className="login-footer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          <p>Secure connection established</p>
        </motion.div>
      </motion.div>
    </div>
  );
}


