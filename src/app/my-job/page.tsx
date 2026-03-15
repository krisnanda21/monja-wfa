"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/app/context/UserContext';
import styles from './my-job.module.css';

export default function MyJobPage() {
  const { currentUser, isLoading } = useUser();
  const [tasks, setTasks] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  
  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc'|'desc'} | null>(null);
  const [filterSubbagian, setFilterSubbagian] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal state
  const [selectedTaskForNotes, setSelectedTaskForNotes] = useState<any>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!currentUser) {
      setFetching(false);
      return;
    }

    async function fetchTasks() {
      try {
        const res = await fetch(`/api/my-job?userId=${currentUser?.id}&role=${currentUser?.role}`);
        if (res.ok) {
          const data = await res.json();
          setTasks(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    }

    fetchTasks();
  }, [currentUser, isLoading]);

  if (isLoading || fetching) {
    return (
      <div className={styles.container} style={{textAlign: 'center', paddingTop: '100px'}}>Loading My Job...</div>
    );
  }

  if (!currentUser) {
    return (
       <div className={styles.container} style={{textAlign: 'center', paddingTop: '100px'}}>
        <h2>Please select a user account to view tasks.</h2>
      </div>
    );
  }

  // Derived filtered/sorted tasks
  const processedTasks = [...tasks].filter(t => {
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchSearch = t.title.toLowerCase().includes(q) || 
                          t.ketuaTim?.name?.toLowerCase().includes(q) || 
                          t.subbagian.toLowerCase().includes(q);
      if (!matchSearch) return false;
    }
    // Filter Subbagian
    if (filterSubbagian && t.subbagian !== filterSubbagian) return false;
    // Filter Status
    if (filterStatus && t.status !== filterStatus) return false;
    
    return true;
  }).sort((a, b) => {
    if (!sortConfig) return 0;
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];
    
    // Handle dates
    if (sortConfig.key === 'startDate' || sortConfig.key === 'endDate') {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    } else {
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
    }
    
    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Job</h1>
        {currentUser.role === 'Ketua Tim' && (
          <div className={styles.headerActions}>
            <Link href="/my-job/create" className={styles.btnPrimary}>
              +Kerja Lagi
            </Link>
          </div>
        )}
      </div>

      <div style={{display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', backgroundColor: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'}}>
        <div style={{flex: '1', minWidth: '250px'}}>
          <label style={{display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px'}}>Search</label>
          <input 
            type="text" 
            placeholder="Cari berdasarkan nama pekerjaan, ketua tim, subbagian..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#000'}}
          />
        </div>
        <div style={{width: '180px'}}>
          <label style={{display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px'}}>Filter Subbagian</label>
          <select 
            value={filterSubbagian} 
            onChange={(e) => setFilterSubbagian(e.target.value)}
            style={{width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#000', backgroundColor: '#f8fafc'}}
          >
            <option value="">Semua Subbagian</option>
            <option value="Penkom">Penkom</option>
            <option value="Bangkom">Bangkom</option>
            <option value="Pembinaan">Pembinaan</option>
            <option value="Khusus">Khusus</option>
          </select>
        </div>
        <div style={{width: '180px'}}>
          <label style={{display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px'}}>Filter Status</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#000', backgroundColor: '#f8fafc'}}
          >
            <option value="">Semua Status</option>
            <option value="SedangDikerjakan">Sedang Dikerjakan</option>
            <option value="ApprovalKetuaTim">Approval Ketua Tim</option>
            <option value="RejectKetuaTim">Reject Ketua Tim</option>
            <option value="ApprovalDalnis">Approval Dalnis</option>
            <option value="RejectDalnis">Reject Dalnis</option>
            <option value="ApprovalSubkoor">Approval Subkoor</option>
            <option value="ApprovalKoordinator">Approval Koordinator</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th} onClick={() => handleSort('title')} style={{cursor: 'pointer'}}>
                Pekerjaan {sortConfig?.key === 'title' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th className={styles.th}>Subbagian</th>
              <th className={styles.th} onClick={() => handleSort('startDate')} style={{cursor: 'pointer'}}>
                Timeline {sortConfig?.key === 'startDate' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {processedTasks.length === 0 && (
              <tr>
                <td colSpan={5} style={{textAlign: 'center', padding: '30px', color: '#888'}}>
                  No tasks available for your current role.
                </td>
              </tr>
            )}
            {processedTasks.map(task => (
              <tr key={task.id} className={styles.tr}>
                <td className={styles.td}>
                  <div style={{fontWeight: 600, color: '#222', fontSize: '1.05rem', marginBottom: '4px'}}>{task.title}</div>
                  <div style={{color: '#666', fontSize: '0.85rem'}}>Ketua: {task.ketuaTim.name}</div>
                </td>
                <td className={styles.td} style={{color: '#000', fontWeight: 500}}>
                  {task.subbagian}
                </td>
                <td className={styles.td} style={{fontSize: '0.9rem', color: '#555'}}>
                  {new Date(task.startDate).toLocaleDateString()} - <br/>
                  {new Date(task.endDate).toLocaleDateString()}
                </td>
                <td className={styles.td}>
                  <span className={`${styles.statusBadge} ${styles[task.status] || ''}`}>
                    {task.status.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </td>
                <td className={styles.td}>
                  <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                    <Link href={`/my-job/${task.id}`} className={styles.actionBtn}>
                      View Details
                    </Link>
                    <button 
                      onClick={() => setSelectedTaskForNotes(task)} 
                      className={styles.actionBtn}
                    >
                      View Notes
                    </button>
                    {task.assignmentLetterUrl && (
                      <a href={task.assignmentLetterUrl} target="_blank" className={styles.actionBtn}>
                        Surat Tugas
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notes Modal */}
      {selectedTaskForNotes && (
        <div className={styles.modalOverlay} onClick={() => setSelectedTaskForNotes(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle} style={{color: '#000'}}>Notes History</h2>
              <button className={styles.closeBtn} onClick={() => setSelectedTaskForNotes(null)}>&times;</button>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
              {/* Combine Anggota Tim file notes and reviewers notes */}
              {selectedTaskForNotes.files?.filter((f: any) => f.notes).map((file: any) => (
                <div key={file.id} style={{padding: '12px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #3b82f6'}}>
                  <div style={{fontSize: '0.8rem', color: '#64748b', marginBottom: '4px'}}>
                    Anggota Tim / Ketua Tim ({new Date(file.createdAt).toLocaleString()})
                  </div>
                  <div style={{color: '#000'}}>{file.notes}</div>
                </div>
              ))}
              
              {selectedTaskForNotes.reviews?.map((review: any) => (
                <div key={review.id} style={{padding: '12px', background: review.isApproved ? '#f0fdf4' : '#fef2f2', borderRadius: '8px', borderLeft: `4px solid ${review.isApproved ? '#22c55e' : '#ef4444'}`}}>
                  <div style={{fontSize: '0.8rem', color: '#64748b', marginBottom: '4px'}}>
                    {review.reviewer.name} ({review.stage}) - {review.isApproved ? 'Approved' : 'Rejected'} - {new Date(review.timestamp).toLocaleString()}
                  </div>
                  <div style={{color: '#000'}}>{review.notes || <i>No notes provided</i>}</div>
                </div>
              ))}

              {(!selectedTaskForNotes.reviews?.length && !selectedTaskForNotes.files?.filter((f:any)=>f.notes).length) && (
                <div style={{color: '#888', textAlign: 'center'}}>No notes available for this task.</div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
