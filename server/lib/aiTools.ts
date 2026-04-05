import { logger } from './logger';
/**
 * AI Tools Framework
 * Provides agentic capabilities for AI assistant to interact with DMS data
 */

import { getDb } from '../db';
import { materials, deliveries, documents, qualityTests, forecastPredictions } from '../../drizzle/schema';
import { like, eq, and, gte, lte, desc } from 'drizzle-orm';
import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required: string[];
  };
  execute: (params: any, userId: number) => Promise<any>;
}

/**
 * Search materials inventory
 */
const searchMaterialsTool: Tool = {
  name: 'search_materials',
  description: 'Search materials inventory by name or check stock levels. Returns current stock, supplier info, and low stock warnings.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Material name to search for (e.g., "cement", "gravel")',
      },
      checkLowStock: {
        type: 'boolean',
        description: 'If true, returns only materials below minimum stock level',
      },
    },
    required: [],
  },
  execute: async (params, userId) => {
    const db = await getDb();
    if (!db) return { error: 'Database not available' };

    let query = db.select().from(materials);

    if (params.query) {
      query = query.where(like(materials.name, `%${params.query}%`)) as any;
    }

    const results = await query;

    if (params.checkLowStock) {
      return results.filter(m => m.quantity <= m.minStock);
    }

    return results.map(m => ({
      id: m.id,
      name: m.name,
      category: m.category,
      quantity: m.quantity,
      unit: m.unit,
      minStock: m.minStock,
      supplier: m.supplier,
      isLowStock: m.quantity <= m.minStock,
      isCritical: m.quantity <= m.criticalThreshold,
    }));
  },
};

/**
 * Get delivery status
 */
const getDeliveryStatusTool: Tool = {
  name: 'get_delivery_status',
  description: 'Get real-time delivery status, GPS location, and ETA. Can search by delivery ID, project name, or status.',
  parameters: {
    type: 'object',
    properties: {
      deliveryId: {
        type: 'number',
        description: 'Specific delivery ID to lookup',
      },
      projectName: {
        type: 'string',
        description: 'Project name to filter deliveries',
      },
      status: {
        type: 'string',
        description: 'Delivery status to filter',
        enum: ['scheduled', 'loaded', 'en_route', 'arrived', 'delivered', 'returning', 'completed'],
      },
    },
    required: [],
  },
  execute: async (params, userId) => {
    const db = await getDb();
    if (!db) return { error: 'Database not available' };

    const conditions = [];

    if (params.deliveryId) {
      conditions.push(eq(deliveries.id, params.deliveryId));
    }
    if (params.projectName) {
      conditions.push(like(deliveries.projectName, `%${params.projectName}%`));
    }
    if (params.status) {
      conditions.push(eq(deliveries.status, params.status));
    }

    const results = await db
      .select()
      .from(deliveries)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(deliveries.scheduledTime))
      .limit(10);

    return results.map(d => ({
      id: d.id,
      projectName: d.projectName,
      concreteType: d.concreteType,
      volume: d.volume,
      status: d.status,
      scheduledTime: d.scheduledTime,
      driverName: d.driverName,
      vehicleNumber: d.vehicleNumber,
      gpsLocation: d.gpsLocation,
      estimatedArrival: d.estimatedArrival,
      notes: d.notes,
    }));
  },
};

/**
 * Search documents
 */
const searchDocumentsTool: Tool = {
  name: 'search_documents',
  description: 'Search documents by name, category, or project. Returns document metadata and download URLs.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Document name to search for',
      },
      category: {
        type: 'string',
        description: 'Document category to filter',
        enum: ['contract', 'blueprint', 'report', 'certificate', 'invoice', 'other'],
      },
      projectId: {
        type: 'number',
        description: 'Project ID to filter documents',
      },
    },
    required: [],
  },
  execute: async (params, userId) => {
    const db = await getDb();
    if (!db) return { error: 'Database not available' };

    const conditions = [];

    if (params.query) {
      conditions.push(like(documents.name, `%${params.query}%`));
    }
    if (params.category) {
      conditions.push(eq(documents.category, params.category));
    }
    if (params.projectId) {
      conditions.push(eq(documents.projectId, params.projectId));
    }

    const results = await db
      .select()
      .from(documents)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(documents.createdAt))
      .limit(20);

    return results.map(d => ({
      id: d.id,
      name: d.name,
      description: d.description,
      category: d.category,
      fileUrl: d.fileUrl,
      mimeType: d.mimeType,
      fileSize: d.fileSize,
      createdAt: d.createdAt,
    }));
  },
};

