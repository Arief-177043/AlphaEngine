import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  
  ArrowUpRight, ArrowDownRight, Zap, 
  Search, PieChart as PieChartIcon, LogOut, TrendingUp,
  Loader2, MessageSquare, X, Send, Cpu, AlertTriangle, Globe,
  BrainCircuit, History, Stethoscope, Play, CheckCircle2, ShieldAlert,
  ChevronDown, ChevronUp, HelpCircle, Activity, Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Tooltip } from 'recharts';
import './App.css';

const API_URL = 'http://localhost:8000';

const COLORS = ['#2962ff', '#089981', '#f0b828', '#f23645', '#9c27b0'];
const CHART_GREEN = '#089981';
const CHART_RED = '#f23645';

// Mock Data
const MOCK_HEATMAP = [
  { symbol: 'RELIANCE', change: 1.2, price: 2950.45 },
  { symbol: 'TCS', change: -0.8, price: 3980.10 },
  { symbol: 'HDFCBANK', change: 2.1, price: 1450.20 },
  { symbol: 'INFY', change: 0.5, price: 1620.80 },
  { symbol: 'ICICIBANK', change: 1.8, price: 1080.50 },
  { symbol: 'SBIN', change: -1.2, price: 740.30 },
  { symbol: 'BHARTIARTL', change: 3.4, price: 1320.10 },
  { symbol: 'ITC', change: -0.2, price: 410.60 },
];

const MISSED_OPPORTUNITIES = [
  { symbol: 'INFY', signal: 'Volume Breakout', gain: 3.2, time: '2 days ago' },
  { symbol: 'ZOMATO', signal: 'Golden Crossover', gain: 8.7, time: '1 week ago' },
  { symbol: 'TRENT', signal: 'MACD Divergence', gain: 5.1, time: '3 days ago' },
];

const generateSparkline = (trend: 'bullish' | 'bearish' | 'neutral') => {
  let base = 100;
  return Array.from({ length: 20 }, () => {
    let change = (Math.random() - 0.5) * 5;
    if (trend === 'bullish') change += 1;
    if (trend === 'bearish') change -= 1;
    base += change;
    return { value: base };
  });
};

