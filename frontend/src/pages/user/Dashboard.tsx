import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';
import { ApiClient } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  MessageSquare,
  ShieldCheck,
  Zap,
  Activity,
  Cpu,
  ArrowRight,
  Lock,
  FileCheck,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, organization, role } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiClient.request('/admin/overview')
      .then((data) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Navbar title="Gateway Dashboard" subtitle={`Welcome back, ${user?.name}`} />

      <main style={{ marginLeft: '260px', marginTop: '70px', padding: '2rem', width: 'calc(100% - 260px)', boxSizing: 'border-box' }}>
        {/* Quick Launch Banner */}
        <div className="glass-panel" style={styles.banner}>
          <div>
            <div className="badge badge-violet" style={{ marginBottom: '0.5rem' }}>
              <Zap size={14} /> LIVE AI GATEWAY ACTIVE
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
              AURA Unified AI Gateway & Governance Console
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Every request is automatically sanitized by DLP, checked against active corporate policy rules, and routed to approved models.
            </p>
          </div>
          <Link to="/chat" className="btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '0.95rem' }}>
            <MessageSquare size={18} /> Launch AI Chat <ArrowRight size={16} />
          </Link>
        </div>

        {/* Metrics Grid */}
        <div style={styles.grid}>
          <div className="glass-panel" style={styles.statCard}>
            <div style={styles.statHeader}>
              <span style={styles.statTitle}>Total AI Requests</span>
              <Activity size={20} color="#8b5cf6" />
            </div>
            <div style={styles.statValue}>{stats?.totalRequests ?? 0}</div>
            <div style={styles.statSub}>Requests processed through Gateway</div>
          </div>

          <div className="glass-panel" style={styles.statCard}>
            <div style={styles.statHeader}>
              <span style={styles.statTitle}>Requests Today</span>
              <Zap size={20} color="#06b6d4" />
            </div>
            <div style={styles.statValue}>{stats?.requestsToday ?? 0}</div>
            <div style={styles.statSub}>Queries executed today</div>
          </div>

          <div className="glass-panel" style={styles.statCard}>
            <div style={styles.statHeader}>
              <span style={styles.statTitle}>DLP Security Interceptions</span>
              <ShieldCheck size={20} color="#f43f5e" />
            </div>
            <div style={{ ...styles.statValue, color: '#fca5a5' }}>
              {stats?.blockedRequests ?? 0}
            </div>
            <div style={styles.statSub}>Blocked or masked PII requests</div>
          </div>

          <div className="glass-panel" style={styles.statCard}>
            <div style={styles.statHeader}>
              <span style={styles.statTitle}>Total Tokens Consumed</span>
              <Cpu size={20} color="#10b981" />
            </div>
            <div style={styles.statValue}>{(stats?.totalTokens ?? 0).toLocaleString()}</div>
            <div style={styles.statSub}>Token quota tracking</div>
          </div>
        </div>

        {/* System & Governance Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
              Governance & DLP Enforcement Status
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={styles.row}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <ShieldCheck size={20} color="#10b981" />
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>Email & Phone Masking</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Automated PII Regex Sanitization</div>
                  </div>
                </div>
                <span className="badge badge-emerald">ACTIVE</span>
              </div>

              <div style={styles.row}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Lock size={20} color="#f43f5e" />
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>API Key & Credential DLP Block</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Strict Interception & Event Logging</div>
                  </div>
                </div>
                <span className="badge badge-rose">ENFORCED</span>
              </div>

              <div style={styles.row}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FileCheck size={20} color="#06b6d4" />
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>Uploaded Document Policy Rules</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Human-in-the-Loop Approved Rules</div>
                  </div>
                </div>
                <span className="badge badge-cyan">APPROVED</span>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
              Quick Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link to="/chat" className="btn-primary" style={{ justifyContent: 'center' }}>
                <MessageSquare size={16} /> Start New Chat
              </Link>
              <Link to="/conversations" className="btn-secondary" style={{ justifyContent: 'center' }}>
                View Conversation History
              </Link>
              {['SUPER_ADMIN', 'ORGANIZATION_ADMIN', 'POLICY_ADMIN'].includes(role || '') && (
                <Link to="/admin/policies/documents" className="btn-secondary" style={{ justifyContent: 'center', color: 'var(--accent-cyan)' }}>
                  Upload Policy Document
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  banner: {
    padding: '2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.25rem',
  },
  statCard: {
    padding: '1.25rem',
  },
  statHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  statTitle: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
  },
  statValue: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: '#fff',
  },
  statSub: {
    fontSize: '0.75rem',
    color: 'var(--text-dim)',
    marginTop: '0.25rem',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.85rem 1rem',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '0.5rem',
    border: '1px solid var(--border-color)',
  },
};
