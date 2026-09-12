'use client';
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="shell error-page">
      <h1>We couldn’t load this insight.</h1>
      <p>Try again in a moment. Your input hasn’t been saved.</p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
