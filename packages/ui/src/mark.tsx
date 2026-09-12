export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M16 2c1.4 8.8 5.2 12.6 14 14-8.8 1.4-12.6 5.2-14 14C14.6 21.2 10.8 17.4 2 16 10.8 14.6 14.6 10.8 16 2Z"
        fill="currentColor"
      />
      <path
        d="M26 1c.4 2.9 1.8 4.3 4.7 4.7-2.9.4-4.3 1.8-4.7 4.7-.4-2.9-1.8-4.3-4.7-4.7C24.2 5.3 25.6 3.9 26 1Z"
        fill="currentColor"
      />
    </svg>
  );
}