/**
 * Get quality test results
 */
const getQualityTestsTool: Tool = {
  name: 'get_quality_tests',
  description: 'Retrieve quality control test results. Can filter by status, test type, or delivery.',
  parameters: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        description: 'Test status to filter',
        enum: ['pass', 'fail', 'pending'],
      },
      testType: {
        type: 'string',
        description: 'Type of test to filter',
        enum: ['slump', 'strength', 'air_content', 'temperature', 'other'],
      },
      deliveryId: {
        type: 'number',
        description: 'Delivery ID to get tests for',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default: 10)',
      },
    },
    required: [],
  },
  execute: async (params, userId) => {
    const db = await getDb();
    if (!db) return { error: 'Database not available' };

    const conditions = [];

    if (params.status) {
      conditions.push(eq(qualityTests.status, params.status));
    }
    if (params.testType) {
      conditions.push(eq(qualityTests.testType, params.testType));
    }
    if (params.deliveryId) {
      conditions.push(eq(qualityTests.deliveryId, params.deliveryId));
    }

    const results = await db
      .select()
      .from(qualityTests)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(qualityTests.createdAt))
      .limit(params.limit || 10);

    return results.map(t => ({
      id: t.id,
      testName: t.testName,
      testType: t.testType,
      result: t.result,
      unit: t.unit,
      status: t.status,
      testedBy: t.testedBy,
      complianceStandard: t.complianceStandard,
      notes: t.notes,
      createdAt: t.createdAt,
    }));
  },
};

/**
 * Generate inventory forecast
 */
const generateForecastTool: Tool = {
  name: 'generate_forecast',
  description: 'Generate inventory forecast predictions showing when materials will run out and recommended order quantities.',
  parameters: {
    type: 'object',
    properties: {
      materialId: {
        type: 'number',
        description: 'Specific material ID to forecast (optional, forecasts all if not provided)',
      },
    },
    required: [],
  },
  execute: async (params, userId) => {
    const db = await getDb();
    if (!db) return { error: 'Database not available' };

    let query = db
      .select()
      .from(forecastPredictions)
      .orderBy(forecastPredictions.daysUntilStockout);

    if (params.materialId) {
      query = query.where(eq(forecastPredictions.materialId, params.materialId)) as any;
    }

    const results = await query.limit(20);

    return results.map(f => ({
      materialId: f.materialId,
      materialName: f.materialName,
      currentStock: f.currentStock,
      dailyConsumptionRate: f.dailyConsumptionRate,
      daysUntilStockout: f.daysUntilStockout,
      predictedRunoutDate: f.predictedRunoutDate,
      recommendedOrderQty: f.recommendedOrderQty,
      confidence: f.confidence,
      status: f.daysUntilStockout && f.daysUntilStockout < 7 ? 'critical' :
        f.daysUntilStockout && f.daysUntilStockout < 14 ? 'warning' : 'ok',
    }));
  },
};

/**
 * Calculate statistics
 */
