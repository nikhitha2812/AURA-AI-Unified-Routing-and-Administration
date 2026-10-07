import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Cpu, FileCheck, ArrowRight, Zap, Eye, CheckCircle2 } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div style={styles.container}>
      {/* Top Header Navigation */}
      <header style={styles.topNav}>
        <div style={styles.brand}>
          <Shield size={28} color="#8b5cf6" />
          <span style={styles.brandName}>AURA</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/login" className="btn-secondary">
            Sign In
          </Link>
          <Link to="/register" className="btn-primary">
            Get Started <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section style={styles.hero}>
        <div className="badge badge-violet" style={{ marginBottom: '1.5rem', padding: '0.4rem 1rem' }}>
          <Shield size={14} /> ENTERPRISE AI GATEWAY & GOVERNANCE PLATFORM
        </div>
        <h1 style={styles.heroTitle}>
          Unified AI Control, DLP & <span style={{ color: 'var(--accent-primary)' }}>Intelligent Model Routing</span>
        </h1>
        <p style={styles.heroSubtitle}>
          Prevent PII data leakage, enforce corporate AI policy compliance, and route queries dynamically across approved AI models in real time.
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <Link to="/register" className="btn-primary" style={{ padding: '0.9rem 2rem', fontSize: '1rem' }}>
            Deploy AURA Gateway <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="btn-secondary" style={{ padding: '0.9rem 2rem', fontSize: '1rem' }}>
            Live Demo Login
          </Link>
        </div>
      </section>

      {/* Architecture Highlights */}
      <section style={styles.gridSection}>
        <div className="glass-panel" style={styles.card}>
          <Lock size={32} color="#8b5cf6" style={{ marginBottom: '1rem' }} />
          <h3>Real-Time DLP & PII Scanner</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Scans every prompt before model dispatch. Automatically ALLOWS clean queries, MASKS sensitive user email/phone numbers, or BLOCKS API key & credit card submissions.
          </p>
        </div>

        <div className="glass-panel" style={styles.card}>
          <Cpu size={32} color="#06b6d4" style={{ marginBottom: '1rem' }} />
          <h3>Intelligent Model Routing Engine</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Evaluates prompt complexity, data classifications, user permissions, and model health to dynamically select Google Gemini, OpenAI, or local shield fallbacks.
          </p>
        </div>

        <div className="glass-panel" style={styles.card}>
          <FileCheck size={32} color="#10b981" style={{ marginBottom: '1rem' }} />
          <h3>Uploaded Policy Document Extraction</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Upload company PDF, DOCX, or TXT governance policies. AURA extracts actionable security rules with Human-in-the-Loop Admin approval.
          </p>
        </div>
      </section>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    padding: '0 2rem 4rem 2rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  topNav: {
    height: '90px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  brandName: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#fff',
    letterSpacing: '0.05em',
  },
  hero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    marginTop: '4rem',
    marginBottom: '5rem',
  },
  heroTitle: {
    fontSize: '3.2rem',
    fontWeight: 800,
    lineHeight: 1.15,
    maxWidth: '900px',
    color: '#fff',
  },
  heroSubtitle: {
    fontSize: '1.15rem',
    color: 'var(--text-muted)',
    maxWidth: '650px',
    marginTop: '1.5rem',
  },
  gridSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
  },
  card: {
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
  },
};
