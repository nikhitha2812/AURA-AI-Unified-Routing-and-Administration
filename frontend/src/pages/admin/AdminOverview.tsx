import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { ApiClient } from '../../services/api';
import { ShieldCheck, Sparkles, SlidersHorizontal, Cpu } from 'lucide-react';

export const AdminOverview: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    ApiClient.request('/admin/overview')
      .then((data) => setAnalytics(data))
      .catch(() => {});
  }, []);

  return (
    <div>
      <Navbar title="Executive Governance Overview" subtitle="Real-time Automatic Routing analytics & Security Posture" />

      <main style={{ marginLeft: '260px', marginTop: '70px', padding: '2rem', width: 'calc(100% - 260px)', boxSizing: 'border-box' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Members</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: '0.25rem' }}>
              {analytics?.activeUsersCount ?? 0}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Security Events Intercepted</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fca5a5', marginTop: '0.25rem' }}>
              {analytics?.securityEventsCount ?? 0}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Blocked Requests</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f43f5e', marginTop: '0.25rem' }}>
              {analytics?.blockedRequests ?? 0}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Gateway Token Volume</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399', marginTop: '0.25rem' }}>
              {(analytics?.totalTokens ?? 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Automatic Routing Mode Card Banner */}
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Sparkles size={20} color="#8b5cf6" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
              Core AURA Feature: Automatic Best Model Routing Engine
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            AURA evaluates every user prompt against task classification, data security policies, and model health to dynamically select approved models across <strong>Google Gemini, OpenAI, Groq Cloud LPU, and Ollama Local</strong>.
          </p>
        </div>

        {/* Model Distribution Table */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
            Live AI Model Distribution
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Model Name</th>
                <th style={{ padding: '0.75rem 1rem' }}>Request Count</th>
                <th style={{ padding: '0.75rem 1rem' }}>Tokens Processed</th>
              </tr>
            </thead>
            <tbody>
              {(analytics?.modelDistribution || []).map((m: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#fff' }}>{m.modelName}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>{m.requestCount}</td>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)' }}>{m.totalTokens.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};