const calculateStatsTool: Tool = {
  name: 'calculate_stats',
  description: 'Calculate statistics and aggregations (total deliveries, average test results, etc.)',
  parameters: {
    type: 'object',
    properties: {
      metric: {
        type: 'string',
        description: 'Metric to calculate',
        enum: ['total_deliveries', 'total_concrete_volume', 'qc_pass_rate', 'active_projects'],
      },
      startDate: {
        type: 'string',
        description: 'Start date for filtering (ISO format)',
      },
      endDate: {
        type: 'string',
        description: 'End date for filtering (ISO format)',
      },
    },
    required: ['metric'],
  },
  execute: async (params, userId) => {
    const db = await getDb();
    if (!db) return { error: 'Database not available' };

    const { metric, startDate, endDate } = params;

    const dateConditions = [];
    if (startDate) {
      dateConditions.push(gte(deliveries.createdAt, new Date(startDate)));
    }
    if (endDate) {
      dateConditions.push(lte(deliveries.createdAt, new Date(endDate)));
    }

    switch (metric) {
      case 'total_deliveries': {
        const results = await db
          .select()
          .from(deliveries)
          .where(dateConditions.length > 0 ? and(...dateConditions) : undefined);
        return {
          metric: 'total_deliveries',
          value: results.length,
          period: { startDate, endDate },
        };
      }

      case 'total_concrete_volume': {
        const results = await db
          .select()
          .from(deliveries)
          .where(dateConditions.length > 0 ? and(...dateConditions) : undefined);
        const totalVolume = results.reduce((sum, d) => sum + (d.volume || 0), 0);
        return {
          metric: 'total_concrete_volume',
          value: totalVolume,
          unit: 'm³',
          period: { startDate, endDate },
        };
      }

      case 'qc_pass_rate': {
        const allTests = await db.select().from(qualityTests);
        const passedTests = allTests.filter(t => t.status === 'pass');
        const passRate = allTests.length > 0 ? (passedTests.length / allTests.length) * 100 : 0;
        return {
          metric: 'qc_pass_rate',
          value: Math.round(passRate * 10) / 10,
          unit: '%',
          totalTests: allTests.length,
          passedTests: passedTests.length,
        };
      }

      default:
        return { error: 'Unknown metric' };
    }
  },
};

/**
 * Log work hours for an employee
 */
const logWorkHoursTool: Tool = {
  name: 'log_work_hours',
  description: 'Log or record work hours for an employee. Use this to track employee working time, overtime, and project assignments.',
  parameters: {
    type: 'object',
    properties: {
      employeeId: {
        type: 'number',
        description: 'ID of the employee',
      },
      projectId: {
        type: 'number',
        description: 'ID of the project (optional)',
      },
      date: {
        type: 'string',
        description: 'Date of work in ISO format (YYYY-MM-DD)',
      },
      startTime: {
        type: 'string',
        description: 'Start time in ISO format',
      },
      endTime: {
        type: 'string',
        description: 'End time in ISO format (optional if ongoing)',
      },
      workType: {
        type: 'string',
        description: 'Type of work',
        enum: ['regular', 'overtime', 'weekend', 'holiday'],
      },
      notes: {
        type: 'string',
        description: 'Additional notes about the work',
      },
    },
    required: ['employeeId', 'date', 'startTime'],
  },
  execute: async (params, userId) => {
    const db = await getDb();
    if (!db) return { error: 'Database not available' };

    const { employeeId, projectId, date, startTime, endTime, workType, notes } = params;

    // Calculate hours worked if endTime is provided
    let hoursWorked = null;
    let overtimeHours = 0;
    if (endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const diffMs = end.getTime() - start.getTime();
      hoursWorked = Math.round(diffMs / (1000 * 60 * 60)); // Convert to hours

      // Calculate overtime (over 8 hours)
      if (hoursWorked > 8) {
        overtimeHours = hoursWorked - 8;
      }
    }

    const [result] = await db.insert(workHours).values({
      employeeId,
      projectId: projectId || null,
      date: new Date(date),
      startTime: Math.floor(new Date(startTime).getTime() / 1000),
      endTime: endTime ? Math.floor(new Date(endTime).getTime() / 1000) : null,
      hoursWorked,
      overtimeHours,
      workType: (workType as any) || 'regular',
      notes: notes || null,
      status: 'pending',
    }).returning();

    return {
      success: true,
      workHourId: result.id,
      hoursWorked,
      overtimeHours,
      message: 'Work hours logged successfully',
    };
  },
};

/**
 * Get work hours summary
 */
