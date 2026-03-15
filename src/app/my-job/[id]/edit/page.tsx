"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/context/UserContext';
import styles from '../../create/create.module.css';
import Link from 'next/link';

export default function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { currentUser, users } = useUser();
  const { id } = use(params);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subbagian: 'Penkom',
    startDate: '',
    endDate: '',
    dalnisId: '',
    subkoordinatorId: '',
  });

  const [selectedAnggota, setSelectedAnggota] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch existing task data
  useEffect(() => {
    async function fetchTask() {
      try {
        const res = await fetch(`/api/tasks/${id}`);
        if (res.ok) {
          const task = await res.json();
          setFormData({
            title: task.title,
            description: task.description,
            subbagian: task.subbagian,
            startDate: new Date(task.startDate).toISOString().split('T')[0],
            endDate: new Date(task.endDate).toISOString().split('T')[0],
            dalnisId: task.dalnisId,
            subkoordinatorId: task.subkoordinatorId,
          });
          setSelectedAnggota(task.assignments.map((a: any) => a.userId));
        } else {
          alert('Task not found');
          router.push('/my-job');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTask();
  }, [id, router]);

  // If not Admin or Ketua Tim, prevent access
  if (currentUser?.role !== 'Admin' && (!currentUser?.role.includes('Ketua Tim'))) {
    return (
      <div className={styles.container} style={{textAlign: 'center', paddingTop: '100px'}}>
        <h2>Unauthorized</h2>
        <p>You do not have permission to edit this task.</p>
        <Link href="/my-job" className={styles.btnCancel} style={{marginTop: '20px', display: 'inline-block'}}>Go Back</Link>
      </div>
    );
  }

  // Filter users for selection dropdowns
  const availableDalnis = users.filter(u => u.role === 'Dalnis');
  const availableSubkoor = users.filter(u => u.role === 'Subkoordinator');
  const availableAnggota = users.filter(u => u.role === 'Anggota Tim' || (u.role && u.role.includes('Anggota Tim')));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleAnggota = (userId: string) => {
    setSelectedAnggota(prev => 
      prev.includes(userId) ? prev.filter(x => x !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAnggota.length === 0) {
      alert('Please select at least one Anggota Tim');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        anggotaTimIds: selectedAnggota,
      };

      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Task updated successfully!');
        router.push('/my-job');
      } else {
        const error = await res.json();
        alert('Failed to update task: ' + error.message);
      }
    } catch (err) {
      alert('Network error while updating task');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className={styles.container}>Loading Task Details...</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Edit Task</h1>
      
      <div className={styles.card}>
        <form onSubmit={handleSubmit}>
          
          <div className={styles.formGroupFull}>
            <label className={styles.label}>Nama Pekerjaan</label>
            <input 
              type="text" 
              name="title" 
              className={styles.input} 
              value={formData.title} 
              onChange={handleInputChange} 
              required 
            />
          </div>

          <div className={styles.formGroupFull}>
            <label className={styles.label}>Deskripsi Pekerjaan</label>
            <textarea 
              name="description" 
              className={styles.textarea} 
              value={formData.description} 
              onChange={handleInputChange} 
              required 
            />
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Subbagian</label>
              <select name="subbagian" className={styles.select} value={formData.subbagian} onChange={handleInputChange} required>
                <option value="Penkom">Penkom</option>
                <option value="Bangkom">Bangkom</option>
                <option value="Pembinaan">Pembinaan</option>
                <option value="Khusus">Khusus</option>
              </select>
            </div>
            
            <div className={styles.formGroup}>
              {/* Layout placeholder */}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Tanggal Mulai</label>
              <input 
                type="date" 
                name="startDate" 
                className={styles.input} 
                value={formData.startDate} 
                onChange={handleInputChange}
                onClick={(e: any) => e.target.showPicker()}
                required 
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Tanggal Selesai</label>
              <input 
                type="date" 
                name="endDate" 
                className={styles.input} 
                value={formData.endDate} 
                onChange={handleInputChange} 
                onClick={(e: any) => e.target.showPicker()}
                required 
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Reviewing Dalnis</label>
              <select name="dalnisId" className={styles.select} value={formData.dalnisId} onChange={handleInputChange} required>
                <option value="">-- Select Dalnis --</option>
                {availableDalnis.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Reviewing Subkoordinator</label>
              <select name="subkoordinatorId" className={styles.select} value={formData.subkoordinatorId} onChange={handleInputChange} required>
                <option value="">-- Select Subkoordinator --</option>
                {availableSubkoor.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.formGroupFull} style={{marginTop: '20px'}}>
            <label className={styles.label}>Pilih Anggota Tim</label>
            <div className={styles.checkboxList}>
              {availableAnggota.map(a => (
                <label key={a.id} className={styles.checkboxItem}>
                  <input 
                    type="checkbox" 
                    checked={selectedAnggota.includes(a.id)}
                    onChange={() => toggleAnggota(a.id)}
                  />
                  {a.name} ({a.subbagian})
                </label>
              ))}
              {availableAnggota.length === 0 && <span>No Anggota Tim available.</span>}
            </div>
          </div>

          <div className={styles.btnGroup} style={{marginTop: '30px'}}>
            <Link href="/my-job" className={styles.btnCancel}>Cancel</Link>
            <button type="submit" className={styles.btnSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
