import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface DeliveryNoteProps {
  delivery: {
    id: number;
    projectName: string;
    concreteType: string;
    volume: number;
    scheduledTime: Date;
    driverName?: string | null;
    vehicleNumber?: string | null;
    notes?: string | null;
    status: string;
  };
}

export function DeliveryNote({ delivery }: DeliveryNoteProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="delivery-note-container">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .delivery-note-container,
          .delivery-note-container * {
            visibility: visible;
          }
          .delivery-note-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
          }
          .no-print {
            display: none !important;
          }
          .print-page {
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="no-print mb-4">
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Print Delivery Note
        </Button>
      </div>

      <div className="print-page bg-white text-black p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
        {/* Header */}
        <div className="border-b-4 border-primary pb-4 mb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src="/azvirt-logo.webp" alt="AzVirt" className="h-16 w-auto" />
            <div>
              <p className="text-sm text-gray-600">Limited Liability Company</p>
              <p className="text-xs text-gray-500 mt-1">30 Years of Excellence</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-primary" style={{ fontFamily: "'Rethink Sans', Arial, sans-serif" }}>
              OTPREMNICA
            </h2>
            <p className="text-sm font-medium text-blue-600">ROAD TO THE FUTURE!</p>
          </div>
        </div>

        {/* Delivery Information */}
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-bold text-blue-600 mb-3 flex items-center gap-2 border-b-2 border-primary pb-2">
            <span className="text-primary">📋</span>
            Podaci o isporuci
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="font-medium text-gray-600 py-2">Broj otpremnice:</td>
                    <td className="font-bold">#{delivery.id.toString().padStart(6, '0')}</td>
                  </tr>
                  <tr>
                    <td className="font-medium text-gray-600 py-2">Naziv projekta:</td>
                    <td className="font-bold text-primary">{delivery.projectName}</td>
                  </tr>
                  <tr>
                    <td className="font-medium text-gray-600 py-2">Tip betona:</td>
                    <td className="font-bold">{delivery.concreteType}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="font-medium text-gray-600 py-2">Zapremina:</td>
                    <td className="font-bold">{delivery.volume} m³</td>
                  </tr>
                  <tr>
                    <td className="font-medium text-gray-600 py-2">Datum i vreme:</td>
                    <td className="font-bold">{new Date(delivery.scheduledTime).toLocaleString('sr-RS')}</td>
                  </tr>
                  <tr>
                    <td className="font-medium text-gray-600 py-2">Status:</td>
                    <td className="font-bold uppercase">{delivery.status}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Vehicle and Driver Information */}
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-bold text-blue-600 mb-3 flex items-center gap-2 border-b-2 border-primary pb-2">
            <span className="text-primary">🚛</span>
            Podaci o vozilu i vozaču
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="font-medium text-gray-600 py-2">Ime vozača:</td>
                    <td className="font-bold">{delivery.driverName || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="font-medium text-gray-600 py-2">Tablice vozila:</td>
                    <td className="font-bold">{delivery.vehicleNumber || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Concrete Composition Table */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-blue-600 mb-3 flex items-center gap-2 border-b-2 border-primary pb-2">
            <span className="text-primary">⚗️</span>
            Sastav betona
          </h3>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-primary text-white">
                <th className="border border-gray-300 p-2 text-center" colSpan={2}>Cement</th>
                <th className="border border-gray-300 p-2 text-center" colSpan={3}>Agregat</th>
                <th className="border border-gray-300 p-2 text-center">Voda</th>
                <th className="border border-gray-300 p-2 text-center" colSpan={2}>Aditivi</th>
              </tr>
              <tr className="bg-blue-600 text-white">
                <th className="border border-gray-300 p-2">Tip</th>
                <th className="border border-gray-300 p-2">Količina (kg)</th>
                <th className="border border-gray-300 p-2">0-4mm</th>
                <th className="border border-gray-300 p-2">4-8mm</th>
                <th className="border border-gray-300 p-2">8-16mm</th>
                <th className="border border-gray-300 p-2">Litara</th>
                <th className="border border-gray-300 p-2">Tip</th>
                <th className="border border-gray-300 p-2">Količina</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2">CEM II 42.5</td>
                <td className="border border-gray-300 p-2 text-center">350</td>
                <td className="border border-gray-300 p-2 text-center">800</td>
                <td className="border border-gray-300 p-2 text-center">400</td>
                <td className="border border-gray-300 p-2 text-center">600</td>
                <td className="border border-gray-300 p-2 text-center">175</td>
                <td className="border border-gray-300 p-2">Plastifikator</td>
                <td className="border border-gray-300 p-2 text-center">2.5 L</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Quality Parameters */}
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-bold text-blue-600 mb-3 flex items-center gap-2 border-b-2 border-primary pb-2">
            <span className="text-primary">🔬</span>
            Parametri kvaliteta
          </h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-600">Slump test:</p>
              <p className="font-bold">120 mm</p>
            </div>
            <div>
              <p className="font-medium text-gray-600">Temperatura:</p>
              <p className="font-bold">18°C</p>
            </div>
            <div>
              <p className="font-medium text-gray-600">Sadržaj vazduha:</p>
              <p className="font-bold">4.5%</p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {delivery.notes && (
          <div className="mb-6 bg-yellow-50 rounded-lg p-4 border-l-4 border-primary">
            <h3 className="text-lg font-bold text-gray-700 mb-2">Napomene:</h3>
            <p className="text-sm italic text-gray-600">{delivery.notes}</p>
          </div>
        )}

        {/* Signatures */}
        <div className="mt-8 grid grid-cols-3 gap-8">
          <div className="text-center">
            <p className="font-bold mb-2">Vozač</p>
            <div className="border-t-2 border-gray-800 mt-12 pt-2">
              <p className="text-sm italic text-gray-600">{delivery.driverName || '_________________'}</p>
            </div>
          </div>
          <div className="text-center">
            <p className="font-bold mb-2">Primalac</p>
            <div className="border-t-2 border-gray-800 mt-12 pt-2">
              <p className="text-sm italic text-gray-600">_________________</p>
            </div>
          </div>
          <div className="text-center">
            <p className="font-bold mb-2">Kontrola kvaliteta</p>
            <div className="border-t-2 border-gray-800 mt-12 pt-2">
              <p className="text-sm italic text-gray-600">_________________</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>AZVIRT d.o.o. | Beograd, Srbija | Tel: +381 11 XXX XXXX | Email: info@azvirt.rs</p>
          <p className="mt-1">Ovaj dokument je važeći samo sa pečatom i potpisom ovlašćenog lica</p>
        </div>
      </div>
    </div>
  );
}
