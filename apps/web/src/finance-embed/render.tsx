import { renderToString } from 'react-dom/server';
import { FINANCE_TOOLS, type FinanceToolId } from '@insightginie/calculators';
import { FinanceEditor } from './editor';
export { FINANCE_TOOLS };
export function renderFinanceEmbed(toolId: FinanceToolId) {
  return renderToString(<FinanceEditor toolId={toolId} />);
}
