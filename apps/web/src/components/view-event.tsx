'use client';
import { useEffect } from 'react';
import { track } from '@insightginie/analytics';
export function ViewEvent() {
  useEffect(() => track('calculator_view', { calculator_id: 'individual-income-percentile' }), []);
  return null;
}