const getWorkHoursSummaryTool: Tool = {
  name: 'get_work_hours_summary',
  description: 'Get summary of work hours for an employee or project. Returns total hours, overtime, and breakdown by work type.',
  parameters: {
    type: 'object',
    properties: {
      employeeId: {
        type: 'number',
        description: 'Filter by employee ID',
      },
      projectId: {
        type: 'number',
        description: 'Filter by project ID',
      },
      startDate: {
        type: 'string',
        description: 'Start date for summary (YYYY-MM-DD)',
      },
      endDate: {
        type: 'string',
        description: 'End date for summary (YYYY-MM-DD)',
      },
      status: {
        type: 'string',
        description: 'Filter by approval status',
        enum: ['pending', 'approved', 'rejected'],
      },
    },
    required: [],
  },
  execute: async (params, userId) => {
    const db = await getDb();
    if (!db) return { error: 'Database not available' };

    const { employeeId, projectId, startDate, endDate, status } = params;

    let query = db.select().from(workHours);

    const conditions = [];
    if (employeeId) conditions.push(eq(workHours.employeeId, employeeId));
    if (projectId) conditions.push(eq(workHours.projectId, projectId));
    if (status) conditions.push(eq(workHours.status, status));
    if (startDate) conditions.push(gte(workHours.date, new Date(startDate)));
    if (endDate) conditions.push(lte(workHours.date, new Date(endDate)));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query;

    // Calculate summary
    const totalHours = results.reduce((sum, r) => sum + (r.hoursWorked || 0), 0);
    const totalOvertime = results.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);
    const byWorkType = results.reduce((acc, r) => {
      acc[r.workType] = (acc[r.workType] || 0) + (r.hoursWorked || 0);
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEntries: results.length,
      totalHours,
      totalOvertime,
      regularHours: totalHours - totalOvertime,
      byWorkType,
      entries: results.slice(0, 10), // Return first 10 entries
    };
  },
};

/**
 * Log machine work hours
 */
const logMachineHoursTool: Tool = {
  name: 'log_machine_hours',
  description: 'Log work hours for machinery/equipment. Track equipment usage, operator, and project assignment.',
  parameters: {
    type: 'object',
    properties: {
      machineId: {
        type: 'number',
        description: 'ID of the machine/equipment',
      },
      projectId: {
        type: 'number',
        description: 'ID of the project (optional)',
      },
      date: {
        type: 'string',
        description: 'Date of operation (YYYY-MM-DD)',
      },
      startTime: {
        type: 'string',
        description: 'Start time in ISO format',
      },
      endTime: {
        type: 'string',
        description: 'End time in ISO format (optional)',
      },
      operatorId: {
        type: 'number',
        description: 'ID of the operator/employee',
      },
      operatorName: {
        type: 'string',
        description: 'Name of the operator',
      },
      notes: {
        type: 'string',
        description: 'Notes about machine operation',
      },
    },
    required: ['machineId', 'date', 'startTime'],
  },
  execute: async (params, userId) => {
    const db = await getDb();
    if (!db) return { error: 'Database not available' };

    const { machineId, projectId, date, startTime, endTime, operatorId, operatorName, notes } = params;

    // Calculate hours if endTime provided
    let hoursWorked = null;
    if (endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const diffMs = end.getTime() - start.getTime();
      hoursWorked = Math.round(diffMs / (1000 * 60 * 60));
    }

    const [result] = await db.insert(machineWorkHours).values({
      machineId,
      projectId: projectId || null,
      date: new Date(date),
      startTime: Math.floor(new Date(startTime).getTime() / 1000),
      endTime: endTime ? Math.floor(new Date(endTime).getTime() / 1000) : null,
      hoursWorked,
      operatorId: operatorId || null,
      operatorName: operatorName || null,
      notes: notes || null,
    }).returning();

    return {
      success: true,
      machineWorkHourId: result.id,
      hoursWorked,
      message: 'Machine hours logged successfully',
    };
  },
};

/**
 * Update document metadata
 */
