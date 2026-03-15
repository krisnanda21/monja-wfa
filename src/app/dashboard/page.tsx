"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@/app/context/UserContext';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const [data, setData] = useState<{
    summary: { total: number; completed: number; inProgress: number; inReview: number };
    teamStats: { total: number; completed: number; name: string }[];
  } | null>(null);
  
  const [subbagian, setSubbagian] = useState('All');

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch(`/api/dashboard?subbagian=${subbagian}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchDashboard();
  }, [subbagian]);

  if (!data) {
    return (
      <div className={styles.container} style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh'}}>
        <div style={{fontSize: '1.5rem', color: '#666', animation: 'pulse 1.5s infinite'}}>Loading Dashboard...</div>
      </div>
    );
  }

  const { summary, teamStats } = data;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <select 
          className={styles.filterSelect} 
          value={subbagian} 
          onChange={(e) => setSubbagian(e.target.value)}
        >
          <option value="All">All Subbagian</option>
          <option value="Penkom">Penkom</option>
          <option value="Bangkom">Bangkom</option>
          <option value="Pembinaan">Pembinaan</option>
        </select>
      </div>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statCardTotal}`}>
          <div className={styles.statValue}>{summary.total}</div>
          <div className={styles.statLabel}>Total Tasks</div>
        </div>
        <div className={`${styles.statCard} ${styles.statCardCompleted}`}>
          <div className={styles.statValue}>{summary.completed}</div>
          <div className={styles.statLabel}>Completed</div>
        </div>
        <div className={`${styles.statCard} ${styles.statCardReview}`}>
          <div className={styles.statValue}>{summary.inReview}</div>
          <div className={styles.statLabel}>In Review</div>
        </div>
        <div className={`${styles.statCard} ${styles.statCardProgress}`}>
          <div className={styles.statValue}>{summary.inProgress}</div>
          <div className={styles.statLabel}>In Progress</div>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Progress Subbidang</h2>
      <div className={styles.teamsGrid}>
        {teamStats.length === 0 && (
          <p style={{color: '#888'}}>No tasks have been created yet.</p>
        )}
        {teamStats.map((team, idx) => {
          const percent = team.total > 0 ? Math.round((team.completed / team.total) * 100) : 0;
          return (
            <div key={idx} className={styles.teamCard}>
              <div className={styles.teamName}>{team.name}</div>
              <div className={styles.progressContainer}>
                <div 
                  className={styles.progressBar} 
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className={styles.teamStats}>
                <span>{percent}% Completed</span>
                <span>{team.completed} / {team.total} Tasks</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
