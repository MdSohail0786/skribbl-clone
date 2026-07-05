import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-4">
      <h1 className="text-5xl font-extrabold">404</h1>
      <p className="text-[var(--color-text-muted)]">This page doesn't exist.</p>
      <Link to="/" className="btn-primary rounded-lg px-5 py-2.5 font-semibold">
        Back to Home
      </Link>
    </div>
  );
}
