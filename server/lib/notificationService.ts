import { ENV } from './env';
import { sendEmail } from './email';

export interface NotificationPayload {
  userId: number;
  taskId: number;
  type: 'overdue_reminder' | 'completion_confirmation' | 'assignment' | 'status_change' | 'comment' | 'delivery_delayed';
  title: string;
  message: string;
  channels: ('email' | 'sms' | 'in_app' | 'push')[];
  scheduledFor?: Date;
}

export interface NotificationResult {
  success: boolean;
  notificationId?: number;
  errors?: Record<string, string>;
}

/**
 * Check if current time is within quiet hours
 */
export function isWithinQuietHours(
  quietHoursStart?: string,
  quietHoursEnd?: string
): boolean {
  if (!quietHoursStart || !quietHoursEnd) return false;

  const now = new Date();
  const [startHour, startMin] = quietHoursStart.split(':').map(Number);
  const [endHour, endMin] = quietHoursEnd.split(':').map(Number);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Send email notification
 */
export async function sendEmailNotification(
  recipientEmail: string,
  title: string,
  message: string,
  taskId: number,
  notificationType: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!recipientEmail) {
      return { success: false, error: 'No recipient email provided' };
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; font-size: 24px;">${title}</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Task Notification</p>
        </div>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px;">
          <p style="color: #333; line-height: 1.6;">${message}</p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 12px; margin: 0;">
              This is an automated notification from AzVirt Document Management System.
            </p>
          </div>
        </div>
      </div>
    `;

    // Use the built-in sendEmail function
    await sendEmail({
      to: recipientEmail,
      subject: title,
      html: htmlContent,
    });

    return { success: true };
  } catch (error) {
    console.error('[NotificationService] Email send failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send SMS notification (placeholder for SMS service integration)
 */
export async function sendSmsNotification(
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!phoneNumber) {
      return { success: false, error: 'No phone number provided' };
    }

    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    // For now, this is a placeholder that logs the SMS
    console.log(`[NotificationService] SMS to ${phoneNumber}: ${message}`);

    // In production, you would call your SMS service here:
    // const result = await twilioClient.messages.create({
    //   body: message,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phoneNumber,
    // });

    return { success: true };
  } catch (error) {
    console.error('[NotificationService] SMS send failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Format notification message based on type
 */
export function formatNotificationMessage(
  type: string,
  taskTitle: string,
  additionalInfo?: Record<string, string>
): string {
  const baseMessage = `Task: "${taskTitle}"`;

  switch (type) {
    case 'overdue_reminder':
      return `${baseMessage} is now overdue. Please complete it as soon as possible.`;
    case 'completion_confirmation':
      return `${baseMessage} has been marked as completed. Great work!`;
    case 'assignment':
      return `You have been assigned to: ${baseMessage}`;
    case 'status_change':
      return `${baseMessage} status has been updated to: ${additionalInfo?.newStatus || 'unknown'}`;
    case 'comment':
      return `New comment on ${baseMessage}: ${additionalInfo?.comment || ''}`;
    case 'delivery_delayed':
      return `Delivery is delayed for ${additionalInfo?.driverName || "unknown driver"} (${additionalInfo?.concreteType || "unknown volume"}). Expected ${additionalInfo?.delayDuration || "Mins"} ago.`;
    default:
      return baseMessage;
  }
}

/**
 * Calculate next overdue check time (daily at 9 AM)
 */
export function getNextOverdueCheckTime(): Date {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  // If it's before 9 AM today, schedule for today
  if (now.getHours() < 9) {
    const today = new Date(now);
    today.setHours(9, 0, 0, 0);
    return today;
  }

  return tomorrow;
}

/**
 * Validate notification payload
 */
export function validateNotificationPayload(payload: NotificationPayload): {
  valid: boolean;
  errors?: string[];
} {
  const errors: string[] = [];

  if (!payload.userId || payload.userId <= 0) {
    errors.push('Invalid userId');
  }

  if (!payload.taskId || payload.taskId <= 0) {
    errors.push('Invalid taskId');
  }

  if (!payload.title || payload.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (!payload.message || payload.message.trim().length === 0) {
    errors.push('Message is required');
  }

  if (!payload.channels || payload.channels.length === 0) {
    errors.push('At least one notification channel must be specified');
  }

  if (payload.channels.some(ch => !['email', 'sms', 'in_app', 'push'].includes(ch))) {
    errors.push('Invalid notification channel');
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Build notification context for templates
 */
export function buildNotificationContext(
  type: string,
  taskTitle: string,
  taskDueDate?: Date,
  assignedTo?: string,
  priority?: string
): Record<string, string> {
  return {
    taskTitle,
    taskDueDate: taskDueDate ? taskDueDate.toLocaleDateString() : 'N/A',
    assignedTo: assignedTo || 'N/A',
    priority: priority || 'medium',
    notificationType: type,
    timestamp: new Date().toLocaleString(),
  };
}
