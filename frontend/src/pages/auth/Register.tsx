import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Lock, Mail, User as UserIcon, Building2, ArrowRight, AlertCircle, Eye, EyeOff, Loader2, Check } from 'lucide-react';

export const Register: React.FC = () => {
  const [orgName, setOrgName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Validations
  const isValidEmail = (emailStr: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  const isPasswordStrong = password.length >= 8;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const isFormValid =
    orgName.trim().length > 0 &&
    name.trim().length > 0 &&
    isValidEmail(email) &&
    isPasswordStrong &&
    passwordsMatch &&
    termsAccepted;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      if (!isValidEmail(email)) {
        setError('Please enter a valid work email address.');
        return;
      }
      if (!isPasswordStrong) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      if (!passwordsMatch) {
        setError('Passwords do not match.');
        return;
      }
      if (!termsAccepted) {
        setError('You must accept the Terms of Service and Privacy Policy.');
        return;
      }
      setError('Please fill out all required fields correctly.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await register({
        orgName: orgName.trim(),
        name: name.trim(),
        email: email.trim(),
        password,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details and try again.');
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
          <h2 style={styles.title}>Create your organization</h2>
          <p style={styles.subtitle}>Set up your enterprise AI governance workspace</p>
        </div>

        {error && (
          <div style={styles.errorAlert} role="alert">
            <AlertCircle size={18} color="#fca5a5" style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          <div>
            <label style={styles.label} htmlFor="org-name">Organization Name</label>
            <div style={{ position: 'relative' }}>
              <Building2 size={18} color="var(--text-muted)" style={styles.inputIconLeft} />
              <input
                id="org-name"
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Acme Cybersec Inc."
                style={{ ...styles.input, paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <div>
            <label style={styles.label} htmlFor="full-name">Full Name</label>
            <div style={{ position: 'relative' }}>
              <UserIcon size={18} color="var(--text-muted)" style={styles.inputIconLeft} />
              <input
                id="full-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                style={{ ...styles.input, paddingLeft: '2.5rem' }}
                autoComplete="name"
              />
            </div>
          </div>

          <div>
            <label style={styles.label} htmlFor="work-email">Work Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="var(--text-muted)" style={styles.inputIconLeft} />
              <input
                id="work-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@organization.com"
                style={{ ...styles.input, paddingLeft: '2.5rem' }}
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label style={styles.label} htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--text-muted)" style={styles.inputIconLeft} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            <label style={styles.label} htmlFor="confirm-password">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--text-muted)" style={styles.inputIconLeft} />
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
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

          <div style={styles.checkboxRow}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                style={{ marginRight: '0.6rem', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
              I agree to the Terms of Service and Privacy Policy
            </label>
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
                Creating Organization Account...
              </>
            ) : (
              <>
                Create Organization Account <ArrowRight size={16} style={{ marginLeft: '0.4rem' }} />
              </>
            )}
          </button>
        </form>

        <div style={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" style={styles.loginLink}>
            Sign in
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
    padding: '2rem 1rem',
  },
  box: {
    width: '100%',
    maxWidth: '460px',
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
    gap: '1.1rem',
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
  checkboxRow: {
    marginTop: '0.2rem',
  },
  checkboxLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
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
  loginLink: {
    fontWeight: 600,
    color: 'var(--accent-primary)',
  },
};
