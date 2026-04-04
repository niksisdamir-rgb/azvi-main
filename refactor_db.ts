import * as fs from 'fs';
import * as path from 'path';

const fileContent = fs.readFileSync(path.join(process.cwd(), 'server', 'db.ts'), 'utf8');

// The file is structured roughly as:
// 1. imports
// 2. mockDb and getDb logic
// 3. lots of exported functions, typically separated by comments like `// Documents`

// Let's create `server/db` folder
const outDir = path.join(process.cwd(), 'server', 'db');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}

// We will split the file by searching for specific recognizable functions and moving them.
const sectionsInfo = [
  { name: 'users', starter: 'export async function upsertUser' },
  { name: 'documents', starter: '// Documents' },
  { name: 'projects', starter: '// Projects' },
  { name: 'materials', starter: '// Materials' },
  { name: 'deliveries', starter: '// Deliveries' },
  { name: 'qualityTests', starter: '// Quality Tests' },
  { name: 'employees', starter: '// ============ Employees =============', starterRegex: /^\/\/ =+ Employees =+$/ },
  { name: 'workHours', starterRegex: /^\/\/ =+ Work Hours =+$/ },
  { name: 'concreteBases', starterRegex: /^\/\/ =+ Concrete Bases =+$/ },
  { name: 'machines', starterRegex: /^\/\/ =+ Machines =+$/ },
  { name: 'machineWorkHours', starterRegex: /^\/\/ =+ Machine Work Hours =+$/ },
  { name: 'machineMaintenance', starterRegex: /^\/\/ =+ Machine Maintenance =+$/ },
  { name: 'aggregateInputs', starterRegex: /^\/\/ =+ Aggregate Inputs =+$/ },
  { name: 'materialConsumptionHistory', starterRegex: /^\/\/ =+ Material Consumption =+$/ },
  { name: 'purchaseOrders', starterRegex: /^\/\/ =+ Purchase Orders =+$/ },
  { name: 'purchaseOrderItems', starterRegex: /^\/\/ =+ Purchase Order Items =+$/ },
  { name: 'forecasting', starterRegex: /^\/\/ =+ Forecasting =+$/ },
  { name: 'aiConversations', starterRegex: /^\/\/ =+ AI Conversations =+$/ },
  { name: 'aiMessages', starterRegex: /^\/\/ =+ AI Messages =+$/ },
  { name: 'aiModels', starterRegex: /^\/\/ =+ AI Models =+$/ },
  { name: 'reportSettings', starterRegex: /^\/\/ =+ Analytics Settings =+$/ },
  { name: 'reportRecipients', starterRegex: /^\/\/ ===+ REPORT RECIPIENTS ===+$/ },
  { name: 'emailBranding', starterRegex: /^\/\/ ===+ EMAIL BRANDING ===+$/ },
  { name: 'systemModules', starterRegex: /^\/\/ ===+ SYSTEM MODULES ===+$/ },
  { name: 'dailyTasks', starterRegex: /^\/\/ ===+ DAILY TASKS ===+$/ },
  { name: 'taskAssignments', starterRegex: /^\/\/ ===+ TASK ASSIGNMENTS ===+$/ },
  { name: 'taskStatusHistory', starterRegex: /^\/\/ ===+ TASK STATUS HISTORY ===+$/ },
  { name: 'taskNotifications', starterRegex: /^\/\/ ===+ TASK NOTIFICATIONS ===+$/ },
  { name: 'notificationPreferences', starterRegex: /^\/\/ ===+ NOTIFICATION PREFERENCES ===+$/ },
  { name: 'notificationHistory', starterRegex: /^\/\/ ===+ NOTIFICATION HISTORY ===+$/ },
  { name: 'notificationTemplates', starterRegex: /^\/\/ ===+ NOTIFICATION TEMPLATES ===+$/ },
  { name: 'notificationTriggers', starterRegex: /^\/\/ ===+ NOTIFICATION TRIGGERS ===+$/ },
  { name: 'triggerExecutionLog', starterRegex: /^\/\/ ===+ TRIGGER EXECUTION LOG ===+$/ },
  { name: 'suppliers', starterRegex: /^\/\/ ===+ SUPPLIERS ===+$/ },
  { name: 'timesheetUploadHistory', starterRegex: /^\/\/ =+ Timesheet Upload History =+$/ }
];

