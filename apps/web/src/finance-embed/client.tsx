import { hydrateRoot } from 'react-dom/client';
import { getFinanceTool } from '@insightginie/calculators';
import { FinanceEditor } from './editor';
const root = document.getElementById('finance-root');
const tool = getFinanceTool(document.documentElement.dataset.tool ?? '');
if (!root || !tool) throw new Error('Unknown financial calculator.');
hydrateRoot(root, <FinanceEditor toolId={tool.id} />);
let previous = 0;
function measure(force = false) {
  const height = Math.max(
    320,
    Math.min(5000, Math.ceil(root!.getBoundingClientRect().height / 32) * 32),
  );
  if (!force && height === previous) return;
  previous = height;
  window.parent.postMessage(
    { channel: 'insightginie:finance:v1', toolId: tool!.id, type: 'resize', height },
    '*',
  );
}
new ResizeObserver(() => measure()).observe(root);
window.addEventListener('message', (event) => {
  if (
    event.source === window.parent &&
    event.data?.channel === 'insightginie:finance:v1' &&
    event.data?.type === 'measure'
  )
    measure(true);
});
measure();
