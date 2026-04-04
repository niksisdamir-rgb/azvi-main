import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export const generateDashboardPdfReport = (stats: any) => {
  const doc = new jsPDF();
  const dateStr = format(new Date(), "dd.MM.yyyy HH:mm");

  // Add Logo / Header
  doc.setFontSize(22);
  doc.setTextColor(41, 128, 185);
  doc.text("AzVirt DMS", 14, 20);
  
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text("Izveštaj Kontrolne Table (Dashboard Report)", 14, 30);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Datum kreiranja: ${dateStr}`, 14, 38);

  // Stats Table
  const tableData = [
    ["Projekti", `Ukupno: ${stats?.totalProjects ?? 0} | Aktivno: ${stats?.activeProjects ?? 0}`],
    ["Dokumenti", `Ukupno: ${stats?.totalDocuments ?? 0}`],
    ["Isporuke", `Danas: ${stats?.todayDeliveries ?? 0} | Ukupno: ${stats?.totalDeliveries ?? 0}`],
    ["Materijali", `Ukupno: ${stats?.totalMaterials ?? 0} | Niske zalihe: ${stats?.lowStockMaterials ?? 0}`],
    ["Testovi Kvaliteta", `Ukupno: ${stats?.totalTests ?? 0} | Na čekanju: ${stats?.pendingTests ?? 0}`]
  ];

  autoTable(doc, {
    startY: 45,
    head: [["Kategorija", "Detalji"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [41, 128, 185] },
    styles: { font: "helvetica", fontSize: 11 },
  });

  // Performance Section (Simulated data to match the UI)
  const finalY = (doc as any).lastAutoTable.finalY || 45;
  
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text("Performanse (Zadnjih 30 dana)", 14, finalY + 15);

  const perfData = [
    ["Iskorišćenost skladišta", "72%"],
    ["Stopa uspešnosti isporuke", "94%"],
    ["Kvalitet testova", "89%"],
    ["Efikasnost rada", "85%"],
  ];

  autoTable(doc, {
    startY: finalY + 20,
    head: [["Metrika", "Vrednost"]],
    body: perfData,
    theme: "grid",
    headStyles: { fillColor: [46, 204, 113] },
    styles: { font: "helvetica", fontSize: 11 },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Strana ${i} od ${pageCount} - AzVirt Document Management System`,
      14,
      doc.internal.pageSize.height - 10
    );
  }

  // Save the PDF
  doc.save(`AzVirt_Dashboard_Izvestaj_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`);
};
