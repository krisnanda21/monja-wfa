"use client";

import { useUser } from "@/app/context/UserContext";

export function UserRoleSwitcher() {
  const { currentUser, users, setCurrentUser, isLoading } = useUser();

  if (isLoading) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: 'rgba(0,0,0,0.85)',
      color: 'white',
      padding: '12px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      fontSize: '12px'
    }}>
      <div style={{ fontWeight: 'bold' }}>🧪 Dev Role Switcher</div>
      <select 
        value={currentUser?.id || ""} 
        onChange={(e) => {
          const u = users.find(user => user.id === e.target.value) || null;
          setCurrentUser(u);
          // Reload page to reset state if we wanted, but context handles it.
          window.location.reload();
        }}
        style={{
          padding: '4px',
          borderRadius: '4px',
          backgroundColor: '#333',
          color: 'white',
          border: '1px solid #555'
        }}
      >
        <option value="">Not Logged In</option>
        {users.map(u => (
          <option key={u.id} value={u.id}>
            {u.name} - {u.role} ({u.subbagian})
          </option>
        ))}
      </select>
    </div>
  );
}
