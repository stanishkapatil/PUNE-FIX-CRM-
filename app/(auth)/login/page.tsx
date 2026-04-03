"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

type Role = 'staff' | 'mla';

const DEMO_CREDENTIALS = {
  staff: {
    email: 'staff@pune.gov.in',
    password: 'Demo@1234',
    name: 'Priya Sharma',
    title: 'Staff Officer — Water Supply Dept.',
    icon: '👩‍💼',
    color: '#2563EB',
    lightBg: '#EFF6FF',
  },
  mla: {
    email: 'mla@pune.gov.in',
    password: 'Demo@1234',
    name: 'MLA Sharma',
    title: 'Public Representative — Pune Ward Cluster',
    icon: '🏛️',
    color: '#0D9488',
    lightBg: '#F0FDFA',
  },
};

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role>('staff');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const role = userDoc.exists() ? userDoc.data().role : 'staff';
          router.push(role === 'mla' ? '/mla' : '/dashboard');
        } catch {
          router.push('/dashboard');
        }
      } else {
        setChecking(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Handle role tab change
  const handleRoleChange = (role: Role) => {
    setSelectedRole(role);
    setEmail('');
    setPassword('');
    setError('');
  };

  // Fill demo credentials with one click
  const fillDemo = () => {
    setEmail(DEMO_CREDENTIALS[selectedRole].email);
    setPassword(DEMO_CREDENTIALS[selectedRole].password);
    setError('');
  };

  const handleLogin = async () => {
    setError('');
    if (!email.trim()) { setError('Email is required'); return; }
    if (!password.trim()) { setError('Password is required'); return; }

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth, email.trim(), password
      );
      const userDoc = await getDoc(
        doc(db, 'users', userCredential.user.uid)
      );
      const role = userDoc.exists() ? userDoc.data().role : 'staff';
      router.push(role === 'mla' ? '/mla' : '/dashboard');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential'
      ) {
        setError('Invalid email or password. Please try again.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait a few minutes.');
      } else {
        setError('Login failed. Please check your credentials.');
      }
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#F8FAFC',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40,
            border: '3px solid #E2E8F0',
            borderTop: '3px solid #2563EB',
            borderRadius: '50%',
            margin: '0 auto 12px',
          }} />
          <p style={{ color: '#94A3B8', fontSize: 14, margin: 0 }}>
            Checking session...
          </p>
        </div>
      </div>
    );
  }

  const cred = DEMO_CREDENTIALS[selectedRole];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1B2A4A 0%, #2563EB 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{ width: '100%', maxWidth: 460 }}>

        {/* TOP BRANDING */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64,
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28, margin: '0 auto 16px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            🏛️
          </div>
          <h1 style={{
            fontSize: 28, fontWeight: 800,
            color: 'white', margin: '0 0 4px',
            letterSpacing: '-0.5px',
          }}>
            P-CRM
          </h1>
          <p style={{
            fontSize: 14, color: 'rgba(255,255,255,0.7)',
            margin: 0,
          }}>
            Smart Public Governance CRM
          </p>
          <p style={{
            fontSize: 12, color: 'rgba(255,255,255,0.5)',
            margin: '4px 0 0', fontStyle: 'italic',
          }}>
            Your Voice, Our Priority
          </p>
        </div>

        {/* MAIN CARD */}
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: '32px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        }}>

          {/* ROLE SELECTOR TABS */}
          <div style={{
            display: 'flex',
            background: '#F1F5F9',
            borderRadius: 12,
            padding: 4,
            marginBottom: 28,
          }}>
            {(['staff', 'mla'] as Role[]).map((role) => (
              <button
                key={role}
                onClick={() => handleRoleChange(role)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  background: selectedRole === role
                    ? 'white'
                    : 'transparent',
                  color: selectedRole === role
                    ? DEMO_CREDENTIALS[role].color
                    : '#94A3B8',
                  boxShadow: selectedRole === role
                    ? '0 2px 8px rgba(0,0,0,0.1)'
                    : 'none',
                }}
              >
                {DEMO_CREDENTIALS[role].icon}{' '}
                {role === 'staff' ? 'Staff Login' : 'MLA Login'}
              </button>
            ))}
          </div>

          {/* ROLE INFO BANNER */}
          <div style={{
            background: cred.lightBg,
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            border: `1px solid ${cred.color}22`,
          }}>
            <span style={{ fontSize: 24 }}>{cred.icon}</span>
            <div>
              <div style={{
                fontSize: 13, fontWeight: 700,
                color: cred.color,
              }}>
                {cred.name}
              </div>
              <div style={{
                fontSize: 11, color: '#64748B', marginTop: 1,
              }}>
                {cred.title}
              </div>
            </div>
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 8,
              padding: '10px 14px',
              color: '#DC2626',
              fontSize: 13,
              marginBottom: 16,
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* EMAIL INPUT */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              fontSize: 13, fontWeight: 600,
              color: '#374151', display: 'block',
              marginBottom: 6,
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              placeholder={cred.email}
              style={{
                width: '100%', height: 46,
                padding: '0 14px',
                border: '1.5px solid #E2E8F0',
                borderRadius: 10, fontSize: 14,
                color: '#1B2A4A', outline: 'none',
                boxSizing: 'border-box',
                background: '#FAFAFA',
              }}
            />
          </div>

          {/* PASSWORD INPUT */}
          <div style={{ marginBottom: 8 }}>
            <label style={{
              fontSize: 13, fontWeight: 600,
              color: '#374151', display: 'block',
              marginBottom: 6,
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setError('');
                }}
                onKeyDown={handleKeyDown}
                placeholder="••••••••"
                style={{
                  width: '100%', height: 46,
                  padding: '0 44px 0 14px',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: 10, fontSize: 14,
                  color: '#1B2A4A', outline: 'none',
                  boxSizing: 'border-box',
                  background: '#FAFAFA',
                }}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 12,
                  top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: 18,
                  color: '#94A3B8', padding: 0,
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* FORGOT PASSWORD */}
          <div style={{
            textAlign: 'right', marginBottom: 24,
          }}>
            <span style={{
              fontSize: 12, color: '#2563EB',
              cursor: 'pointer', fontWeight: 500,
            }}>
              Forgot password?
            </span>
          </div>

          {/* SIGN IN BUTTON */}
          <button
            onClick={handleLogin}
            disabled={isLoading}
            style={{
              width: '100%', height: 48,
              background: isLoading ? '#93C5FD' : cred.color,
              color: 'white', border: 'none',
              borderRadius: 10, fontSize: 15,
              fontWeight: 700, cursor: isLoading
                ? 'not-allowed' : 'pointer',
              marginBottom: 16,
              letterSpacing: '0.3px',
            }}
          >
            {isLoading
              ? '⏳ Signing in...'
              : `Sign In as ${selectedRole === 'staff'
                  ? 'Staff Officer'
                  : 'MLA'}`}
          </button>

          {/* DEMO CREDENTIALS BOX */}
          <div style={{
            background: '#F8FAFC',
            borderRadius: 10,
            border: '1px solid #E2E8F0',
            padding: '14px 16px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}>
              <p style={{
                fontSize: 11, fontWeight: 700,
                color: '#64748B', margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                🎯 Demo Credentials
              </p>
              <button
                onClick={fillDemo}
                style={{
                  background: cred.color,
                  color: 'white', border: 'none',
                  borderRadius: 6, padding: '4px 10px',
                  fontSize: 11, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Auto Fill ↗
              </button>
            </div>
            <p style={{
              fontSize: 12, color: '#475569',
              margin: '2px 0', fontFamily: 'monospace',
            }}>
              📧 {cred.email}
            </p>
            <p style={{
              fontSize: 12, color: '#475569',
              margin: '2px 0', fontFamily: 'monospace',
            }}>
              🔑 Demo@1234
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <p style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.5)',
          fontSize: 11, marginTop: 20,
        }}>
          🔒 Authorized personnel only · P-CRM v1.0
        </p>
      </div>
    </div>
  );
}
