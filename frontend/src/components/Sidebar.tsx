import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  LayoutDashboard,
  MessageSquare,
  History,
  Activity,
  User as UserIcon,
  Users,
  Cpu,
  FileText,
  Upload,
  AlertTriangle,
  FileCheck,
  LogOut,
  Building2,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, organization, role, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAdmin = ['SUPER_ADMIN', 'ORGANIZATION_ADMIN', 'SECURITY_ADMIN', 'POLICY_ADMIN'].includes(role || '');

  return (
    <aside style={styles.sidebar}>
      {/* Brand Header */}
      <div style={styles.header}>
        <div style={styles.logoBadge}>
          <Shield size={24} color="#8b5cf6" />
        </div>
        <div>
          <h1 style={styles.brandTitle}>AURA</h1>
          <p style={styles.brandSubtitle}>AI Gateway & Governance</p>
        </div>
      </div>

      {/* Org & Role Info */}
      <div style={styles.orgBox}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building2 size={16} color="#06b6d4" />
          <span style={styles.orgName}>{organization?.name || 'AURA Enterprise'}</span>
        </div>
        <span className="badge badge-violet" style={{ marginTop: '0.4rem', fontSize: '0.7rem' }}>
          {role || 'EMPLOYEE'}
        </span>
      </div>

      {/* Nav List */}
      <div style={styles.navScroll}>
        <div style={styles.sectionHeader}>WORKSPACE</div>
        <NavLink to="/dashboard" style={({ isActive }) => (isActive ? styles.activeLink : styles.link)}>
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>
        <NavLink to="/chat" style={({ isActive }) => (isActive ? styles.activeLink : styles.link)}>
          <MessageSquare size={18} />
          AI Gateway Chat
        </NavLink>
        <NavLink to="/conversations" style={({ isActive }) => (isActive ? styles.activeLink : styles.link)}>
          <History size={18} />
          Conversations
        </NavLink>
        <NavLink to="/usage" style={({ isActive }) => (isActive ? styles.activeLink : styles.link)}>
          <Activity size={18} />
          Usage & Telemetry
        </NavLink>

        {isAdmin && (
          <>
            <div style={styles.sectionHeader}>ADMIN & GOVERNANCE</div>
            <NavLink to="/admin" end style={({ isActive }) => (isActive ? styles.activeLink : styles.link)}>
              <Shield size={18} />
              Executive Overview
            </NavLink>
            <NavLink to="/admin/users" style={({ isActive }) => (isActive ? styles.activeLink : styles.link)}>
              <Users size={18} />
              User & RBAC Mgmt
            </NavLink>
            <NavLink to="/admin/models" style={({ isActive }) => (isActive ? styles.activeLink : styles.link)}>
              <Cpu size={18} />
              AI Model Catalog
            </NavLink>
            <NavLink to="/admin/policies" end style={({ isActive }) => (isActive ? styles.activeLink : styles.link)}>
              <FileText size={18} />
              DLP & Policy Rules
            </NavLink>
            <NavLink to="/admin/policies/documents" style={({ isActive }) => (isActive ? styles.activeLink : styles.link)}>
              <Upload size={18} />
              Policy Doc Review
            </NavLink>
            <NavLink to="/admin/security" style={({ isActive }) => (isActive ? styles.activeLink : styles.link)}>
              <AlertTriangle size={18} />
              Security Events Log
            </NavLink>
            <NavLink to="/admin/audit-logs" style={({ isActive }) => (isActive ? styles.activeLink : styles.link)}>
              <FileCheck size={18} />
              Audit Trail
            </NavLink>
          </>
        )}

        <div style={styles.sectionHeader}>ACCOUNT</div>
        <NavLink to="/profile" style={({ isActive }) => (isActive ? styles.activeLink : styles.link)}>
          <UserIcon size={18} />
          Profile & Account
        </NavLink>
      </div>

      {/* Footer Profile & Logout */}
      <div style={styles.footer}>
        <div style={styles.userInfo}>
          <div style={styles.avatar}>{user?.name?.charAt(0) || 'U'}</div>
          <div style={{ overflow: 'hidden' }}>
            <div style={styles.userName}>{user?.name}</div>
            <div style={styles.userEmail}>{user?.email}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn} title="Logout">
          <LogOut size={18} color="#f43f5e" />
        </button>
      </div>
    </aside>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '260px',
    height: '100vh',
    background: 'var(--bg-sidebar)',
    borderRight: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 100,
  },
  header: {
    padding: '1.25rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    borderBottom: '1px solid var(--border-color)',
  },
  logoBadge: {
    width: '40px',
    height: '40px',
    borderRadius: '0.5rem',
    background: 'rgba(139, 92, 246, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(139, 92, 246, 0.3)',
  },
  brandTitle: {
    fontSize: '1.25rem',
    fontWeight: 800,
    letterSpacing: '0.05em',
    color: '#fff',
  },
  brandSubtitle: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  orgBox: {
    margin: '1rem 1.25rem 0.5rem 1.25rem',
    padding: '0.75rem 1rem',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '0.5rem',
    border: '1px solid var(--border-color)',
  },
  orgName: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-main)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  navScroll: {
    flex: 1,
    overflowY: 'auto',
    padding: '0.75rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  sectionHeader: {
    fontSize: '0.65rem',
    fontWeight: 700,
    color: 'var(--text-dim)',
    letterSpacing: '0.1em',
    marginTop: '1.25rem',
    marginBottom: '0.35rem',
    paddingLeft: '0.5rem',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.65rem 0.85rem',
    borderRadius: '0.5rem',
    fontSize: '0.85rem',
    fontWeight: 500,
    color: 'var(--text-muted)',
    transition: 'all 0.2s ease',
  },
  activeLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.65rem 0.85rem',
    borderRadius: '0.5rem',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.05) 100%)',
    borderLeft: '3px solid var(--accent-primary)',
  },
  footer: {
    padding: '1rem 1.25rem',
    borderTop: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(0, 0, 0, 0.2)',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    overflow: 'hidden',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'var(--accent-primary)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.85rem',
    flexShrink: 0,
  },
  userName: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#fff',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userEmail: {
    fontSize: '0.7rem',
    color: 'var(--text-dim)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    padding: '0.35rem',
    borderRadius: '0.35rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
