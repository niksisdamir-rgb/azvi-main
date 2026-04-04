import { eq, desc, like, and, or, gte, lt, sql } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { getDb } from "./setup";

// Quality Tests
export async function createQualityTest(test: schema.InsertQualityTest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(schema.qualityTests).values(test).returning();
  return result;
}

export async function getQualityTests(filters?: { projectId?: number; deliveryId?: number; testType?: string; status?: string; startDate?: Date; endDate?: Date }) {
  const db = await getDb();
  if (!db) return [];

  let conditions: any[] = [];

  if (filters?.projectId) {
    conditions.push(eq(schema.qualityTests.projectId, filters.projectId));
  }

  if (filters?.deliveryId) {
    conditions.push(eq(schema.qualityTests.deliveryId, filters.deliveryId));
  }

  if (filters?.testType) {
    conditions.push(eq(schema.qualityTests.testType, filters.testType as any));
  }

  if (filters?.status) {
    conditions.push(eq(schema.qualityTests.status, filters.status as any));
  }

  if (filters?.startDate) {
    conditions.push(gte(schema.qualityTests.createdAt, filters.startDate));
  }

  if (filters?.endDate) {
    conditions.push(lt(schema.qualityTests.createdAt, filters.endDate));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const result = await db
    .select()
    .from(schema.qualityTests)
    .where(whereClause)
    .orderBy(desc(schema.qualityTests.createdAt));

  return result;
}

export async function getHistoricalQualityData(projectId?: number, concreteType?: string, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  let query = db
    .select({
      testType: schema.qualityTests.testType,
      result: schema.qualityTests.result,
      unit: schema.qualityTests.unit,
      status: schema.qualityTests.status,
      createdAt: schema.qualityTests.createdAt,
      concreteType: schema.deliveries.concreteType,
    })
    .from(schema.qualityTests)
    .leftJoin(schema.deliveries, eq(schema.qualityTests.deliveryId, schema.deliveries.id));

  let conditions: any[] = [];
  if (projectId) {
    conditions.push(eq(schema.qualityTests.projectId, projectId));
  }
  if (concreteType) {
    conditions.push(eq(schema.deliveries.concreteType, concreteType));
  }

  // Only include completed tests with results
  conditions.push(and(sql`${schema.qualityTests.result} != ''`, eq(schema.qualityTests.status, 'pass')));

  query = query.where(and(...conditions)) as any;

  return await query.orderBy(desc(schema.qualityTests.createdAt)).limit(limit);
}

export async function updateQualityTest(id: number, data: Partial<schema.InsertQualityTest>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(schema.qualityTests).set(data).where(eq(schema.qualityTests.id, id));
}

export async function getQualityTestById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(schema.qualityTests).where(eq(schema.qualityTests.id, id)).limit(1);
  return result[0];
}

export async function generateCompliancePDF(testId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const testResult = await db.select().from(schema.qualityTests).where(eq(schema.qualityTests.id, testId)).limit(1);
  const test = testResult[0];

  if (!test) throw new Error("Quality test not found");

  // Simulate PDF generation by creating a document record
  const certName = `Compliance_Certificate_${testId}.pdf`;
  const fileKey = `certificates/${testId}/cert.pdf`;
  const fileUrl = `https://storage.example.com/${fileKey}`; // Mock URL

  await createDocument({
    name: certName,
    description: `Auto-generated compliance certificate for test ${test.testName}`,
    fileKey,
    fileUrl,
    mimeType: "application/pdf",
    fileSize: 1024 * 50, // 50KB mock size
    category: "certificate",
    projectId: test.projectId,
    uploadedBy: 1, // Default admin ID
  });

  return fileUrl;
}

export async function getFailedQualityTests(days: number = 30) {
  const db = await getDb();
  if (!db) return [];

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const result = await db
    .select()
    .from(schema.qualityTests)
    .where(
      and(
        eq(schema.qualityTests.status, 'fail'),
        gte(schema.qualityTests.createdAt, cutoffDate)
      )
    )
    .orderBy(desc(schema.qualityTests.createdAt));

  return result;
}

export async function getQualityTestTrends(days: number = 30) {
  const db = await getDb();
  if (!db) return { passRate: 0, failRate: 0, pendingRate: 0, totalTests: 0, byType: [] };

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const [stats] = await db
    .select({
      total: sql<number>`count(*)`,
      pass: sql<number>`count(*) FILTER (WHERE ${schema.qualityTests.status} = 'pass')`,
      fail: sql<number>`count(*) FILTER (WHERE ${schema.qualityTests.status} = 'fail')`,
      pending: sql<number>`count(*) FILTER (WHERE ${schema.qualityTests.status} = 'pending')`,
    })
    .from(schema.qualityTests)
    .where(gte(schema.qualityTests.createdAt, cutoffDate));

  const totalTests = stats?.total || 0;
  if (totalTests === 0) {
    return { passRate: 0, failRate: 0, pendingRate: 0, totalTests: 0, byType: [] };
  }

  const byTypeRes = await db
    .select({
      type: schema.qualityTests.testType,
      total: sql<number>`count(*)`,
    })
    .from(schema.qualityTests)
    .where(gte(schema.qualityTests.createdAt, cutoffDate))
    .groupBy(schema.qualityTests.testType);

  const types = ['slump', 'strength', 'air_content', 'temperature', 'other'];
  const byTypeMapped = types.map(t => ({
    type: t,
    total: byTypeRes.find(r => r.type === t)?.total || 0
  }));

  return {
    passRate: (stats.pass / totalTests) * 100,
    failRate: (stats.fail / totalTests) * 100,
    pendingRate: (stats.pending / totalTests) * 100,
    totalTests,
    byType: byTypeMapped,
  };
}
