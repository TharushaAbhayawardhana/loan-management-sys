import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ScrollText } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Field';

export function Login() {
  const { user, loading, signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-paper)]">
        <div className="flex h-14 w-14 animate-pulse items-center justify-center rounded-xl bg-[var(--color-ink-900)] text-[var(--color-brass)]">
          <ScrollText size={26} />
        </div>
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err?.message || 'Sign in failed. Check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError(err?.message || 'Google sign-in failed.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="paper-texture flex min-h-screen flex-col items-center justify-center bg-[var(--color-paper)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--color-ink-900)] text-[var(--color-brass)]">
            <ScrollText size={26} />
          </div>
          <h1 className="mt-4 font-display text-2xl font-semibold text-[var(--color-ink)]">FFMS</h1>
          <p className="text-sm text-[var(--color-ink-faint)]">Family Financial Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Email
            </label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-[var(--color-crimson)]/25 bg-[var(--color-crimson-50)] px-4 py-2.5 text-xs font-medium text-[var(--color-crimson)]">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--color-hairline)]" />
          <span className="text-xs text-[var(--color-ink-faint)]">or</span>
          <div className="h-px flex-1 bg-[var(--color-hairline)]" />
        </div>

        <Button variant="secondary" className="w-full" onClick={handleGoogle} disabled={submitting}>
          Continue with Google
        </Button>

        <p className="mt-6 text-center text-xs text-[var(--color-ink-faint)]">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-[var(--color-brass-dark)] hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
