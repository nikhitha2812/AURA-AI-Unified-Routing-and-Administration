import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { ApiClient } from '../../services/api';
import { Users, UserPlus, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [roleName, setRoleName] = useState('EMPLOYEE');
  const [department, setDepartment] = useState('Engineering');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const data = await ApiClient.request('/admin/users');
      setMembers(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      await ApiClient.request('/admin/users/invite', {
        method: 'POST',
        body: JSON.stringify({ email, name, roleName, department }),
      });
      setMessage(`Successfully invited ${name} (${email}) as ${roleName}.`);
      setEmail('');
      setName('');
      loadMembers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      await ApiClient.request(`/admin/users/${memberId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ roleName: newRole }),
      });
      loadMembers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <Navbar title="User & RBAC Management" subtitle="Invite users, assign roles, and manage tenant privileges" />

      <main style={{ marginLeft: '260px', marginTop: '70px', padding: '2rem', width: 'calc(100% - 260px)', boxSizing: 'border-box' }}>
        {/* Invite Member Form */}
        <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <UserPlus size={22} color="#8b5cf6" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Invite Member to Organization</h3>
          </div>

          {message && (
            <div style={styles.successAlert}>
              <CheckCircle2 size={18} /> <span>{message}</span>
            </div>
          )}

          {error && (
            <div style={styles.errorAlert}>
              <AlertCircle size={18} /> <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleInvite} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={styles.label}>Full Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Vance" style={{ width: '100%' }} />
            </div>

            <div style={{ flex: 1, minWidth: '220px' }}>
              <label style={styles.label}>Work Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alex@company.com" style={{ width: '100%' }} />
            </div>

            <div style={{ width: '180px' }}>
              <label style={styles.label}>Role</label>
              <select value={roleName} onChange={(e) => setRoleName(e.target.value)} style={{ width: '100%' }}>
                <option value="EMPLOYEE">EMPLOYEE</option>
                <option value="MANAGER">MANAGER</option>
                <option value="POLICY_ADMIN">POLICY_ADMIN</option>
                <option value="SECURITY_ADMIN">SECURITY_ADMIN</option>
                <option value="ORGANIZATION_ADMIN">ORGANIZATION_ADMIN</option>
              </select>
            </div>

            <div style={{ width: '160px' }}>
              <label style={styles.label}>Department</label>
              <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Engineering" style={{ width: '100%' }} />
            </div>

            <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
              Invite User
            </button>
          </form>
        </div>

        {/* Member Table */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
            Organization Members ({members.length})
          </h3>

          <table style={styles.table}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <th style={{ padding: '0.75rem 1rem' }}>User</th>
                <th style={{ padding: '0.75rem 1rem' }}>Department</th>
                <th style={{ padding: '0.75rem 1rem' }}>Assigned Role</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Joined Date</th>
                <th style={{ padding: '0.75rem 1rem' }}>Modify Role</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{m.user.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.user.email}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem' }}>{m.department || 'General'}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className="badge badge-violet">{m.role.name}</span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className="badge badge-emerald">{m.status}</span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(m.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <select
                      value={m.role.name}
                      onChange={(e) => handleRoleChange(m.id, e.target.value)}
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
                    >
                      <option value="EMPLOYEE">EMPLOYEE</option>
                      <option value="MANAGER">MANAGER</option>
                      <option value="POLICY_ADMIN">POLICY_ADMIN</option>
                      <option value="SECURITY_ADMIN">SECURITY_ADMIN</option>
                      <option value="ORGANIZATION_ADMIN">ORGANIZATION_ADMIN</option>
                    </select>
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

const styles: Record<string, React.CSSProperties> = {
  label: { fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem', display: 'block' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  successAlert: { background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' },
  errorAlert: { background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fca5a5', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' },
};
