"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@/app/context/UserContext';
import styles from './profile.module.css';

export default function ProfilePage() {
  const { currentUser, setCurrentUser, fetchUsers, isLoading } = useUser();
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    subbagian: 'Penkom',
    role: 'Anggota Tim',
    password: ''
  });
  
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        position: currentUser.position || '',
        subbagian: currentUser.subbagian || 'Penkom',
        role: currentUser.role || 'Anggota Tim',
        password: '' // Don't show existing password
      });
    }
  }, [currentUser]);

  if (isLoading) return <div className={styles.container} style={{textAlign: 'center', paddingTop: '100px'}}>Loading...</div>;
  if (!currentUser) return <div className={styles.container} style={{textAlign: 'center', paddingTop: '100px'}}>Please sign in.</div>;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      // Create payload. Only include password if it was filled out.
      const payload: any = {
        name: formData.name,
        position: formData.position,
        subbagian: formData.subbagian,
        role: formData.role
      };
      
      if (formData.password.trim() !== '') {
        payload.password = formData.password;
      }

      const res = await fetch(`/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updatedUser = await res.json();
        // Update local session
        setCurrentUser(updatedUser);
        fetchUsers(); // Refresh context users list
        
        setMessage('Profile updated successfully!');
        setFormData(prev => ({ ...prev, password: '' })); // clear password field
      } else {
        setMessage('Failed to update profile.');
      }
    } catch (err) {
      setMessage('Network error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>My Profile</h1>
        <p className={styles.subtitle}>View and edit your personal information. Username cannot be changed.</p>
        
        {message && (
          <div className={styles.messageBadge} style={{backgroundColor: message.includes('success') ? '#dcfce7' : '#fee2e2', color: message.includes('success') ? '#166534' : '#991b1b'}}>
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Username (Read-Only)</label>
            <input 
              type="text" 
              className={styles.input} 
              value={(currentUser as any).username || ''} 
              disabled 
              style={{backgroundColor: '#e5e7eb', cursor: 'not-allowed', color: '#6b7280'}}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Full Name</label>
            <input 
              type="text" 
              name="name"
              className={styles.input} 
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Jabatan (Position)</label>
            <input 
              type="text" 
              name="position"
              className={styles.input} 
              value={formData.position}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Role</label>
              <select name="role" className={styles.select} value={formData.role} onChange={handleInputChange} required>
                {['Admin', 'Anggota Tim', 'Ketua Tim', 'Dalnis', 'Subkoordinator', 'Koordinator'].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Subbagian</label>
              <select name="subbagian" className={styles.select} value={formData.subbagian} onChange={handleInputChange} required>
                {['Penkom', 'Bangkom', 'Pembinaan', 'Khusus'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>New Password (Optional)</label>
            <input 
              type="password" 
              name="password"
              className={styles.input} 
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Leave blank to keep current password"
            />
          </div>

          <button type="submit" className={styles.btnPrimary} disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
