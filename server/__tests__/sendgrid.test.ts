import { describe, it, expect } from 'vitest';
import { sendEmail } from '../lib/email';

const shouldRun = process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL;
const describeIntegration = shouldRun ? describe : describe.skip;

describeIntegration('SendGrid Email Integration', () => {
  it('should have SendGrid credentials configured', () => {
    expect(process.env.SENDGRID_API_KEY).toBeDefined();
    expect(process.env.SENDGRID_API_KEY).toMatch(/^SG\./);
    expect(process.env.SENDGRID_FROM_EMAIL).toBeDefined();
    expect(process.env.SENDGRID_FROM_EMAIL).toMatch(/@/);
  });

  it('should send a test email successfully', async () => {
    const result = await sendEmail({
      to: process.env.SENDGRID_FROM_EMAIL!, // Send to self for testing
      subject: 'AzVirt DMS - SendGrid Integration Test',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>SendGrid Test</title>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #f97316;">✅ SendGrid Integration Successful!</h1>
          <p>This is a test email from AzVirt DMS to verify SendGrid integration.</p>
          <p>If you're reading this, email delivery is working correctly.</p>
          <hr>
          <p style="font-size: 12px; color: #666;">
            Sent at: ${new Date().toISOString()}<br>
            From: AzVirt Document Management System
          </p>
        </body>
        </html>
      `,
    });

    expect(result).toBe(true);
  }, 15000); // 15 second timeout for API call

  it('should handle invalid email addresses gracefully', async () => {
    const result = await sendEmail({
      to: 'invalid-email',
      subject: 'Test',
      html: '<p>Test</p>',
    });

    expect(result).toBe(false);
  });
});