const updateDocumentTool: Tool = {
  name: 'update_document',
  description: 'Update document metadata such as name, description, category, or project assignment.',
  parameters: {
    type: 'object',
    properties: {
      documentId: {
        type: 'number',
        description: 'ID of the document to update',
      },
      name: {
        type: 'string',
        description: 'New document name',
      },
      description: {
        type: 'string',
        description: 'New description',
      },
      category: {
        type: 'string',
        description: 'Document category',
        enum: ['contract', 'blueprint', 'report', 'certificate', 'invoice', 'other'],
      },
      projectId: {
        type: 'number',
        description: 'Assign to project ID',
      },
    },
    required: ['documentId'],
  },
  execute: async (params, userId) => {
    const db = await getDb();
    if (!db) return { error: 'Database not available' };

    const { documentId, name, description, category, projectId } = params;

    // Build update object with only provided fields
    const updates: any = { updatedAt: new Date() };
    if (name) updates.name = name;
    if (description) updates.description = description;
    if (category) updates.category = category as any;
    if (projectId !== undefined) updates.projectId = projectId;

    await db
      .update(documents)
      .set(updates)
      .where(eq(documents.id, documentId));

    return {
      success: true,
      documentId,
      updated: Object.keys(updates).filter(k => k !== 'updatedAt'),
      message: 'Document updated successfully',
    };
  },
};

/**
 * Delete document
 */
const deleteDocumentTool: Tool = {
  name: 'delete_document',
  description: 'Delete a document from the system. This permanently removes the document record.',
  parameters: {
    type: 'object',
    properties: {
      documentId: {
        type: 'number',
        description: 'ID of the document to delete',
      },
    },
    required: ['documentId'],
  },
  execute: async (params, userId) => {
    const db = await getDb();
    if (!db) return { error: 'Database not available' };

    const { documentId } = params;

    await db.delete(documents).where(eq(documents.id, documentId));

    return {
      success: true,
      documentId,
      message: 'Document deleted successfully',
    };
  },
};

/**
 * Create material entry
 */
const createMaterialTool: Tool = {
  name: 'create_material',
  description: 'Add a new material to inventory. Use this to register new materials for tracking.',
  parameters: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Material name',
      },
      category: {
        type: 'string',
        description: 'Material category',
        enum: ['cement', 'aggregate', 'admixture', 'water', 'other'],
      },
      unit: {
        type: 'string',
        description: 'Unit of measurement (kg, m³, L, etc.)',
      },
      quantity: {
        type: 'number',
        description: 'Initial quantity',
      },
      minStock: {
        type: 'number',
        description: 'Minimum stock level for alerts',
      },
      supplier: {
        type: 'string',
        description: 'Supplier name',
      },
      unitPrice: {
        type: 'number',
        description: 'Price per unit',
      },
    },
    required: ['name', 'unit'],
  },
  execute: async (params, userId) => {
    const db = await getDb();
    if (!db) return { error: 'Database not available' };

    const { name, category, unit, quantity, minStock, supplier, unitPrice } = params;

    const [result] = await db.insert(materials).values({
      name,
      category: (category as any) || 'other',
      unit,
      quantity: quantity || 0,
      minStock: minStock || 0,
      criticalThreshold: minStock ? Math.floor(minStock * 0.5) : 0,
      supplier: supplier || null,
      unitPrice: unitPrice || null,
    }).returning();

    return {
      success: true,
      materialId: result.id,
      message: `Material "${name}" created successfully`,
    };
  },
};

/**
 * Update material quantity
 */
const updateMaterialQuantityTool: Tool = {
  name: 'update_material_quantity',
  description: 'Update the quantity of a material in inventory. Use for stock adjustments, additions, or consumption.',
  parameters: {
    type: 'object',
    properties: {
      materialId: {
        type: 'number',
        description: 'ID of the material',
      },
      quantity: {
        type: 'number',
        description: 'New quantity value',
      },
      adjustment: {
        type: 'number',
        description: 'Amount to add (positive) or subtract (negative) from current quantity',
      },
    },
    required: ['materialId'],
  },
  execute: async (params, userId) => {
    const db = await getDb();
    if (!db) return { error: 'Database not available' };

    const { materialId, quantity, adjustment } = params;

    if (quantity !== undefined) {
      // Set absolute quantity
      await db
        .update(materials)
        .set({ quantity, updatedAt: new Date() })
        .where(eq(materials.id, materialId));

      return {
        success: true,
        materialId,
        newQuantity: quantity,
        message: 'Material quantity updated',
      };
    } else if (adjustment !== undefined) {
      // Adjust by amount
      const [material] = await db
        .select()
        .from(materials)
        .where(eq(materials.id, materialId));

      if (!material) {
        return { error: 'Material not found' };
      }

      const newQuantity = material.quantity + adjustment;

      await db
        .update(materials)
        .set({ quantity: newQuantity, updatedAt: new Date() })
        .where(eq(materials.id, materialId));

      return {
        success: true,
        materialId,
        previousQuantity: material.quantity,
        adjustment,
        newQuantity,
        message: `Material quantity ${adjustment > 0 ? 'increased' : 'decreased'} by ${Math.abs(adjustment)}`,
      };
    }

    return { error: 'Either quantity or adjustment must be provided' };
  },
};

