import { describe, it, expect } from 'vitest';
import {
  calculateZScore,
  calculateIQR,
  calculateRollingStats,
  classifySeverity,
  calcMeanStd,
  detectQualityAnomalies,
  detectDeliveryAnomalies,
  detectConsumptionAnomalies,
  calculateDelayMinutes,
  aggregateScanResults,
} from '../lib/anomalyDetection';

describe('Anomaly Detection Engine', () => {
  // ─── Statistical Utilities ───────────────────────────────────────────

  describe('calculateZScore', () => {
    it('should calculate Z-score correctly', () => {
      // Value 10, mean 5, std 2 → z = (10-5)/2 = 2.5
      expect(calculateZScore(10, 5, 2)).toBe(2.5);
    });

    it('should return negative Z-score below mean', () => {
      expect(calculateZScore(0, 5, 2)).toBe(-2.5);
    });

    it('should return 0 when std is 0 (no variation)', () => {
      expect(calculateZScore(10, 5, 0)).toBe(0);
    });

    it('should return 0 when value equals mean', () => {
      expect(calculateZScore(5, 5, 2)).toBe(0);
    });
  });

  describe('calculateIQR', () => {
    it('should calculate IQR from sorted values', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      const result = calculateIQR(values);

      expect(result.q1).toBe(4);
      expect(result.q3).toBe(10);
      expect(result.iqr).toBe(6);
      expect(result.lowerBound).toBe(4 - 1.5 * 6); // -5
      expect(result.upperBound).toBe(10 + 1.5 * 6); // 19
    });

    it('should identify outliers using IQR method', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const { upperBound, lowerBound } = calculateIQR(values);

      // 25 is well above the upper bound
      expect(25 > upperBound).toBe(true);
      // -10 is well below the lower bound
      expect(-10 < lowerBound).toBe(true);
      // 5 is within bounds
      expect(5 >= lowerBound && 5 <= upperBound).toBe(true);
    });

    it('should handle empty array', () => {
      const result = calculateIQR([]);
      expect(result.q1).toBe(0);
      expect(result.q3).toBe(0);
      expect(result.iqr).toBe(0);
    });

    it('should handle single element', () => {
      const result = calculateIQR([5]);
      expect(result.iqr).toBe(0);
    });
  });

  describe('calculateRollingStats', () => {
    it('should calculate rolling mean and std', () => {
      const data = [10, 20, 30, 40, 50];
      const results = calculateRollingStats(data, 3);

      // Window [10,20,30]: mean=20, std=√((100+0+100)/3) ≈ 8.16
      expect(results.length).toBe(3); // 5 - 3 + 1 = 3 windows
      expect(results[0].mean).toBe(20);
      expect(results[0].std).toBeCloseTo(8.165, 2);

      // Window [20,30,40]: mean=30
      expect(results[1].mean).toBe(30);
    });

    it('should return empty for data shorter than window', () => {
      const results = calculateRollingStats([1, 2], 3);
      expect(results.length).toBe(0);
    });
  });

  describe('classifySeverity', () => {
    it('should classify |z| < 2 as info', () => {
      expect(classifySeverity(1.5)).toBe('info');
      expect(classifySeverity(-1.0)).toBe('info');
      expect(classifySeverity(0)).toBe('info');
    });

    it('should classify 2 ≤ |z| < 3 as warning', () => {
      expect(classifySeverity(2.0)).toBe('warning');
      expect(classifySeverity(2.5)).toBe('warning');
      expect(classifySeverity(-2.5)).toBe('warning');
    });

    it('should classify |z| ≥ 3 as critical', () => {
      expect(classifySeverity(3.0)).toBe('critical');
      expect(classifySeverity(4.5)).toBe('critical');
      expect(classifySeverity(-3.1)).toBe('critical');
    });
  });

  describe('calcMeanStd', () => {
    it('should calculate mean and std', () => {
      const { mean, std } = calcMeanStd([10, 20, 30]);
      expect(mean).toBe(20);
      expect(std).toBeCloseTo(8.165, 2);
    });

    it('should handle empty array', () => {
      const { mean, std } = calcMeanStd([]);
      expect(mean).toBe(0);
      expect(std).toBe(0);
    });

    it('should handle single value', () => {
      const { mean, std } = calcMeanStd([42]);
      expect(mean).toBe(42);
      expect(std).toBe(0);
    });
  });

  // ─── Quality Anomaly Detection ───────────────────────────────────────

  describe('Quality Anomaly Detection', () => {
    it('should return empty for insufficient data', () => {
      const tests = [
        { id: 1, testType: 'slump', status: 'pass', result: null, createdAt: new Date() },
        { id: 2, testType: 'slump', status: 'fail', result: null, createdAt: new Date() },
      ];
      const anomalies = detectQualityAnomalies(tests);
      expect(anomalies).toEqual([]);
    });

    it('should detect high failure rate anomaly', () => {
      const now = new Date();
      // Historical period: 90% pass rate (90 pass, 10 fail)
      const historicalTests = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        testType: 'slump',
        status: i < 90 ? 'pass' : 'fail',
        result: null,
        createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      }));

      // Recent period: suddenly 60% failure rate (huge spike)
      const recentTests = Array.from({ length: 50 }, (_, i) => ({
        id: 100 + i,
        testType: 'slump',
        status: i < 20 ? 'pass' : 'fail',
        result: null,
        createdAt: new Date(now.getTime() - i * 12 * 60 * 60 * 1000), // Within last 30 days
      }));

      const allTests = [...historicalTests, ...recentTests];
      const anomalies = detectQualityAnomalies(allTests, 30);

      // Should detect the spike in failure rate
      const rateAnomaly = anomalies.find(a => a.anomalyType === 'quality_failure_rate');
      expect(rateAnomaly).toBeDefined();
      expect(rateAnomaly!.severity).not.toBe('info');
    });

    it('should handle all-pass data (no anomalies)', () => {
      const now = new Date();
      const tests = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        testType: 'slump',
        status: 'pass',
        result: null,
        createdAt: new Date(now.getTime() - i * 24 * 60 * 60 * 1000),
      }));
      const anomalies = detectQualityAnomalies(tests, 30);
      // All pass → no failure rate anomaly
      const rateAnomalies = anomalies.filter(a => a.anomalyType === 'quality_failure_rate');
      expect(rateAnomalies).toEqual([]);
    });

    it('should detect daily failure spikes', () => {
      const now = new Date();
      // Normal: 1 failure per day for most days
      const tests: any[] = [];
      for (let day = 0; day < 20; day++) {
        const date = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);
        // 1 pass, 1 fail per day normally
        tests.push({ id: day * 3, testType: 'slump', status: 'pass', result: null, createdAt: date });
        tests.push({ id: day * 3 + 1, testType: 'slump', status: 'fail', result: null, createdAt: date });
      }
      // Spike day: 10 failures
      const spikeDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      for (let i = 0; i < 10; i++) {
        tests.push({ id: 100 + i, testType: 'slump', status: 'fail', result: null, createdAt: spikeDate });
      }

      const anomalies = detectQualityAnomalies(tests, 30);
      const spikes = anomalies.filter(a => a.anomalyType === 'quality_failure_spike');
      expect(spikes.length).toBeGreaterThan(0);
    });
  });

  // ─── Delivery Delay Detection ────────────────────────────────────────

  describe('Delivery Delay Detection', () => {
    it('should calculate delay minutes correctly', () => {
      const expected = new Date('2024-01-01T10:00:00Z');
      const actual = new Date('2024-01-01T11:30:00Z');
      expect(calculateDelayMinutes(expected, actual)).toBe(90);
    });

    it('should return null for missing times', () => {
      expect(calculateDelayMinutes(null, new Date())).toBeNull();
      expect(calculateDelayMinutes(new Date(), null)).toBeNull();
    });

    it('should handle on-time deliveries (no anomaly)', () => {
      // All deliveries within a tight range → no outliers
      const deliveries = Array.from({ length: 10 }, (_, i) => ({
        id: i,
        scheduledTime: new Date('2024-01-01T10:00:00Z'),
        estimatedArrival: new Date('2024-01-01T10:00:00Z'),
        actualDeliveryTime: new Date(`2024-01-01T10:0${i % 5}:00Z`), // 0-4 min delay
        status: 'delivered',
        projectName: 'Project A',
      }));

      const anomalies = detectDeliveryAnomalies(deliveries);
      const outliers = anomalies.filter(a => a.anomalyType === 'delivery_delay_outlier');
      // Tight range → no outliers
      expect(outliers).toEqual([]);
    });

    it('should flag delays outside IQR bounds as outliers', () => {
      // Normal deliveries: 5-15 min delay
      const deliveries = Array.from({ length: 20 }, (_, i) => {
        const delay = 5 + (i % 10); // 5-14 min delay
        return {
          id: i,
          scheduledTime: new Date('2024-01-01T10:00:00Z'),
          estimatedArrival: new Date('2024-01-01T10:00:00Z'),
          actualDeliveryTime: new Date(`2024-01-01T10:${String(delay).padStart(2, '0')}:00Z`),
          status: 'delivered',
          projectName: 'Project A',
        };
      });

      // Add one huge outlier: 180 min delay (3 hours)
      deliveries.push({
        id: 99,
        scheduledTime: new Date('2024-01-01T10:00:00Z'),
        estimatedArrival: new Date('2024-01-01T10:00:00Z'),
        actualDeliveryTime: new Date('2024-01-01T13:00:00Z'),
        status: 'delivered',
        projectName: 'Project B',
      });

      const anomalies = detectDeliveryAnomalies(deliveries);
      const outliers = anomalies.filter(a => a.anomalyType === 'delivery_delay_outlier');
      expect(outliers.length).toBeGreaterThan(0);
      expect(outliers.some(o => o.details.deliveryId === 99)).toBe(true);
    });

    it('should return empty for insufficient data', () => {
      const deliveries = [
        { id: 1, scheduledTime: new Date(), estimatedArrival: null, actualDeliveryTime: new Date(), status: 'delivered' },
      ];
      const anomalies = detectDeliveryAnomalies(deliveries);
      expect(anomalies).toEqual([]);
    });
  });

  // ─── Consumption Spike Detection ─────────────────────────────────────

  describe('Consumption Spike Detection', () => {
    it('should detect consumption spike >2σ above rolling mean', () => {
      const now = new Date();
      // Normal consumption: ~100 units/day for 14 days
      const consumptions: any[] = [];
      for (let day = 0; day < 14; day++) {
        consumptions.push({
          materialId: 1,
          materialName: 'Cement',
          quantityUsed: 100 + (day % 3) * 5, // 100-110 range
          date: new Date(now.getTime() - (14 - day) * 24 * 60 * 60 * 1000),
        });
      }
      // Add a massive spike: 500 units
      consumptions.push({
        materialId: 1,
        materialName: 'Cement',
        quantityUsed: 500,
        date: new Date(now.getTime() - 0 * 24 * 60 * 60 * 1000),
      });

      const anomalies = detectConsumptionAnomalies(consumptions, 7);
      const spikes = anomalies.filter(a => a.anomalyType === 'consumption_spike');
      expect(spikes.length).toBeGreaterThan(0);
      expect(spikes[0].details.materialName).toBe('Cement');
    });

    it('should not flag normal variation as anomaly', () => {
      const now = new Date();
      // Very consistent consumption: exactly 100 every day
      const consumptions = Array.from({ length: 15 }, (_, i) => ({
        materialId: 1,
        materialName: 'Sand',
        quantityUsed: 100,
        date: new Date(now.getTime() - (14 - i) * 24 * 60 * 60 * 1000),
      }));

      const anomalies = detectConsumptionAnomalies(consumptions, 7);
      // Constant consumption → std = 0 → z-score = 0 → no spikes
      expect(anomalies).toEqual([]);
    });

    it('should handle zero consumption days', () => {
      const now = new Date();
      const consumptions = Array.from({ length: 10 }, (_, i) => ({
        materialId: 1,
        materialName: 'Gravel',
        quantityUsed: 0,
        date: new Date(now.getTime() - (9 - i) * 24 * 60 * 60 * 1000),
      }));

      const anomalies = detectConsumptionAnomalies(consumptions, 7);
      // All zeros → no spikes
      expect(anomalies).toEqual([]);
    });

    it('should return empty for insufficient data', () => {
      const consumptions = [
        { materialId: 1, quantityUsed: 100, date: new Date() },
      ];
      const anomalies = detectConsumptionAnomalies(consumptions, 7);
      expect(anomalies).toEqual([]);
    });
  });

  // ─── Full Scan Aggregation ───────────────────────────────────────────

  describe('Full Scan Aggregation', () => {
    it('should aggregate results from all detectors', () => {
      const quality = [
        { anomalyType: 'quality_failure_rate', severity: 'critical' as const, message: 'test', score: 3.5, details: {}, detectedAt: new Date() },
      ];
      const delivery = [
        { anomalyType: 'delivery_delay_outlier', severity: 'warning' as const, message: 'test', score: 2.5, details: {}, detectedAt: new Date() },
      ];
      const consumption = [
        { anomalyType: 'consumption_spike', severity: 'info' as const, message: 'test', score: 1.5, details: {}, detectedAt: new Date() },
      ];

      const result = aggregateScanResults(quality, delivery, consumption);

      expect(result.summary.totalAnomalies).toBe(3);
      expect(result.summary.critical).toBe(1);
      expect(result.summary.warning).toBe(1);
      expect(result.summary.info).toBe(1);
      expect(result.quality).toHaveLength(1);
      expect(result.delivery).toHaveLength(1);
      expect(result.consumption).toHaveLength(1);
      expect(result.scannedAt).toBeInstanceOf(Date);
    });

    it('should handle empty results', () => {
      const result = aggregateScanResults([], [], []);
      expect(result.summary.totalAnomalies).toBe(0);
      expect(result.summary.critical).toBe(0);
    });
  });
});
