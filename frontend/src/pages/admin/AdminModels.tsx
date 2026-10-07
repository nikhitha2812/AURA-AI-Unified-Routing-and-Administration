import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { ApiClient } from '../../services/api';
import { Cpu, Power, Activity, ArrowUpRight, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

export const AdminModels: React.FC = () => {
  const [models, setModels] = useState<any[]>([]);
  const [testingModelId, setTestingModelId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; ms?: number; message?: string }>>({});

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const data = await ApiClient.request('/admin/models');
      setModels(data);
    } catch (e) {}
  };

  const handleToggleEnable = async (id: string, currentVal: boolean) => {
    try {
      await ApiClient.request(`/admin/models/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isEnabled: !currentVal }),
      });
      loadModels();
    } catch (e) {}
  };

  const handleTestConnection = async (id: string) => {
    setTestingModelId(id);
    try {
      const res = await ApiClient.request(`/admin/models/${id}/test`, {
        method: 'POST',
      });
      setTestResults((prev) => ({
        ...prev,
        [id]: {
          success: true,
          ms: res.responseTimeMs,
          message: `Connected (${res.responseTimeMs}ms)`,
        },
      }));
      loadModels();
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [id]: {
          success: false,
          message: err.message || 'Connection failed',
        },
      }));
    } finally {
      setTestingModelId(null);
    }
  };

  return (
    <div>
      <Navbar title="AI Model Catalog & Health Configurator" subtitle="Configure allowed provider models, priority ordering, and fallback rules" />

      <main style={{ marginLeft: '260px', marginTop: '70px', padding: '2rem', width: 'calc(100% - 260px)', boxSizing: 'border-box' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {models.map((m) => {
            const testRes = testResults[m.id];
            const isTesting = testingModelId === m.id;

            return (
              <div key={m.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Cpu size={20} color="#8b5cf6" />
                      <span className="badge badge-violet">{m.provider.name}</span>
                    </div>
                    <span className={`badge ${m.status === 'ACTIVE' ? 'badge-emerald' : 'badge-amber'}`}>
                      {m.status}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{m.name}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>{m.description}</p>

                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    <div>Model ID: <code style={{ color: 'var(--accent-cyan)' }}>{m.modelId}</code></div>
                    <div>Max Token Window: {m.maxTokens.toLocaleString()} tokens</div>
                    <div>Min Allowed Role: <strong style={{ color: '#fff' }}>{m.minRole}</strong></div>
                    <div>Fallback Priority Rank: #{m.priority}</div>
                  </div>

                  {testRes && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        backgroundColor: testRes.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        border: `1px solid ${testRes.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        color: testRes.success ? '#34d399' : '#f87171',
                      }}
                    >
                      {testRes.success ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      <span>{testRes.message}</span>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleToggleEnable(m.id, m.isEnabled)}
                    className={m.isEnabled ? 'btn-primary' : 'btn-secondary'}
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                  >
                    <Power size={14} /> {m.isEnabled ? 'Active' : 'Disabled'}
                  </button>

                  <button
                    onClick={() => handleTestConnection(m.id)}
                    disabled={isTesting}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <RefreshCw size={14} className={isTesting ? 'spin' : ''} /> {isTesting ? 'Testing...' : 'Test Ping'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