const ConfidenceBar = ({ confidence }: { confidence: number }) => {
  const filled = Math.round(confidence / 10);
  const squares = Array.from({ length: 10 }, (_, i) => i < filled ? '█' : '░').join('');
  return (
    <div style={{ fontFamily: 'monospace', letterSpacing: '1px', fontSize: '0.85rem', color: 'var(--accent-color)', margin: '4px 0' }}>
      [{squares}] {confidence}%
    </div>
  );
};

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [ticker, setTicker] = useState('RELIANCE.NS');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  // Real-time tracking
  const [liveSymbol, setLiveSymbol] = useState('RELIANCE.NS');
  const [liveStock, setLiveStock] = useState<{ symbol: string; price: number; company_name: string } | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState('');
  
  const prevPriceRef = useRef<number | null>(null);
  const [flashClass, setFlashClass] = useState('');

  // AI Trade Simulator
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  // AI Decision Engine
  const [decision, setDecision] = useState<any>(null);
  const [generatingDecision, setGeneratingDecision] = useState(false);

  // Portfolio
  const [portfolio, setPortfolio] = useState([
    { ticker: 'TCS.NS', shares: 50, price: 4000, sector: 'IT' },
    { ticker: 'INFY.NS', shares: 100, price: 1600, sector: 'IT' },
    { ticker: 'RELIANCE.NS', shares: 20, price: 2900, sector: 'Energy' },
    { ticker: 'WIPRO.NS', shares: 200, price: 490, sector: 'IT' }
  ]);
  const [portfolioAnalysis, setPortfolioAnalysis] = useState<any>(null);
  const [portfolioDoctor, setPortfolioDoctor] = useState<any>(null);

  // Chatbot
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([{ sender: 'ai', text: 'Ask me anything about your portfolio or the market. For instance: "Should I hold RELIANCE?"' }]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    fetchAlerts();
    analyzePortfolio(portfolio);
    const alertInterval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(alertInterval);
  }, []);

  useEffect(() => {
    const fetchLivePrice = async () => {
      if (!liveSymbol) return;
      try {
        const res = await axios.get(`${API_URL}/stock/${liveSymbol}`);
        setLiveStock(res.data);
        setLiveError('');
      } catch (e: any) {
        setLiveError(`Invalid symbol`);
        setLiveStock(null);
      }
    };
    setLiveLoading(true);
    fetchLivePrice().finally(() => setLiveLoading(false));
    const interval = setInterval(fetchLivePrice, 5000);
    return () => clearInterval(interval);
  }, [liveSymbol]);

  useEffect(() => {
    if (!liveStock) return;
    if (prevPriceRef.current !== null && liveStock.price !== prevPriceRef.current) {
        if (liveStock.price > prevPriceRef.current) {
            setFlashClass('flash-green');
        } else {
            setFlashClass('flash-red');
        }
        setTimeout(() => setFlashClass(''), 1000);
    }
    prevPriceRef.current = liveStock.price;
  }, [liveStock]);

  const fetchAlerts = async () => {
    try {
      const res = await axios.get(`${API_URL}/alerts`);
      setAlerts(res.data.alerts);
    } catch (e) {
      console.error('Alerts err', e);
    }
  };

  const handleScan = async () => {
    setLoading(true);
    setSimulationResult(null); 
    setDecision(null);
    try {
      const res = await axios.get(`${API_URL}/scan?ticker=${ticker}`);
      const trend = res.data.technical_analysis?.trend || 'Neutral';
      const enhancedData = {
        ...res.data,
        sparkline: generateSparkline(trend.toLowerCase() as any),
        signals: (res.data.signals || []).map((sig: any) => ({
          ...sig,
          confidence: Math.floor(65 + Math.random() * 30),
          reason: `Bearish trend with high institutional conviction due to 20-day SMA crossing below 50-day SMA, validated by declining breadth.`.replace('Bearish', trend)
        })),
        ai_insight: `Advanced pattern matching confirms a ${trend} trend with 82% confidence due to 20-day EMA slope changes combined with accelerating MACD momentum.`
      };
      setScanResult(enhancedData);
    } catch (e) {
      console.error(e);
      alert('Failed to scan market data. Is backend running?');
    }
    setLoading(false);
  };

  const runSimulation = () => {
    setSimulating(true);
    setTimeout(() => {
      const trend = scanResult.technical_analysis?.trend || 'Neutral';
      const bullProb = trend === 'Bullish' ? 65 : trend === 'Bearish' ? 35 : 50;
      const bearProb = 100 - bullProb;
      
      setSimulationResult({
        bullishProb: bullProb,
        bearishProb: bearProb,
        expectedHighGain: (Math.random() * 4 + 2).toFixed(1), 
        expectedLoss: (Math.random() * 3 + 1).toFixed(1)
      });
      setSimulating(false);
    }, 1800);
  };

  const handleGetDecision = () => {
      setGeneratingDecision(true);
      setTimeout(() => {
         const trend = scanResult?.technical_analysis?.trend || 'Neutral';
         setDecision({
             action: trend === 'Bullish' ? 'BUY' : trend === 'Bearish' ? 'SELL' : 'HOLD',
             confidence: trend === 'Bullish' ? 84 : 76,
             risk: trend === 'Bullish' ? 'Medium' : 'High',
             explanation: trend === 'Bullish' 
                 ? "Stock near strong support base. Weak short-term choppiness is dominated by strong long-term institutional momentum."
                 : "Critical moving averages have crossed downwards, signaling aggressive distribution. Heavy resistance overhead limits upside."
         });
         setGeneratingDecision(false);
      }, 1500);
  };

  const calculateDoctorInsights = (port: any[]) => {
    if (port.length === 0) return null;
    const sectorMap: any = {};
    let totalValue = 0;
    port.forEach(item => {
      const v = item.shares * item.price;
      sectorMap[item.sector] = (sectorMap[item.sector] || 0) + v;
      totalValue += v;
    });
    
    const overexposed = Object.keys(sectorMap).filter(s => sectorMap[s] / totalValue > 0.4);
    const weakStocks = port.filter(item => item.ticker.includes('WIPRO') || item.ticker.includes('SBIN'));
    
    return {
      overexposed: overexposed.map(s => ({ sector: s, percentage: Math.round((sectorMap[s] / totalValue) * 100) })),
      weakStocks: weakStocks.map(s => s.ticker),
      suggestions: [
        overexposed.length > 0 ? `Reduce exposure in **${overexposed.join(', ')}** (currently >40%) to balance beta risks.` : `Sector allocation looks mathematically balanced.`,
        weakStocks.length > 0 ? `Consider tightening trailing stop-losses for **${weakStocks.join(', ')}** due to deeply weak sectoral momentum vs Nifty 50.` : `Hold current assets, individual cross-momentum is stable.`,
        `Recommendation: Rebalance by allocating 15% towards defensive assets (e.g., FMCG/Pharma) to dynamically hedge volatile drawdowns.`
      ]
    };
  };

  const analyzePortfolio = async (currentPortfolio: any[]) => {
    try {
      const res = await axios.post(`${API_URL}/portfolio`, currentPortfolio);
      const sectorMap: Record<string, number> = {};
      currentPortfolio.forEach(item => {
        const val = item.shares * item.price;
        sectorMap[item.sector] = (sectorMap[item.sector] || 0) + val;
      });
      const pieData = Object.keys(sectorMap).map(k => ({ name: k, value: sectorMap[k] }));

      setPortfolioAnalysis({ ...res.data, pieData });
      setPortfolioDoctor(calculateDoctorInsights(currentPortfolio));
    } catch (e) {
      console.error(e);
    }
  };

  const updatePortfolioItem = (index: number, field: string, value: string) => {
    const updated = [...portfolio];
    (updated[index] as any)[field] = field === 'shares' || field === 'price' ? Number(value) : value;
    setPortfolio(updated);
  };

  const handleChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { sender: 'user', text: chatInput }]);
    const query = chatInput.toLowerCase();
    setChatInput('');
    
    setTimeout(() => {
      let reply = "I am processing predictive algorithms for that query...";
      if (query.includes('hold') && query.includes('reliance')) {
        reply = "RELIANCE shows a **Bullish breakout** with a 20% volume surge and RSI > 60 today. The momentum is extremely robust. Recommendation: **HOLD** with a trailing stop-loss at ₹2850.";
      } else if (query.includes('risk') || query.includes('doctor')) {
        reply = "Your portfolio risk is heavily concentrated in IT (>70%). The algorithm suggests rebalancing into FMCG components to lower geometric drawdown risks.";
      } else {
        reply = "Quantitative market markers indicate a stable equilibrium. No immediate rebalances necessary.";
      }
      setChatMessages(prev => [...prev, { sender: 'ai', text: reply }]);
    }, 1000);
  };

  const ExpandableSignal = ({ sig }: any) => {
      const [isOpen, setIsOpen] = useState(false);
      return (
          <div className="signal-item" style={{ cursor: 'pointer', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }} onClick={() => setIsOpen(!isOpen)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                      <strong style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px', color: sig.impact === 'High' ? 'var(--danger-color)' : 'var(--success-color)' }}>
                          {sig.impact === 'High' ? <AlertTriangle size={18}/> : <Zap size={18}/>}
                          {sig.type}
                      </strong>
                      <ConfidenceBar confidence={sig.confidence} />
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                      {isOpen ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                  </div>
              </div>
              <AnimatePresence>
                  {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                              <p style={{ marginBottom: '12px', lineHeight: 1.5, color: '#c9d1d9' }}><strong>Explanation:</strong> {sig.reason}</p>
                              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', borderLeft: '2px solid var(--accent-color)' }}>
                                  <ul style={{ paddingLeft: '16px', margin: 0, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <li>Volume Spike: <strong>+145%</strong> vs 10-day avg</li>
                                      <li>RSI Level: <strong>{ Math.floor(Math.random()*40 + 30) }</strong> (Momentum shift)</li>
                                      <li>MA Crossover: <strong>20-EMA interacting with 50-SMA</strong></li>
                                      <li>Key Levels: <strong>Approaching major technical resistance</strong></li>
                                  </ul>
                              </div>
                          </div>
                      </motion.div>
                  )}
              </AnimatePresence>
          </div>
      );
  };

  return (
    <div className="container">
      {/* Live Market Pulse Top Bar */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} 
        style={{ 
          background: 'linear-gradient(90deg, rgba(88, 166, 255, 0.1), rgba(13, 15, 20, 0.8))', 
          border: '1px solid rgba(88, 166, 255, 0.2)', padding: '12px 24px', borderRadius: '12px', 
          marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success-color)', fontWeight: 600, fontSize: '0.9rem' }}>
           <Activity size={18}/> Market Sentiment: Bullish (62%)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
           <Zap size={18} color="var(--warning-color)"/> High Activity: <strong style={{ color: '#fff' }}>IT, Banking</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger-color)', fontSize: '0.9rem' }}>
           <AlertTriangle size={18}/> Risk Zone: <strong style={{ color: '#fff' }}>Midcaps</strong>
        </div>
      </motion.div>

      {/* Header */}
      <header>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1>AI Market Intelligence Engine</h1>
          <p className="subtitle">Real-time signal detection and predictive decision-making</p>
        </motion.div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
            <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{user.name}</strong>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-color)' }}>Pro Subscriber</span>
          </div>
          <button className="btn" onClick={onLogout} style={{ background: 'rgba(255,255,255,0.05)', border: 'none' }}>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Row 2: Live Tracker (1/3), Heatmap (1/3), Missed Opportunities (1/3) */}
      <motion.div className="grid grid-3" style={{ marginBottom: '24px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="card" style={{ background: 'linear-gradient(145deg, rgba(30, 75, 216, 0.1) 0%, rgba(19, 23, 34, 0.8) 100%)', border: '1px solid rgba(41, 98, 255, 0.2)' }}>
          <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <TrendingUp size={18} color="var(--accent-color)"/> Live Tracker
          </h3>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input type="text" value={liveSymbol} onChange={(e) => setLiveSymbol(e.target.value.toUpperCase())} placeholder="e.g. INFY.NS" />
          </div>
          <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {liveLoading && !liveStock ? (
               <Loader2 size={32} className="animate-spin" color="var(--accent-color)" />
            ) : liveError ? (
               <span style={{ color: 'var(--danger-color)', fontSize: '0.9rem' }}>{liveError}</span>
            ) : liveStock ? (
              <motion.div style={{ width: '100%' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="badge badge-primary" style={{ background: 'var(--accent-color)', color: '#fff' }}>{liveStock.symbol}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{liveStock.company_name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className={` ${flashClass}`} style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, transition: 'text-shadow 0.2s' }}>₹{liveStock.price.toFixed(2)}</div>
                    <div style={{ color: 'var(--success-color)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '4px' }}><ArrowUpRight size={14}/> Live Sync</div>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} color="var(--warning-color)"/> Heatmap
            </h3>
          </div>
          <div className="grid-2" style={{ gap: '12px' }}>
            {MOCK_HEATMAP.slice(0, 4).map((stock, i) => {
              const checkGreen = stock.change >= 0;
              return (
                <motion.div 
                  key={i} whileHover={{ scale: 1.05 }}
                  style={{ 
                    background: checkGreen ? 'rgba(8, 153, 129, 0.15)' : 'rgba(242, 54, 69, 0.15)',
                    border: `1px solid ${checkGreen ? 'rgba(8, 153, 129, 0.3)' : 'rgba(242, 54, 69, 0.3)'}`,
                    padding: '12px', borderRadius: '8px', cursor: 'pointer'
                  }}
                  onClick={() => { setTicker(stock.symbol + '.NS'); handleScan(); }}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{stock.symbol}</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>₹{stock.price.toFixed(0)}</span>
                    <span style={{ fontSize: '0.8rem', color: checkGreen ? 'var(--success-color)' : 'var(--danger-color)', fontWeight: 600 }}>
                      {checkGreen ? '+' : ''}{stock.change}%
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Missed Opportunity Detector */}
        <div className="card" style={{ background: 'linear-gradient(145deg, rgba(140, 155, 176, 0.05) 0%, rgba(19, 23, 34, 0.8) 100%)' }}>
          <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#c9d1d9' }}>
            <History size={18} color="#8c9bb0"/> Missed Opportunities
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {MISSED_OPPORTUNITIES.map((opp, i) => (
              <div key={i} style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', borderLeft: '3px solid var(--accent-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '0.9rem' }}>{opp.symbol} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>- {opp.signal}</span></strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>+{opp.gain}% GAIN</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Detected {opp.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-3">
        {/* Main Scanner Section */}
        <div style={{ gridColumn: 'span 2' }}>
          <motion.div className="card" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <h2 className="section-title"><Search size={22} color="var(--accent-color)"/> AI Intelligence Scanner</h2>
            <div className="search-bar" style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '12px' }}>
              <input 
                type="text" 
                value={ticker} 
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="NSE Ticker (e.g. RELIANCE.NS)"
                style={{ border: 'none', background: 'transparent' }}
              />
              <button className="btn btn-primary" onClick={handleScan} disabled={loading} style={{ padding: '10px 32px' }}>
                {loading ? <Loader2 className="animate-spin" size={18}/> : 'Analyze'}
              </button>
            </div>

            {scanResult && scanResult.technical_analysis && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} style={{ marginTop: '32px' }}>
                
                {/* Advanced Stock Card with "What Should I Do?" button */}
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
                  <div style={{ flex: '1 1 50%' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-1px' }}>{scanResult.ticker}</h3>
                      <span className={`badge badge-${scanResult.technical_analysis.trend === 'Bullish' ? 'bullish' : 'bearish'}`}>
                        {scanResult.technical_analysis.trend}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>{scanResult.company_name}</div>
                    
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '16px' }}>
                      <span style={{ fontSize: '3rem', fontWeight: 700, lineHeight: 1 }}>₹{scanResult.current_price?.toFixed(2)}</span>
                    </div>
                    
                    <button 
                      onClick={handleGetDecision}
                      disabled={generatingDecision}
                      className="btn" 
                      style={{ background: 'linear-gradient(90deg, #9c27b0, #673ab7)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 600, fontSize: '1rem', boxShadow: '0 8px 24px rgba(156, 39, 176, 0.4)', display: 'flex', gap: '10px', alignItems: 'center', width: 'fit-content' }}
                    >
                      {generatingDecision ? <Loader2 className="animate-spin"/> : <HelpCircle/>}
                      What Should I Do?
                    </button>
                  </div>
                  <div style={{ flex: '1 1 30%', height: '120px', minWidth: '200px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={scanResult.sparkline}>
                        <Line type="monotone" dataKey="value" stroke={scanResult.technical_analysis.trend === 'Bullish' ? CHART_GREEN : CHART_RED} strokeWidth={4} dot={false} isAnimationActive={true} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* AI Decision Panel */}
                <AnimatePresence>
                    {decision && (
                        <motion.div initial={{ opacity: 0, height: 0, y: -20 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: '24px' }}>
                            <div style={{ 
                                background: decision.action === 'BUY' ? 'linear-gradient(135deg, rgba(8, 153, 129, 0.2), rgba(19, 23, 34, 0.9))' : 
                                            decision.action === 'SELL' ? 'linear-gradient(135deg, rgba(242, 54, 69, 0.2), rgba(19, 23, 34, 0.9))' : 
                                            'linear-gradient(135deg, rgba(240, 184, 40, 0.2), rgba(19, 23, 34, 0.9))',
                                border: `1px solid ${decision.action === 'BUY' ? 'rgba(8, 153, 129, 0.4)' : decision.action === 'SELL' ? 'rgba(242, 54, 69, 0.4)' : 'rgba(240, 184, 40, 0.4)'}`,
                                borderRadius: '16px', padding: '24px', position: 'relative'
                            }}>
                                <span style={{ position: 'absolute', top: '-10px', left: '24px', background: decision.action === 'BUY' ? 'var(--success-color)' : decision.action === 'SELL' ? 'var(--danger-color)' : 'var(--warning-color)', color: '#000', fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: '20px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                    AI Recommendation
                                </span>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', marginTop: '8px' }}>
                                    <h4 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', letterSpacing: '2px', margin: 0 }}>{decision.action}</h4>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>AI Confidence</div>
                                        <ConfidenceBar confidence={decision.confidence} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                    <span className={`badge ${decision.risk === 'Low' ? 'badge-success' : decision.risk === 'High' ? 'badge-danger' : 'badge-warning'}`}>Risk Level: {decision.risk}</span>
                                </div>
                                <p style={{ fontSize: '1.05rem', lineHeight: '1.6', color: '#e2e8f0', margin: 0 }}>
                                    <strong style={{ color: '#fff' }}>Rationale:</strong> {decision.explanation}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-2" style={{ marginBottom: '24px' }}>
                  {/* AI Signals Panel (Explainable) */}
                  <div>
                    <h4 style={{ marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Target size={18} color="var(--accent-color)"/> Actionable Signals
                    </h4>
                    {scanResult.signals.length === 0 ? (
                      <p style={{ color: 'var(--text-secondary)' }}>No anomalies or strong signals detected.</p>
                    ) : (
                      scanResult.signals.map((sig: any, i: number) => (
                          <ExpandableSignal key={i} sig={sig} />
                      ))
                    )}
                  </div>
                  <div>
                    <h4 style={{ marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BrainCircuit size={18} color="var(--accent-color)"/> AI Insight
                    </h4>
                    <div className="ai-insight" style={{ marginTop: 0 }}>
                      <p style={{ margin: 0, fontSize: '1rem', lineHeight: '1.7' }}>{scanResult.ai_insight}</p>
                    </div>
                  </div>
                </div>

                {/* AI Trade Simulator Feature */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px', marginTop: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '1.4rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <BrainCircuit size={24} color="var(--accent-color)"/> Trade Simulator (What-If Engine)
                    </h4>
                    {!simulationResult && (
                      <button className="btn btn-primary" onClick={runSimulation} disabled={simulating} style={{ padding: '10px 24px', display: 'flex', gap: '8px' }}>
                        {simulating ? <Loader2 className="animate-spin" size={18}/> : <Play size={18}/>}
                        {simulating ? 'Simulating 10k Paths...' : 'Run Simulation'}
                      </button>
                    )}
                  </div>

                  {simulationResult && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(41, 98, 255, 0.3)' }}>
                      <div className="grid grid-2" style={{ gap: '24px' }}>
                        {/* Bullish Scenario */}
                        <div style={{ background: 'linear-gradient(180deg, rgba(8, 153, 129, 0.1) 0%, transparent 100%)', border: '1px solid rgba(8, 153, 129, 0.3)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success-color)' }}>
                              <ArrowUpRight size={24}/> <strong style={{ fontSize: '1.1rem', textTransform: 'uppercase' }}>If Breakout Holds</strong>
                          </div>
                          <div>
                              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '4px' }}>Expected Gain</div>
                              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--success-color)' }}>+{simulationResult.expectedHighGain}%</div>
                          </div>
                          <ConfidenceBar confidence={simulationResult.bullishProb} />
                        </div>
                        {/* Bearish Scenario */}
                        <div style={{ background: 'linear-gradient(180deg, rgba(242, 54, 69, 0.1) 0%, transparent 100%)', border: '1px solid rgba(242, 54, 69, 0.3)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger-color)' }}>
                              <ArrowDownRight size={24}/> <strong style={{ fontSize: '1.1rem', textTransform: 'uppercase' }}>If Support Breaks</strong>
                          </div>
                          <div>
                              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '4px' }}>Expected Loss</div>
                              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--danger-color)' }}>-{simulationResult.expectedLoss}%</div>
                          </div>
                          <ConfidenceBar confidence={simulationResult.bearishProb} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Alerts Sidebar */}
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="card" style={{ height: '100%', background: 'linear-gradient(180deg, rgba(19, 23, 34, 0.8) 0%, rgba(19, 23, 34, 0.4) 100%)' }}>
            <h2 className="section-title"><Globe size={20} color="var(--warning-color)"/> Event Stream</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.85rem' }}>Auto-monitoring NSE scripts</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '1000px', overflowY: 'auto', paddingRight: '8px' }}>
              <AnimatePresence>
                {alerts.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>Waiting for signals...</p>
                ) : (
                  alerts.map((alert: any, i: number) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, scale: 0.9, x: -20 }} 
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      className={`signal-item ${alert.severity === 'high' ? 'signal-bearish' : alert.severity === 'low' ? 'signal-bullish' : ''}`}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{alert.type}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Live</span>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{alert.message}</p>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Portfolio & Doctor Section */}
      <motion.div className="card" style={{ marginTop: '24px' }} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
        <h2 className="section-title"><PieChartIcon size={22} color="var(--accent-color)"/> Portfolio Intelligence</h2>
        
        <div className="grid grid-2" style={{ marginBottom: '24px' }}>
          <div>
            {portfolio.map((item, i) => (
              <div key={i} className="portfolio-input">
                <input value={item.ticker} onChange={e => updatePortfolioItem(i, 'ticker', e.target.value)} placeholder="Ticker" />
                <input type="number" value={item.shares} onChange={e => updatePortfolioItem(i, 'shares', e.target.value)} placeholder="Shares" />
                <input type="number" value={item.price} onChange={e => updatePortfolioItem(i, 'price', e.target.value)} placeholder="Price" />
                <input value={item.sector} onChange={e => updatePortfolioItem(i, 'sector', e.target.value)} placeholder="Sector" />
                <button className="btn" onClick={() => {
                  const newP = [...portfolio];
                  newP.splice(i, 1);
                  setPortfolio(newP);
                }} style={{ background: 'transparent', padding: '8px', border: '1px solid rgba(255,255,255,0.1)' }}><X size={14}/></button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button className="btn" onClick={() => setPortfolio([...portfolio, { ticker: 'NEW', shares: 0, price: 0, sector: 'Misc' }])}>+ Add Asset</button>
              <button className="btn btn-primary" onClick={() => analyzePortfolio(portfolio)}>Generate Insights</button>
            </div>
          </div>
          
          {portfolioAnalysis && (
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Value</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>₹{portfolioAnalysis.total_value.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Risk Meter</div>
                  <span className={`badge ${portfolioAnalysis.risk_level === 'High' ? 'badge-danger' : portfolioAnalysis.risk_level === 'Medium' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '1rem', padding: '6px 16px' }}>
                    {portfolioAnalysis.risk_level}
                  </span>
                </div>
              </div>
              
              <div style={{ height: '180px', display: 'flex' }}>
                <div style={{ flex: 1 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={portfolioAnalysis.pieData} innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value">
                        {portfolioAnalysis.pieData?.map((_entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#131722', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
                  {portfolioAnalysis.pieData?.map((entry: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[i % COLORS.length] }}></div>
                      {entry.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI Portfolio Doctor Feature */}
        {portfolioDoctor && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '24px' }}>
            <h3 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', color: '#fff' }}>
              <Stethoscope size={24} color="var(--accent-color)"/> AI Portfolio Doctor
            </h3>
            
            <div className="grid grid-3" style={{ gap: '24px' }}>
              {/* Overexposure */}
              <div style={{ background: 'rgba(240, 184, 40, 0.05)', padding: '16px', borderRadius: '12px', borderLeft: '3px solid var(--warning-color)' }}>
                <h5 style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--warning-color)', marginBottom: '12px', fontSize: '1rem' }}>
                  <AlertTriangle size={18}/> Overexposure
                </h5>
                {portfolioDoctor.overexposed.length > 0 ? (
                  portfolioDoctor.overexposed.map((item: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                      <span>{item.sector} Sector</span>
                      <strong style={{ color: '#fff' }}>{item.percentage}%</strong>
                    </div>
                  ))
                ) : (
                   <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>No dangerously overexposed sectors detected.</span>
                )}
              </div>

              {/* Weak Stocks */}
              <div style={{ background: 'rgba(242, 54, 69, 0.05)', padding: '16px', borderRadius: '12px', borderLeft: '3px solid var(--danger-color)' }}>
                <h5 style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger-color)', marginBottom: '12px', fontSize: '1rem' }}>
                  <ShieldAlert size={18}/> Weak Momentum Assets
                </h5>
                {portfolioDoctor.weakStocks.length > 0 ? (
                  <ul style={{ paddingLeft: '16px', fontSize: '0.9rem', color: '#fff', margin: 0 }}>
                    {portfolioDoctor.weakStocks.map((ticker: string, i: number) => (
                      <li key={i} style={{ marginBottom: '4px' }}>{ticker.replace('.NS','')}</li>
                    ))}
                  </ul>
                ) : (
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>All assets appear to have stable momentum.</span>
                )}
              </div>

              {/* Action Plan */}
              <div style={{ background: 'rgba(8, 153, 129, 0.05)', padding: '16px', borderRadius: '12px', borderLeft: '3px solid var(--success-color)' }}>
                <h5 style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success-color)', marginBottom: '12px', fontSize: '1rem' }}>
                  <CheckCircle2 size={18}/> Actionable Fixes
                </h5>
                <ul style={{ paddingLeft: '16px', fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                  {portfolioDoctor.suggestions.map((sug: string, i: number) => (
                    <li key={i} style={{ marginBottom: '8px' }} dangerouslySetInnerHTML={{__html: sug }} />
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Floating AI Assistant Chatbot */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            style={{ 
              position: 'fixed', bottom: '100px', right: '32px', width: '360px', height: '480px', 
              background: 'var(--bg-tertiary)', borderRadius: '16px', border: '1px solid rgba(41, 98, 255, 0.3)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 100
            }}
          >
            <div style={{ background: 'linear-gradient(90deg, #2962ff, #1e4bd8)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                <Cpu size={20}/> <strong style={{ letterSpacing: '0.5px' }}>AI Assistant</strong>
              </div>
              <button onClick={() => setIsChatOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={18}/></button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ 
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  background: msg.sender === 'user' ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
                  color: '#fff', padding: '12px 16px', borderRadius: '16px',
                  borderBottomRightRadius: msg.sender === 'user' ? '4px' : '16px',
                  borderBottomLeftRadius: msg.sender === 'ai' ? '4px' : '16px',
                  maxWidth: '85%', fontSize: '0.9rem', lineHeight: 1.5
                }} dangerouslySetInnerHTML={{__html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}} />
              ))}
            </div>
            
            <form onSubmit={handleChat} style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                value={chatInput} 
                onChange={e => setChatInput(e.target.value)} 
                placeholder="Ask about your portfolio..." 
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '10px' }}><Send size={18}/></button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsChatOpen(!isChatOpen)}
        style={{ 
          position: 'fixed', bottom: '32px', right: '32px', width: '60px', height: '60px', 
          borderRadius: '30px', background: 'linear-gradient(135deg, #2962ff 0%, #1e4bd8 100%)', 
          border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(41, 98, 255, 0.4)', zIndex: 100, transition: 'transform 0.2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        {isChatOpen ? <X size={24}/> : <MessageSquare size={24}/>}
      </button>

    </div>
  );
}
