import React from 'react';
import { ShieldCheck, Lock, Activity } from 'lucide-react';

interface NavbarProps {
  title: string;
  subtitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ title, subtitle }) => {
  return (
    <header style={styles.navbar}>
      <div style={styles.titleContainer}>
        <h2 style={styles.title} title={title}>{title}</h2>
        {subtitle && <p style={styles.subtitle} title={subtitle}>{subtitle}</p>}
      </div>

      <div style={styles.rightSection}>
        <div style={styles.statusChip}>
          <ShieldCheck size={15} color="#10b981" />
          <span style={styles.statusText}>AURA DLP Engine: Active</span>
        </div>

        <div style={styles.statusChip}>
          <Lock size={14} color="#06b6d4" />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Tenant Isolated</span>
        </div>

        <div style={styles.statusChip}>
          <Activity size={14} color="#8b5cf6" />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>TLS 1.3</span>
        </div>
      </div>
    </header>
  );
};

const styles: Record<string, React.CSSProperties> = {
  navbar: {
    height: '70px',
    padding: '0 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid var(--border-color)',
    background: 'rgba(13, 14, 25, 0.85)',
    backdropFilter: 'blur(12px)',
    position: 'fixed',
    top: 0,
    left: '260px',
    right: 0,
    width: 'calc(100% - 260px)',
    zIndex: 90,
    boxSizing: 'border-box',
  },
  titleContainer: {
    flex: '1 1 auto',
    minWidth: 0,
    marginRight: '1rem',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  title: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#fff',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    margin: '3px 0 0 0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: 1.2,
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    flexShrink: 0,
  },
  statusChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.3rem 0.65rem',
    borderRadius: '9999px',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid var(--border-color)',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  statusText: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#34d399',
    whiteSpace: 'nowrap',
  },
};
