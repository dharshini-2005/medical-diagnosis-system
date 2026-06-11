import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, topDisease: '-', recentDate: '-' });
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/history')
      .then((res) => {
        const records = res.data.records || [];
        setRecentRecords(records.slice(0, 3));
        setStats({
          total: records.length,
          topDisease: records[0]?.topDiagnosis || '—',
          recentDate: records[0]
            ? new Date(records[0].createdAt).toLocaleDateString()
            : '—'
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { icon: '🔬', label: 'Start Diagnosis', desc: 'Enter your symptoms and get instant AI analysis', to: '/diagnose', color: '#0078d7' },
    { icon: '📋', label: 'View History',    desc: 'Review all your past diagnosis records',          to: '/history',  color: '#38a169' },
    { icon: '👤', label: 'My Profile',      desc: 'Update your personal health information',         to: '/profile',  color: '#805ad5' }
  ];

  return (
    <div className="dashboard-page fade-in">
      <div className="dashboard-hero">
        <div>
          <h1>Good day, {user?.name?.split(' ')[0]} 👋</h1>
          <p>Your AI-powered medical diagnosis assistant is ready.</p>
        </div>
        <Link to="/diagnose" className="btn-diagnose-now">🔬 Diagnose Now</Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">📊</span>
          <div>
            <p className="stat-value">{loading ? '…' : stats.total}</p>
            <p className="stat-label">Total Diagnoses</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🩸</span>
          <div>
            <p className="stat-value">{loading ? '…' : stats.topDisease}</p>
            <p className="stat-label">Last Diagnosis</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📅</span>
          <div>
            <p className="stat-value">{loading ? '…' : stats.recentDate}</p>
            <p className="stat-label">Last Checkup</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <h2 className="section-title">Quick Actions</h2>
      <div className="action-cards">
        {cards.map((c) => (
          <Link to={c.to} key={c.to} className="action-card" style={{ '--accent': c.color }}>
            <span className="action-icon">{c.icon}</span>
            <h3>{c.label}</h3>
            <p>{c.desc}</p>
          </Link>
        ))}
      </div>

      {/* Recent records */}
      {recentRecords.length > 0 && (
        <>
          <h2 className="section-title">Recent Diagnoses</h2>
          <div className="recent-list">
            {recentRecords.map((r) => (
              <div key={r._id} className="recent-item">
                <div>
                  <strong>{r.topDiagnosis}</strong>
                  <p className="recent-symptoms">{r.symptoms.join(', ')}</p>
                </div>
                <span className="recent-date">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
            <Link to="/history" className="view-all-link">View all history →</Link>
          </div>
        </>
      )}

      <footer className="dashboard-footer">
        💡 Built with MERN Stack · AI Medical Diagnosis System
      </footer>
    </div>
  );
}
