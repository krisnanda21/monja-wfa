"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/context/UserContext';
import styles from './create.module.css';
import Link from 'next/link';

export default function CreateTaskPage() {
  const router = useRouter();
  const { currentUser, users } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileAwalInputRef = useRef<HTMLInputElement>(null);

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [assignmentLetterUrl, setAssignmentLetterUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fileAwalFiles, setFileAwalFiles] = useState<{url: string, name: string}[]>([]);
  const [fileAwalLinks, setFileAwalLinks] = useState<string[]>([]);
  const [currentLinkInput, setCurrentLinkInput] = useState('');
  const [uploadingFileAwal, setUploadingFileAwal] = useState(false);

  // If not Ketua Tim, show unauthorized
  if (currentUser?.role !== 'Ketua Tim') {
    return (
      <div className={styles.container} style={{textAlign: 'center', paddingTop: '100px'}}>
        <h2>Unauthorized</h2>
        <p>Only Ketua Tim can create new tasks.</p>
        <Link href="/my-job" className={styles.btnCancel} style={{marginTop: '20px', display: 'inline-block'}}>Go Back</Link>
      </div>
    );
  }

  // Filter users for selection dropdowns
  const availableDalnis = users.filter(u => u.role === 'Dalnis');
  const availableSubkoor = users.filter(u => u.role === 'Subkoordinator');
  const availableAnggota = users.filter(u => u.role === 'Anggota Tim');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleAnggota = (id: string) => {
    setSelectedAnggota(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Hanya file berformat PDF yang diizinkan untuk Surat Tugas.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    
    setSelectedFile(file);
    setUploadingFile(true);
    const formUrlData = new FormData();
    formUrlData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formUrlData,
      });
      const data = await res.json();
      if (data.success) {
        setAssignmentLetterUrl(data.url);
      } else {
        alert('Failed to upload file');
      }
    } catch (err) {
      alert('Error uploading file');
    } finally {
      setUploadingFile(false);
      // Reset input so they skip same file check
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileAwalChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploadingFileAwal(true);
    const uploadedFiles: {url: string, name: string}[] = [];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          uploadedFiles.push({ url: data.url, name: file.name });
        } else {
          alert(`Failed to upload ${file.name}`);
        }
      }
      setFileAwalFiles(prev => [...prev, ...uploadedFiles]);
    } catch (err) {
      alert('Error uploading files');
    } finally {
      setUploadingFileAwal(false);
      if (fileAwalInputRef.current) fileAwalInputRef.current.value = '';
    }
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
        ketuaTimId: currentUser.id,
        anggotaTimIds: selectedAnggota,
        assignmentLetterUrl: assignmentLetterUrl || null,
        fileAwalFiles: fileAwalFiles.map(f => f.url),
        fileAwalLinks: fileAwalLinks.length > 0 ? fileAwalLinks : (currentLinkInput.trim() ? [currentLinkInput.trim()] : [])
      };

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        router.push('/my-job');
      } else {
        const error = await res.json();
        alert('Failed to create task: ' + error.message);
        setIsSubmitting(false);
      }
    } catch (err) {
      alert('Network error while creating task');
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Create New Task</h1>
      
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
              placeholder="e.g. Audit Laporan Keuangan Tahunan"
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
              placeholder="Provide clear instructions for the team..."
            />
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Subbagian</label>
              <select name="subbagian" className={styles.select} value={formData.subbagian} onChange={handleInputChange} required>
                <option value="Penkom">Penkom</option>
                <option value="Bangkom">Bangkom</option>
                <option value="Pembinaan">Pembinaan</option>
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
                style={{colorScheme: 'light'}}
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
                style={{colorScheme: 'light'}}
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

          <div className={styles.formGroupFull} style={{marginTop: '20px'}}>
            <label className={styles.label}>Surat Tugas (Optional)</label>
            <div 
              className={styles.fileUploadArea}
              onClick={() => fileInputRef.current?.click()}
            >
              <span style={{fontSize: '2rem'}}>📄</span>
              <p style={{color: '#4b5563'}}>{uploadingFile ? "Uploading..." : (selectedFile ? `File Selected: ${selectedFile.name}` : "Click to upload an assignment letter (.pdf)")}</p>
              <input 
                type="file" 
                accept=".pdf"
                className={styles.input} 
                style={{display: 'none'}}
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className={styles.formGroupFull} style={{marginTop: '20px'}}>
            <label className={styles.label}>File Awal (Optional)</label>
            <p style={{fontSize: '0.85rem', color: '#64748b', marginBottom: '10px'}}>Upload multiple files (all extensions) or provide a link to share with your team.</p>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
              <div 
                className={styles.fileUploadArea}
                onClick={() => fileAwalInputRef.current?.click()}
                style={{padding: '20px', minHeight: 'auto'}}
              >
                <span style={{fontSize: '1.5rem'}}>📁</span>
                <p style={{color: '#4b5563', margin: '5px 0'}}>{uploadingFileAwal ? "Uploading..." : "Click to upload Files"}</p>
                <input 
                  type="file" 
                  multiple
                  className={styles.input} 
                  style={{display: 'none'}}
                  ref={fileAwalInputRef}
                  onChange={handleFileAwalChange}
                />
              </div>

              {fileAwalFiles.length > 0 && (
                <ul style={{listStyle: 'none', padding: 0, margin: 0, color: '#000'}}>
                  {fileAwalFiles.map((f, idx) => (
                    <li key={idx} style={{fontSize: '0.9rem', marginBottom: '4px'}}>📄 {f.name}</li>
                  ))}
                </ul>
              )}
              
              {fileAwalLinks.length > 0 && (
                <ul style={{listStyle: 'none', padding: 0, margin: '10px 0', color: '#000'}}>
                  {fileAwalLinks.map((l, idx) => (
                    <li key={idx} style={{fontSize: '0.9rem', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '6px 10px', borderRadius: '4px'}}>
                      <span style={{wordBreak: 'break-all', marginRight: '10px'}}>🔗 {l}</span>
                      <button 
                        type="button" 
                        onClick={() => setFileAwalLinks(prev => prev.filter((_, i) => i !== idx))}
                        style={{background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold'}}
                        title="Remove link"
                      >
                        ✖
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              
              <div style={{display: 'flex', gap: '8px', marginTop: '10px'}}>
                <input 
                  type="url" 
                  placeholder="OR Enter Link Address" 
                  value={currentLinkInput}
                  onChange={(e) => setCurrentLinkInput(e.target.value)}
                  className={styles.input}
                  style={{backgroundColor: '#f8fafc', color: '#000', flex: 1, margin: 0}}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (currentLinkInput.trim()) {
                        setFileAwalLinks(prev => [...prev, currentLinkInput.trim()]);
                        setCurrentLinkInput('');
                      }
                    }
                  }}
                />
                <button 
                  type="button" 
                  onClick={() => {
                    if (currentLinkInput.trim()) {
                      setFileAwalLinks(prev => [...prev, currentLinkInput.trim()]);
                      setCurrentLinkInput('');
                    }
                  }}
                  style={{padding: '0 16px', borderRadius: '6px', background: '#e2e8f0', color: '#334155', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 600}}
                >
                  Add Link
                </button>
              </div>
            </div>
          </div>

          <div className={styles.btnGroup}>
            <Link href="/my-job" className={styles.btnCancel}>Cancel</Link>
            <button type="submit" className={styles.btnSubmit} disabled={isSubmitting || uploadingFile || uploadingFileAwal}>
              {isSubmitting ? 'Creating...' : 'Kuy Kerja'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
