import { hydrateRoot } from 'react-dom/client';
import { configureAnalytics } from '@insightginie/analytics';
import { IncomeEmbed } from './income';
import { INCOME_EMBED_CHANNEL, SAFE_CALCULATOR_EVENTS, SAFE_INTERACTIONS } from './protocol';

const root = document.getElementById('income-embed-root');
if (!root) throw new Error('Calculator root is missing.');

configureAnalytics({
  track(event, properties) {
    if (!SAFE_CALCULATOR_EVENTS.some((allowed) => allowed === event)) return;
    const interaction = SAFE_INTERACTIONS.find((allowed) => allowed === properties.interaction);
    window.parent.postMessage(
      { channel: INCOME_EMBED_CHANNEL, type: 'event', event, interaction },
      '*',
    );
  },
});

hydrateRoot(root, <IncomeEmbed compact={document.documentElement.dataset.view === 'compact'} />);

let priorHeight = 0;
function reportHeight(force = false) {
  // Round up to 32px increments. Only layout size leaves this opaque-origin document.
  const height = Math.max(
    320,
    Math.min(5000, Math.ceil(root!.getBoundingClientRect().height / 32) * 32),
  );
  if (!force && height === priorHeight) return;
  priorHeight = height;
  window.parent.postMessage({ channel: INCOME_EMBED_CHANNEL, type: 'resize', height }, '*');
}
new ResizeObserver(() => reportHeight()).observe(root);
window.addEventListener('message', (event) => {
  if (
    event.source === window.parent &&
    event.data?.channel === INCOME_EMBED_CHANNEL &&
    event.data?.type === 'measure'
  )
    reportHeight(true);
});
reportHeight();
