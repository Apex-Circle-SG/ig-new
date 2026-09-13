import { renderToString } from 'react-dom/server';
import { IncomeEmbed } from './income';

export function renderIncomeEmbed(compact: boolean): string {
  return renderToString(<IncomeEmbed compact={compact} />);
}
