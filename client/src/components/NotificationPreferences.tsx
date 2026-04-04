import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle2, Mail, MessageSquare, Bell } from "lucide-react";

export function NotificationPreferences() {
  const { data: preferences, isLoading } = trpc.notifications.getPreferences.useQuery();
  const updateMutation = trpc.notifications.updatePreferences.useMutation();
  const testMutation = trpc.notifications.sendTestNotification.useMutation();

  const [formData, setFormData] = useState({
    emailEnabled: true,
    smsEnabled: false,
    inAppEnabled: true,
    overdueReminders: true,
    completionNotifications: true,
    assignmentNotifications: true,
    statusChangeNotifications: true,
    quietHoursStart: "",
    quietHoursEnd: "",
    timezone: "UTC",
  });

  const [testingChannel, setTestingChannel] = useState<"email" | "sms" | "in_app" | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (preferences) {
      setFormData({
        emailEnabled: preferences.emailEnabled ?? true,
        smsEnabled: preferences.smsEnabled ?? false,
        inAppEnabled: preferences.inAppEnabled ?? true,
        overdueReminders: preferences.overdueReminders ?? true,
        completionNotifications: preferences.completionNotifications ?? true,
        assignmentNotifications: preferences.assignmentNotifications ?? true,
        statusChangeNotifications: preferences.statusChangeNotifications ?? true,
        quietHoursStart: preferences.quietHoursStart || "",
        quietHoursEnd: preferences.quietHoursEnd || "",
        timezone: preferences.timezone || "UTC",
      });
    }
  }, [preferences]);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save preferences:", error);
    }
  };

  const handleTestNotification = async (channel: "email" | "sms" | "in_app") => {
    try {
      setTestingChannel(channel);
      await testMutation.mutateAsync({ channel });
      setTestingChannel(null);
    } catch (error) {
      console.error("Failed to send test notification:", error);
      setTestingChannel(null);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading preferences...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Channels
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-500" />
                <div>
                  <Label className="font-medium">Email Notifications</Label>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.emailEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, emailEnabled: checked as boolean })
                  }
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestNotification("email")}
                  disabled={!formData.emailEnabled || testingChannel === "email"}
                >
                  {testingChannel === "email" ? "Sending..." : "Test"}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-green-500" />
                <div>
                  <Label className="font-medium">SMS Notifications</Label>
                  <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.smsEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, smsEnabled: checked as boolean })
                  }
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestNotification("sms")}
                  disabled={!formData.smsEnabled || testingChannel === "sms"}
                >
                  {testingChannel === "sms" ? "Sending..." : "Test"}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-purple-500" />
                <div>
                  <Label className="font-medium">In-App Notifications</Label>
                  <p className="text-sm text-gray-500">See notifications in the app</p>
                </div>
              </div>
              <Checkbox
                checked={formData.inAppEnabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, inAppEnabled: checked as boolean })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>
            Choose which types of notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <Checkbox
              checked={formData.overdueReminders}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, overdueReminders: checked as boolean })
              }
            />
            <div>
              <Label className="font-medium">Overdue Task Reminders</Label>
              <p className="text-sm text-gray-500">Get reminded about overdue tasks</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <Checkbox
              checked={formData.completionNotifications}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, completionNotifications: checked as boolean })
              }
            />
            <div>
              <Label className="font-medium">Completion Confirmations</Label>
              <p className="text-sm text-gray-500">Get notified when tasks are completed</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <Checkbox
              checked={formData.assignmentNotifications}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, assignmentNotifications: checked as boolean })
              }
            />
            <div>
              <Label className="font-medium">Task Assignments</Label>
              <p className="text-sm text-gray-500">Get notified when assigned to tasks</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <Checkbox
              checked={formData.statusChangeNotifications}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, statusChangeNotifications: checked as boolean })
              }
            />
            <div>
              <Label className="font-medium">Status Changes</Label>
              <p className="text-sm text-gray-500">Get notified when task status changes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quiet Hours</CardTitle>
          <CardDescription>
            Set a time range when you don't want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quiet-start">Start Time</Label>
              <Input
                id="quiet-start"
                type="time"
                value={formData.quietHoursStart}
                onChange={(e) =>
                  setFormData({ ...formData, quietHoursStart: e.target.value })
                }
                placeholder="HH:MM"
              />
            </div>
            <div>
              <Label htmlFor="quiet-end">End Time</Label>
              <Input
                id="quiet-end"
                type="time"
                value={formData.quietHoursEnd}
                onChange={(e) =>
                  setFormData({ ...formData, quietHoursEnd: e.target.value })
                }
                placeholder="HH:MM"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={formData.timezone} onValueChange={(value) =>
              setFormData({ ...formData, timezone: value })
            }>
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                <SelectItem value="America/Chicago">Central Time</SelectItem>
                <SelectItem value="America/Denver">Mountain Time</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                <SelectItem value="Europe/London">London</SelectItem>
                <SelectItem value="Europe/Paris">Paris</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                <SelectItem value="Australia/Sydney">Sydney</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {saveSuccess && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="text-green-800">Preferences saved successfully</span>
        </div>
      )}

      {updateMutation.isError && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">Failed to save preferences</span>
        </div>
      )}

      <Button
        onClick={handleSave}
        disabled={updateMutation.isPending}
        className="w-full"
        size="lg"
      >
        {updateMutation.isPending ? "Saving..." : "Save Preferences"}
      </Button>
    </div>
  );
}
