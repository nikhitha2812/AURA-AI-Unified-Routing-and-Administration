import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';
import { ApiClient } from '../../services/api';
import { MessageSquare, Search, Trash2, Calendar, Clock } from 'lucide-react';

export const Conversations: React.FC = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const data = await ApiClient.request('/conversations');
      setConversations(data);
    } catch (e) {}
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await ApiClient.request(`/conversations/${id}`, { method: 'DELETE' });
      loadConversations();
    } catch (e) {}
  };

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <Navbar title="Saved Conversations" subtitle="Manage and search past AI Gateway session histories" />

      <main style={{ marginLeft: '260px', marginTop: '70px', padding: '2rem', width: 'calc(100% - 260px)', boxSizing: 'border-box' }}>
        {/* Search Bar */}
        <div style={{ marginBottom: '1.5rem', position: 'relative', maxWidth: '450px' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search conversations by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '2.75rem' }}
          />
        </div>

        {/* Conversations List */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filtered.map((c) => (
            <div
              key={c.id}
              className="glass-panel"
              onClick={() => navigate(`/chat?c=${c.id}`)}
              style={{ padding: '1.25rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px', transition: 'transform 0.2s ease' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>{c.title}</h4>
                  <button onClick={(e) => handleDelete(c.id, e)} className="btn-danger" style={{ padding: '0.25rem 0.4rem' }} title="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c._count?.messages || 0} messages recorded</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '1rem' }}>
                <Clock size={13} /> Updated {new Date(c.updatedAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
