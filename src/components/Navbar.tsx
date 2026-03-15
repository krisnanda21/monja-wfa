"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/app/context/UserContext';
import { useState, useEffect, useRef } from 'react';
import styles from './Navbar.module.css';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser } = useUser();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const fetchNotifs = async () => {
      const res = await fetch(`/api/notifications?userId=${currentUser.id}`);
      if (res.ok) setNotifications(await res.json());
    };
    fetchNotifs();
    // Poll every 10 seconds
    const int = setInterval(fetchNotifs, 10000);
    return () => clearInterval(int);
  }, [currentUser]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async () => {
    if (!currentUser) return;
    await fetch(`/api/notifications?userId=${currentUser.id}`, { method: 'PUT' });
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUserId');
      window.location.href = '/';
    }
  };

  const isAdmin = currentUser?.role === 'Admin';

  // Do not show navbar on login page
  if (pathname === '/') return null;

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <div className={styles.brand} onClick={() => router.push('/dashboard')} style={{cursor: 'pointer'}}>
          <img src="/logo.jpg" alt="Logo" style={{width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover'}} />
          <span className={styles.brandName} style={{display: 'none'}}>TaskManager</span>
        </div>
        
        <div className={styles.navLinks}>
          <Link 
            href="/dashboard"
            className={`${styles.navLink} ${pathname === '/dashboard' ? styles.active : ''}`}
          >
            Dashboard
          </Link>
          <Link 
            href="/my-job" 
            className={`${styles.navLink} ${pathname.startsWith('/my-job') ? styles.active : ''}`}
          >
            My Job
          </Link>
          {isAdmin && (
            <Link 
              href="/admin" 
              className={`${styles.navLink} ${pathname.startsWith('/admin') ? styles.active : ''}`}
            >
              Admin
            </Link>
          )}
          {!isAdmin && (
            <Link 
              href="/profile" 
              className={`${styles.navLink} ${pathname === '/profile' ? styles.active : ''}`}
            >
              Profile
            </Link>
          )}
        </div>
        
        <div className={styles.userProfile}>
          {currentUser ? (
            <>
              <div ref={dropdownRef} style={{position: 'relative', cursor: 'pointer'}} onClick={() => {
                setShowDropdown(!showDropdown);
                if (unreadCount > 0) markAsRead();
              }}>
                <span style={{fontSize: '1.5rem'}}>🔔</span>
                {unreadCount > 0 && (
                  <span className={styles.badge}>{unreadCount}</span>
                )}
                
                {showDropdown && (
                  <div className={styles.notifDropdown} onClick={(e) => e.stopPropagation()}>
                    <div style={{fontWeight: 600, paddingBottom: '10px', borderBottom: '1px solid #eee', marginBottom: '10px', color: '#000'}}>Notifications</div>
                    {notifications.length === 0 && <div style={{color: '#888', fontSize: '0.9rem'}}>No notifications</div>}
                    {notifications.map(n => (
                       <Link 
                         href={n.taskId ? `/my-job/${n.taskId}` : '#'} 
                         key={n.id} 
                         className={styles.notifItem}
                         style={{opacity: n.isRead ? 0.7 : 1}}
                       >
                         <div style={{fontSize: '0.85rem', color: '#333'}}>{n.message}</div>
                         <div style={{fontSize: '0.75rem', color: '#888', marginTop: '4px'}}>{new Date(n.timestamp).toLocaleString()}</div>
                       </Link>
                    ))}
                  </div>
                )}
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{currentUser.name}</span>
                <span className={styles.userRole}>{currentUser.role}</span>
              </div>
              <button 
                onClick={handleLogout} 
                style={{marginLeft: '15px', background: 'transparent', border: '1px solid #ccc', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', color: '#000'}}
              >
                Logout
              </button>
            </>
          ) : (
            <div className={styles.userInfo}>
              <span className={styles.userName}>Not Logged In</span>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
