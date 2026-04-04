/**
 * Bulk Import Router
 * Handles CSV/Excel file uploads and batch data processing
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../../lib/trpc';
import { TRPCError } from '@trpc/server';
import {
  parseFile,
  validateRow,
  transformRow,
  batchProcess,
  ColumnSchema,
  ParsedRow,
} from '../../lib/fileParser';
import * as fs from 'fs';
import * as path from 'path';
import { getDb } from '../../db';
import { workHours, materials, documents } from '../../../drizzle/schema';

// Schema for work hours import
const WORK_HOURS_SCHEMA: ColumnSchema[] = [
  { name: 'employeeId', type: 'number', required: true },
  { name: 'date', type: 'date', required: true },
  { name: 'startTime', type: 'string', required: true },
  { name: 'endTime', type: 'string', required: false },
  { name: 'projectId', type: 'number', required: false },
  { name: 'workType', type: 'string', required: false },
  { name: 'notes', type: 'string', required: false },
];

// Schema for materials import
const MATERIALS_SCHEMA: ColumnSchema[] = [
  { name: 'name', type: 'string', required: true },
  { name: 'category', type: 'string', required: false },
  { name: 'unit', type: 'string', required: true },
  { name: 'quantity', type: 'number', required: false },
  { name: 'minStock', type: 'number', required: false },
  { name: 'supplier', type: 'string', required: false },
  { name: 'unitPrice', type: 'number', required: false },
];

// Schema for documents import
const DOCUMENTS_SCHEMA: ColumnSchema[] = [
  { name: 'name', type: 'string', required: true },
  { name: 'fileUrl', type: 'string', required: true },
  { name: 'fileKey', type: 'string', required: true },
  { name: 'category', type: 'string', required: false },
  { name: 'description', type: 'string', required: false },
  { name: 'projectId', type: 'number', required: false },
];

export const bulkImportRouter = router({
  /**
   * Upload and preview file
   */
  previewFile: protectedProcedure
    .input(
      z.object({
        filePath: z.string(),
        importType: z.enum(['work_hours', 'materials', 'documents']),
        sheetName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { filePath, importType, sheetName } = input;

        // Validate file exists
        if (!fs.existsSync(filePath)) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'File not found',
          });
        }

        // Parse file
        const parseResult = parseFile(filePath, sheetName);
        if (!parseResult.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: parseResult.error || 'Failed to parse file',
          });
        }

        // Get schema based on import type
        let schema: ColumnSchema[] = [];
        switch (importType) {
          case 'work_hours':
            schema = WORK_HOURS_SCHEMA;
            break;
          case 'materials':
            schema = MATERIALS_SCHEMA;
            break;
          case 'documents':
            schema = DOCUMENTS_SCHEMA;
            break;
        }

        // Validate first 5 rows
        const preview = parseResult.data!.slice(0, 5);
        const validationResults = preview.map((row, idx) => ({
          rowIndex: idx + 1,
          valid: validateRow(row, schema).valid,
          errors: validateRow(row, schema).errors,
        }));

        return {
          success: true,
          fileName: path.basename(filePath),
          totalRows: parseResult.rowCount,
          columns: parseResult.columns,
          preview: preview.slice(0, 3),
          validationResults,
          estimatedRecords: parseResult.rowCount,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Preview failed',
        });
      }
    }),

  /**
   * Import work hours from file
   */
  importWorkHours: protectedProcedure
    .input(
      z.object({
        filePath: z.string(),
        sheetName: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { filePath, sheetName } = input;
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database not available',
          });
        }

        // Parse file
        const parseResult = parseFile(filePath, sheetName);
        if (!parseResult.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: parseResult.error || 'Failed to parse file',
          });
        }

        const rows = parseResult.data!;
        let successCount = 0;
        const errors: Array<{ rowIndex: number; error: string }> = [];

        // Process rows
        await batchProcess(
          rows,
          async (row, index) => {
            // Validate
            const validation = validateRow(row, WORK_HOURS_SCHEMA);
            if (!validation.valid) {
              throw new Error(validation.errors.join('; '));
            }

            // Transform
            const transformed = transformRow(row, WORK_HOURS_SCHEMA);

            // Calculate hours worked
            let hoursWorked = null;
            let overtimeHours = 0;
            if (transformed.endTime) {
              const start = new Date(transformed.startTime as string);
              const end = new Date(transformed.endTime as string);
              const diffMs = end.getTime() - start.getTime();
              hoursWorked = Math.round(diffMs / (1000 * 60 * 60));

              if (hoursWorked > 8) {
                overtimeHours = hoursWorked - 8;
              }
            }

            // Insert
            const workType = (transformed.workType as string) || 'regular';
            const validWorkTypes = ['regular', 'overtime', 'weekend', 'holiday'];
            await db.insert(workHours).values({
              employeeId: transformed.employeeId as number,
              projectId: (transformed.projectId as number) || null,
              date: new Date(transformed.date as string),
              startTime: new Date(transformed.startTime as string),
              endTime: transformed.endTime ? new Date(transformed.endTime as string) : null,
              hoursWorked,
              overtimeHours,
              workType: (validWorkTypes.includes(workType) ? workType : 'regular') as any,
              notes: (transformed.notes as string) || null,
              status: 'pending',
            });

            successCount++;
            return { success: true };
          },
          {
            batchSize: 50,
            onError: (rowIndex, error) => {
              errors.push({ rowIndex: rowIndex + 2, error }); // +2 for header and 0-index
            },
          }
        );

        return {
          success: true,
          imported: successCount,
          failed: errors.length,
          total: rows.length,
          errors: errors.slice(0, 10), // Return first 10 errors
          message: `Successfully imported ${successCount} work hour records`,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Import failed',
        });
      }
    }),

  /**
   * Import materials from file
   */
  importMaterials: protectedProcedure
    .input(
      z.object({
        filePath: z.string(),
        sheetName: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { filePath, sheetName } = input;
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database not available',
          });
        }

        // Parse file
        const parseResult = parseFile(filePath, sheetName);
        if (!parseResult.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: parseResult.error || 'Failed to parse file',
          });
        }

        const rows = parseResult.data!;
        let successCount = 0;
        const errors: Array<{ rowIndex: number; error: string }> = [];

        // Process rows
        await batchProcess(
          rows,
          async (row, index) => {
            // Validate
            const validation = validateRow(row, MATERIALS_SCHEMA);
            if (!validation.valid) {
              throw new Error(validation.errors.join('; '));
            }

            // Transform
            const transformed = transformRow(row, MATERIALS_SCHEMA);

            // Insert
            const category = (transformed.category as string) || 'other';
            const validCategories = ['cement', 'aggregate', 'admixture', 'water', 'other'];
            await db.insert(materials).values({
              name: transformed.name as string,
              category: (validCategories.includes(category) ? category : 'other') as any,
              unit: transformed.unit as string,
              quantity: (transformed.quantity as number) || 0,
              minStock: (transformed.minStock as number) || 0,
              criticalThreshold: transformed.minStock
                ? Math.floor((transformed.minStock as number) * 0.5)
                : 0,
              supplier: (transformed.supplier as string) || null,
              unitPrice: (transformed.unitPrice as number) || null,
            });

            successCount++;
            return { success: true };
          },
          {
            batchSize: 50,
            onError: (rowIndex, error) => {
              errors.push({ rowIndex: rowIndex + 2, error });
            },
          }
        );

        return {
          success: true,
          imported: successCount,
          failed: errors.length,
          total: rows.length,
          errors: errors.slice(0, 10),
          message: `Successfully imported ${successCount} material records`,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Import failed',
        });
      }
    }),

  /**
   * Import documents from file
   */
  importDocuments: protectedProcedure
    .input(
      z.object({
        filePath: z.string(),
        sheetName: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { filePath, sheetName } = input;
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database not available',
          });
        }

        // Parse file
        const parseResult = parseFile(filePath, sheetName);
        if (!parseResult.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: parseResult.error || 'Failed to parse file',
          });
        }

        const rows = parseResult.data!;
        let successCount = 0;
        const errors: Array<{ rowIndex: number; error: string }> = [];

        // Process rows
        await batchProcess(
          rows,
          async (row, index) => {
            // Validate
            const validation = validateRow(row, DOCUMENTS_SCHEMA);
            if (!validation.valid) {
              throw new Error(validation.errors.join('; '));
            }

            // Transform
            const transformed = transformRow(row, DOCUMENTS_SCHEMA);

            // Insert
            const docCategory = (transformed.category as string) || 'other';
            const validDocCategories = ['contract', 'blueprint', 'report', 'certificate', 'invoice', 'other'];
            await db.insert(documents).values({
              name: transformed.name as string,
              description: (transformed.description as string) || null,
              fileKey: transformed.fileKey as string,
              fileUrl: transformed.fileUrl as string,
              category: (validDocCategories.includes(docCategory) ? docCategory : 'other') as any,
              projectId: (transformed.projectId as number) || null,
              uploadedBy: ctx.user.id,
            });

            successCount++;
            return { success: true };
          },
          {
            batchSize: 50,
            onError: (rowIndex, error) => {
              errors.push({ rowIndex: rowIndex + 2, error });
            },
          }
        );

        return {
          success: true,
          imported: successCount,
          failed: errors.length,
          total: rows.length,
          errors: errors.slice(0, 10),
          message: `Successfully imported ${successCount} document records`,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Import failed',
        });
      }
    }),
});
