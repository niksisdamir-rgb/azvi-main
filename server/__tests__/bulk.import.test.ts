/**
 * Bulk Import Tests
 * Tests for CSV/Excel file parsing and batch data import
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parseCSV, parseExcel, parseFile, validateRow, transformRow, batchProcess } from '../lib/fileParser';
import { appRouter } from '../routers';
import { getDb } from '../db';

const testDir = path.join(process.cwd(), 'test-imports');

describe('File Parser', () => {
  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  describe('CSV Parsing', () => {
    it('should parse valid CSV file', () => {
      const csvPath = path.join(testDir, 'test.csv');
      const csvContent = 'name,quantity,price\nCement,100,50\nGravel,200,30';
      fs.writeFileSync(csvPath, csvContent);

      const result = parseCSV(csvPath);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.columns).toEqual(['name', 'quantity', 'price']);
      expect(result.data![0].name).toBe('Cement');
      expect(result.data![0].quantity).toBe(100);

      fs.unlinkSync(csvPath);
    });

    it('should handle empty CSV file', () => {
      const csvPath = path.join(testDir, 'empty.csv');
      fs.writeFileSync(csvPath, '');

      const result = parseCSV(csvPath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('empty');

      fs.unlinkSync(csvPath);
    });

    it('should handle missing file', () => {
      const result = parseCSV('/nonexistent/file.csv');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should parse CSV with empty values', () => {
      const csvPath = path.join(testDir, 'with-empty.csv');
      const csvContent = 'name,quantity,notes\nCement,100,\nGravel,,Important';
      fs.writeFileSync(csvPath, csvContent);

      const result = parseCSV(csvPath);

      expect(result.success).toBe(true);
      expect(result.data![0].notes).toBeNull();
      expect(result.data![1].quantity).toBeNull();

      fs.unlinkSync(csvPath);
    });
  });

  describe('Excel Parsing', () => {
    it('should parse valid Excel file', () => {
      const excelPath = path.join(testDir, 'test.xlsx');
      const XLSX = require('xlsx');
      const ws = XLSX.utils.aoa_to_sheet([
        ['name', 'quantity', 'price'],
        ['Cement', 100, 50],
        ['Gravel', 200, 30],
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      XLSX.writeFile(wb, excelPath);

      const result = parseExcel(excelPath);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.columns).toEqual(['name', 'quantity', 'price']);

      fs.unlinkSync(excelPath);
    });

    it('should handle Excel with multiple sheets', () => {
      const excelPath = path.join(testDir, 'multi-sheet.xlsx');
      const XLSX = require('xlsx');
      const ws1 = XLSX.utils.aoa_to_sheet([['name', 'qty'], ['Item1', 10]]);
      const ws2 = XLSX.utils.aoa_to_sheet([['name', 'qty'], ['Item2', 20]]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws1, 'Sheet1');
      XLSX.utils.book_append_sheet(wb, ws2, 'Sheet2');
      XLSX.writeFile(wb, excelPath);

      const result = parseExcel(excelPath, 'Sheet2');

      expect(result.success).toBe(true);
      expect(result.data![0].name).toBe('Item2');

      fs.unlinkSync(excelPath);
    });
  });

  describe('Auto-detect File Type', () => {
    it('should detect and parse CSV', () => {
      const csvPath = path.join(testDir, 'auto.csv');
      fs.writeFileSync(csvPath, 'name,qty\nTest,100');

      const result = parseFile(csvPath);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);

      fs.unlinkSync(csvPath);
    });

    it('should detect and parse Excel', () => {
      const excelPath = path.join(testDir, 'auto.xlsx');
      const XLSX = require('xlsx');
      const ws = XLSX.utils.aoa_to_sheet([['name', 'qty'], ['Test', 100]]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      XLSX.writeFile(wb, excelPath);

      const result = parseFile(excelPath);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);

      fs.unlinkSync(excelPath);
    });

    it('should reject unsupported file types', () => {
      const result = parseFile('/path/to/file.txt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported');
    });
  });

  describe('Row Validation', () => {
    const schema = [
      { name: 'name', type: 'string' as const, required: true },
      { name: 'quantity', type: 'number' as const, required: true },
      { name: 'price', type: 'number' as const, required: false },
    ];

    it('should validate valid row', () => {
      const row = { name: 'Cement', quantity: 100, price: 50 };
      const result = validateRow(row, schema);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const row = { quantity: 100 };
      const result = validateRow(row, schema);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('name');
    });

    it('should validate number type', () => {
      const row = { name: 'Cement', quantity: 'not-a-number' };
      const result = validateRow(row, schema);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('number');
    });

    it('should allow optional fields to be empty', () => {
      const row = { name: 'Cement', quantity: 100 };
      const result = validateRow(row, schema);

      expect(result.valid).toBe(true);
    });
  });

  describe('Row Transformation', () => {
    it('should transform row values', () => {
      const schema = [
        {
          name: 'quantity',
          type: 'number' as const,
          transform: (v: any) => Math.round(Number(v) * 1.1),
        },
      ];
      const row = { quantity: 100 };
      const result = transformRow(row, schema);

      expect(result.quantity).toBe(110);
    });

    it('should handle transform errors gracefully', () => {
      const schema = [
        {
          name: 'value',
          type: 'string' as const,
          transform: () => {
            throw new Error('Transform failed');
          },
        },
      ];
      const row = { value: 'test' };
      const result = transformRow(row, schema);

      expect(result.value).toBe('test'); // Original value preserved
    });
  });

  describe('Batch Processing', () => {
    it('should process rows in batches', async () => {
      const rows = Array.from({ length: 150 }, (_, i) => ({ id: i + 1 }));
      const processed: any[] = [];

      const result = await batchProcess(rows, async (row) => {
        processed.push(row);
        return row;
      }, { batchSize: 50 });

      expect(result.successful).toHaveLength(150);
      expect(result.failed).toHaveLength(0);
      expect(result.total).toBe(150);
    });

    it('should handle processing errors', async () => {
      const rows = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const errors: Array<{ rowIndex: number; error: string }> = [];

      const result = await batchProcess(
        rows,
        async (row, index) => {
          if (index === 1) throw new Error('Processing failed');
          return row;
        },
        {
          onError: (rowIndex, error) => errors.push({ rowIndex, error }),
        }
      );

      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(1);
      expect(errors).toHaveLength(1);
    });

    it('should track progress', async () => {
      const rows = Array.from({ length: 10 }, (_, i) => ({ id: i }));
      const progressUpdates: Array<[number, number]> = [];

      await batchProcess(rows, async (row) => row, {
        batchSize: 3,
        onProgress: (processed, total) => {
          progressUpdates.push([processed, total]);
        },
      });

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1][0]).toBe(10);
    });
  });
});

// Bulk Import Procedures tests are integration tests and require proper setup
// File parser tests above cover the core functionality
