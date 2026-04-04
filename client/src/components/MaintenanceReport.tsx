import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface MaintenanceRecord {
  id: number;
  machineId: number;
  maintenanceType: "lubrication" | "fuel" | "oil_change" | "repair" | "inspection" | "other";
  description: string | null;
  cost?: number | null;
  date: Date | string;
  nextDueDate?: Date | string | null;
}

interface Machine {
  id: number;
  name: string;
  machineNumber: string;
  type: string;
  manufacturer?: string | null;
  model?: string | null;
  year?: number | null;
  lastMaintenanceDate?: Date | string | null;
  nextMaintenanceDate?: Date | string | null;
}

interface MaintenanceReportProps {
  machine: Machine;
  records: MaintenanceRecord[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MaintenanceReport({
  machine,
  records,
  open,
  onOpenChange,
}: MaintenanceReportProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (contentRef.current) {
      const printWindow = window.open("", "", "width=800,height=600");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Maintenance Report - ${machine.name}</title>
              <style>
                body { font-family: sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th { background: #FF6C0E; color: white; padding: 8px; text-align: left; }
                td { border-bottom: 1px solid #ddd; padding: 8px; }
                .header { border-bottom: 2px solid #FF6C0E; margin-bottom: 20px; padding-bottom: 10px; }
                @media print {
                  button { display: none; }
                }
              </style>
            </head>
            <body>
              ${contentRef.current.innerHTML}
              <script>window.print(); window.close();</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  const totalCost = records.reduce((sum, record) => sum + (record.cost || 0), 0);
  
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "N/A";
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString("bs-BA");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Machine Maintenance Report</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button onClick={handlePrint} className="bg-orange-600 hover:bg-orange-700">
            <Printer className="mr-2 h-4 w-4" />
            Print Report
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="ml-auto"
          >
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
        </div>

        <div
          ref={contentRef}
          className="print-content bg-white p-4 text-black"
          style={{ fontSize: "12px", fontFamily: "Arial, sans-serif" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6 border-b-2 border-orange-600 pb-4">
            <div>
              <div className="text-2xl font-bold text-orange-600">AZVIRT</div>
              <div className="text-xs text-gray-500">30 Years of Excellence</div>
            </div>
            <div className="text-center">
              <h1 style={{ fontSize: "20px", fontWeight: "bold", margin: "0" }}>
                MAINTENANCE REPORT
              </h1>
              <p style={{ margin: "4px 0", color: "#666" }}>
                Machine: {machine.name} ({machine.machineNumber})
              </p>
            </div>
            <div className="text-right text-xs">
              <p>Generated: {new Date().toLocaleString("bs-BA")}</p>
            </div>
          </div>

          {/* Machine Info */}
          <div className="mb-6">
            <h2 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "8px", color: "#FF6C0E" }}>
              1. MACHINE SPECIFICATIONS
            </h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "6px", fontWeight: "bold", width: "25%" }}>Machine Name:</td>
                  <td style={{ padding: "6px" }}>{machine.name}</td>
                  <td style={{ padding: "6px", fontWeight: "bold", width: "25%" }}>Machine #:</td>
                  <td style={{ padding: "6px" }}>{machine.machineNumber}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "6px", fontWeight: "bold" }}>Type:</td>
                  <td style={{ padding: "6px" }}>{machine.type}</td>
                  <td style={{ padding: "6px", fontWeight: "bold" }}>Manufacturer:</td>
                  <td style={{ padding: "6px" }}>{machine.manufacturer || "—"}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "6px", fontWeight: "bold" }}>Model:</td>
                  <td style={{ padding: "6px" }}>{machine.model || "—"}</td>
                  <td style={{ padding: "6px", fontWeight: "bold" }}>Year:</td>
                  <td style={{ padding: "6px" }}>{machine.year || "—"}</td>
                </tr>
                <tr>
                  <td style={{ padding: "6px", fontWeight: "bold" }}>Last Maint:</td>
                  <td style={{ padding: "6px" }}>{formatDate(machine.lastMaintenanceDate)}</td>
                  <td style={{ padding: "6px", fontWeight: "bold" }}>Next Maint:</td>
                  <td style={{ padding: "6px" }}>{formatDate(machine.nextMaintenanceDate)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Maintenance Records */}
          <div className="mb-6">
            <h2 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "8px", color: "#FF6C0E" }}>
              2. SERVICE HISTORY
            </h2>
            {records.length === 0 ? (
              <p className="text-gray-500 italic">No maintenance records found for this period.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#FF6C0E", color: "white" }}>
                    <th style={{ padding: "6px", textAlign: "left" }}>Date</th>
                    <th style={{ padding: "6px", textAlign: "left" }}>Type</th>
                    <th style={{ padding: "6px", textAlign: "left" }}>Description</th>
                    <th style={{ padding: "6px", textAlign: "right" }}>Cost (€)</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} style={{ borderBottom: "1px solid #ddd" }}>
                      <td style={{ padding: "6px" }}>{formatDate(record.date)}</td>
                      <td style={{ padding: "6px", textTransform: "capitalize" }}>
                        {record.maintenanceType.replace("_", " ")}
                      </td>
                      <td style={{ padding: "6px" }}>{record.description || "—"}</td>
                      <td style={{ padding: "6px", textAlign: "right" }}>
                        {record.cost ? `€${record.cost.toFixed(2)}` : "—"}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: "#f9f9f9", fontWeight: "bold" }}>
                    <td colSpan={3} style={{ padding: "8px", textAlign: "right" }}>TOTAL EXPENDITURE:</td>
                    <td style={{ padding: "8px", textAlign: "right", color: "#FF6C0E" }}>
                      €{totalCost.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* Summary Footer */}
          <div style={{ marginTop: "40px", borderTop: "1px solid #eee", paddingTop: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
              <div>
                <p style={{ fontWeight: "bold", marginBottom: "30px" }}>Operator Signature:</p>
                <div style={{ borderBottom: "1px solid #000", width: "200px" }}></div>
              </div>
              <div>
                <p style={{ fontWeight: "bold", marginBottom: "30px" }}>Manager Approval:</p>
                <div style={{ borderBottom: "1px solid #000", width: "200px" }}></div>
              </div>
            </div>
            <div style={{ marginTop: "30px", fontSize: "10px", color: "#999" }}>
              AzVirt Document Management System (DMS) | Maintenance Module | Confidential
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
