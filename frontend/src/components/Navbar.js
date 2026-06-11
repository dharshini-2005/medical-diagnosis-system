import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: '🏠 Dashboard' },
    { to: '/diagnose',  label: '🔬 Diagnose' },
    { to: '/history',   label: '📋 History' },
    { to: '/profile',   label: '👤 Profile' }
  ];

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-icon">🩺</span>
        <span className="brand-name">MediDiagnose AI</span>
      </div>

      <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>☰</button>

      <ul className={`navbar-links ${menuOpen ? 'open' : ''}`}>
        {navLinks.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className={location.pathname === link.to ? 'active' : ''}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          </li>
        ))}
        <li className="nav-user">
          <span>👋 {user?.name}</span>
        </li>
        <li>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </li>
      </ul>
    </nav>
  );
}