let lines = fileContent.split('\n');
let currentSectionName = 'setup';
let parsedSections = { 'setup': [] };

// Iterate through lines, when we hit a starter, switch bucket
for (let i = 0; i < lines.length; i++) {
  let line = lines[i];

  let matched = false;
  for (const si of sectionsInfo) {
    if (si.starter && line.trim() === si.starter) {
      if (si.name === 'documents' && currentSectionName === 'documents') {
        // Prevent matching `// Documents` twice if there's multiple
      } else {
        currentSectionName = si.name;
        if (!parsedSections[currentSectionName]) parsedSections[currentSectionName] = [];
        matched = true;
        break;
      }
    } else if (si.starterRegex && si.starterRegex.test(line.trim())) {
      currentSectionName = si.name;
      if (!parsedSections[currentSectionName]) parsedSections[currentSectionName] = [];
      matched = true;
      break;
    }
  }

  // Edge case: users doesn't have a comment. It starts exactly at `export async function upsertUser`
  if (!matched && line.includes('export async function upsertUser')) {
    currentSectionName = 'users';
    if (!parsedSections[currentSectionName]) parsedSections[currentSectionName] = [];
  }

  parsedSections[currentSectionName].push(line);
}

// Generate the setup
fs.writeFileSync(path.join(outDir, 'setup.ts'), parsedSections['setup'].join('\n'));
console.log('Wrote setup.ts');

const schemaTypes = [
  'InsertUser', 'users', 'documents', 'InsertDocument', 'projects', 'InsertProject',
  'materials', 'InsertMaterial', 'deliveries', 'InsertDelivery', 'qualityTests', 'InsertQualityTest',
  'employees', 'InsertEmployee', 'workHours', 'InsertWorkHour', 'concreteBases', 'InsertConcreteBase',
  'machines', 'InsertMachine', 'machineMaintenance', 'InsertMachineMaintenance',
  'machineWorkHours', 'InsertMachineWorkHour', 'aggregateInputs', 'InsertAggregateInput',
  'materialConsumptionHistory', 'InsertMaterialConsumptionHistory', 'purchaseOrders', 'InsertPurchaseOrder',
  'purchaseOrderItems', 'InsertPurchaseOrderItem', 'forecastPredictions', 'InsertForecastPrediction',
  'aiConversations', 'aiMessages', 'aiModels', 'reportSettings', 'reportRecipients',
  'emailBranding', 'emailTemplates', 'notificationTemplates', 'notificationTriggers',
  'triggerExecutionLog', 'suppliers', 'InsertSupplier', 'deliveryStatusHistory', 'InsertDeliveryStatusHistory',
  'timesheetUploadHistory', 'InsertTimesheetUploadHistory', 'systemModules', 'InsertSystemModule',
  'dailyTasks', 'InsertDailyTask', 'taskAssignments', 'InsertTaskAssignment',
  'taskStatusHistory', 'InsertTaskStatusHistory', 'taskNotifications', 'InsertTaskNotification',
  'notificationPreferences', 'InsertNotificationPreference', 'notificationHistory', 'InsertNotificationHistory',
  'analyticsSettings', 'InsertAnalyticsSetting'
];

let indexContent = Object.keys(parsedSections).map(k => `export * from './${k}';`).join('\n');
fs.writeFileSync(path.join(outDir, 'index.ts'), indexContent);

// Process the other sections
Object.keys(parsedSections).forEach(secName => {
  if (secName === 'setup') return;
  
  let sectionLines = parsedSections[secName].join('\n');
  
  // replace the schema words with schema.Word
  for (const st of schemaTypes) {
    const rx = new RegExp(`\\b${st}\\b`, 'g');
    sectionLines = sectionLines.replace(rx, `schema.${st}`);
  }

  const imports = `import { eq, desc, like, and, or, gte, lt, sql } from "drizzle-orm";
import * as schema from "../drizzle/schema";
import { getDb } from "./setup";
`;
  
  fs.writeFileSync(path.join(outDir, `${secName}.ts`), imports + '\n' + sectionLines);
  console.log('Wrote ' + secName + '.ts');
});

// Update standard db.ts to simply export the new folder
fs.writeFileSync(path.join(process.cwd(), 'server', 'db.ts'), `export * from './db';\n`);
console.log('Successfully completed full refactor of server/db.ts');
