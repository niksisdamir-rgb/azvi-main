import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Mail, Send, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

export default function ReportSettings() {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);

  const sendTestReport = trpc.reports.sendDailyProductionEmail.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Daily production report sent successfully!");
      } else {
        toast.error("Failed to send report. Please check the email address.");
      }
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleSendTest = () => {
    if (!recipientEmail) {
      toast.error("Please enter a recipient email address");
      return;
    }

    sendTestReport.mutate({
      date: testDate,
      recipientEmail: recipientEmail,
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Report Settings</h1>
          <p className="text-muted-foreground">Configure automated daily production reports</p>
        </div>

        {/* Scheduled Report Info */}
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Automated Daily Reports Active</AlertTitle>
          <AlertDescription>
            Production reports are automatically sent every day at <strong>6:00 PM</strong> to the configured email address.
            The report includes concrete production, deliveries, material consumption, and quality control statistics.
          </AlertDescription>
        </Alert>

        {/* Email Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Configuration
            </CardTitle>
            <CardDescription>
              Set the recipient email address for daily production reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="recipientEmail">Recipient Email Address</Label>
              <Input
                id="recipientEmail"
                type="email"
                placeholder="manager@azvirt.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                This email will receive the automated daily production reports at 6 PM
              </p>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium mb-3">Test Report</h3>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="testDate">Report Date</Label>
                  <Input
                    id="testDate"
                    type="date"
                    value={testDate}
                    onChange={(e) => setTestDate(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Select a date to generate a test report
                  </p>
                </div>

                <Button 
                  onClick={handleSendTest}
                  disabled={sendTestReport.isPending}
                  className="w-full sm:w-auto"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {sendTestReport.isPending ? "Sending..." : "Send Test Report Now"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Content Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Report Content</CardTitle>
            <CardDescription>What's included in the daily production report</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Concrete Production</p>
                  <p className="text-sm text-muted-foreground">Total cubic meters of concrete produced and delivered</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Delivery Statistics</p>
                  <p className="text-sm text-muted-foreground">Number of deliveries completed successfully</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Material Consumption</p>
                  <p className="text-sm text-muted-foreground">Breakdown of materials used (cement, sand, gravel, etc.)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Quality Control</p>
                  <p className="text-sm text-muted-foreground">Total tests performed, pass rate, and failed tests</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Information */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule Information</CardTitle>
            <CardDescription>When and how reports are sent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frequency:</span>
                <span className="font-medium">Daily</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time:</span>
                <span className="font-medium">6:00 PM (18:00)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Report Period:</span>
                <span className="font-medium">Previous day's data</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Format:</span>
                <span className="font-medium">HTML Email</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Language:</span>
                <span className="font-medium">Bilingual (Bosnian/English)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
