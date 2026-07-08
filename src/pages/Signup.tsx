import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ScrollText } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Field';

export function Signup() {
  const { user, loading, signUp, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [householdName, setHouseholdName] = useState('');
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
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await signUp(email, password, householdName || undefined);
    } catch (err: any) {
      setError(err?.message || 'Sign up failed. Please try again.');
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
          <h1 className="mt-4 font-display text-2xl font-semibold text-[var(--color-ink)]">Create Account</h1>
          <p className="text-sm text-[var(--color-ink-faint)]">Set up your family's financial ledger</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Household Name
            </label>
            <Input
              placeholder="e.g. Silva Family"
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
            />
          </div>
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
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={6}
            />
          </div>

          {error && (
            <p className="rounded-lg border border-[var(--color-crimson)]/25 bg-[var(--color-crimson-50)] px-4 py-2.5 text-xs font-medium text-[var(--color-crimson)]">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create Account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-[var(--color-ink-faint)]">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[var(--color-brass-dark)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
