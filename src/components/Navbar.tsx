"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/app/context/UserContext';
import { useState, useEffect, useRef } from 'react';
import styles from './Navbar.module.css';

export default function Navbar({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser } = useUser();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const closeSidebar = () => setSidebarOpen(false);

  const isAdmin = currentUser?.role === 'Admin';

  if (pathname === '/') return <>{children}</>;

  return (
    <>
      {/* Mobile Toggle & Overlay */}
      <button className={styles.mobileToggle} onClick={() => setSidebarOpen(true)}>
        ☰
      </button>
      <div 
        className={`${styles.mobileOverlay} ${sidebarOpen ? styles.open : ''}`} 
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader} onClick={() => { router.push('/dashboard'); closeSidebar(); }}>
          <img src="/logo.jpg" alt="Logo" style={{width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover'}} />
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>Monitoring Kinerja</span>
            <span className={styles.brandSubtitle}>Work From Anywhere</span>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          <Link href="/dashboard" onClick={closeSidebar} className={`${styles.navLink} ${pathname === '/dashboard' ? styles.active : ''}`}>
            Dashboard
          </Link>
          <Link href="/my-job" onClick={closeSidebar} className={`${styles.navLink} ${pathname.startsWith('/my-job') ? styles.active : ''}`}>
             My Job
          </Link>
          {isAdmin && (
            <Link href="/admin" onClick={closeSidebar} className={`${styles.navLink} ${pathname.startsWith('/admin') ? styles.active : ''}`}>
              Admin
            </Link>
          )}
          {!isAdmin && currentUser && (
            <Link href="/profile" onClick={closeSidebar} className={`${styles.navLink} ${pathname === '/profile' ? styles.active : ''}`}>
              Profile
            </Link>
          )}
        </nav>

        <div className={styles.sidebarFooter}>
          {currentUser ? (
            <div className={styles.userInfo}>
              <span className={styles.userName}>{currentUser.name}</span>
              <span className={styles.userRole}>{currentUser.role}</span>
            </div>
          ) : (
            <div className={styles.userInfo}>
              <span className={styles.userName}>Not Logged In</span>
            </div>
          )}
        </div>
      </aside>

      {/* Topbar for Notifications and Logout */}
      <header className={styles.topbar}>
        <div className={styles.topbarRight}>
          {currentUser && (
            <div ref={dropdownRef} style={{position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center'}} onClick={() => {
              setShowDropdown(!showDropdown);
              if (unreadCount > 0) markAsRead();
            }}>
              <span style={{fontSize: '1.4rem'}}>🔔</span>
              {unreadCount > 0 && (
                <span className={styles.badge}>{unreadCount}</span>
              )}
              
              {showDropdown && (
                <div className={styles.notifDropdown} onClick={(e) => e.stopPropagation()}>
                  <div style={{fontWeight: 600, paddingBottom: '10px', borderBottom: '1px solid #e2e8f0', marginBottom: '10px', color: '#0f172a'}}>Notifications</div>
                  {notifications.length === 0 && <div style={{color: '#64748b', fontSize: '0.9rem'}}>No notifications</div>}
                  {notifications.map(n => (
                     <Link 
                       href={n.taskId ? `/my-job/${n.taskId}` : '#'} 
                       key={n.id} 
                       className={styles.notifItem}
                       style={{opacity: n.isRead ? 0.7 : 1}}
                     >
                       <div style={{fontSize: '0.85rem', color: '#334155'}}>{n.message}</div>
                       <div style={{fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px'}}>{new Date(n.timestamp).toLocaleString()}</div>
                     </Link>
                  ))}
                </div>
              )}
            </div>
          )}
          {currentUser && (
            <button onClick={handleLogout} className={styles.logoutBtn}>
              Logout
            </button>
          )}
        </div>
      </header>

      {/* Main Content Wrapper */}
      <main className={styles.mainContent}>
        {children}
      </main>
    </>
  );
}
