import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name:   user?.name   || '',
    age:    user?.age    || '',
    gender: user?.gender || ''
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.name
    ?.split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="profile-page fade-in">
      <div className="profile-hero">
        <div className="avatar">{initials}</div>
        <div>
          <h1>{user?.name}</h1>
          <p>{user?.email}</p>
          <span className="role-badge">{user?.role}</span>
        </div>
      </div>

      <div className="profile-card">
        <h2>✏️ Edit Profile</h2>
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label>Full Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your name"
              required
            />
          </div>

          <div className="profile-row">
            <div className="form-group">
              <label>Age</label>
              <input
                type="number"
                name="age"
                value={form.age}
                onChange={handleChange}
                placeholder="25"
                min="1" max="120"
              />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input value={user?.email} disabled className="disabled-input" />
            <small>Email cannot be changed</small>
          </div>

          <button type="submit" className="btn-save" disabled={saving}>
            {saving ? 'Saving…' : '💾 Save Changes'}
          </button>
        </form>
      </div>

      <div className="profile-info-card">
        <h3>📊 Account Info</h3>
        <div className="info-row">
          <span>Member since</span>
          <strong>{new Date(user?.createdAt).toLocaleDateString()}</strong>
        </div>
        <div className="info-row">
          <span>Account role</span>
          <strong>{user?.role}</strong>
        </div>
      </div>
    </div>
  );
}
