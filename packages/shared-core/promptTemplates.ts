/**
 * AI Prompt Templates
 * Pre-built prompts for common DMS tasks to help users get started
 */

export interface PromptTemplate {
  id: string;
  category: TemplateCategory;
  title: string;
  description: string;
  prompt: string;
  icon: string;
  tags: string[];
  usageCount?: number;
}

export type TemplateCategory = 
  | 'inventory'
  | 'deliveries'
  | 'quality'
  | 'reports'
  | 'analysis'
  | 'forecasting'
  | 'bulk_import';

export const TEMPLATE_CATEGORIES: Record<TemplateCategory, { label: string; icon: string; description: string }> = {
  inventory: {
    label: 'Upravljanje zalihama',
    icon: 'Package',
    description: 'Provjera zaliha, narudžbe i materijala',
  },
  deliveries: {
    label: 'Isporuke',
    icon: 'Truck',
    description: 'Praćenje i analiza isporuka',
  },
  quality: {
    label: 'Kontrola kvaliteta',
    icon: 'FlaskConical',
    description: 'Testovi kvaliteta i usklađenost',
  },
  reports: {
    label: 'Izvještaji',
    icon: 'FileText',
    description: 'Generisanje izvještaja i sažetaka',
  },
  analysis: {
    label: 'Analiza',
    icon: 'TrendingUp',
    description: 'Analiza podataka i trendova',
  },
  forecasting: {
    label: 'Prognoze',
    icon: 'LineChart',
    description: 'Predviđanje i planiranje',
  },
  bulk_import: {
    label: 'Masovni unos',
    icon: 'Upload',
    description: 'Uvoz podataka iz CSV i Excel datoteka',
  },
};

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  // Data Entry & Manipulation Templates
  {
    id: 'log-employee-hours',
    category: 'inventory',
    title: 'Evidentiraj radne sate zaposlenika',
    description: 'Zabilježi radne sate za zaposlenika sa automatskim računanjem prekovremenog rada',
    prompt: 'Evidentiraj radne sate za zaposlenika ID [broj] na projektu [naziv projekta]. Radio je od [vrijeme početka] do [vrijeme kraja] dana [datum]. Tip rada: [regular/overtime/weekend/holiday].',
    icon: 'Clock',
    tags: ['radni sati', 'zaposlenici', 'evidencija'],
  },
  {
    id: 'get-hours-summary',
    category: 'reports',
    title: 'Sažetak radnih sati',
    description: 'Prikaži ukupne radne sate za zaposlenika ili projekat',
    prompt: 'Prikaži mi sažetak radnih sati za zaposlenika ID [broj] u periodu od [datum početka] do [datum kraja]. Uključi ukupne sate, prekovremeni rad, i podjelu po tipu rada.',
    icon: 'BarChart',
    tags: ['izvještaj', 'radni sati', 'sažetak'],
  },
  {
    id: 'log-machine-hours',
    category: 'inventory',
    title: 'Evidentiraj rad mašine',
    description: 'Zabilježi sate rada opreme/mašine',
    prompt: 'Evidentiraj rad mašine ID [broj] na projektu [naziv]. Mašina je radila od [vrijeme početka] do [vrijeme kraja] dana [datum]. Operater: [ime operatera].',
    icon: 'Settings',
    tags: ['mašine', 'oprema', 'evidencija'],
  },
  {
    id: 'add-new-material',
    category: 'inventory',
    title: 'Dodaj novi materijal',
    description: 'Kreiraj novi materijal u inventaru',
    prompt: 'Dodaj novi materijal u inventar: naziv "[naziv]", kategorija [cement/aggregate/admixture/water/other], jedinica [kg/m³/L], početna količina [broj], minimalne zalihe [broj], dobavljač "[naziv dobavljača]", cijena po jedinici [broj].',
    icon: 'Plus',
    tags: ['materijal', 'inventar', 'kreiranje'],
  },
  {
    id: 'update-stock-quantity',
    category: 'inventory',
    title: 'Ažuriraj količinu zaliha',
    description: 'Promijeni količinu materijala u inventaru',
    prompt: 'Ažuriraj količinu materijala ID [broj]: postavi na [nova količina] ili dodaj/oduzmi [+/- broj] od trenutne količine.',
    icon: 'RefreshCw',
    tags: ['zalihe', 'ažuriranje', 'inventar'],
  },
  {
    id: 'update-document-info',
    category: 'reports',
    title: 'Ažuriraj informacije dokumenta',
    description: 'Promijeni naziv, opis, ili kategoriju dokumenta',
    prompt: 'Ažuriraj dokument ID [broj]: promijeni naziv na "[novi naziv]", opis na "[novi opis]", kategoriju na [contract/blueprint/report/certificate/invoice/other], i dodijeli projektu ID [broj].',
    icon: 'Edit',
    tags: ['dokument', 'ažuriranje', 'metadata'],
  },
  {
    id: 'delete-document',
    category: 'reports',
    title: 'Obriši dokument',
    description: 'Trajno ukloni dokument iz sistema',
    prompt: 'Obriši dokument ID [broj] iz sistema. Potvrdi brisanje.',
    icon: 'Trash2',
    tags: ['dokument', 'brisanje', 'upravljanje'],
  },
  // Inventory Management Templates (existing)
  {
    id: 'check-low-stock',
    category: 'inventory',
    title: 'Provjeri materijale sa niskim zalihama',
    description: 'Prikaži sve materijale koji su ispod minimalnog nivoa zaliha',
    prompt: 'Koji materijali trenutno imaju niske zalihe? Prikaži mi listu sa trenutnim količinama i minimalnim nivoima.',
    icon: 'AlertTriangle',
    tags: ['zalihe', 'upozorenje', 'materijali'],
  },
  {
    id: 'search-material',
    category: 'inventory',
    title: 'Pretraži specifičan materijal',
    description: 'Pronađi informacije o određenom materijalu',
    prompt: 'Prikaži mi sve informacije o [naziv materijala] - trenutnu količinu, dobavljača, cijenu i historiju potrošnje.',
    icon: 'Search',
    tags: ['pretraga', 'materijal', 'detalji'],
  },
  {
    id: 'inventory-summary',
    category: 'inventory',
    title: 'Sažetak zaliha',
    description: 'Pregled ukupnog stanja zaliha',
    prompt: 'Daj mi sažetak trenutnog stanja zaliha - ukupan broj materijala, kritični nivoi, i ukupna vrijednost.',
    icon: 'ClipboardList',
    tags: ['sažetak', 'pregled', 'zalihe'],
  },
  {
    id: 'order-recommendations',
    category: 'inventory',
    title: 'Preporuke za narudžbe',
    description: 'Dobij preporuke šta treba naručiti',
    prompt: 'Na osnovu trenutnih zaliha i historije potrošnje, koje materijale trebam naručiti i u kojim količinama?',
    icon: 'ShoppingCart',
    tags: ['narudžba', 'preporuke', 'planiranje'],
  },

  // Delivery Management Templates
  {
    id: 'active-deliveries',
    category: 'deliveries',
    title: 'Aktivne isporuke',
    description: 'Prikaži sve trenutno aktivne isporuke',
    prompt: 'Prikaži mi sve aktivne isporuke danas - status, destinaciju, i očekivano vrijeme dolaska.',
    icon: 'Truck',
    tags: ['isporuke', 'aktivno', 'praćenje'],
  },
  {
    id: 'delivery-history',
    category: 'deliveries',
    title: 'Historija isporuka za projekat',
    description: 'Pregled svih isporuka za određeni projekat',
    prompt: 'Prikaži mi sve isporuke za projekat [naziv projekta] - datume, količine, i status.',
    icon: 'History',
    tags: ['historija', 'projekat', 'isporuke'],
  },
  {
    id: 'delivery-performance',
    category: 'deliveries',
    title: 'Performanse isporuka',
    description: 'Analiza efikasnosti isporuka',
    prompt: 'Analiziraj performanse isporuka za posljednjih 30 dana - procenat isporuka na vrijeme, kašnjenja, i prosječno vrijeme.',
    icon: 'BarChart',
    tags: ['performanse', 'analiza', 'metrike'],
  },
  {
    id: 'delayed-deliveries',
    category: 'deliveries',
    title: 'Zakašnjele isporuke',
    description: 'Identifikuj isporuke sa kašnjenjem',
    prompt: 'Koje isporuke kasne ili su imale kašnjenja u posljednje vrijeme? Prikaži razloge i trajanje kašnjenja.',
    icon: 'Clock',
    tags: ['kašnjenje', 'problemi', 'praćenje'],
  },

  // Quality Control Templates
  {
    id: 'predictive-qc',
    category: 'quality',
    title: 'Predikcija kvaliteta betona',
    description: 'Predviđanje rezultata kvaliteta za željeni miks betona',
    prompt: 'Analiziraj miks betona (w/c odnos, cement, agregat) i temperaturu, i predvidi rezultate slump testa i čvrstoće',
    icon: 'BrainCircuit',
    tags: ['predikcija', 'miks', 'kvalitet', 'analiza'],
  },
  {
    id: 'recent-tests',
    category: 'quality',
    title: 'Nedavni testovi kvaliteta',
    description: 'Pregled posljednjih testova',
    prompt: 'Prikaži mi rezultate testova kvaliteta iz posljednje sedmice - tip testa, rezultati, i status prolaska.',
    icon: 'FlaskConical',
    tags: ['testovi', 'kvalitet', 'rezultati'],
  },
  {
    id: 'failed-tests',
    category: 'quality',
    title: 'Neuspjeli testovi',
    description: 'Identifikuj testove koji nisu prošli',
    prompt: 'Koji testovi kvaliteta nisu prošli u posljednjih 30 dana? Prikaži detalje i razloge neuspjeha.',
    icon: 'XCircle',
    tags: ['neuspjeh', 'problemi', 'kvalitet'],
  },
  {
    id: 'quality-trends',
    category: 'quality',
    title: 'Trendovi kvaliteta',
    description: 'Analiza trendova u kvalitetu betona',
    prompt: 'Analiziraj trendove u kvalitetu betona tokom posljednjih 3 mjeseca - čvrstoća, slump test, i stopa prolaska.',
    icon: 'TrendingUp',
    tags: ['trendovi', 'analiza', 'kvalitet'],
  },
  {
    id: 'compliance-check',
    category: 'quality',
    title: 'Provjera usklađenosti',
    description: 'Provjeri usklađenost sa standardima',
    prompt: 'Da li su svi testovi kvaliteta u skladu sa standardima EN 206 i ASTM C94? Prikaži eventualna odstupanja.',
    icon: 'CheckCircle',
    tags: ['usklađenost', 'standardi', 'provjera'],
  },

  // Reporting Templates
  {
    id: 'weekly-summary',
    category: 'reports',
    title: 'Sedmični izvještaj',
    description: 'Generiši sažetak sedmice',
    prompt: 'Napravi sažetak aktivnosti za ovu sedmicu - broj isporuka, potrošnja materijala, testovi kvaliteta, i ključni događaji.',
    icon: 'Calendar',
    tags: ['izvještaj', 'sedmično', 'sažetak'],
  },
  {
    id: 'monthly-report',
    category: 'reports',
    title: 'Mjesečni izvještaj',
    description: 'Detaljan mjesečni pregled',
    prompt: 'Generiši detaljan mjesečni izvještaj - ukupne isporuke, potrošnja po materijalu, kvalitet, i finansijski pregled.',
    icon: 'FileText',
    tags: ['izvještaj', 'mjesečno', 'detalji'],
  },
  {
    id: 'project-summary',
    category: 'reports',
    title: 'Sažetak projekta',
    description: 'Pregled specifičnog projekta',
    prompt: 'Napravi sažetak za projekat [naziv projekta] - isporuke, potrošnja materijala, troškovi, i status.',
    icon: 'Folder',
    tags: ['projekat', 'sažetak', 'pregled'],
  },

  // Analysis Templates
  {
    id: 'cost-analysis',
    category: 'analysis',
    title: 'Analiza troškova',
    description: 'Analiziraj troškove materijala i isporuka',
    prompt: 'Analiziraj troškove za posljednjih 30 dana - najskuplji materijali, troškovi isporuka, i mogućnosti uštede.',
    icon: 'DollarSign',
    tags: ['troškovi', 'analiza', 'finansije'],
  },
  {
    id: 'consumption-patterns',
    category: 'analysis',
    title: 'Obrasci potrošnje',
    description: 'Identifikuj obrasce u potrošnji materijala',
    prompt: 'Analiziraj obrasce potrošnje materijala - koji se materijali najčešće koriste, sezonske varijacije, i trendovi.',
    icon: 'PieChart',
    tags: ['potrošnja', 'obrasci', 'trendovi'],
  },
  {
    id: 'efficiency-metrics',
    category: 'analysis',
    title: 'Metrike efikasnosti',
    description: 'Izračunaj ključne metrike performansi',
    prompt: 'Izračunaj ključne metrike efikasnosti - iskorištenost zaliha, vrijeme isporuke, stopa kvaliteta, i produktivnost.',
    icon: 'Activity',
    tags: ['metrike', 'efikasnost', 'KPI'],
  },

  // Forecasting Templates
  {
    id: 'demand-forecast',
    category: 'forecasting',
    title: 'Prognoza potražnje',
    description: 'Predvidi buduću potražnju za materijalom',
    prompt: 'Na osnovu historijskih podataka, predvidi potražnju za [naziv materijala] u narednih 30 dana.',
    icon: 'LineChart',
    tags: ['prognoza', 'potražnja', 'planiranje'],
  },
  {
    id: 'stockout-prediction',
    category: 'forecasting',
    title: 'Predviđanje nestašice',
    description: 'Kada će materijali biti nestašici',
    prompt: 'Koji materijali će biti u nestašici u narednih 14 dana ako se nastavi trenutni tempo potrošnje?',
    icon: 'AlertCircle',
    tags: ['nestašica', 'upozorenje', 'prognoza'],
  },
  {
    id: 'seasonal-planning',
    category: 'forecasting',
    title: 'Sezonsko planiranje',
    description: 'Planiranje za sezonske varijacije',
    prompt: 'Analiziraj sezonske varijacije u potrošnji i daj preporuke za planiranje zaliha za narednu sezonu.',
    icon: 'Sun',
    tags: ['sezonsko', 'planiranje', 'prognoza'],
  },
  {
    id: 'import-work-hours-csv',
    category: 'bulk_import',
    title: 'Uvezi radne sate iz CSV',
    description: 'Ucitaj radne sate zaposlenih iz CSV datoteke',
    prompt: 'Uvezi radne sate zaposlenih iz CSV datoteke. Datoteka treba da sadrzi kolone: employeeId, date, startTime, endTime, projectId.',
    icon: 'FileUp',
    tags: ['radni sati', 'csv', 'zaposleni', 'uvoz'],
  },
  {
    id: 'import-materials-excel',
    category: 'bulk_import',
    title: 'Uvezi materijale iz Excel',
    description: 'Ucitaj materijale u inventar iz Excel datoteke',
    prompt: 'Uvezi materijale u inventar iz Excel datoteke. Datoteka treba da sadrzi kolone: name, category, unit, quantity, minStock, supplier, unitPrice.',
    icon: 'FileUp',
    tags: ['materijali', 'excel', 'inventar', 'uvoz'],
  },
  {
    id: 'import-documents-batch',
    category: 'bulk_import',
    title: 'Uvezi dokumente u batch',
    description: 'Ucitaj vise dokumenata odjednom iz CSV datoteke',
    prompt: 'Uvezi dokumente u sistem iz CSV datoteke. Datoteka treba da sadrzi kolone: name, fileUrl, fileKey, category, description, projectId.',
    icon: 'FileUp',
    tags: ['dokumenti', 'csv', 'batch', 'uvoz'],
  },
  {
    id: 'bulk-update-stock',
    category: 'bulk_import',
    title: 'Masovna azuriranja zaliha',
    description: 'Azuriraj kolicine materijala u batch operaciji',
    prompt: 'Azuriraj kolicine vise materijala odjednom. Pripremi CSV datoteku sa kolonama: materialId, quantity ili adjustment za relativnu promenu.',
    icon: 'RefreshCw',
    tags: ['zalihe', 'azuriranje', 'batch', 'csv'],
  },
  {
    id: 'import-quality-tests',
    category: 'bulk_import',
    title: 'Uvezi rezultate testova',
    description: 'Ucitaj rezultate testova kvaliteta iz datoteke',
    prompt: 'Uvezi rezultate testova kvalitete iz CSV datoteke. Datoteka treba da sadrzi: materialId, testType, result, date, notes.',
    icon: 'FileUp',
    tags: ['testovi', 'kvalitet', 'csv', 'uvoz'],
  },
  {
    id: 'bulk-machine-hours',
    category: 'bulk_import',
    title: 'Uvezi sate masina',
    description: 'Ucitaj sate rada masina iz datoteke',
    prompt: 'Uvezi sate rada masina iz CSV datoteke. Datoteka treba da sadrzi: machineId, date, startTime, endTime, operatorId, projectId.',
    icon: 'FileUp',
    tags: ['masine', 'sati', 'csv', 'uvoz'],
  },
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: TemplateCategory): PromptTemplate[] {
  return PROMPT_TEMPLATES.filter(t => t.category === category);
}

/**
 * Search templates by query
 */
export function searchTemplates(query: string): PromptTemplate[] {
  const lowerQuery = query.toLowerCase();
  return PROMPT_TEMPLATES.filter(t => 
    t.title.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
    t.prompt.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): PromptTemplate | undefined {
  return PROMPT_TEMPLATES.find(t => t.id === id);
}
