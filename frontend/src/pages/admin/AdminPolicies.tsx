import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { ApiClient } from '../../services/api';
import { FileText, Shield, Trash2, CheckCircle2 } from 'lucide-react';

export const AdminPolicies: React.FC = () => {
  const [rules, setRules] = useState<any[]>([]);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const data = await ApiClient.request('/policies/rules');
      setRules(data);
    } catch (e) {}
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await ApiClient.request(`/policies/rules/${id}`, { method: 'DELETE' });
      loadRules();
    } catch (e) {}
  };

  return (
    <div>
      <Navbar title="Active DLP & Policy Enforcement Rules" subtitle="View and manage corporate AI security policy rules" />

      <main style={{ marginLeft: '260px', marginTop: '70px', padding: '2rem', width: 'calc(100% - 260px)', boxSizing: 'border-box' }}>
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
            Active Enforcement Rules ({rules.length})
          </h3>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                <th style={{ padding: '0.75rem 1rem' }}>Data Type</th>
                <th style={{ padding: '0.75rem 1rem' }}>Action</th>
                <th style={{ padding: '0.75rem 1rem' }}>Applies To</th>
                <th style={{ padding: '0.75rem 1rem' }}>Priority</th>
                <th style={{ padding: '0.75rem 1rem' }}>Description</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Delete</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className="badge badge-violet">{rule.category}</span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#fff' }}>{rule.dataType}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className={`badge ${rule.action === 'BLOCK' ? 'badge-rose' : rule.action === 'MASK' ? 'badge-amber' : 'badge-emerald'}`}>
                      {rule.action}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem' }}>{rule.appliesTo}</td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>{rule.priority}</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem' }}>{rule.description}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className={`badge ${rule.status === 'APPROVED' ? 'badge-emerald' : 'badge-amber'}`}>{rule.status}</span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <button onClick={() => handleDeleteRule(rule.id)} className="btn-danger" style={{ padding: '0.25rem 0.5rem' }}>
                      <Trash2 size={13} />
                    </button>
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
