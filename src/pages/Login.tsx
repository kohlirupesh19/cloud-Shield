import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield } from 'lucide-react';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@cloudshield.local');
  const [password, setPassword] = useState('ChangeMe123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-surface-container-lowest border border-precision border-outline-variant rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-8">
          <Shield className="w-12 h-12 text-primary fill-primary/10 mb-4" />
          <h1 className="text-metric-display font-medium text-primary tracking-tight">CloudShield</h1>
          <p className="text-label-caps text-outline tracking-widest mt-1">GOV DATA GOVERNANCE</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-body-main font-medium text-on-surface mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-container-low border border-precision border-outline-variant rounded-lg px-4 py-2.5 text-body-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-body-main font-medium text-on-surface mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-container-low border border-precision border-outline-variant rounded-lg px-4 py-2.5 text-body-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>
          {error ? <p className="text-sm text-error">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 mt-6 bg-primary text-on-primary rounded-lg font-section-header hover:bg-primary-container hover:text-on-primary-container transition-colors active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? 'Authenticating...' : 'Authenticate'}
          </button>
        </form>
        
        <p className="text-center text-[12px] text-outline mt-6 flex items-center gap-2 justify-center">
          <Shield className="w-3 h-3" /> Secure Government Portal
        </p>
      </div>
    </div>
  );
}
