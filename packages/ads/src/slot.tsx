export type AdPlacement = 'calculator-result-bottom' | 'editorial-in-content';
export interface AdProvider {
  id: string;
}
/** No ad scripts run until a provider and the consent layer are implemented. */
export function AdSlot({
  placement,
  enabled = false,
}: {
  placement: AdPlacement;
  enabled?: boolean;
}) {
  if (!enabled) return null;
  return (
    <aside data-placement={placement} aria-label="Advertisement" style={{ minHeight: 250 }}>
      Advertisement
    </aside>
  );
}
