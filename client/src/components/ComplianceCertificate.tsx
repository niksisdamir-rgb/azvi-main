import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, FileText, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface ComplianceCertificateProps {
  test: {
    id: number;
    testName: string;
    testType: string;
    result: string;
    unit?: string | null;
    status: string;
    deliveryId?: number | null;
    projectId?: number | null;
    testedBy?: string | null;
    notes?: string | null;
    photoUrls?: string | null;
    inspectorSignature?: string | null;
    supervisorSignature?: string | null;
    testLocation?: string | null;
    complianceStandard?: string | null;
    createdAt: Date;
  };
}

export function ComplianceCertificate({ test }: ComplianceCertificateProps) {
  const [open, setOpen] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const generatePDF = trpc.reports.generateCompliancePDF.useMutation({
    onSuccess: (data) => {
      const link = document.createElement('a');
      link.href = data.pdf;
      link.download = `Certificate-${test.id}.pdf`;
      link.click();
      toast.success("PDF generated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to generate PDF: ${error.message}`);
    }
  });

  const handleDownload = () => {
    generatePDF.mutate({ testId: test.id });
  };

  const certificateNumber = `QC-${test.id.toString().padStart(6, '0')}`;
  const testDate = new Date(test.createdAt).toLocaleDateString('en-GB');
  const photos = test.photoUrls ? JSON.parse(test.photoUrls) : [];

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Certificate
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quality Control Compliance Certificate</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div id="certificate-content" className="bg-white text-black p-8 rounded">
              {/* Header */}
              <div className="border-b-4 border-orange-500 pb-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-orange-500">AzVirt</h1>
                    <p className="text-sm text-gray-600">Concrete Mixing Base</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl font-bold">QUALITY CONTROL CERTIFICATE</h2>
                    <p className="text-sm text-gray-600">Compliance Standard: {test.complianceStandard || 'EN 206'}</p>
                  </div>
                </div>
              </div>

              {/* Certificate Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Certificate Number</p>
                  <p className="font-bold">{certificateNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Test Date</p>
                  <p className="font-bold">{testDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Test Type</p>
                  <p className="font-bold">{test.testType.toUpperCase().replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className={`font-bold ${test.status === 'pass' ? 'text-green-600' : test.status === 'fail' ? 'text-red-600' : 'text-yellow-600'}`}>
                    {test.status.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Test Details */}
              <div className="border border-gray-300 rounded p-4 mb-6">
                <h3 className="font-bold mb-3 text-lg">Test Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Test Name</p>
                    <p className="font-medium">{test.testName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Result</p>
                    <p className="font-medium">{test.result} {test.unit || ''}</p>
                  </div>
                  {test.testedBy && (
                    <div>
                      <p className="text-sm text-gray-600">Tested By</p>
                      <p className="font-medium">{test.testedBy}</p>
                    </div>
                  )}
                  {test.testLocation && (
                    <div>
                      <p className="text-sm text-gray-600">GPS Location</p>
                      <p className="font-medium text-xs">{test.testLocation}</p>
                    </div>
                  )}
                </div>
                {test.notes && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600">Notes</p>
                    <p className="text-sm">{test.notes}</p>
                  </div>
                )}
              </div>

              {/* Photos */}
              {photos.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold mb-3 text-lg">Test Documentation</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {photos.slice(0, 6).map((photo: string, idx: number) => (
                      <img
                        key={idx}
                        src={photo}
                        alt={`Test photo ${idx + 1}`}
                        className="w-full h-32 object-cover rounded border border-gray-300"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-6 mt-8">
                {test.inspectorSignature && (
                  <div className="border-t-2 border-gray-300 pt-2">
                    <img
                      src={test.inspectorSignature}
                      alt="Inspector signature"
                      className="h-16 mb-2"
                    />
                    <p className="text-sm font-medium">Inspector Signature</p>
                    <p className="text-xs text-gray-600">{test.testedBy || 'Inspector'}</p>
                  </div>
                )}
                {test.supervisorSignature && (
                  <div className="border-t-2 border-gray-300 pt-2">
                    <img
                      src={test.supervisorSignature}
                      alt="Supervisor signature"
                      className="h-16 mb-2"
                    />
                    <p className="text-sm font-medium">Supervisor Signature</p>
                    <p className="text-xs text-gray-600">Quality Control Supervisor</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-600">
                <p>This certificate is issued in accordance with {test.complianceStandard || 'EN 206'} standards</p>
                <p>AzVirt Concrete Mixing Base • Quality Assurance Department</p>
                <p className="mt-2">Certificate generated on {new Date().toLocaleDateString('en-GB')}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 print:hidden">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button 
                onClick={handleDownload} 
                className="bg-primary hover:bg-primary/90"
                disabled={generatePDF.isPending}
              >
                {generatePDF.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Download PDF
              </Button>
              <Button onClick={handlePrint} className="bg-orange-500 hover:bg-orange-600">
                Print Certificate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #certificate-content,
          #certificate-content * {
            visibility: visible;
          }
          #certificate-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}
