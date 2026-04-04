import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

type WorkHour = {
  id: number;
  date: string | Date;
  startTime: string | Date;
  endTime?: string | Date | null;
  hoursWorked?: number | null;
  overtimeHours?: number | null;
  workType?: string | null;
  projectId?: number | null;
  project?: string | null;
  status?: string | null;
};

type Employee = {
  id: number;
  firstName: string;
  lastName: string;
  employeeNumber?: string;
  position?: string;
  department?: string;
  hourlyRate?: number | null;
};

type PrintableTimesheetReportProps = {
  employee?: Employee | null;
  workHours: WorkHour[];
  periodLabel: string; // e.g. "Februar 2026" or "Sedmica 10–16. Feb"
  managerName?: string;
};

function formatTime(dt: string | Date | null | undefined) {
  if (!dt) return "—";
  const d = new Date(dt);
  return d.toLocaleTimeString("bs-BA", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dt: string | Date | null | undefined) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("bs-BA");
}

const WORK_TYPE_LABELS: Record<string, string> = {
  regular: "Redovni",
  overtime: "Prekovremeni",
  weekend: "Vikend",
  holiday: "Praznik",
};

export function PrintableTimesheetReport({
  employee,
  workHours,
  periodLabel,
  managerName,
}: PrintableTimesheetReportProps) {
  const totalRegular = workHours.reduce((s, wh) => s + (wh.hoursWorked || 0), 0);
  const totalOvertime = workHours.reduce((s, wh) => s + (wh.overtimeHours || 0), 0);
  const totalGross =
    employee?.hourlyRate
      ? (totalRegular * (employee.hourlyRate || 0) + totalOvertime * (employee.hourlyRate || 0) * 1.5).toFixed(2)
      : null;

  const handlePrint = () => window.print();

  return (
    <>
      {/* Print trigger button – hidden when printing */}
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        className="print:hidden"
        title="Štampaj evidenciju"
      >
        <Printer className="mr-2 h-4 w-4" />
        Štampaj
      </Button>

      {/* Print-only layout */}
      <div className="hidden print:block font-[Arial,sans-serif] text-sm text-black p-8 max-w-[800px] mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 border-b-2 border-gray-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AzVirt d.o.o.</h1>
            <p className="text-gray-600 text-xs mt-1">Evidencija radnih sati</p>
          </div>
          <div className="text-right text-xs text-gray-600">
            <p className="font-bold text-base text-gray-900">EVIDENCIJA RADNIH SATI</p>
            <p>Period: {periodLabel}</p>
            <p>Datum štampe: {new Date().toLocaleDateString("bs-BA")}</p>
          </div>
        </div>

        {/* Employee Info */}
        {employee && (
          <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded border">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Zaposlenik</p>
              <p className="font-bold text-base">{employee.firstName} {employee.lastName}</p>
              <p className="text-xs text-gray-600">Br. zaposlenika: {employee.employeeNumber || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Pozicija / Odjel</p>
              <p className="font-medium">{employee.position || "—"}</p>
              <p className="text-xs text-gray-600">{employee.department || ""}</p>
            </div>
          </div>
        )}

        {/* Work hours table */}
        <table className="w-full border-collapse mb-6 text-xs">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-400 px-2 py-1.5 text-left">Datum</th>
              <th className="border border-gray-400 px-2 py-1.5 text-left">Dolazak</th>
              <th className="border border-gray-400 px-2 py-1.5 text-left">Odlazak</th>
              <th className="border border-gray-400 px-2 py-1.5 text-right">Sati</th>
              <th className="border border-gray-400 px-2 py-1.5 text-right">Prekovr.</th>
              <th className="border border-gray-400 px-2 py-1.5 text-left">Tip</th>
              <th className="border border-gray-400 px-2 py-1.5 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {workHours.length === 0 ? (
              <tr>
                <td colSpan={7} className="border border-gray-300 px-2 py-4 text-center text-gray-500 italic">
                  Nema evidentiranih sati za odabrani period.
                </td>
              </tr>
            ) : (
              workHours.map((wh) => (
                <tr key={wh.id} className="even:bg-gray-50">
                  <td className="border border-gray-300 px-2 py-1">{formatDate(wh.date)}</td>
                  <td className="border border-gray-300 px-2 py-1">{formatTime(wh.startTime)}</td>
                  <td className="border border-gray-300 px-2 py-1">{formatTime(wh.endTime)}</td>
                  <td className="border border-gray-300 px-2 py-1 text-right">{wh.hoursWorked?.toFixed(2) || "—"}</td>
                  <td className="border border-gray-300 px-2 py-1 text-right">{wh.overtimeHours?.toFixed(2) || "—"}</td>
                  <td className="border border-gray-300 px-2 py-1">{WORK_TYPE_LABELS[wh.workType || ""] || (wh.workType || "Redovni")}</td>
                  <td className="border border-gray-300 px-2 py-1 capitalize">{wh.status || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-bold">
              <td colSpan={3} className="border border-gray-400 px-2 py-1.5">UKUPNO</td>
              <td className="border border-gray-400 px-2 py-1.5 text-right">{totalRegular.toFixed(2)}</td>
              <td className="border border-gray-400 px-2 py-1.5 text-right">{totalOvertime.toFixed(2)}</td>
              <td colSpan={2} className="border border-gray-400 px-2 py-1.5">
                {totalGross ? `Bruto: ${totalGross} EUR` : ""}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Summary box */}
        <div className="flex gap-6 mb-8 text-xs bg-gray-50 border p-3 rounded">
          <div>
            <p className="text-gray-500">Redovni sati</p>
            <p className="font-bold text-base">{totalRegular.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500">Prekovremeni</p>
            <p className="font-bold text-base">{totalOvertime.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500">Ukupno sati</p>
            <p className="font-bold text-base">{(totalRegular + totalOvertime).toFixed(2)}</p>
          </div>
          {totalGross && (
            <div>
              <p className="text-gray-500">Bruto iznos</p>
              <p className="font-bold text-base">{totalGross} EUR</p>
            </div>
          )}
        </div>

        {/* Signature section */}
        <div className="grid grid-cols-2 gap-8 mt-8 pt-4 border-t">
          <div>
            <p className="text-xs text-gray-500 mb-8">Potpis zaposlenika:</p>
            <div className="border-b border-gray-400 w-48" />
            <p className="text-xs text-gray-600 mt-1">
              {employee ? `${employee.firstName} ${employee.lastName}` : "Zaposlenik"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-8">Odobrenje menadžera:</p>
            <div className="border-b border-gray-400 w-48" />
            <p className="text-xs text-gray-600 mt-1">{managerName || "Menadžer"}</p>
          </div>
        </div>
      </div>
    </>
  );
}
