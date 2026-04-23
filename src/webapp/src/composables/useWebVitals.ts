import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';
import { getLogger } from '../utils/logger';

const logger = getLogger('webVitals');

interface VitalMetric {
  name: string;
  value: number;
  id: string;
  rating: string;
  timestamp: number;
}

interface VitalSummary {
  count: number;
  avg: number;
  min: number;
  max: number;
  latest: number;
  rating: string;
}

const vitals: VitalMetric[] = [];

function formatMetric(value: number): string {
  return value.toFixed(2);
}

function sendToAnalytics({
  name,
  delta,
  id,
  rating,
}: {
  name: string;
  delta: number;
  id: string;
  rating: string;
}) {
  const metric: VitalMetric = {
    name,
    value: delta,
    id,
    rating,
    timestamp: Date.now(),
  };

  vitals.push(metric);

  const ratingEmoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';

  logger.info(`[Web Vitals] ${name}: ${formatMetric(delta)}ms ${ratingEmoji}`, {
    id,
    rating,
  });

  if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
    fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT as string, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric),
    }).catch((error: Error) =>
      logger.error('[Web Vitals] Failed to send to analytics:', { error: error.message })
    );
  }
}

function initWebVitals() {
  try {
    onCLS(sendToAnalytics);
    onFCP(sendToAnalytics);
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
    onINP(sendToAnalytics);

    logger.info('[Web Vitals] Monitoring initialized', {
      metrics: ['CLS', 'FCP', 'LCP', 'TTFB', 'INP'],
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('[Web Vitals] Failed to initialize:', { error: errorMessage });
  }
}

function getVitals(): VitalMetric[] {
  return [...vitals];
}

function getVitalsSummary(): Record<string, VitalSummary> {
  const summary: Record<string, { values: number[]; count: number }> = {};
  const latest: Record<string, VitalMetric> = {};

  vitals.forEach((v) => {
    if (!latest[v.name] || v.timestamp > latest[v.name].timestamp) {
      latest[v.name] = v;
    }

    if (!summary[v.name]) {
      summary[v.name] = { values: [], count: 0 };
    }
    summary[v.name].values.push(v.value);
    summary[v.name].count++;
  });

  const result: Record<string, VitalSummary> = {};

  Object.keys(summary).forEach((name) => {
    const values = summary[name].values;
    result[name] = {
      count: values.length,
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      latest: latest[name]?.value || 0,
      rating: latest[name]?.rating || 'unknown',
    };
  });

  return result;
}

function clearVitals() {
  vitals.length = 0;
}

function getOverallScore(): number {
  const summary = getVitalsSummary();
  const scores: number[] = [];

  if (summary.CLS) {
    scores.push(
      summary.CLS.rating === 'good' ? 100 : summary.CLS.rating === 'needs-improvement' ? 50 : 0
    );
  }
  if (summary.LCP) {
    scores.push(
      summary.LCP.rating === 'good' ? 100 : summary.LCP.rating === 'needs-improvement' ? 50 : 0
    );
  }
  if (summary.FID !== undefined || summary.INP) {
    scores.push(
      (summary.FID || summary.INP)?.rating === 'good'
        ? 100
        : (summary.FID || summary.INP)?.rating === 'needs-improvement'
          ? 50
          : 0
    );
  }

  return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
}

export { initWebVitals, getVitals, getVitalsSummary, clearVitals, getOverallScore };

export type { VitalMetric, VitalSummary };
