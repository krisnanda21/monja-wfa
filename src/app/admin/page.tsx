"use client";

import { useState, useRef } from 'react';
import styles from './admin.module.css';
import { useUser } from '@/app/context/UserContext';

export default function AdminDashboard() {
  const { currentUser, users, fetchUsers } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<{name: string, username: string, password: string, position: string, role: string[], subbagian: string}>({
    name: '',
    username: '',
    password: '',
    position: '',
    role: [],
    subbagian: 'Penkom'
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileStatus, setFileStatus] = useState({ type: '', message: '' });
  
  // Edit User state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{name: string, username: string, password: string, position: string, role: string[], subbagian: string}>({
    name: '',
    username: '',
    position: '',
    role: [],
    subbagian: 'Penkom',
    password: ''
  });
  const [editStatus, setEditStatus] = useState({ type: '', message: '' });
  
  // Password Visibility state for table
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleRoleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const { value, checked } = e.target;
    if (isEdit) {
      setEditFormData(prev => ({
        ...prev,
        role: checked ? [...prev.role, value] : prev.role.filter(r => r !== value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        role: checked ? [...prev.role, value] : prev.role.filter(r => r !== value)
      }));
    }
  };

  const roleOptions = ['Anggota Tim', 'Ketua Tim', 'Dalnis', 'Subkoordinator', 'Koordinator', 'Assesor Utama', 'Admin'];

  // Only allow admin to view this directly, mock a check
  if (currentUser?.role !== "Admin") {
    return (
      <div className={styles.container} style={{textAlign: 'center', paddingTop: '100px'}}>
        <h2 className={styles.title}>Access Denied</h2>
        <p className={styles.subtitle}>You must be an Admin to view this page. Please use the Role Switcher.</p>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await fetch('/api/users/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStatus({ type: 'success', message: `User ${formData.name} added successfully!` });
        setFormData({ name: '', username: '', password: '', position: '', role: [], subbagian: 'Penkom' });
        fetchUsers();
      } else {
        const error = await res.json();
        setStatus({ type: 'error', message: error.message || 'Failed to add user' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSubmitting(true);
    setFileStatus({ type: '', message: '' });

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        
        const res = await fetch('/api/users/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csvData: text }),
        });

        if (res.ok) {
          const result = await res.json();
          setFileStatus({ type: 'success', message: `Successfully imported ${result.count} users!` });
          fetchUsers();
          if (fileInputRef.current) fileInputRef.current.value = '';
        } else {
          const error = await res.json();
          setFileStatus({ type: 'error', message: error.message || 'Failed to import users' });
        }
      } catch (err) {
        setFileStatus({ type: 'error', message: 'Failed to process CSV file.' });
      } finally {
        setIsSubmitting(false);
      }
    };
    reader.readAsText(file);
  };

  const openEditModal = (user: any) => {
    setEditingUserId(user.id);
    setEditFormData({
      name: user.name,
      username: user.username || '',
      position: user.position,
      role: user.role ? user.role.split(',') : [],
      subbagian: user.subbagian,
      password: '' // Don't show existing hash in input
    });
    setEditStatus({ type: '', message: '' });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setEditStatus({ type: '', message: '' });

    try {
      const payload: any = {
        name: editFormData.name,
        username: editFormData.username,
        position: editFormData.position,
        subbagian: editFormData.subbagian,
        role: editFormData.role
      };
      if (editFormData.password.trim() !== '') {
        payload.password = editFormData.password;
      }

      const res = await fetch(`/api/users/${editingUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setEditStatus({ type: 'success', message: 'User updated successfully!' });
        fetchUsers();
        setTimeout(() => setEditingUserId(null), 1500);
      } else {
        const error = await res.json();
        setEditStatus({ type: 'error', message: error.message || 'Failed to update user' });
      }
    } catch (err) {
      setEditStatus({ type: 'error', message: 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) return;
    
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        alert('User deleted successfully!');
        fetchUsers();
      } else {
        const error = await res.json();
        alert('Failed to delete user: ' + (error.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Network error while deleting user.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>User Management</h1>
        <p className={styles.subtitle}>Add new users or import them via CSV.</p>
      </div>

      <div className={styles.grid}>
        {/* Manual Addition Card */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Add User Manually</h2>
          <form onSubmit={handleManualSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Name</label>
              <input 
                type="text" 
                name="name" 
                className={styles.input} 
                value={formData.name} 
                onChange={handleInputChange} 
                required 
                placeholder="John Doe"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Username</label>
              <input 
                type="text" 
                name="username" 
                className={styles.input} 
                value={formData.username} 
                onChange={handleInputChange} 
                required 
                placeholder="johndoe"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Password</label>
              <input 
                type="password" 
                name="password" 
                className={styles.input} 
                value={formData.password} 
                onChange={handleInputChange} 
                required 
                placeholder="secret123"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Position</label>
              <input 
                type="text" 
                name="position" 
                className={styles.input} 
                value={formData.position} 
                onChange={handleInputChange} 
                required 
                placeholder="e.g. Staff IT"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Subbagian</label>
              <select name="subbagian" className={styles.select} value={formData.subbagian} onChange={handleInputChange}>
                <option value="Penkom">Penkom</option>
                <option value="Bangkom">Bangkom</option>
                <option value="Pembinaan">Pembinaan</option>
                <option value="Khusus">Khusus</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Roles (Select multiple)</label>
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #cbd5e1'}}>
                {roleOptions.map(r => (
                  <label key={r} style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b', cursor: 'pointer'}}>
                    <input 
                      type="checkbox" 
                      value={r} 
                      checked={formData.role.includes(r)} 
                      onChange={(e) => handleRoleCheckboxChange(e, false)} 
                      style={{width: '16px', height: '16px'}}
                    />
                    {r}
                  </label>
                ))}
              </div>
            </div>
            <button type="submit" className={styles.button} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Add User'}
            </button>
            {status.message && (
              <div className={`${styles.message} ${status.type === 'success' ? styles.success : styles.error}`}>
                {status.message}
              </div>
            )}
          </form>
        </div>

        {/* Bulk Upload Card */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Bulk Import (CSV)</h2>
          <p className={styles.subtitle} style={{marginBottom: '10px', fontSize: '0.9rem'}}>
            CSV format must contain headers: <strong>name,username,password,position,subbagian</strong><br/>
            Valid Subbagian: Penkom, Bangkom, Pembinaan, Khusus
          </p>
          <a href="data:text/csv;charset=utf-8,name,username,password,position,subbagian%0AJohn Doe,johndoe,password123,Staff IT,Penkom" download="user_template.csv" style={{display: 'inline-block', marginBottom: '20px', color: '#0070f3', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem'}}>
            ⬇ Download CSV Template
          </a>
          
          <div 
            className={styles.fileUploadArea}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className={styles.uploadIcon}>📄</div>
            <h3>Click or drag to upload CSV</h3>
            <p className={styles.uploadHelp}>Only .csv files are supported</p>
            <input 
              type="file" 
              accept=".csv" 
              className={styles.fileInput} 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>
          
          {fileStatus.message && (
            <div className={`${styles.message} ${fileStatus.type === 'success' ? styles.success : styles.error}`}>
              {fileStatus.message}
            </div>
          )}
        </div>
      </div>

      {/* Existing Users Table */}
      <div className={styles.userListSection}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
          <h2 className={styles.cardTitle} style={{marginBottom: 0}}>Daftar User ({users.length})</h2>
          <input 
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#000', minWidth: '250px'}}
          />
        </div>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.tr}>
                <th className={styles.th}>Name</th>
                <th className={styles.th}>Username</th>
                <th className={styles.th}>Password</th>
                <th className={styles.th}>Jabatan</th>
                <th className={styles.th}>Subbagian</th>
                <th className={styles.th}>Role</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.filter(u => {
                 if (!searchQuery) return true;
                 const q = searchQuery.toLowerCase();
                 return (
                   u.name.toLowerCase().includes(q) ||
                   u.username?.toLowerCase().includes(q) ||
                   u.position?.toLowerCase().includes(q) ||
                   u.subbagian?.toLowerCase().includes(q) ||
                   u.role?.toLowerCase().includes(q)
                 );
              }).map((user) => (
                <tr key={user.id} className={styles.tr}>
                  <td className={styles.td} style={{fontWeight: 500}}>{user.name}</td>
                  <td className={styles.td} style={{color: '#475569'}}>{user.username}</td>
                  <td className={styles.td} style={{fontFamily: 'monospace', position: 'relative'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                      {visiblePasswords[user.id] ? user.password || 'N/A' : '••••••••'}
                      <button 
                        onClick={() => togglePasswordVisibility(user.id)}
                        style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '2px'}}
                        title="Toggle Password Visibility"
                      >
                        {visiblePasswords[user.id] ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </td>
                  <td className={styles.td} style={{color: '#666'}}>{user.position}</td>
                  <td className={styles.td}>
                    <span className={`${styles.badge} ${styles['badgeSubbagian' + user.subbagian] || styles.badge}`}>
                      {user.subbagian}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <div style={{display: 'flex', gap: '4px', flexWrap: 'wrap'}}>
                      {user.role ? user.role.split(',').map((r: string) => (
                        <span key={r} className={`${styles.badge} ${styles['badgeRole' + r.trim().replace(/\s+/g, '')] || styles.badge}`}>
                          {r.trim()}
                        </span>
                      )) : <span className={styles.badge}>No Role</span>}
                    </div>
                  </td>
                  <td className={styles.td}>
                    <div style={{display: 'flex', gap: '8px'}}>
                      <button 
                        onClick={() => openEditModal(user)}
                        style={{background: '#3b82f6', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600}}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        style={{background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600}}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr className={styles.tr}>
                  <td className={styles.td} colSpan={7} style={{textAlign: 'center', color: '#888'}}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUserId && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
          <div className={styles.card} style={{width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h2 className={styles.cardTitle} style={{margin: 0}}>Edit User</h2>
              <button onClick={() => setEditingUserId(null)} style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer'}}>&times;</button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Name</label>
                <input type="text" name="name" className={styles.input} value={editFormData.name} onChange={handleEditChange} required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Username</label>
                <input type="text" name="username" className={styles.input} value={editFormData.username} onChange={handleEditChange} required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>New Password (Optional)</label>
                <input type="password" name="password" className={styles.input} value={editFormData.password} onChange={handleEditChange} placeholder="Leave blank to keep current password" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Position</label>
                <input type="text" name="position" className={styles.input} value={editFormData.position} onChange={handleEditChange} required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Subbagian</label>
                <select name="subbagian" className={styles.select} value={editFormData.subbagian} onChange={handleEditChange}>
                  <option value="Penkom">Penkom</option>
                  <option value="Bangkom">Bangkom</option>
                  <option value="Pembinaan">Pembinaan</option>
                  <option value="Khusus">Khusus</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Roles (Select multiple)</label>
                <div style={{display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #cbd5e1'}}>
                  {roleOptions.map(r => (
                    <label key={r} style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b', cursor: 'pointer'}}>
                      <input 
                        type="checkbox" 
                        value={r} 
                        checked={editFormData.role.includes(r)} 
                        onChange={(e) => handleRoleCheckboxChange(e, true)} 
                        style={{width: '16px', height: '16px'}}
                      />
                      {r}
                    </label>
                  ))}
                </div>
              </div>
              
              <button type="submit" className={styles.button} disabled={isSubmitting} style={{marginTop: '20px'}}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
              
              {editStatus.message && (
                <div className={`${styles.message} ${editStatus.type === 'success' ? styles.success : styles.error}`} style={{marginTop: '15px'}}>
                  {editStatus.message}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