// Import work hours and machine work hours from schema
import { workHours, machineWorkHours } from '../../drizzle/schema';

const bulkImportTool: Tool = {
  name: 'bulk_import_data',
  description: 'Import bulk data from CSV or Excel files for work hours, materials, or documents.',
  parameters: {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: 'Path to the CSV or Excel file to import',
      },
      importType: {
        type: 'string',
        enum: ['work_hours', 'materials', 'documents'],
        description: 'Type of data to import',
      },
      sheetName: {
        type: 'string',
        description: 'Sheet name for Excel files (optional)',
      },
    },
    required: ['filePath', 'importType'],
  },
  execute: async (params, userId) => {
    const { filePath, importType } = params;
    if (!filePath || !importType) {
      return { error: 'filePath and importType are required' };
    }
    return {
      success: true,
      message: 'Use bulkImport procedures to complete the import',
    };
  },
};

/**
 * Detect anomalies across quality, delivery, and consumption data
 */
const detectAnomaliesTool: Tool = {
  name: 'detect_anomalies',
  description: 'Scan for anomalies across quality tests, deliveries, and material consumption. Returns detected issues like failure rate spikes, delivery delays, and consumption surges.',
  parameters: {
    type: 'object',
    properties: {
      scanType: {
        type: 'string',
        enum: ['all', 'quality', 'delivery', 'consumption'],
        description: 'Type of anomaly scan to run (default: all)',
      },
      windowDays: {
        type: 'string',
        description: 'Number of days to analyze (default: 30)',
      },
    },
    required: [],
  },
  execute: async (params, _userId) => {
    const { detectQualityAnomalies, detectDeliveryAnomalies, detectConsumptionAnomalies, aggregateScanResults } = await import('./anomalyDetection');
    const db = await getDb();
    const windowDays = parseInt(params.windowDays) || 30;
    const scanType = params.scanType || 'all';

    const results: any = {};

    if (scanType === 'all' || scanType === 'quality') {
      const allTests = await db.select().from(qualityTests);
      const testData = allTests.map(t => ({
        id: t.id,
        testType: t.testType || 'other',
        status: t.status,
        result: t.result || null,
        createdAt: t.createdAt,
        deliveryId: t.deliveryId || null,
      }));
      results.quality = detectQualityAnomalies(testData, windowDays);
    }

    if (scanType === 'all' || scanType === 'delivery') {
      const allDeliveries = await db.select().from(deliveries);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - windowDays);
      const completed = allDeliveries.filter(d =>
        new Date(d.createdAt) >= cutoff && (d.status === 'delivered' || d.status === 'completed')
      );
      const deliveryData = completed.map(d => ({
        id: d.id,
        scheduledTime: d.scheduledTime,
        estimatedArrival: (d as any).estimatedArrival || null,
        actualDeliveryTime: d.actualDeliveryTime || null,
        driverName: d.driverName || null,
        vehicleNumber: d.vehicleNumber || null,
        projectName: (d as any).projectName || null,
        status: d.status,
      }));
      results.delivery = detectDeliveryAnomalies(deliveryData);
    }

    if (scanType === 'all' || scanType === 'consumption') {
      const { materialConsumptionHistory } = await import('../../drizzle/schema');
      const allConsumptions = await db.select().from(materialConsumptionHistory);
      const allMaterials = await db.select().from(materials);
      const materialMap = new Map(allMaterials.map(m => [m.id, m.name]));
      const consumptionData = allConsumptions.map(c => ({
        materialId: c.materialId,
        materialName: materialMap.get(c.materialId) || `Material #${c.materialId}`,
        quantityUsed: c.quantityUsed,
        date: c.date,
      }));
      results.consumption = detectConsumptionAnomalies(consumptionData, 7);
    }

    if (scanType === 'all') {
      return aggregateScanResults(
        results.quality || [],
        results.delivery || [],
        results.consumption || []
      );
    }

    const anomalies = results[scanType] || [];
    return {
      anomalies,
      totalAnomalies: anomalies.length,
      critical: anomalies.filter((a: any) => a.severity === 'critical').length,
      warning: anomalies.filter((a: any) => a.severity === 'warning').length,
      info: anomalies.filter((a: any) => a.severity === 'info').length,
    };
  },
};

