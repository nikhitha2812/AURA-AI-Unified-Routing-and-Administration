import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiClient } from '../../services/api';
import { Shield, Mail, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your work email address.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await ApiClient.request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });
      setSubmitted(true);
    } catch (err: any) {
      // Even if network error occurs, render secure message or error gracefully
      setError(err.message || 'An error occurred while processing your request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div className="glass-panel" style={styles.box}>
        <div style={styles.header}>
          <div style={styles.logoBadge}>
            <Shield size={28} color="#8b5cf6" />
          </div>
          <h2 style={styles.title}>Forgot Password</h2>
          <p style={styles.subtitle}>Enter your work email address to reset your account password</p>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center' }}>
            <div style={styles.successAlert}>
              <CheckCircle2 size={24} color="#34d399" style={{ marginBottom: '0.5rem' }} />
              <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                Instructions Sent
              </p>
              <p style={{ fontSize: '0.82rem', color: '#a7f3d0', lineHeight: 1.4 }}>
                If an account exists for <strong>{email}</strong>, password reset instructions will be sent.
              </p>
            </div>

            <Link to="/login" className="btn-primary" style={{ ...styles.submitButton, marginTop: '1.25rem' }}>
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form} noValidate>
            {error && (
              <div style={styles.errorAlert} role="alert">
                <AlertCircle size={18} color="#fca5a5" style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label style={styles.label} htmlFor="forgot-email">Work Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="var(--text-muted)" style={styles.inputIconLeft} />
                <input
                  id="forgot-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  style={{ ...styles.input, paddingLeft: '2.5rem' }}
                  autoComplete="email"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="btn-primary"
              style={{
                ...styles.submitButton,
                opacity: loading || !email.trim() ? 0.65 : 1,
                cursor: loading || !email.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" style={{ marginRight: '0.5rem' }} />
                  Processing...
                </>
              ) : (
                <>
                  Send Reset Instructions <ArrowRight size={16} style={{ marginLeft: '0.4rem' }} />
                </>
              )}
            </button>

            <div style={styles.footer}>
              <Link to="/login" style={styles.backLink}>
                ← Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem',
  },
  box: {
    width: '100%',
    maxWidth: '440px',
    padding: '2.5rem',
    borderRadius: '1rem',
  },
  header: {
    textAlign: 'center',
    marginBottom: '1.75rem',
  },
  logoBadge: {
    width: '54px',
    height: '54px',
    borderRadius: '0.85rem',
    background: 'rgba(139, 92, 246, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)',
  },
  title: {
    fontSize: '1.6rem',
    fontWeight: 800,
    color: '#ffffff',
    marginTop: '0.85rem',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginTop: '0.25rem',
    lineHeight: 1.4,
  },
  errorAlert: {
    background: 'rgba(244, 63, 94, 0.12)',
    border: '1px solid rgba(244, 63, 94, 0.3)',
    color: '#fca5a5',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    marginBottom: '1.25rem',
  },
  successAlert: {
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#34d399',
    padding: '1.25rem 1rem',
    borderRadius: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-main)',
    marginBottom: '0.4rem',
    display: 'block',
  },
  input: {
    width: '100%',
  },
  inputIconLeft: {
    position: 'absolute',
    left: '0.85rem',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  },
  submitButton: {
    width: '100%',
    justifyContent: 'center',
    padding: '0.8rem 1rem',
    fontSize: '0.9rem',
    fontWeight: 600,
  },
  footer: {
    marginTop: '1.25rem',
    textAlign: 'center',
  },
  backLink: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
};
