import { eq, desc, like, and, or, gte, lt, sql } from "drizzle-orm";
import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as postgresModule from "postgres";
// @ts-ignore
const postgresDefault = (postgresModule as any).default || postgresModule;
import {
  InsertUser, users,
  documents, InsertDocument,
  projects, InsertProject,
  materials, InsertMaterial,
  deliveries, InsertDelivery,
  qualityTests, InsertQualityTest,
  employees, InsertEmployee,
  workHours, InsertWorkHour,
  concreteBases, InsertConcreteBase,
  machines, InsertMachine,
  machineMaintenance, InsertMachineMaintenance,
  machineWorkHours, InsertMachineWorkHour,
  aggregateInputs, InsertAggregateInput,
  materialConsumptionHistory, InsertMaterialConsumptionHistory,
  purchaseOrders, InsertPurchaseOrder,
  purchaseOrderItems, InsertPurchaseOrderItem,
  forecastPredictions, InsertForecastPrediction,
  aiConversations,
  aiMessages,
  aiModels,
  reportSettings,
  reportRecipients,
  emailBranding,
  emailTemplates,
  notificationTemplates,
  notificationTriggers,
  triggerExecutionLog,
  suppliers, InsertSupplier,
  deliveryStatusHistory, InsertDeliveryStatusHistory,
  timesheetUploadHistory, InsertTimesheetUploadHistory,
} from "../../drizzle/schema";
import * as schema from "../../drizzle/schema";
import * as relations from "../../drizzle/relations";
import { ENV } from '../lib/env';
import { dbLogger } from "../lib/logger";

const combinedSchema = { ...schema, ...relations };

import { withReplicas } from "drizzle-orm/pg-core";

let _db: PostgresJsDatabase<typeof combinedSchema> | null = null;
let _client: any = null;
let _replicaClients: any[] = [];

export interface SelectBuilder {
  from(table: any): {
    where: (condition: any) => {
      limit: (n: number) => Promise<any[]>;
      orderBy: (order: any) => Promise<any[]>;
    };
    orderBy: (order: any) => Promise<any[]>;
    limit: (n: number) => Promise<any[]>;
    execute: () => Promise<any[]>;
    then: (onfulfilled: any) => Promise<any>;
  };
}

export interface InsertBuilder {
  values(values: any): {
    onConflictDoUpdate: (config: any) => Promise<any[]>;
    returning: () => Promise<any[]>;
  };
}

export interface UpdateBuilder {
  set(values: any): {
    where: (condition: any) => Promise<void>;
  };
}

export interface DeleteBuilder {
  where: (condition: any) => Promise<void>;
}

export interface IDbOperations {
  select(): SelectBuilder;
  insert(table: any): InsertBuilder;
  update(table: any): UpdateBuilder;
  delete(table: any): DeleteBuilder;
  transaction<T>(cb: (tx: IDbOperations) => Promise<T>): Promise<T>;
}

// Mock DB implementation for testing in restricted environments
const mockData: Record<string, any[]> = {
  users: [],
  projects: [],
  materials: [],
  deliveries: [],
  quality_tests: [],
  documents: [],
  employees: [],
  work_hours: [],
  concrete_bases: [],
  machines: [],
  aggregate_inputs: [],
  timesheetUploadHistory: [],
};

const getTableName = (table: any): string => {
  return table?._?.name || table?.name || "unknown";
};

let _idCounter = 1;
const generateId = () => _idCounter++;

class MockDb implements IDbOperations {
  transaction<T>(cb: (tx: IDbOperations) => Promise<T>): Promise<T> {
    return cb(this);
  }

  select(): SelectBuilder {
    return {
      from: (table: any) => {
        const tableName = getTableName(table);
        const data = mockData[tableName] || [];
        return {
          where: (condition: any) => ({
            limit: (n: number) => Promise.resolve(data.slice(0, n)),
            orderBy: (order: any) => Promise.resolve([...data]),
          }),
          orderBy: (order: any) => Promise.resolve([...data]),
          limit: (n: number) => Promise.resolve(data.slice(0, n)),
          execute: () => Promise.resolve([...data]),
          then: (onfulfilled: any) => Promise.resolve([...data]).then(onfulfilled),
        };
      },
    };
  }

  insert(table: any): InsertBuilder {
    return {
      values: (values: any) => ({
        onConflictDoUpdate: (config: any) => {
          const tableName = getTableName(table);
          if (!mockData[tableName]) mockData[tableName] = [];
          const result = { id: generateId(), ...values };
          mockData[tableName].push(result);
          return Promise.resolve([result]);
        },
        returning: () => {
          const tableName = getTableName(table);
          if (!mockData[tableName]) mockData[tableName] = [];

          // Schema constraint enforcement
          const columns = table?._?.columns || {};
          for (const [colName, colDef] of Object.entries(columns)) {
            const c = colDef as any;
            if (c.notNull && !c.hasDefault && values[c.name] === undefined) {
               return Promise.reject(new Error(`null value in column "${c.name}" of relation "${tableName}" violates not-null constraint`));
            }
            if (c.isUnique) {
               const existing = mockData[tableName].find(row => row[c.name] === values[c.name]);
               if (existing) {
                  return Promise.reject(new Error(`duplicate key value violates unique constraint on column "${c.name}"`));
               }
            }
          }

          const result = { id: generateId(), ...values };
          mockData[tableName].push(result);
          return Promise.resolve([result]);
        },
      }),
    };
  }

  update(table: any): UpdateBuilder {
    return {
      set: (values: any) => ({
        where: (condition: any) => Promise.resolve(),
      }),
    };
  }

  delete(table: any): DeleteBuilder {
    return {
      where: (condition: any) => Promise.resolve(),
    };
  }
}

const mockDb = new MockDb();

export async function getDb(): Promise<PostgresJsDatabase<typeof combinedSchema> | any> {
  const useMocks = process.env.DMS_USE_MOCKS === "true";
  if (useMocks) {
    return mockDb;
  }

  const connectionString = ENV.databaseUrl;
  const replicaUrls = ENV.databaseReplicaUrls;

  if (!_db && connectionString) {
    try {
      dbLogger.info("[DEBUG] Attempting to connect to database...");
      _client = postgresDefault(connectionString);
      const primaryDb = drizzle(_client, { schema: combinedSchema });
      
      if (replicaUrls && replicaUrls.length > 0) {
        dbLogger.info(`[DEBUG] Configuring ${replicaUrls.length} read replicas...`);
        const readReplicas = replicaUrls.map(url => {
          const client = postgresDefault(url);
          _replicaClients.push(client);
          return drizzle(client, { schema: combinedSchema });
        });
        
        const [first, ...rest] = readReplicas;
        _db = withReplicas(primaryDb, [first, ...rest]);
      } else {
        _db = primaryDb;
      }
      
      dbLogger.info("[DEBUG] Database connection initialized successfully.");
    } catch (error) {
      dbLogger.warn({ err: error }, "[Database] Failed to connect");
      _db = null;
    }
  } else if (!_db) {
    dbLogger.info("[DEBUG] _db is null and connectionString is empty.");
  }

  return _db;
}