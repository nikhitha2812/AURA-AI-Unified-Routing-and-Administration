import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { ApiClient } from '../../services/api';
import { FileCheck, Shield, Clock } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      const data = await ApiClient.request('/admin/audit-logs');
      setLogs(data);
    } catch (e) {}
  };

  return (
    <div>
      <Navbar title="Append-Only System Audit Trail" subtitle="Immutable security ledger of all platform administrative and gateway operations" />

      <main style={{ marginLeft: '260px', marginTop: '70px', padding: '2rem', width: 'calc(100% - 260px)', boxSizing: 'border-box' }}>
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
            Audit Log Entries ({logs.length})
          </h3>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Timestamp</th>
                <th style={{ padding: '0.75rem 1rem' }}>User / Initiator</th>
                <th style={{ padding: '0.75rem 1rem' }}>Action Code</th>
                <th style={{ padding: '0.75rem 1rem' }}>Entity Type</th>
                <th style={{ padding: '0.75rem 1rem' }}>Audit Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#fff' }}>
                    {log.user?.name || 'System Auto'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className="badge badge-violet">{log.action}</span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem' }}>{log.entityType}</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-main)', maxWidth: '400px', wordBreak: 'break-all' }}>
                    {log.details}
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
