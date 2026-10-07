import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login({ email: email.trim(), password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = email.trim().length > 0 && password.trim().length > 0;

  return (
    <div style={styles.container}>
      <div className="glass-panel" style={styles.box}>
        <div style={styles.header}>
          <div style={styles.logoBadge}>
            <Shield size={28} color="#8b5cf6" />
          </div>
          <h2 style={styles.title}>Sign in to AURA</h2>
          <p style={styles.subtitle}>Enterprise AI Governance Platform</p>
        </div>

        {error && (
          <div style={styles.errorAlert} role="alert">
            <AlertCircle size={18} color="#fca5a5" style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          <div>
            <label style={styles.label} htmlFor="email-input">Work Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="var(--text-muted)" style={styles.inputIconLeft} />
              <input
                id="email-input"
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

          <div>
            <div style={styles.passwordLabelRow}>
              <label style={styles.label} htmlFor="password-input">Password</label>
              <Link to="/forgot-password" style={styles.forgotLink}>
                Forgot password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--text-muted)" style={styles.inputIconLeft} />
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{ ...styles.input, paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} color="var(--text-muted)" /> : <Eye size={18} color="var(--text-muted)" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="btn-primary"
            style={{
              ...styles.submitButton,
              opacity: loading || !isFormValid ? 0.65 : 1,
              cursor: loading || !isFormValid ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" style={{ marginRight: '0.5rem' }} />
                Authenticating...
              </>
            ) : (
              <>
                Sign In <ArrowRight size={16} style={{ marginLeft: '0.4rem' }} />
              </>
            )}
          </button>
        </form>

        <div style={styles.footer}>
          Don't have an organization account?{' '}
          <Link to="/register" style={styles.registerLink}>
            Create Organization Account
          </Link>
        </div>
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
    padding: '2rem',
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
  passwordLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.4rem',
  },
  forgotLink: {
    fontSize: '0.78rem',
    color: 'var(--accent-cyan)',
    fontWeight: 500,
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
  eyeButton: {
    position: 'absolute',
    right: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    padding: '0.2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  submitButton: {
    width: '100%',
    justifyContent: 'center',
    marginTop: '0.5rem',
    padding: '0.8rem 1rem',
    fontSize: '0.9rem',
    fontWeight: 600,
  },
  footer: {
    marginTop: '1.75rem',
    textAlign: 'center',
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '1.25rem',
  },
  registerLink: {
    fontWeight: 600,
    color: 'var(--accent-primary)',
  },
};
