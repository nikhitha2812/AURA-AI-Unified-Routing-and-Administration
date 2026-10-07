import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ApiClient } from '../../services/api';
import { Shield, Lock, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Key } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const isPasswordStrong = newPassword.length >= 8;
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const isFormValid = token.trim().length > 0 && isPasswordStrong && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      if (!isPasswordStrong) {
        setError('New password must be at least 8 characters long.');
        return;
      }
      if (!passwordsMatch) {
        setError('Passwords do not match.');
        return;
      }
      setError('Please fill in all required fields correctly.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await ApiClient.request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: token.trim(), newPassword }),
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The reset token may be invalid or expired.');
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
          <h2 style={styles.title}>Set New Password</h2>
          <p style={styles.subtitle}>Enter your security reset token and new password</p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={styles.successAlert}>
              <CheckCircle2 size={26} color="#34d399" style={{ marginBottom: '0.5rem' }} />
              <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                Password Updated Successfully
              </p>
              <p style={{ fontSize: '0.82rem', color: '#a7f3d0' }}>
                Your account password has been updated. You can now sign in with your new credentials.
              </p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="btn-primary"
              style={{ ...styles.submitButton, marginTop: '1.5rem' }}
            >
              Proceed to Sign In <ArrowRight size={16} style={{ marginLeft: '0.4rem' }} />
            </button>
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
              <label style={styles.label} htmlFor="reset-token">Reset Authorization Token</label>
              <div style={{ position: 'relative' }}>
                <Key size={18} color="var(--text-muted)" style={styles.inputIconLeft} />
                <input
                  id="reset-token"
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste reset token string"
                  style={{ ...styles.input, paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <div>
              <label style={styles.label} htmlFor="new-password">New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--text-muted)" style={styles.inputIconLeft} />
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  style={{ ...styles.input, paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                  autoComplete="new-password"
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

            <div>
              <label style={styles.label} htmlFor="confirm-new-password">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--text-muted)" style={styles.inputIconLeft} />
                <input
                  id="confirm-new-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  style={{ ...styles.input, paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} color="var(--text-muted)" /> : <Eye size={18} color="var(--text-muted)" />}
                </button>
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <span style={styles.fieldError}>Passwords do not match.</span>
              )}
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
                  Updating Password...
                </>
              ) : (
                <>
                  Save New Password <ArrowRight size={16} style={{ marginLeft: '0.4rem' }} />
                </>
              )}
            </button>

            <div style={styles.footer}>
              <Link to="/login" style={styles.backLink}>
                ← Return to Sign In
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
  fieldError: {
    fontSize: '0.75rem',
    color: '#fca5a5',
    marginTop: '0.35rem',
    display: 'block',
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
