import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { ApiClient } from '../../services/api';
import { Activity, Cpu, Zap, DollarSign } from 'lucide-react';

export const Usage: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    ApiClient.request('/admin/overview')
      .then((data) => setAnalytics(data))
      .catch(() => {});
  }, []);

  return (
    <div>
      <Navbar title="Usage & Telemetry" subtitle="Monitor token consumption, latency metrics, and model breakdown" />

      <main style={{ marginLeft: '260px', marginTop: '70px', padding: '2rem', width: 'calc(100% - 260px)', boxSizing: 'border-box' }}>
        {/* Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Tokens</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: '0.25rem' }}>
              {(analytics?.totalTokens || 0).toLocaleString()}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Estimated Spend</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399', marginTop: '0.25rem' }}>
              ${(analytics?.totalCost || 0).toFixed(4)}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Average Latency</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#67e8f9', marginTop: '0.25rem' }}>
              {analytics?.avgLatencyMs || 0} ms
            </div>
          </div>
        </div>

        {/* Model Distribution Breakdown Table */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
            AI Model Consumption Breakdown
          </h3>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Model Name</th>
                <th style={{ padding: '0.75rem 1rem' }}>Requests Handled</th>
                <th style={{ padding: '0.75rem 1rem' }}>Total Tokens Consumed</th>
              </tr>
            </thead>
            <tbody>
              {(analytics?.modelDistribution || []).map((m: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#fff' }}>{m.modelName}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>{m.requestCount}</td>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)' }}>
                    {m.totalTokens.toLocaleString()}
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
