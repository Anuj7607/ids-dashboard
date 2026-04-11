import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref as dbRef, onValue } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
import { ShieldAlert, ShieldCheck, Activity, Server, Lock, LogOut, UserPlus, User, X } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './App.css';

// ==========================================
// 1. FIREBASE CONFIG 
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyA-Nb12qmK3E1G56Hs16fqKqgZX5y4z8pg",
  authDomain: "ids-dashboard-f86c6.firebaseapp.com",
  databaseURL: "https://ids-dashboard-f86c6-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ids-dashboard-f86c6",
  storageBucket: "ids-dashboard-f86c6.firebasestorage.app",
  messagingSenderId: "533039350303",
  appId: "1:533039350303:web:83c062553da413656ecb2a"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

const CHART_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981'];

function App() {
  // Auth State
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');

  // Dashboard State
  const [alerts, setAlerts] = useState([]);
  const [chartData, setChartData] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [systemStatus, setSystemStatus] = useState('Active');

  // Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleAuth = (e) => {
    e.preventDefault();
    setAuthError('');
    
    if (isRegistering) {
      createUserWithEmailAndPassword(auth, email, password)
        .catch((error) => setAuthError(error.message));
    } else {
      signInWithEmailAndPassword(auth, email, password)
        .catch((error) => setAuthError("Invalid credentials. Access Denied."));
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  // --- USERNAME UPDATE LOGIC ---
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    try {
      // Update Firebase Auth Profile with just the username
      await updateProfile(user, {
        displayName: newUsername
      });

      // Force UI to refresh to show the new name
      setUser({ ...auth.currentUser });
      setIsProfileModalOpen(false);
      setNewUsername(''); // Clear the input
    } catch (error) {
      console.error("Error updating username:", error);
      alert("Failed to update username.");
    }
  };

  useEffect(() => {
    if (!user) return;

    const alertsNodeRef = dbRef(db, 'live_alerts');
    const unsubscribe = onValue(alertsNodeRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const alertList = Object.values(data).reverse();
        setAlerts(alertList);

        const typeCounts = {};
        alertList.forEach(alert => {
          typeCounts[alert.type] = (typeCounts[alert.type] || 0) + 1;
        });
        
        const formattedChartData = Object.keys(typeCounts).map(key => ({
          name: key,
          value: typeCounts[key]
        }));
        setChartData(formattedChartData);

      } else {
        setAlerts([]);
        setChartData([]);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // ==========================================
  // UI: LOGIN SCREEN
  // ==========================================
  if (!user) {
    return (
      <div style={{ backgroundColor: '#0f172a', color: 'white', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'system-ui' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '3rem', borderRadius: '12px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', textAlign: 'center' }}>
          <ShieldAlert color="#ef4444" size={56} style={{ marginBottom: '1rem' }} />
          <h2 style={{ margin: '0 0 2rem 0', fontSize: '24px' }}>SOC Gateway</h2>
          
          {authError && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '10px', borderRadius: '6px', marginBottom: '1rem', fontSize: '14px' }}>{authError}</div>}

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="email" 
              placeholder="Email Address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: '12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', outline: 'none' }}
              required
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: '12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', outline: 'none' }}
              required
            />
            <button type="submit" style={{ padding: '12px', backgroundColor: isRegistering ? '#10b981' : '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              {isRegistering ? <UserPlus size={18} /> : <Lock size={18} />} 
              {isRegistering ? "Create Account" : "Authenticate"}
            </button>
          </form>
          
          <div style={{ marginTop: '1.5rem', fontSize: '14px', color: '#94a3b8' }}>
            {isRegistering ? "Already have an account? " : "Need an account? "}
            <span 
              onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }} 
              style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {isRegistering ? "Log In" : "Sign Up"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // UI: MAIN DASHBOARD
  // ==========================================
  return (
    <div style={{ backgroundColor: '#0f172a', color: 'white', minHeight: '100vh', padding: '2rem', fontFamily: 'system-ui', position: 'relative' }}>
      
      {/* Username Edit Modal */}
      {isProfileModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: '#1e293b', padding: '2rem', borderRadius: '12px', width: '350px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Set Username</h3>
              <X size={20} color="#94a3b8" style={{ cursor: 'pointer' }} onClick={() => setIsProfileModalOpen(false)} />
            </div>
            
            <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                type="text" 
                placeholder="e.g., SecurityAdmin01" 
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', outline: 'none' }}
                required
              />
              <button type="submit" style={{ padding: '10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
                Save Username
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldAlert color="#ef4444" size={36} />
          <h1 style={{ margin: 0, fontSize: '22px' }}>Intelligent Network Monitoring and Intrusion Detection System</h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: '8px 16px', borderRadius: '20px' }}>
            <Activity size={20} />
            <span style={{ fontWeight: 'bold' }}>System {systemStatus}</span>
          </div>
          
          {/* User Profile Display */}
          <div 
            onClick={() => setIsProfileModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#1e293b', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', border: '1px solid #334155', transition: '0.2s' }}
            title="Click to set username"
          >
            <div style={{ backgroundColor: '#3b82f6', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <User size={16} color="white" />
            </div>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
              {user.displayName || user.email.split('@')[0]}
            </span>
          </div>

          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#334155', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        
        {/* Left Column: Stats & Logs */}
        <div>
          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #ef4444' }}>
              <h3 style={{ margin: 0, color: '#94a3b8', fontSize: '14px', textTransform: 'uppercase' }}>Total Threats</h3>
              <p style={{ margin: '10px 0 0 0', fontSize: '36px', fontWeight: 'bold' }}>{alerts.length}</p>
            </div>
            <div style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #3b82f6' }}>
              <h3 style={{ margin: 0, color: '#94a3b8', fontSize: '14px', textTransform: 'uppercase' }}>Interface Monitored</h3>
              <p style={{ margin: '10px 0 0 0', fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Server size={24} color="#3b82f6"/> Wi-Fi 6 AX201
              </p>
            </div>
          </div>

          {/* Alert Feed */}
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '1.2rem', backgroundColor: '#334155', fontWeight: 'bold', fontSize: '18px' }}>
              Live Threat Log
            </div>
            
            {alerts.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                <ShieldCheck size={64} style={{ margin: '0 auto', marginBottom: '1rem', color: '#22c55e', opacity: '0.8' }} />
                <h2>Network is Secure</h2>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '400px', overflowY: 'auto' }}>
                {alerts.map((alert, index) => (
                  <div key={index} style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', 
                    borderBottom: '1px solid #334155',
                    backgroundColor: alert.severity === 'High' ? 'rgba(239, 68, 68, 0.05)' : 'transparent'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ 
                        backgroundColor: alert.severity === 'High' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)', 
                        color: alert.severity === 'High' ? '#ef4444' : '#f59e0b', 
                        padding: '4px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold'
                      }}>
                        {alert.type}
                      </span>
                      <span style={{ fontFamily: 'monospace', color: '#e2e8f0', fontSize: '14px' }}>
                        {alert.source} &rarr; {alert.destination}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Analytics */}
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '18px', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
            Threat Distribution
          </h3>
          
          {chartData.length > 0 ? (
            <div style={{ flexGrow: 1, minHeight: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
                    itemStyle={{ color: 'white' }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#cbd5e1' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748b' }}>
              Awaiting data to generate analytics...
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default App;
