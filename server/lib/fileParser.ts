/**
 * File Parser Utilities
 * Handles CSV and Excel file parsing for bulk imports
 */

import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { parse } from 'csv-parse/sync';

export interface ParsedRow {
  [key: string]: string | number | null;
}

export interface ParseResult {
  success: boolean;
  data?: ParsedRow[];
  error?: string;
  rowCount?: number;
  columns?: string[];
}

/**
 * Parse CSV file
 */
export function parseCSV(filePath: string): ParseResult {
  try {
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'File not found' };
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: (value: any, context: any) => {
        // Try to parse numbers
        if (value && !isNaN(Number(value)) && value.trim() !== '') {
          return Number(value);
        }
        // Return null for empty strings
        return value === '' ? null : value;
      },
    }) as ParsedRow[];

    if (records.length === 0) {
      return { success: false, error: 'CSV file is empty' };
    }

    const columns = Object.keys(records[0] || {});

    return {
      success: true,
      data: records,
      rowCount: records.length,
      columns,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse CSV',
    };
  }
}

/**
 * Parse Excel file
 */
export function parseExcel(filePath: string, sheetName?: string): ParseResult {
  try {
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'File not found' };
    }

    const workbook = XLSX.readFile(filePath);
    
    // Use provided sheet name or first sheet
    const sheet = sheetName 
      ? workbook.Sheets[sheetName]
      : workbook.Sheets[workbook.SheetNames[0]];

    if (!sheet) {
      return { 
        success: false, 
        error: `Sheet "${sheetName || workbook.SheetNames[0]}" not found` 
      };
    }

    const records = XLSX.utils.sheet_to_json(sheet, {
      defval: null,
      blankrows: false,
    }) as ParsedRow[];

    if (records.length === 0) {
      return { success: false, error: 'Excel sheet is empty' };
    }

    const columns = Object.keys(records[0] || {});

    return {
      success: true,
      data: records,
      rowCount: records.length,
      columns,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse Excel',
    };
  }
}

/**
 * Auto-detect and parse file based on extension
 */
export function parseFile(filePath: string, sheetName?: string): ParseResult {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.csv') {
    return parseCSV(filePath);
  } else if (['.xlsx', '.xls'].includes(ext)) {
    return parseExcel(filePath, sheetName);
  } else {
    return {
      success: false,
      error: `Unsupported file format: ${ext}. Supported: .csv, .xlsx, .xls`,
    };
  }
}

/**
 * Validate row against schema
 */
export interface ColumnSchema {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  required?: boolean;
  transform?: (value: any) => any;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateRow(
  row: ParsedRow,
  schema: ColumnSchema[]
): ValidationResult {
  const errors: string[] = [];

  for (const column of schema) {
    const value = row[column.name];

    // Check required
    if (column.required && (value === null || value === undefined || value === '')) {
      errors.push(`Missing required field: ${column.name}`);
      continue;
    }

    if (value === null || value === undefined || value === '') {
      continue;
    }

    // Type validation
    switch (column.type) {
      case 'number':
        if (isNaN(Number(value))) {
          errors.push(`${column.name} must be a number, got: ${value}`);
        }
        break;

      case 'date':
        const date = new Date(value as string);
        if (isNaN(date.getTime())) {
          errors.push(`${column.name} must be a valid date, got: ${value}`);
        }
        break;

      case 'boolean':
        if (!['true', 'false', '1', '0', 'yes', 'no'].includes(String(value).toLowerCase())) {
          errors.push(`${column.name} must be boolean, got: ${value}`);
        }
        break;

      case 'string':
        if (typeof value !== 'string' && typeof value !== 'number') {
          errors.push(`${column.name} must be a string, got: ${typeof value}`);
        }
        break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Transform row values according to schema
 */
export function transformRow(
  row: ParsedRow,
  schema: ColumnSchema[]
): ParsedRow {
  const transformed: ParsedRow = { ...row };

  for (const column of schema) {
    if (column.transform && transformed[column.name] !== null && transformed[column.name] !== undefined) {
      try {
        transformed[column.name] = column.transform(transformed[column.name]);
      } catch (error) {
        console.error(`Transform error for ${column.name}:`, error);
      }
    }
  }

  return transformed;
}

/**
 * Batch process rows with error handling
 */
export interface BatchProcessOptions {
  batchSize?: number;
  onProgress?: (processed: number, total: number) => void;
  onError?: (rowIndex: number, error: string) => void;
}

export async function batchProcess<T>(
  rows: ParsedRow[],
  processor: (row: ParsedRow, index: number) => Promise<T>,
  options: BatchProcessOptions = {}
): Promise<{
  successful: T[];
  failed: Array<{ rowIndex: number; error: string }>;
  total: number;
}> {
  const { batchSize = 100, onProgress, onError } = options;
  const successful: T[] = [];
  const failed: Array<{ rowIndex: number; error: string }> = [];

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, Math.min(i + batchSize, rows.length));

    const promises = batch.map(async (row, batchIndex) => {
      const rowIndex = i + batchIndex;
      try {
        const result = await processor(row, rowIndex);
        successful.push(result);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        failed.push({ rowIndex, error: errorMsg });
        onError?.(rowIndex, errorMsg);
      }

      onProgress?.(i + batchIndex + 1, rows.length);
    });

    await Promise.all(promises);
  }

  return {
    successful,
    failed,
    total: rows.length,
  };
}

/**
 * Generate sample CSV template
 */
export function generateCSVTemplate(columns: string[]): string {
  return columns.join(',') + '\n';
}

/**
 * Generate sample Excel template
 */
export function generateExcelTemplate(columns: string[]): Buffer {
  const worksheet = XLSX.utils.aoa_to_sheet([columns]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }) as Buffer;
}
