"use client";

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/context/UserContext';
import styles from './details.module.css';

export default function TaskDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { currentUser, isLoading } = useUser();
  const [task, setTask] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadLinkUrl, setUploadLinkUrl] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  // Workflow state
  const [workflowAction, setWorkflowAction] = useState<string | null>(null);
  const [workflowNotes, setWorkflowNotes] = useState('');
  const [processingWorkflow, setProcessingWorkflow] = useState(false);

  const fetchTask = async () => {
    try {
      const res = await fetch(`/api/tasks/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  if (isLoading || fetching) return <div className={styles.container} style={{textAlign: 'center', paddingTop: '100px'}}>Loading Task Detals...</div>;
  if (!currentUser) return <div className={styles.container}>Please login.</div>;
  if (!task) return <div className={styles.container}>Task not found.</div>;

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleFileUpload = async (e: React.FormEvent, type: 'File' | 'Link') => {
    e.preventDefault();
    let finalUrl = '';
    
    if (type === 'File') {
      if (!selectedFile) {
        alert("Please select a file to upload");
        return;
      }
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        const resStorage = await fetch('/api/upload', { method: 'POST', body: formData });
        const dataStorage = await resStorage.json();

        if (dataStorage.success) {
          finalUrl = dataStorage.url;
        } else {
          alert('Upload failed: ' + dataStorage.error);
          setUploading(false);
          return;
        }
      } catch (err) {
        alert('Error uploading file');
        setUploading(false);
        return;
      }
    } else {
      if (!uploadLinkUrl.trim()) {
        alert("Please enter a valid link");
        return;
      }
      let formattedUrl = uploadLinkUrl.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }
      finalUrl = formattedUrl;
      setUploading(true);
    }

    try {
      const resTask = await fetch(`/api/tasks/${id}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploaderId: currentUser.id,
          fileUrl: finalUrl,
          fileType: type,
          notes: uploadNotes
        })
      });

      if (resTask.ok) {
        alert(`${type} uploaded successfully!`);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setUploadLinkUrl('');
        setUploadNotes('');
        fetchTask(); 
      }
    } catch (err) {
      alert(`Error uploading ${type}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileApproval = async (fileId: string, status: string) => {
    if (!confirm(`Are you sure you want to ${status} this file?`)) return;
    try {
      const res = await fetch(`/api/tasks/${id}/files`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, status })
      });
      if (res.ok) {
        fetchTask();
      }
    } catch (err) {
      alert('Error updating file status');
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    try {
      const res = await fetch(`/api/tasks/${id}/files`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, userId: currentUser.id })
      });
      if (res.ok) {
        fetchTask();
      } else {
        const err = await res.json();
        alert('Failed to delete file: ' + err.message);
      }
    } catch (err) {
      alert('Error deleting file');
    }
  };

  const handleWorkflowAction = async (action: string) => {
    setWorkflowAction(action);
  };

  const submitWorkflowAction = async () => {
    if (!workflowAction) return;
    setProcessingWorkflow(true);

    try {
      const res = await fetch(`/api/tasks/${id}/workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: workflowAction,
          reviewerId: currentUser.id,
          notes: workflowNotes
        })
      });

      if (res.ok) {
        alert('Action processed successfully!');
        setWorkflowAction(null);
        setWorkflowNotes('');
        fetchTask();
      } else {
        const err = await res.json();
        alert('Error: ' + err.message);
      }
    } catch (err) {
      alert('Network error while processing action');
    } finally {
      setProcessingWorkflow(false);
    }
  };


  // Derived UI states
  const userRoles = currentUser.role ? currentUser.role.split(',').map((r:string) => r.trim()) : [];
  
  const isAnggota = userRoles.includes('Anggota Tim') && task.assignments.some((a:any) => a.userId === currentUser.id);
  const isKetuaTim = userRoles.includes('Ketua Tim') && task.ketuaTimId === currentUser.id;
  const isDalnis = userRoles.includes('Dalnis') && task.dalnisId === currentUser.id;
  const isSubkoor = userRoles.includes('Subkoordinator') && task.subkoordinatorId === currentUser.id;
  const isKoordinator = userRoles.includes('Koordinator');

  // Can upload files if Anggota Tim and task is SedangDikerjakan OR RejectKetuaTim
  const canUploadAnggota = isAnggota && (task.status === 'SedangDikerjakan' || task.status === 'RejectKetuaTim');
  
  // Can upload files if KetuaTim and task is ApprovalKetuaTim OR RejectDalnis OR SedangDikerjakan
  const canUploadKetua = isKetuaTim && (task.status === 'ApprovalKetuaTim' || task.status === 'RejectDalnis' || task.status === 'SedangDikerjakan');
  
  // File Deletability Logic for UI rendering
  const isFileDeletable = (fileUploaderId: string) => {
    if (fileUploaderId !== currentUser.id) return false;
    
    // If they are acting as an Anggota Tim for this file
    if (userRoles.includes('Anggota Tim')) {
      return (task.status === 'SedangDikerjakan' || task.status === 'RejectKetuaTim');
    }
    // Jika Ketua Tim atau admin yang upload, asumsi bisa delete (tidak ada pembatasan eksplisit di instruksi selain Anggota Tim)
    return true;
  };

  const showWorkflowActions = () => {
    if (canUploadAnggota) {
      return (
        <div className={styles.workflowActions}>
          <div className={styles.workflowTitle}>Submit to Ketua Tim</div>
          <p style={{fontSize: '0.9rem', color: '#166534', marginBottom: '10px'}}>Once you upload all your files, click below to submit this task to your Ketua Tim for review.</p>
          <button className={styles.btnPrimary} onClick={() => handleWorkflowAction('submit_to_ketuatim')}>Submit</button>
        </div>
      );
    }
    
    if (isKetuaTim && (task.status === 'ApprovalKetuaTim' || task.status === 'RejectDalnis')) {
       return (
        <div className={styles.workflowActions}>
          <div className={styles.workflowTitle}>Ketua Tim Actions</div>
          <p style={{fontSize: '0.9rem', color: '#166534', marginBottom: '10px'}}>Review the submission and approve/reject the overall task.</p>
          <div className={styles.actionBtnGroup}>
            <button className={`${styles.btnAction} ${styles.btnApprove}`} onClick={() => handleWorkflowAction('submit_to_dalnis')}>Approve</button>
            <button className={`${styles.btnAction} ${styles.btnReject}`} onClick={() => handleWorkflowAction('reject_by_ketuatim')}>Reject</button>
          </div>
        </div>
      );
    } else if (isKetuaTim && task.status === 'SedangDikerjakan') {
       return (
        <div className={styles.workflowActions}>
          <div className={styles.workflowTitle}>Ketua Tim Submissions</div>
          <p style={{fontSize: '0.9rem', color: '#64748b', marginBottom: '10px'}}>Anda dapat mengunggah file tambahan. Menunggu Anggota Tim untuk submit tugas ini sebelum bisa di-Approve ke Dalnis.</p>
        </div>
       )
    }

    if (isDalnis && (task.status === 'ApprovalDalnis' || task.status === 'RejectSubkoor')) {
      return (
        <div className={styles.workflowActions}>
          <div className={styles.workflowTitle}>Dalnis Review Actions</div>
          <div className={styles.actionBtnGroup}>
            <button className={`${styles.btnAction} ${styles.btnApprove}`} onClick={() => handleWorkflowAction('approve_dalnis')}>Approve</button>
            <button className={`${styles.btnAction} ${styles.btnReject}`} onClick={() => handleWorkflowAction('reject_dalnis')}>Reject</button>
          </div>
        </div>
      );
    }

    if (isSubkoor && (task.status === 'ApprovalSubkoor' || task.status === 'RejectKoordinator')) {
      return (
        <div className={styles.workflowActions}>
          <div className={styles.workflowTitle}>Subkoordinator Review Actions</div>
          <div className={styles.actionBtnGroup}>
            <button className={`${styles.btnAction} ${styles.btnApprove}`} onClick={() => handleWorkflowAction('approve_subkoor')}>Approve</button>
            <button className={`${styles.btnAction} ${styles.btnReject}`} onClick={() => handleWorkflowAction('reject_subkoor')}>Reject</button>
          </div>
        </div>
      );
    }

    if (isKoordinator && task.status === 'ApprovalKoordinator') {
      return (
        <div className={styles.workflowActions}>
          <div className={styles.workflowTitle}>Koordinator Final Review</div>
          <div className={styles.actionBtnGroup}>
            <button className={`${styles.btnAction} ${styles.btnApprove}`} onClick={() => handleWorkflowAction('approve_koor')}>Approve</button>
            <button className={`${styles.btnAction} ${styles.btnReject}`} onClick={() => handleWorkflowAction('reject_koor')}>Reject</button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={styles.container}>
      <div style={{marginBottom: '20px'}}>
        <button className={styles.btnAction} onClick={() => router.push('/my-job')} style={{padding: '6px 16px', fontSize: '0.9rem', background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600}}>← Back to My Job</button>
      </div>

      <div className={styles.header}>
        <h1 className={styles.title}>{task.title}</h1>
        <p className={styles.subtitle}>{task.description}</p>
        <span className={`${styles.statusBadge} ${styles[task.status] || ''}`}>
          {task.status.replace(/([A-Z])/g, ' $1').trim()}
        </span>
      </div>

      <div className={styles.grid}>
        
        {/* Left Col: Files and Workflow Actions */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '30px'}}>
          
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>File Kerja</h2>
            <div className={styles.fileList}>
              {task.files.length === 0 && <p style={{color: '#888'}}>No files uploaded yet.</p>}
              
              {task.files.map((file: any) => (
                <div key={file.id} className={styles.fileItem}>
                  <div className={styles.fileHeader}>
                    <a href={file.fileType === 'Link' ? (file.fileUrl.match(/^https?:\/\//i) ? file.fileUrl : `https://${file.fileUrl}`) : file.fileUrl} target="_blank" className={styles.fileName}>
                      {file.fileType === 'Link' ? '🔗' : '📄'} {file.fileType === 'Link' ? file.fileUrl : file.fileUrl.split('/').pop()}
                    </a>
                    {isFileDeletable(file.uploaderId) && (
                      <button 
                         onClick={() => handleDeleteFile(file.id)}
                         style={{background: '#ef4444', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold'}}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <div className={styles.fileMeta}>
                    Uploaded by: <strong>{file.uploader.name} ({file.uploader.role})</strong> on {new Date(file.createdAt).toLocaleString()}
                  </div>
                  {file.notes && (
                    <div className={styles.fileNotes}>
                      <em>"{file.notes}"</em>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Upload form */}
            {(canUploadAnggota || canUploadKetua) && (
              <div className={styles.uploadForm}>
                <h3 style={{marginBottom: '15px', color: '#000'}}>{canUploadAnggota ? 'Upload Hasil Kerja' : 'Upload File Tambahan'}</h3>
                <form>
                  <div style={{display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px'}}>
                    <button type="button" onClick={() => fileInputRef.current?.click()} style={{padding: '10px 16px', borderRadius: '6px', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600}}>Select File...</button>
                    <span style={{color: '#000', fontSize: '0.95rem'}}>{selectedFile ? selectedFile.name : 'No file chosen'}</span>
                  </div>
                  <input type="file" ref={fileInputRef} style={{display: 'none'}} onChange={handleFileSelection} />
                  
                  <div style={{marginBottom: '16px'}}>
                    <input 
                      type="url" 
                      placeholder="Or enter a link/URL instead of file" 
                      value={uploadLinkUrl}
                      onChange={(e) => setUploadLinkUrl(e.target.value)}
                      style={{width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', color:'#000', backgroundColor: '#f3f4f6', fontFamily: 'inherit', fontSize: '1rem'}}
                    />
                  </div>
                  
                  <textarea 
                    placeholder="Add notes (optional)" 
                    className={styles.textarea}
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                  />
                  <div style={{display: 'flex', gap: '10px'}}>
                    <button type="button" onClick={(e) => handleFileUpload(e, 'File')} className={styles.btnPrimary} style={{background: '#3b82f6'}} disabled={uploading || !selectedFile}>
                      {uploading && selectedFile ? 'Uploading...' : 'Upload File'}
                    </button>
                    <button type="button" onClick={(e) => handleFileUpload(e, 'Link')} className={styles.btnPrimary} style={{background: '#10b981'}} disabled={uploading || !uploadLinkUrl.trim()}>
                      {uploading && uploadLinkUrl ? 'Saving Link...' : 'Submit Link'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Approval Review History</h2>
            <div className={styles.fileList}>
              {task.reviews.length === 0 && <p style={{color: '#888'}}>No reviews yet.</p>}
              
              {task.reviews.map((rev: any) => (
                <div key={rev.id} className={styles.reviewItem} style={{background: rev.isApproved ? '#f0fdf4' : '#fef2f2', borderLeft: `4px solid ${rev.isApproved ? '#22c55e' : '#ef4444'}`}}>
                  <div style={{fontWeight: 600, marginBottom: '6px', color: '#000'}}>{rev.reviewer.name} ({rev.stage}) <span style={{color: rev.isApproved ? '#166534' : '#991b1b'}}>- {rev.isApproved ? 'APPROVE' : 'REJECT'}</span></div>
                  <div style={{color: '#64748b', fontSize: '0.8rem', marginBottom: '8px'}}>{new Date(rev.timestamp).toLocaleString()}</div>
                  {rev.notes && <div style={{color: '#000'}}><em>"{rev.notes}"</em></div>}
                </div>
              ))}
            </div>
          </div>
          
        </div>

        {/* Right Col: Info and Workflow action modal/block */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '30px'}}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Detail Pekerjaan</h2>
            <div className={styles.infoRow}>
              <div className={styles.infoLabel}>Subbagian</div>
              <div className={styles.infoValue}>{task.subbagian}</div>
            </div>
            <div className={styles.infoRow}>
              <div className={styles.infoLabel}>Start Date</div>
              <div className={styles.infoValue}>{new Date(task.startDate).toLocaleDateString()}</div>
            </div>
            <div className={styles.infoRow}>
              <div className={styles.infoLabel}>End Date</div>
              <div className={styles.infoValue}>{new Date(task.endDate).toLocaleDateString()}</div>
            </div>
            <div className={styles.infoRow}>
              <div className={styles.infoLabel}>Ketua Tim</div>
              <div className={styles.infoValue}>{task.ketuaTim.name}</div>
            </div>
            <div className={styles.infoRow}>
              <div className={styles.infoLabel}>Dalnis</div>
              <div className={styles.infoValue}>{task.dalnis.name}</div>
            </div>
            <div className={styles.infoRow}>
              <div className={styles.infoLabel}>Subkoordinator</div>
              <div className={styles.infoValue}>{task.subkoordinator.name}</div>
            </div>
            <div className={styles.infoRow} style={{marginTop: '15px'}}>
              <div className={styles.infoLabel}>Anggota Tim</div>
              <div className={styles.infoValue}>
                <ul style={{margin: 0, paddingLeft: '20px'}}>
                  {task.assignments.map((a:any) => <li key={a.id}>{a.user.name}</li>)}
                </ul>
              </div>
            </div>
            {task.assignmentLetterUrl && (
              <div style={{marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee'}}>
                <a href={task.assignmentLetterUrl} target="_blank" className={`${styles.btnAction} ${styles.btnApprove}`} style={{display: 'block', textAlign: 'center', textDecoration: 'none'}}>View Surat Tugas</a>
              </div>
            )}
          </div>

          {!workflowAction && showWorkflowActions()}

          {workflowAction && (
             <div className={styles.section} style={{borderColor: '#3b82f6', background: '#eff6ff'}}>
                <h3 className={styles.sectionTitle} style={{color: '#000'}}>Confirm Review Action</h3>
                <p style={{fontSize: '0.9rem', marginBottom: '15px', color: '#000'}}>Please add optional review notes before applying this action.</p>
                <textarea 
                  className={styles.textarea} 
                  placeholder="Review Notes (Optional)"
                  value={workflowNotes}
                  onChange={(e) => setWorkflowNotes(e.target.value)}
                />
                <div className={styles.actionBtnGroup}>
                  <button className={`${styles.btnAction} ${styles.btnReject}`} onClick={() => setWorkflowAction(null)}>Cancel</button>
                  <button className={`${styles.btnAction} ${styles.btnPrimary}`} style={{marginTop: 0, flex: 1}} onClick={submitWorkflowAction} disabled={processingWorkflow}>
                    {processingWorkflow ? 'Processing...' : 'Submit'}
                  </button>
                </div>
             </div>
          )}

        </div>

      </div>
    </div>
  );
}
