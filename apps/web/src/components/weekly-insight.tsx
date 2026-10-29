'use client';

/** Email-only UI until the owner supplies a mailing provider; never submits data. */
export function WeeklyInsight({ id }: { id: string }) {
  return (
    <section className="weekly-insight" aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>One money insight a week. No noise.</h2>
      <p>
        A surprising number from real public data, and what it actually means. Free. Unsubscribe
        anytime. Your calculator inputs stay in your browser — we never ask for them here.
      </p>
      <form onSubmit={(event) => event.preventDefault()}>
        <label htmlFor={`${id}-email`}>Email address</label>
        <input
          id={`${id}-email`}
          type="email"
          autoComplete="email"
          maxLength={254}
          aria-describedby={`${id}-status`}
        />
        <button className="button primary" type="submit" disabled>
          Get the weekly insight
        </button>
      </form>
      <p id={`${id}-status`} role="status">
        Weekly signup is not connected yet. No email address is sent or saved.
      </p>
    </section>
  );
}
