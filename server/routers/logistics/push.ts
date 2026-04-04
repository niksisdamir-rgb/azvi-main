import { z } from "zod";
import { publicProcedure, router } from "../../lib/trpc";
import { users } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { getDb } from "../../db";

export const pushRouter = router({
  subscribe: publicProcedure
    .input(z.any())
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      await db
        .update(users)
        .set({ pushSubscription: input })
        .where(eq(users.id, ctx.user.id));

      return { success: true };
    }),
});