/**
 * Detect sensor data anomalies using ML service
 */
const sensorAnomalyTool: Tool = {
  name: 'detect_sensor_anomalies',
  description: 'Detect anomalies in sensor data using machine learning algorithms. Analyzes time series data to identify unusual patterns or outliers.',
  parameters: {
    type: 'object',
    properties: {
      sensorId: {
        type: 'string',
        description: 'ID of the sensor to analyze',
      },
      contamination: {
        type: 'number',
        description: 'Expected proportion of anomalies in the data (0.01 to 0.5, default 0.1)',
        minimum: 0.01,
        maximum: 0.5,
      },
    },
    required: ['sensorId'],
  },
  execute: async (params, _userId) => {
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/api/anomalies/detect`, {
        sensor_id: params.sensorId,
        contamination: params.contamination || 0.1,
      });

      return {
        success: true,
        anomalies: response.data.anomalies,
        totalAnomalies: response.data.anomalies.length,
        message: response.data.message,
      };
    } catch (error: any) {
      logger.error({ err: error }, "Sensor anomaly detection error:");
      return {
        success: false,
        error: error.message || "Failed to detect sensor anomalies",
      };
    }
  },
};

/**
 * Query documents using RAG (Retrieval-Augmented Generation)
 */
const ragQueryTool: Tool = {
  name: 'query_rag',
  description: 'Query documents using RAG to retrieve relevant information. Searches through indexed documents and returns contextually relevant results.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query to find relevant documents',
      },
      k: {
        type: 'number',
        description: 'Number of results to return (1-10, default 3)',
        minimum: 1,
        maximum: 10,
      },
    },
    required: ['query'],
  },
  execute: async (params, _userId) => {
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/api/rag/query`, {
        query: params.query,
        k: params.k || 3,
      });

      return {
        success: true,
        results: response.data.results,
        totalResults: response.data.results.length,
      };
    } catch (error: any) {
      logger.error({ err: error }, "RAG query error:");
      return {
        success: false,
        error: error.message || "Failed to query RAG service",
      };
    }
  },
};

// Export all tools
export const AI_TOOLS: Tool[] = [
  // Read-only tools
  searchMaterialsTool,
  getDeliveryStatusTool,
  searchDocumentsTool,
  getQualityTestsTool,
  generateForecastTool,
  calculateStatsTool,
  // Data manipulation tools
  logWorkHoursTool,
  getWorkHoursSummaryTool,
  logMachineHoursTool,
  updateDocumentTool,
  deleteDocumentTool,
  createMaterialTool,
  updateMaterialQuantityTool,
  // Bulk import tool
  bulkImportTool,
  // Anomaly detection
  detectAnomaliesTool,
  sensorAnomalyTool,
  ragQueryTool,
];

/**
 * Execute a tool by name
 */
export async function executeTool(
  toolName: string,
  parameters: any,
  userId: number
): Promise<any> {
  const tool = AI_TOOLS.find(t => t.name === toolName);

  if (!tool) {
    throw new Error(`Tool not found: ${toolName}`);
  }

  try {
    const result = await tool.execute(parameters, userId);
    return {
      success: true,
      toolName,
      parameters,
      result,
    };
  } catch (error) {
    logger.error({ err: error }, `Tool execution failed for ${toolName}:`);
    return {
      success: false,
      toolName,
      parameters,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get tool definitions for AI model
 */
export function getToolDefinitions(): any[] {
  return AI_TOOLS.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}
