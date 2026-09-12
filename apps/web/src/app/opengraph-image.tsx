import { ImageResponse } from 'next/og';
export const alt = 'InsightGinie — Understand where you stand.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          padding: 72,
          background: '#f5f3ff',
          color: '#171c32',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 36, color: '#5844d7' }}>
          <svg width="40" height="40" viewBox="0 0 32 32" style={{ marginRight: 16 }}>
            <path
              d="M16 2c1.4 8.8 5.2 12.6 14 14-8.8 1.4-12.6 5.2-14 14C14.6 21.2 10.8 17.4 2 16 10.8 14.6 14.6 10.8 16 2Z"
              fill="#5844d7"
            />
          </svg>
          insightginie.
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: 76,
            fontWeight: 700,
            letterSpacing: -4,
          }}
        >
          <span>Understand where</span>
          <span style={{ color: '#5844d7' }}>you stand.</span>
        </div>
        <div style={{ display: 'flex', fontSize: 26 }}>
          Real US data. Clear comparisons. Your next move.
        </div>
      </div>
    ),
    size,
  );
}
