/**
 * Anomaly Detection Engine
 * Pure-TypeScript statistical anomaly detection for quality tests,
 * delivery delays, and material consumption spikes.
 */

// ─── Statistical Utilities ───────────────────────────────────────────────────

export type Severity = 'info' | 'warning' | 'critical';

export interface AnomalyResult {
  anomalyType: string;
  severity: Severity;
  message: string;
  score: number;
  details: Record<string, any>;
  detectedAt: Date;
}

/**
 * Calculate Z-score: how many standard deviations a value is from the mean.
 * Returns 0 if std is 0 (no variation).
 */
export function calculateZScore(value: number, mean: number, std: number): number {
  if (std === 0) return 0;
  return (value - mean) / std;
}

/**
 * Calculate IQR (Interquartile Range) from a sorted array of numbers.
 * Returns { q1, q3, iqr, lowerBound, upperBound }.
 */
export function calculateIQR(values: number[]): {
  q1: number;
  q3: number;
  iqr: number;
  lowerBound: number;
  upperBound: number;
} {
  if (values.length === 0) {
    return { q1: 0, q3: 0, iqr: 0, lowerBound: 0, upperBound: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  const q1Index = Math.floor(n * 0.25);
  const q3Index = Math.floor(n * 0.75);

  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;

  return {
    q1,
    q3,
    iqr,
    lowerBound: q1 - 1.5 * iqr,
    upperBound: q3 + 1.5 * iqr,
  };
}

/**
 * Calculate rolling mean and standard deviation over a window.
 */
export function calculateRollingStats(
  data: number[],
  windowSize: number
): { mean: number; std: number }[] {
  const results: { mean: number; std: number }[] = [];

  for (let i = 0; i <= data.length - windowSize; i++) {
    const window = data.slice(i, i + windowSize);
    const mean = window.reduce((s, v) => s + v, 0) / window.length;
    const variance = window.reduce((s, v) => s + (v - mean) ** 2, 0) / window.length;
    const std = Math.sqrt(variance);
    results.push({ mean, std });
  }

  return results;
}

/**
 * Classify severity based on absolute Z-score.
 *   |z| < 2   → info
 *   2 ≤ |z| < 3 → warning
 *   |z| ≥ 3   → critical
 */
export function classifySeverity(zScore: number): Severity {
  const absZ = Math.abs(zScore);
  if (absZ >= 3) return 'critical';
  if (absZ >= 2) return 'warning';
  return 'info';
}

/**
 * Calculate mean and standard deviation of an array.
 */
export function calcMeanStd(values: number[]): { mean: number; std: number } {
  if (values.length === 0) return { mean: 0, std: 0 };
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return { mean, std: Math.sqrt(variance) };
}

// ─── Quality Anomaly Detector ────────────────────────────────────────────────

export interface QualityTestData {
  id: number;
  testType: string;
  status: string;
  result: string | null;
  createdAt: Date | string;
  deliveryId?: number | null;
}

/**
 * Detect anomalies in quality test data.
 * Scans for:
 *  1. High failure rate relative to historical baseline
 *  2. Spikes in failure count per day
 */
export function detectQualityAnomalies(
  tests: QualityTestData[],
  windowDays: number = 30
): AnomalyResult[] {
  if (tests.length < 3) return [];

  const anomalies: AnomalyResult[] = [];
  const now = new Date();
  const cutoff = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

  // Filter to window
  const windowTests = tests.filter(t => new Date(t.createdAt) >= cutoff);
  if (windowTests.length === 0) return [];

  // --- 1. Overall failure rate anomaly ---
  const totalTests = windowTests.length;
  const failedTests = windowTests.filter(t => t.status === 'fail').length;
  const failureRate = failedTests / totalTests;

  // Compare to full historical rate
  const historicalFailed = tests.filter(t => t.status === 'fail').length;
  const historicalRate = tests.length > 0 ? historicalFailed / tests.length : 0;

  if (historicalRate > 0 && failureRate > 0) {
    // Treat historical rate as the baseline mean, estimate std from proportions
    const baselineStd = Math.sqrt(historicalRate * (1 - historicalRate) / totalTests);
    const zScore = baselineStd > 0 ? calculateZScore(failureRate, historicalRate, baselineStd) : 0;

    if (Math.abs(zScore) >= 2) {
      anomalies.push({
        anomalyType: 'quality_failure_rate',
        severity: classifySeverity(zScore),
        message: `Quality failure rate (${(failureRate * 100).toFixed(1)}%) is significantly ${failureRate > historicalRate ? 'higher' : 'lower'} than baseline (${(historicalRate * 100).toFixed(1)}%)`,
        score: zScore,
        details: {
          currentRate: failureRate,
          historicalRate,
          totalTests,
          failedTests,
          windowDays,
        },
        detectedAt: now,
      });
    }
  }

  // --- 2. Daily failure count spikes ---
  const dailyFailures = new Map<string, number>();
  for (const test of windowTests) {
    if (test.status === 'fail') {
      const dateKey = new Date(test.createdAt).toISOString().split('T')[0];
      dailyFailures.set(dateKey, (dailyFailures.get(dateKey) || 0) + 1);
    }
  }

  const dailyCounts = Array.from(dailyFailures.values());
  if (dailyCounts.length >= 3) {
    const { mean, std } = calcMeanStd(dailyCounts);
    for (const [date, count] of Array.from(dailyFailures.entries())) {
      const zScore = calculateZScore(count, mean, std);
      if (zScore >= 2) {
        anomalies.push({
          anomalyType: 'quality_failure_spike',
          severity: classifySeverity(zScore),
          message: `${count} quality test failures on ${date} (avg: ${mean.toFixed(1)}/day)`,
          score: zScore,
          details: { date, failureCount: count, dailyMean: mean, dailyStd: std },
          detectedAt: now,
        });
      }
    }
  }

  // --- 3. Per-test-type failure rate ---
  const testTypes = Array.from(new Set(windowTests.map(t => t.testType)));
  for (const testType of testTypes) {
    const typeTests = windowTests.filter(t => t.testType === testType);
    const typeFailed = typeTests.filter(t => t.status === 'fail').length;
    const typeRate = typeTests.length > 0 ? typeFailed / typeTests.length : 0;

    // Compare to overall rate
    if (typeRate > failureRate && typeTests.length >= 3) {
      const diffStd = Math.sqrt(failureRate * (1 - failureRate) / typeTests.length);
      const zScore = diffStd > 0 ? calculateZScore(typeRate, failureRate, diffStd) : 0;

      if (zScore >= 2) {
        anomalies.push({
          anomalyType: 'quality_test_type_anomaly',
          severity: classifySeverity(zScore),
          message: `${testType} tests have ${(typeRate * 100).toFixed(1)}% failure rate vs ${(failureRate * 100).toFixed(1)}% overall`,
          score: zScore,
          details: { testType, typeRate, overallRate: failureRate, typeTotal: typeTests.length, typeFailed },
          detectedAt: now,
        });
      }
    }
  }

  return anomalies;
}

// ─── Delivery Delay Detector ─────────────────────────────────────────────────

export interface DeliveryData {
  id: number;
  scheduledTime: Date | string | null;
  estimatedArrival: Date | string | null;
  actualDeliveryTime?: Date | string | null;
  driverName?: string | null;
  vehicleNumber?: string | null;
  projectName?: string | null;
  status: string;
}

/**
 * Calculate delay in minutes between scheduled/estimated and actual delivery.
 * Returns null if times are missing.
 */
export function calculateDelayMinutes(
  expected: Date | string | null,
  actual: Date | string | null
): number | null {
  if (!expected || !actual) return null;
  const expectedMs = new Date(expected).getTime();
  const actualMs = new Date(actual).getTime();
  if (isNaN(expectedMs) || isNaN(actualMs)) return null;
  return (actualMs - expectedMs) / (1000 * 60);
}

/**
 * Detect anomalies in delivery timing data.
 * Uses IQR method to identify outlier delays.
 */
export function detectDeliveryAnomalies(deliveries: DeliveryData[]): AnomalyResult[] {
  const anomalies: AnomalyResult[] = [];
  const now = new Date();

  // Calculate delays for completed deliveries
  const delayData: { id: number; delay: number; delivery: DeliveryData }[] = [];
  for (const d of deliveries) {
    const expected = d.estimatedArrival || d.scheduledTime;
    const delay = calculateDelayMinutes(expected, d.actualDeliveryTime ?? null);
    if (delay !== null) {
      delayData.push({ id: d.id, delay, delivery: d });
    }
  }

  if (delayData.length < 4) return [];

  // IQR-based outlier detection
  const delays = delayData.map(d => d.delay);
  const { q1, q3, iqr, lowerBound, upperBound } = calculateIQR(delays);
  const { mean, std } = calcMeanStd(delays);

  for (const { id, delay, delivery } of delayData) {
    if (delay > upperBound) {
      const zScore = calculateZScore(delay, mean, std);
      anomalies.push({
        anomalyType: 'delivery_delay_outlier',
        severity: classifySeverity(zScore),
        message: `Delivery #${id} to ${delivery.projectName || 'unknown'} delayed by ${Math.round(delay)} min (upper bound: ${Math.round(upperBound)} min)`,
        score: zScore,
        details: {
          deliveryId: id,
          delayMinutes: Math.round(delay),
          upperBound: Math.round(upperBound),
          meanDelay: Math.round(mean),
          driverName: delivery.driverName,
          vehicleNumber: delivery.vehicleNumber,
          projectName: delivery.projectName,
        },
        detectedAt: now,
      });
    }
  }

  // Overall delay trend — is mean delay itself high?
  if (mean > 30) {
    // More than 30 min average delay is concerning
    const trendSeverity: Severity = mean > 60 ? 'critical' : mean > 45 ? 'warning' : 'info';
    anomalies.push({
      anomalyType: 'delivery_delay_trend',
      severity: trendSeverity,
      message: `Average delivery delay is ${Math.round(mean)} minutes across ${delayData.length} deliveries`,
      score: mean / 30, // Normalized score
      details: {
        meanDelay: Math.round(mean),
        stdDelay: Math.round(std),
        q1: Math.round(q1),
        q3: Math.round(q3),
        totalDeliveries: delayData.length,
      },
      detectedAt: now,
    });
  }

  return anomalies;
}

// ─── Consumption Spike Detector ──────────────────────────────────────────────

export interface ConsumptionData {
  materialId: number;
  materialName?: string;
  quantityUsed: number;
  date: Date | string;
}

/**
 * Detect consumption spikes using rolling window Z-score analysis.
 */
export function detectConsumptionAnomalies(
  consumptions: ConsumptionData[],
  windowSize: number = 7
): AnomalyResult[] {
  if (consumptions.length < windowSize + 1) return [];

  const anomalies: AnomalyResult[] = [];
  const now = new Date();

  // Group by materialId
  const byMaterial = new Map<number, ConsumptionData[]>();
  for (const c of consumptions) {
    const existing = byMaterial.get(c.materialId) || [];
    existing.push(c);
    byMaterial.set(c.materialId, existing);
  }

  for (const [materialId, records] of Array.from(byMaterial.entries())) {
    // Sort by date ascending
    const sorted = [...records].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    if (sorted.length < windowSize + 1) continue;

    // Aggregate daily consumption
    const dailyMap = new Map<string, number>();
    for (const r of sorted) {
      const dateKey = new Date(r.date).toISOString().split('T')[0];
      dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + r.quantityUsed);
    }

    const dailyValues = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b));

    if (dailyValues.length < windowSize + 1) continue;

    const quantities = dailyValues.map(([, q]) => q);
    const rollingStats = calculateRollingStats(quantities, windowSize);

    // Check if the latest values are spikes relative to their rolling window
    for (let i = windowSize; i < quantities.length; i++) {
      const statsIdx = i - windowSize;
      if (statsIdx >= rollingStats.length) break;

      const { mean, std } = rollingStats[statsIdx];
      const currentValue = quantities[i];
      const zScore = calculateZScore(currentValue, mean, std);

      if (zScore >= 2) {
        const materialName = records[0]?.materialName || `Material #${materialId}`;
        const dateStr = dailyValues[i][0];

        anomalies.push({
          anomalyType: 'consumption_spike',
          severity: classifySeverity(zScore),
          message: `${materialName} consumption spike on ${dateStr}: ${currentValue.toFixed(0)} vs rolling avg ${mean.toFixed(0)}`,
          score: zScore,
          details: {
            materialId,
            materialName,
            date: dateStr,
            currentConsumption: currentValue,
            rollingMean: mean,
            rollingStd: std,
            windowSize,
          },
          detectedAt: now,
        });
      }
    }
  }

  return anomalies;
}

// ─── Full Scan Aggregator ────────────────────────────────────────────────────

export interface FullScanResult {
  quality: AnomalyResult[];
  delivery: AnomalyResult[];
  consumption: AnomalyResult[];
  summary: {
    totalAnomalies: number;
    critical: number;
    warning: number;
    info: number;
  };
  scannedAt: Date;
}

export function aggregateScanResults(
  quality: AnomalyResult[],
  delivery: AnomalyResult[],
  consumption: AnomalyResult[]
): FullScanResult {
  const all = [...quality, ...delivery, ...consumption];
  return {
    quality,
    delivery,
    consumption,
    summary: {
      totalAnomalies: all.length,
      critical: all.filter(a => a.severity === 'critical').length,
      warning: all.filter(a => a.severity === 'warning').length,
      info: all.filter(a => a.severity === 'info').length,
    },
    scannedAt: new Date(),
  };
}
