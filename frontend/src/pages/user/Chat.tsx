import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ApiClient } from '../../services/api';
import { Navbar } from '../../components/Navbar';
import {
  Send,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Copy,
  Check,
  RotateCcw,
  Square,
  Trash2,
  Sparkles,
  AlertCircle,
  MessageSquare,
  HelpCircle,
  SlidersHorizontal,
  Info,
} from 'lucide-react';

interface Message {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  mode?: string;
  maskedPrompt?: string;
  modelName?: string;
  providerName?: string;
  taskType?: string;
  routingReason?: string;
  userExplanation?: string;
  securityAction?: string;
}

export const Chat: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeConvId = searchParams.get('c') || undefined;

  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');

  // Mode state: AUTOMATIC is default as required
  const [routingMode, setRoutingMode] = useState<'AUTOMATIC' | 'PREFERRED'>('AUTOMATIC');
  const [selectedModelId, setSelectedModelId] = useState<string>('seed-model-aura-shield-v1');
  const [models, setModels] = useState<any[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [securityBadge, setSecurityBadge] = useState<{ action: string; reason?: string } | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [expandedExplanation, setExpandedExplanation] = useState<number | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<boolean>(false);

  useEffect(() => {
    ApiClient.request('/models')
      .then((data) => {
        setModels(data);
        if (data.length > 0) {
          const def = data.find((m: any) => m.isDefault) || data[0];
          setSelectedModelId(def.modelId);
        }
      })
      .catch(() => {});

    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConvId) {
      ApiClient.request(`/conversations/${activeConvId}`)
        .then((data) => {
          setRoutingMode((data.mode as 'AUTOMATIC' | 'PREFERRED') || 'AUTOMATIC');
          if (data.preferredModelId) setSelectedModelId(data.preferredModelId);

          const formatted = data.messages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            mode: m.mode,
            maskedPrompt: m.maskedPrompt,
            modelName: m.selectedModel?.name,
            providerName: m.selectedModel?.provider?.name,
            taskType: m.taskType,
            routingReason: m.routingReason,
            userExplanation: m.userExplanation,
          }));
          setMessages(formatted);
        })
        .catch(() => setMessages([]));
    } else {
      setMessages([]);
      setRoutingMode('AUTOMATIC'); // Always reset to AUTOMATIC for new chat
    }
  }, [activeConvId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const loadConversations = async () => {
    try {
      const data = await ApiClient.request('/conversations');
      setConversations(data);
    } catch (e) {}
  };

  const handleStartNewChat = () => {
    setSearchParams({});
    setMessages([]);
    setRoutingMode('AUTOMATIC'); // Requirement #13: AUTOMATIC is default for new chat
    setErrorAlert(null);
    setSecurityBadge(null);
  };

  const handleSendPrompt = async (retryPrompt?: string) => {
    const textToSend = retryPrompt || inputPrompt;
    if (!textToSend.trim() || isStreaming) return;

    if (!retryPrompt) setInputPrompt('');
    setErrorAlert(null);
    setSecurityBadge(null);
    setIsStreaming(true);
    abortControllerRef.current = false;

    const userMsg: Message = { role: 'user', content: textToSend, mode: routingMode };
    setMessages((prev) => [...prev, userMsg]);

    const assistantMsgPlaceholder: Message = {
      role: 'assistant',
      content: '',
      mode: routingMode,
      modelName: routingMode === 'AUTOMATIC' ? 'AURA Best Router Engine...' : 'Routing to Preferred Model...',
    };
    setMessages((prev) => [...prev, assistantMsgPlaceholder]);

    await ApiClient.streamChat(
      {
        prompt: textToSend,
        conversationId: activeConvId,
        mode: routingMode,
        modelId: routingMode === 'PREFERRED' ? selectedModelId : undefined,
      },
      (meta) => {
        if (meta.conversationId && !activeConvId) {
          setSearchParams({ c: meta.conversationId });
          loadConversations();
        }
        setSecurityBadge({ action: meta.securityAction });
        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const lastIdx = prev.length - 1;
          const last = prev[lastIdx];
          if (last.role !== 'assistant') return prev;

          const updatedLast = {
            ...last,
            modelName: meta.modelName,
            providerName: meta.providerName,
            taskType: meta.taskType,
            routingReason: meta.routingReason,
            userExplanation: meta.userExplanation,
            securityAction: meta.securityAction,
          };
          const updated = [...prev];
          updated[lastIdx] = updatedLast;
          return updated;
        });
      },
      (delta) => {
        if (abortControllerRef.current) return;
        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const lastIdx = prev.length - 1;
          const last = prev[lastIdx];
          if (last.role !== 'assistant') return prev;

          const updatedLast = {
            ...last,
            content: last.content + delta,
          };
          const updated = [...prev];
          updated[lastIdx] = updatedLast;
          return updated;
        });
      },
      (done) => {
        setIsStreaming(false);
      },
      (errStr) => {
        setIsStreaming(false);
        setErrorAlert(errStr);
        setMessages((prev) => {
          const updated = [...prev];
          if (updated.length > 0 && updated[updated.length - 1].role === 'assistant' && updated[updated.length - 1].content === '') {
            updated.pop();
          }
          return updated;
        });
      }
    );
  };

  const handleStopGeneration = () => {
    abortControllerRef.current = true;
    setIsStreaming(false);
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await ApiClient.request(`/conversations/${id}`, { method: 'DELETE' });
      if (activeConvId === id) handleStartNewChat();
      loadConversations();
    } catch (e) {}
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar title="AI Gateway Chat" subtitle="Automatic Best Model Routing & Governance Gateway" />

      <div style={styles.container}>
        {/* Left Drawer */}
        <div style={styles.convDrawer} className="glass-panel">
          <button onClick={handleStartNewChat} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            <Plus size={16} /> New Conversation
          </button>

          {/* Model Selection Mode Component (Requirement #1 & #11) */}
          <div style={styles.modeBox}>
            <div style={styles.modeLabel}>
              <SlidersHorizontal size={14} color="#8b5cf6" /> MODEL ROUTING MODE
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.4rem' }}>
              <label
                style={{
                  ...styles.modeRadioCard,
                  background: routingMode === 'AUTOMATIC' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                  borderColor: routingMode === 'AUTOMATIC' ? 'var(--accent-primary)' : 'var(--border-color)',
                }}
              >
                <input
                  type="radio"
                  name="routingMode"
                  value="AUTOMATIC"
                  checked={routingMode === 'AUTOMATIC'}
                  onChange={() => setRoutingMode('AUTOMATIC')}
                  style={{ accentColor: 'var(--accent-primary)' }}
                />
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Sparkles size={14} color="#c4b5fd" /> Automatic — Best Model
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    AURA automatically evaluates task type & policy to select the best approved AI model.
                  </div>
                </div>
              </label>

              <label
                style={{
                  ...styles.modeRadioCard,
                  background: routingMode === 'PREFERRED' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                  borderColor: routingMode === 'PREFERRED' ? 'var(--accent-cyan)' : 'var(--border-color)',
                }}
              >
                <input
                  type="radio"
                  name="routingMode"
                  value="PREFERRED"
                  checked={routingMode === 'PREFERRED'}
                  onChange={() => setRoutingMode('PREFERRED')}
                  style={{ accentColor: 'var(--accent-cyan)' }}
                />
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>Preferred Model</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Choose an approved model yourself.
                  </div>
                </div>
              </label>
            </div>

            {/* Preferred Model Dropdown (Visible only if Preferred Mode selected) */}
            {routingMode === 'PREFERRED' && (
              <div style={{ marginTop: '0.75rem' }}>
                <label style={styles.selectLabel}>SELECT PERMITTED MODEL</label>
                <select
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  style={styles.selectInput}
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.modelId}>
                      {m.name} ({m.provider.name})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div style={styles.convHeader}>CONVERSATION HISTORY</div>
          <div style={styles.convList}>
            {conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => setSearchParams({ c: c.id })}
                style={{
                  ...styles.convItem,
                  background: activeConvId === c.id ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                  borderColor: activeConvId === c.id ? 'var(--accent-primary)' : 'transparent',
                }}
              >
                <MessageSquare size={15} color="var(--text-muted)" />
                <span style={styles.convTitle}>{c.title}</span>
                <span className="badge badge-violet" style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem' }}>
                  {c.mode === 'PREFERRED' ? 'PREF' : 'AUTO'}
                </span>
                <button onClick={(e) => handleDeleteConversation(c.id, e)} style={styles.deleteBtn} title="Delete">
                  <Trash2 size={13} color="#f43f5e" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Center Workspace */}
        <div style={styles.chatArea}>
          {securityBadge && (
            <div
              style={{
                ...styles.securityBanner,
                background: securityBadge.action === 'MASK' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                borderColor: securityBadge.action === 'MASK' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)',
              }}
            >
              {securityBadge.action === 'MASK' ? (
                <>
                  <ShieldAlert size={18} color="#fcd34d" />
                  <span>DLP Security Notice: Sensitive PII detected in prompt. Sanitized before model dispatch.</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} color="#34d399" />
                  <span>DLP Policy Clean: Prompt passed organization security checks with 0 policy violations.</span>
                </>
              )}
            </div>
          )}

          {errorAlert && (
            <div style={styles.errorBanner}>
              <AlertCircle size={18} color="#fca5a5" />
              <span>{errorAlert}</span>
            </div>
          )}

          {/* Messages Stream */}
          <div style={styles.messageStream}>
            {messages.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>
                  <Sparkles size={36} color="#8b5cf6" />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>AURA Automatic Best Model Gateway</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '520px', marginTop: '0.5rem', lineHeight: 1.6 }}>
                  Type your request below. AURA automatically evaluates your query's complexity, data classification, and corporate privacy rules to select the most suitable approved AI model across <strong>Gemini, OpenAI, Groq, and Ollama</strong>.
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button onClick={() => setInputPrompt('Write a Python function to detect duplicate values.')} className="btn-secondary" style={{ fontSize: '0.8rem' }}>
                    💻 Coding Request (Auto-routed)
                  </button>
                  <button onClick={() => setInputPrompt('Analyze this confidential corporate architecture document.')} className="btn-secondary" style={{ fontSize: '0.8rem' }}>
                    🔒 Confidential Request (On-Premise Routed)
                  </button>
                </div>
              </div>
            ) : (
              messages.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    ...styles.messageRow,
                    justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    className="glass-panel"
                    style={{
                      ...styles.messageBubble,
                      background: m.role === 'user' ? 'rgba(139, 92, 246, 0.25)' : 'rgba(18, 20, 32, 0.9)',
                      borderColor: m.role === 'user' ? 'rgba(139, 92, 246, 0.4)' : 'var(--border-color)',
                    }}
                  >
                    {/* Routing Indicator (Requirement #12 & #21) */}
                    {m.role === 'assistant' && (
                      <div style={styles.routingMeta}>
                        <span className="badge badge-violet" style={{ fontSize: '0.7rem' }}>
                          <Cpu size={12} /> Answered by AURA • {m.modelName || 'Best Model'}
                        </span>

                        <button
                          onClick={() => setExpandedExplanation(expandedExplanation === idx ? null : idx)}
                          style={styles.whyBtn}
                        >
                          <HelpCircle size={12} /> Why this model?
                        </button>
                      </div>
                    )}

                    {/* Expandable Explanation Popover (Requirement #12) */}
                    {m.role === 'assistant' && expandedExplanation === idx && (
                      <div style={styles.explanationBox}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: '#c4b5fd', marginBottom: '0.25rem' }}>
                          <Info size={14} /> Routing Explanation
                        </div>
                        <div>{m.userExplanation || 'Selected for this request based on capability, availability, and organization policy.'}</div>
                        {m.routingReason && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                            Internal Audit Log: {m.routingReason}
                          </div>
                        )}
                      </div>
                    )}

                    <div style={styles.messageText}>{m.content}</div>

                    {/* Actions bar */}
                    {m.role === 'assistant' && (
                      <div style={styles.actionRow}>
                        <button onClick={() => handleCopy(m.content, idx)} style={styles.iconBtn} title="Copy response">
                          {copiedIndex === idx ? <Check size={14} color="#10b981" /> : <Copy size={14} color="var(--text-muted)" />}
                        </button>
                        <button
                          onClick={() => handleSendPrompt(messages[idx - 1]?.content)}
                          style={styles.iconBtn}
                          title="Regenerate response"
                        >
                          <RotateCcw size={14} color="var(--text-muted)" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Controls */}
          <div style={styles.inputBox}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt()}
                placeholder={
                  routingMode === 'AUTOMATIC'
                    ? 'Ask anything... AURA will automatically select the best model.'
                    : 'Type your prompt for selected preferred model...'
                }
                style={{ flex: 1 }}
                disabled={isStreaming}
              />

              {isStreaming ? (
                <button onClick={handleStopGeneration} className="btn-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Square size={14} /> Stop
                </button>
              ) : (
                <button onClick={() => handleSendPrompt()} className="btn-primary">
                  <Send size={16} /> Send
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    marginLeft: '260px',
    marginTop: '70px',
    height: 'calc(100vh - 70px)',
    display: 'flex',
    width: 'calc(100% - 260px)',
  },
  convDrawer: {
    width: '290px',
    padding: '1.25rem',
    borderRight: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  modeBox: {
    background: 'rgba(255, 255, 255, 0.02)',
    padding: '0.85rem',
    borderRadius: '0.65rem',
    border: '1px solid var(--border-color)',
  },
  modeLabel: {
    fontSize: '0.65rem',
    fontWeight: 700,
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    letterSpacing: '0.05em',
  },
  modeRadioCard: {
    display: 'flex',
    gap: '0.6rem',
    alignItems: 'flex-start',
    padding: '0.65rem',
    borderRadius: '0.5rem',
    border: '1px solid var(--border-color)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  selectLabel: {
    fontSize: '0.65rem',
    fontWeight: 700,
    color: 'var(--text-muted)',
    display: 'block',
    marginBottom: '0.35rem',
  },
  selectInput: {
    width: '100%',
    fontSize: '0.8rem',
    padding: '0.5rem',
  },
  convHeader: {
    fontSize: '0.65rem',
    fontWeight: 700,
    color: 'var(--text-dim)',
    letterSpacing: '0.1em',
    marginTop: '0.5rem',
  },
  convList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  convItem: {
    padding: '0.6rem 0.75rem',
    borderRadius: '0.5rem',
    border: '1px solid transparent',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  convTitle: {
    fontSize: '0.8rem',
    color: 'var(--text-main)',
    flex: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    opacity: 0.7,
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  securityBanner: {
    padding: '0.65rem 1.5rem',
    borderBottom: '1px solid var(--border-color)',
    fontSize: '0.8rem',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
  },
  errorBanner: {
    padding: '0.65rem 1.5rem',
    background: 'rgba(244, 63, 94, 0.15)',
    borderBottom: '1px solid rgba(244, 63, 94, 0.3)',
    color: '#fca5a5',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  messageStream: {
    flex: 1,
    overflowY: 'auto',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  emptyState: {
    margin: 'auto',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  emptyIcon: {
    width: '70px',
    height: '70px',
    borderRadius: '1.25rem',
    background: 'rgba(139, 92, 246, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem',
    border: '1px solid rgba(139, 92, 246, 0.3)',
  },
  messageRow: {
    display: 'flex',
    width: '100%',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: '1.25rem',
    borderRadius: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  routingMeta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.35rem',
  },
  whyBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '0.7rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    cursor: 'pointer',
  },
  explanationBox: {
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    padding: '0.65rem 0.85rem',
    borderRadius: '0.5rem',
    fontSize: '0.75rem',
    color: '#fff',
    margin: '0.25rem 0 0.5rem 0',
  },
  messageText: {
    fontSize: '0.9rem',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  actionRow: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.5rem',
    alignSelf: 'flex-end',
  },
  iconBtn: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--border-color)',
    padding: '0.35rem',
    borderRadius: '0.35rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputBox: {
    padding: '1.25rem 2rem',
    borderTop: '1px solid var(--border-color)',
    background: 'rgba(13, 14, 25, 0.8)',
    backdropFilter: 'blur(12px)',
  },
};
