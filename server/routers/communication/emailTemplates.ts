import { z } from "zod";
import { router, protectedProcedure } from "../../lib/trpc";

// In-memory store for email templates
// (Ideally should be moved to a DB in production, but preserving original logic)
const emailTemplateStore = new Map<string, any>();

export const emailTemplatesRouter = router({
  getEmailTemplates: protectedProcedure.query(async () => {
    return Array.from(emailTemplateStore.values());
  }),

  getEmailTemplate: protectedProcedure
    .input(z.object({ type: z.string() }))
    .query(async ({ input }) => {
      return emailTemplateStore.get(input.type) ?? null;
    }),

  upsertEmailTemplate: protectedProcedure
    .input(z.object({
      type: z.string(),
      name: z.string(),
      subject: z.string(),
      htmlTemplate: z.string(),
      variables: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      emailTemplateStore.set(input.type, { ...input, updatedAt: new Date().toISOString() });
      return { success: true };
    }),

  deleteEmailTemplate: protectedProcedure
    .input(z.object({ type: z.string() }))
    .mutation(async ({ input }) => {
      emailTemplateStore.delete(input.type);
      return { success: true };
    }),
});
