import { z } from "zod";
import { router, protectedProcedure } from "../../lib/trpc";
import { storagePut } from "../../storage";
import { nanoid } from "nanoid";
import * as db from "../../db";

export const brandingRouter = router({
  get: protectedProcedure.query(async () => {
    return await db.getEmailBranding();
  }),

  update: protectedProcedure
    .input(z.object({
      logoUrl: z.string().optional(),
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      companyName: z.string().optional(),
      footerText: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.upsertEmailBranding(input);
      return { success: true };
    }),

  uploadLogo: protectedProcedure
    .input(z.object({
      fileData: z.string(), // base64 encoded image
      fileName: z.string(),
      mimeType: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
      if (!allowedTypes.includes(input.mimeType)) {
        throw new Error('Invalid file type. Only PNG, JPG, and SVG are allowed.');
      }

      // Decode base64 and upload to S3
      const buffer = Buffer.from(input.fileData, 'base64');

      // Check file size (max 2MB)
      if (buffer.length > 2 * 1024 * 1024) {
        throw new Error('File size must be less than 2MB');
      }

      const fileKey = `branding/logo-${nanoid()}-${input.fileName}`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      // Update branding with new logo URL
      await db.upsertEmailBranding({ logoUrl: url });

      return { url };
    }),
});
