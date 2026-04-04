import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
  Bell,
  MessageCircle,
} from "lucide-react";

interface Notification {
  id: number;
  taskId: number;
  type: string;
  title: string;
  message: string;
  status: string;
  readAt?: Date | null;
  createdAt: Date;
}

export function NotificationCenter() {
  const { data: notifications = [], isLoading, refetch } = trpc.notifications.getNotifications.useQuery({ limit: 50 });
  const { data: unreadCount = { count: 0 } } = trpc.notifications.getUnreadCount.useQuery();
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation();
  const clearAllMutation = trpc.notifications.clearAll.useMutation();

  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markAsReadMutation.mutateAsync({ notificationId });
      refetch();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllMutation.mutateAsync();
      refetch();
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "overdue_reminder":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "completion_confirmation":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "assignment":
        return <Bell className="w-5 h-5 text-blue-500" />;
      case "status_change":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "comment":
        return <MessageCircle className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "overdue_reminder":
        return "bg-red-50 border-red-200";
      case "completion_confirmation":
        return "bg-green-50 border-green-200";
      case "assignment":
        return "bg-blue-50 border-blue-200";
      case "status_change":
        return "bg-yellow-50 border-yellow-200";
      case "comment":
        return "bg-purple-50 border-purple-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const formatTime = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading notifications...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Notifications</h2>
          {unreadCount.count > 0 && (
            <Badge variant="destructive">{unreadCount.count}</Badge>
          )}
        </div>
        {notifications.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            disabled={clearAllMutation.isPending}
          >
            Clear All
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="p-8 text-center">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No notifications yet</p>
        </Card>
      ) : (
        <ScrollArea className="h-[400px] border rounded-lg">
          <div className="space-y-2 p-4">
            {notifications.map((notification: Notification) => (
              <div
                key={notification.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  getNotificationColor(notification.type)
                } ${notification.status === "read" ? "opacity-60" : ""}`}
                onClick={() =>
                  setExpandedId(
                    expandedId === notification.id ? null : notification.id
                  )
                }
              >
                <div className="flex items-start gap-3">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium truncate">
                        {notification.title}
                      </h3>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>
                    {expandedId === notification.id && (
                      <div className="mt-2 space-y-2">
                        <p className="text-sm text-gray-700">
                          {notification.message}
                        </p>
                        <div className="flex gap-2">
                          {notification.status !== "read" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                              disabled={markAsReadMutation.isPending}
                            >
                              Mark as Read
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
