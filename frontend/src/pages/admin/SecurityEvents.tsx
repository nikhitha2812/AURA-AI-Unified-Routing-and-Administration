import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { ApiClient } from '../../services/api';
import { AlertTriangle, ShieldCheck, ShieldAlert, Lock } from 'lucide-react';

export const SecurityEvents: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await ApiClient.request('/admin/security/events');
      setEvents(data);
    } catch (e) {}
  };

  return (
    <div>
      <Navbar title="Security & DLP Events Log" subtitle="Audit log of blocked prompts, PII detections, and policy enforcement events" />

      <main style={{ marginLeft: '260px', marginTop: '70px', padding: '2rem', width: 'calc(100% - 260px)', boxSizing: 'border-box' }}>
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
            Interception Log ({events.length})
          </h3>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Timestamp</th>
                <th style={{ padding: '0.75rem 1rem' }}>User</th>
                <th style={{ padding: '0.75rem 1rem' }}>Event Type</th>
                <th style={{ padding: '0.75rem 1rem' }}>Severity</th>
                <th style={{ padding: '0.75rem 1rem' }}>Detected Data</th>
                <th style={{ padding: '0.75rem 1rem' }}>Action Taken</th>
                <th style={{ padding: '0.75rem 1rem' }}>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(e.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#fff' }}>{e.user.name}</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem' }}>{e.eventType}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className={`badge ${e.severity === 'CRITICAL' ? 'badge-rose' : e.severity === 'HIGH' ? 'badge-amber' : 'badge-violet'}`}>
                      {e.severity}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
                    {e.detectedData}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className={`badge ${e.actionTaken === 'BLOCK' ? 'badge-rose' : e.actionTaken === 'MASK' ? 'badge-amber' : 'badge-emerald'}`}>
                      {e.actionTaken}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>{e.ipAddress || '127.0.0.1'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};
