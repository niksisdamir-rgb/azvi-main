import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'server', 'db.ts');
const dbContent = fs.readFileSync(dbPath, 'utf8');

const lines = dbContent.split('\n');
const sections = [];
let currentSection = { name: 'setup', lines: [] };

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const sectionMatch = line.match(/^\/\/ ===+ (.+) ===+$/) || line.match(/^\/\/ ============ (.+) ============$/) || line.match(/^\/\/ (.+)$/);
  
  if (sectionMatch && sectionMatch[1] && !line.includes('// Mock DB') && !line.includes('// In a real application') && !line.includes('// If status is being updated') && !line.includes('// Simulate PDF generation') && !line.includes('// Penalty') && !line.includes('// Delete') && !line.includes('// Update') && !line.includes('// Only include') && !line.includes('// Attach pino-http logger middleware') && !line.includes('// Prometheus configuration') && !line.includes('// Configure body parser') && !line.includes('// Start the server') && !line.includes('// Apply rate checking') && !line.includes('// Set basic usage info') && !line.includes('// Save trigger log') && !line.includes('// Fetch templates') && !line.includes('// Parse variables JSON') && !line.includes('// Execute triggers') && !line.includes('// Create default') && !line.includes('// Check if message should trigger notifications') && !line.includes('// Get unique recipient string') && !line.includes('// Evaluate condition')) {
    
    // Some lines are false positives, we only want the actual big blocks
    // Let's rely on common ones: 'Documents', 'Projects', etc.
    if (['Documents', 'Projects', 'Materials', 'Deliveries', 'Quality Tests', 'Employees', 'Work Hours', 'Concrete Bases', 'Machines', 'Machine Work Hours', 'Machine Maintenance', 'Aggregate Inputs', 'Material Consumption', 'Purchase Orders', 'Purchase Order Items', 'Forecasting', 'AI Conversations', 'AI Messages', 'AI Models', 'Analytics Settings', 'REPORT RECIPIENTS', 'EMAIL BRANDING', 'SYSTEM MODULES', 'DAILY TASKS', 'TASK ASSIGNMENTS', 'TASK STATUS HISTORY', 'TASK NOTIFICATIONS', 'NOTIFICATION PREFERENCES', 'NOTIFICATION HISTORY', 'NOTIFICATION TEMPLATES', 'NOTIFICATION TRIGGERS', 'TRIGGER EXECUTION LOG', 'SUPPLIERS', 'Timesheet Upload History'].includes(sectionMatch[1].trim().replace(/=+ /g, '').replace(/ =+/g, ''))) {
      sections.push(currentSection);
      currentSection = { name: sectionMatch[1].trim().replace(/=+ /g, '').replace(/ =+/g, '').replace(/\s+/g, '').toLowerCase(), lines: [] };
      continue;
    }
  }

  // Handle first few users imports and setup
  if (currentSection.name === 'setup' && line.startsWith('export async function createDocument')) {
     // If we missed "Documents", let's manually catch it
     sections.push(currentSection);
     currentSection = { name: 'documents', lines: [line] };
     continue;
  }

  currentSection.lines.push(line);
}
sections.push(currentSection);

const dbDir = path.join(process.cwd(), 'server', 'db_new');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);

// Now write them out
let indexExports = '';

const sharedImports = `import { eq, desc, like, and, or, gte, lt, sql } from "drizzle-orm";
import * as schema from "../drizzle/schema";
import { getDb } from "./setup";
`;

for (const section of sections) {
  if (section.name === 'setup') {
    // Write setup and users which were clumped at the top
    fs.writeFileSync(path.join(dbDir, 'setup.ts'), section.lines.join('\n'));
    indexExports += `export * from './setup';\n`;
  } else {
    // Normal section
    // We need to inject common imports depending on what's used
    let fileContent = section.lines.join('\n');
    
    // Fix schema references since we use * as schema
    const schemaEntities = [
      'InsertUser', 'users',
      'documents', 'InsertDocument',
      'projects', 'InsertProject',
      'materials', 'InsertMaterial',
      'deliveries', 'InsertDelivery',
      'qualityTests', 'InsertQualityTest',
      'employees', 'InsertEmployee',
      'workHours', 'InsertWorkHour',
      'concreteBases', 'InsertConcreteBase',
      'machines', 'InsertMachine',
      'machineMaintenance', 'InsertMachineMaintenance',
      'machineWorkHours', 'InsertMachineWorkHour',
      'aggregateInputs', 'InsertAggregateInput',
      'materialConsumptionHistory', 'InsertMaterialConsumptionHistory',
      'purchaseOrders', 'InsertPurchaseOrder',
      'purchaseOrderItems', 'InsertPurchaseOrderItem',
      'forecastPredictions', 'InsertForecastPrediction',
      'aiConversations',
      'aiMessages',
      'aiModels',
      'reportSettings',
      'reportRecipients',
      'emailBranding',
      'emailTemplates',
      'notificationTemplates',
      'notificationTriggers',
      'triggerExecutionLog',
      'suppliers', 'InsertSupplier',
      'deliveryStatusHistory', 'InsertDeliveryStatusHistory',
      'timesheetUploadHistory', 'InsertTimesheetUploadHistory',
      'systemModules', 'InsertSystemModule',
      'dailyTasks', 'InsertDailyTask',
      'taskAssignments', 'InsertTaskAssignment',
      'taskStatusHistory', 'InsertTaskStatusHistory',
      'taskNotifications', 'InsertTaskNotification',
      'notificationPreferences', 'InsertNotificationPreference',
      'notificationHistory', 'InsertNotificationHistory',
      'analyticsSettings', 'InsertAnalyticsSetting'
    ];
    
    for (const entity of schemaEntities) {
      if (fileContent.includes(entity)) {
        // Find whole word matches and replace with schema.entity
        const regex = new RegExp(`\\b${entity}\\b`, 'g');
        fileContent = fileContent.replace(regex, `schema.${entity}`);
      }
    }
    
    fs.writeFileSync(path.join(dbDir, `${section.name}.ts`), sharedImports + '\n' + fileContent);
    indexExports += `export * from './${section.name}';\n`;
  }
}

fs.writeFileSync(path.join(dbDir, 'index.ts'), indexExports);
console.log('Done splitting!');
