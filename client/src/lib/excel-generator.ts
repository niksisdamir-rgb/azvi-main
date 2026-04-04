import * as XLSX from "xlsx";
import { format } from "date-fns";

export const generateDashboardExcelReport = (stats: any) => {
  // Define metadata
  const reportDate = format(new Date(), "dd.MM.yyyy HH:mm");

  // Format data into rows
  const overviewData = [
    ["Kategorija", "Metrika", "Vrednost"],
    ["Projekti", "Ukupno", stats?.totalProjects ?? 0],
    ["Projekti", "Aktivno", stats?.activeProjects ?? 0],
    ["Dokumenti", "Ukupno", stats?.totalDocuments ?? 0],
    ["Isporuke", "Danas", stats?.todayDeliveries ?? 0],
    ["Isporuke", "Na Čekanju", stats?.pendingDeliveries ?? 0],
    ["Isporuke", "Ukupno", stats?.totalDeliveries ?? 0],
    ["Materijali", "Ukupno", stats?.totalMaterials ?? 0],
    ["Materijali", "Niske zalihe", stats?.lowStockMaterials ?? 0],
    ["Testovi", "Ukupno", stats?.totalTests ?? 0],
    ["Testovi", "Na čekanju", stats?.pendingTests ?? 0],
  ];

  /* Create workbook and a worksheet */
  const wb = XLSX.utils.book_new();
  
  // Sheet 1: Pregled (Overview)
  const wsOverview = XLSX.utils.aoa_to_sheet([
    ["AzVirt DMS - Kontrolna Tabla"],
    [`Datum izveštaja: ${reportDate}`],
    [], // empty row
    ...overviewData
  ]);

  // Make the header bold by just setting some col widths
  wsOverview["!cols"] = [
    { wch: 15 }, // Kategorija
    { wch: 20 }, // Metrika
    { wch: 15 }  // Vrednost
  ];

  XLSX.utils.book_append_sheet(wb, wsOverview, "Pregled");

  // Save the file
  const fileName = `AzVirt_Dashboard_Izvestaj_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
