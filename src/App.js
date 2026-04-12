import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref as dbRef, onValue } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { ShieldAlert, Globe, Activity, Server, Zap, Signal, LogOut, FileText } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import 'leaflet/dist/leaflet.css';
import './App.css';

// Fix for default Leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Red Icon for Threats
const attackIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

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

function MapRecenter({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords[0] !== 0) {
      map.flyTo(coords, 4, { animate: true });
    }
  }, [coords, map]);
  return null;
}

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [health, setHealth] = useState({ latency: 0, speed: 0, status: 'Active' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubAlerts = onValue(dbRef(db, 'live_alerts'), (snap) => {
      const data = snap.val();
      if (data) {
        const list = Object.values(data).reverse();
        setAlerts(list);
        const counts = {};
        list.forEach(a => counts[a.type] = (counts[a.type] || 0) + 1);
        setChartData(Object.keys(counts).map(k => ({ name: k, value: counts[k] })));
      }
    });
    const unsubHealth = onValue(dbRef(db, 'network_status'), (snap) => {
      if (snap.val()) setHealth(snap.val());
    });
    return () => { unsubAlerts(); unsubHealth(); };
  }, [user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Cybersecurity Incident Report", 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text("System: Intelligent Network Traffic Monitoring & IDS", 14, 37);
    const tableColumn = ["Type", "Source IP", "Location", "Severity", "Timestamp"];
    const tableRows = alerts.map(a => [a.type, a.source, a.location || "Unknown", a.severity, new Date(a.timestamp).toLocaleString()]);
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 45, theme: 'grid', headStyles: { fillColor: [239, 68, 68] } });
    doc.save(`IDS_Report_${new Date().getTime()}.pdf`);
  };

  if (!user) {
    return (
      <div style={{ backgroundColor: '#0f172a', color: 'white', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'system-ui' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '3rem', borderRadius: '12px', width: '400px', textAlign: 'center', border: '1px solid #334155' }}>
          <ShieldAlert color="#ef4444" size={56} style={{ marginBottom: '1rem' }} />
          {/* Dynamic Login/Register Header */}
          <h2 style={{ marginBottom: '1.5rem' }}>{isRegistering ? "Register New Account" : "Login to System"}</h2>
          {authError && <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '13px' }}>{authError}</div>}
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '12px', borderRadius: '6px', backgroundColor: '#0f172a', color: 'white', border: '1px solid #334155' }} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '12px', borderRadius: '6px', backgroundColor: '#0f172a', color: 'white', border: '1px solid #334155' }} required />
            <button type="submit" style={{ padding: '12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              {isRegistering ? "Create Account" : "Access Dashboard"}
            </button>
          </form>
          <div style={{ marginTop: '1.5rem', cursor: 'pointer', color: '#3b82f6', fontSize: '14px' }} onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? "Already have an account? Login" : "Don't have an account? Register"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0f172a', color: 'white', minHeight: '100vh', padding: '1.5rem', fontFamily: 'system-ui' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldAlert color="#ef4444" size={32} />
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Intelligent Network Traffic Monitoring & Intrusion Detection System</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '6px 12px', borderRadius: '8px', border: '1px solid #3b82f6' }}><Signal size={16} color="#3b82f6" /><span style={{ fontSize: '13px', fontWeight: 'bold' }}>{health.latency} ms</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '8px', border: '1px solid #10b981' }}><Zap size={16} color="#10b981" /><span style={{ fontSize: '13px', fontWeight: 'bold' }}>{health.speed} Mbps</span></div>
          <button onClick={() => signOut(auth)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><LogOut size={20} /></button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #ef4444', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Threats Detected</span><div style={{ fontSize: '36px', fontWeight: 'bold', marginTop: '5px' }}>{alerts.length}</div></div>
                  <button onClick={generatePDF} style={{ backgroundColor: '#334155', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}><FileText size={16} /> Export PDF</button>
              </div>
              <div style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #3b82f6' }}>
                  <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>System Status</span>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '10px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={18} /> Live Monitoring Active</div>
              </div>
          </div>

          <div style={{ backgroundColor: '#1e293b', padding: '1.2rem', borderRadius: '12px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}><Globe size={20} color="#3b82f6" /><h3 style={{ margin: 0, fontSize: '16px' }}>Geospatial Threat Attribution</h3></div>
            <div style={{ height: '350px', borderRadius: '8px', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
              <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
                {alerts.map((a, i) => (a.lat && a.lon) && (<Marker key={i} position={[a.lat, a.lon]} icon={attackIcon}><Popup><div style={{ color: '#333' }}><strong style={{ color: '#ef4444' }}>{a.type} Detected</strong><br/>Source: {a.source}<br/>Location: {a.location || 'Unknown'}</div></Popup></Marker>))}
                {alerts.length > 0 && alerts[0].lat && <MapRecenter coords={[alerts[0].lat, alerts[0].lon]} />}
              </MapContainer>
            </div>
          </div>

          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
             <div style={{ padding: '1rem', backgroundColor: '#334155', fontWeight: 'bold' }}>Real-time Incident Feed</div>
             <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {alerts.length === 0 ? <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No threats detected. Network secure.</div> : alerts.map((a, i) => (
                  <div key={i} style={{ padding: '0.8rem 1rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: a.severity === 'High' ? '#ef4444' : '#f59e0b', fontWeight: 'bold', width: '80px' }}>[{a.type}]</span>
                    <span style={{ flex: 1, textAlign: 'center', color: '#e2e8f0' }}>{a.location || 'Identifying...'}</span>
                    <span style={{ opacity: 0.6, width: '120px', textAlign: 'right' }}>{a.source}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '12px' }}>
            <h3 style={{ marginTop: 0, fontSize: '16px' }}>Threat Distribution</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{chartData.map((e, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}</Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: 'white' }} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #3b82f6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#3b82f6', marginBottom: '10px' }}><Server size={20} /><span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Monitoring Interface</span></div>
            <div style={{ fontWeight: 'bold', fontSize: '15px' }}>Intel(R) Wi-Fi 6 AX201 160MHz</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '5px' }}>Status: Live & Sniffing</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;