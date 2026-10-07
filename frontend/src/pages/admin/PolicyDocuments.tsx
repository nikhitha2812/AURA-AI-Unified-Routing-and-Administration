import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { ApiClient } from '../../services/api';
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileCheck,
  Shield,
  Plus,
} from 'lucide-react';

export const PolicyDocuments: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('AI_GOVERNANCE');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const docsData = await ApiClient.request('/policies/documents');
      setDocuments(docsData);

      const rulesData = await ApiClient.request('/policies/rules');
      setRules(rulesData);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await ApiClient.uploadFile('/policies/documents', selectedFile, { documentType });
      setMessage(res.message);
      setSelectedFile(null);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRuleReview = async (ruleId: string, actionStatus: 'APPROVED' | 'REJECTED') => {
    try {
      await ApiClient.request(`/policies/rules/${ruleId}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ status: actionStatus }),
      });
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <Navbar title="Company Policy Document Management" subtitle="Upload Privacy & AI Governance Policies for Automated Rule Extraction & Admin Review" />

      <main style={{ marginLeft: '260px', marginTop: '70px', padding: '2rem', width: 'calc(100% - 260px)', boxSizing: 'border-box' }}>
        {/* Document Upload Box */}
        <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Upload size={22} color="#8b5cf6" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
              Upload Corporate Governance Policy Document
            </h3>
          </div>

          {message && (
            <div style={styles.successAlert}>
              <CheckCircle2 size={18} /> <span>{message}</span>
            </div>
          )}

          {error && (
            <div style={styles.errorAlert}>
              <AlertCircle size={18} /> <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleFileUpload} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <label style={styles.label}>Select Document File (PDF, DOCX, TXT)</label>
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                required
                style={{ width: '100%', padding: '0.55rem' }}
              />
            </div>

            <div style={{ width: '220px' }}>
              <label style={styles.label}>Document Type Category</label>
              <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} style={{ width: '100%' }}>
                <option value="AI_GOVERNANCE">AI Usage & Governance Policy</option>
                <option value="PRIVACY_POLICY">Company Privacy Policy</option>
                <option value="DATA_SECURITY">Data Security Policy</option>
                <option value="CONFIDENTIALITY">Confidentiality & Trade Secrets</option>
                <option value="ACCEPTABLE_USE">Acceptable Use Guidelines</option>
              </select>
            </div>

            <button type="submit" disabled={uploading || !selectedFile} className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
              {uploading ? 'Parsing & Extracting Rules...' : 'Upload & Parse Policy'}
            </button>
          </form>
        </div>

        {/* Human-in-the-loop Proposed Policy Rules Table */}
        <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                Extracted Policy Rules (Human Review Required)
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Review, edit, or approve machine-extracted policy rules before they become active enforcement rules.
              </p>
            </div>
            <span className="badge badge-amber">
              <Clock size={14} /> {rules.filter((r) => r.status === 'PROPOSED').length} Pending Approval
            </span>
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th>Category</th>
                <th>Data Type Target</th>
                <th>Action</th>
                <th>Applies To</th>
                <th>Priority</th>
                <th>Description</th>
                <th>Review Status</th>
                <th>Human Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td>
                    <span className="badge badge-violet">{rule.category}</span>
                  </td>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{rule.dataType}</td>
                  <td>
                    <span
                      className={`badge ${
                        rule.action === 'BLOCK'
                          ? 'badge-rose'
                          : rule.action === 'MASK'
                          ? 'badge-amber'
                          : 'badge-emerald'
                      }`}
                    >
                      {rule.action}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{rule.appliesTo}</td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>{rule.priority}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-main)', maxWidth: '300px' }}>{rule.description}</td>
                  <td>
                    <span
                      className={`badge ${
                        rule.status === 'APPROVED'
                          ? 'badge-emerald'
                          : rule.status === 'REJECTED'
                          ? 'badge-rose'
                          : 'badge-amber'
                      }`}
                    >
                      {rule.status}
                    </span>
                  </td>
                  <td>
                    {rule.status === 'PROPOSED' ? (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => handleRuleReview(rule.id, 'APPROVED')}
                          className="btn-primary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                        >
                          <CheckCircle2 size={13} /> Approve
                        </button>
                        <button
                          onClick={() => handleRuleReview(rule.id, 'REJECTED')}
                          className="btn-danger"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        Reviewed by {rule.approvedBy?.name || 'Admin'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Uploaded Documents List */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
            Uploaded Organization Documents ({documents.length})
          </h3>

          <table style={styles.table}>
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Type Category</th>
                <th>Version</th>
                <th>File Size</th>
                <th>Status</th>
                <th>Uploaded By</th>
                <th>Upload Date</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#fff' }}>
                    <FileText size={16} color="#8b5cf6" />
                    {doc.name}
                  </td>
                  <td>
                    <span className="badge badge-cyan">{doc.documentType}</span>
                  </td>
                  <td style={{ fontWeight: 700 }}>v{doc.version}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {(doc.fileSize / 1024).toFixed(1)} KB
                  </td>
                  <td>
                    <span className="badge badge-emerald">{doc.status}</span>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{doc.uploadedBy?.name || 'Admin'}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  label: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-main)',
    marginBottom: '0.35rem',
    display: 'block',
  },
  successAlert: {
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#34d399',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  errorAlert: {
    background: 'rgba(244, 63, 94, 0.15)',
    border: '1px solid rgba(244, 63, 94, 0.3)',
    color: '#fca5a5',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    marginTop: '0.5rem',
  },
};
