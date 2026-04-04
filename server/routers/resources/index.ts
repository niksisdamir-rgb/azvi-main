import { z } from "zod";
import { router, protectedProcedure, permissionProcedure } from "../../lib/trpc";
import { storagePut } from "../../storage";
import { nanoid } from "nanoid";
import * as db from "../../db";

import { TRPCError } from "@trpc/server";

export const documentsRouter = router({
  list: protectedProcedure
    .input(z.object({
      projectId: z.number().optional(),
      category: z.string().optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      const docs = await db.getDocuments(input);
      
      // Strict verification for sensitive categories
      const sensitiveCategories = ["contract", "invoice"];
      
      if (ctx.user.role === "admin") return docs;

      return docs.filter(doc => 
        !sensitiveCategories.includes(doc.category) || 
        doc.uploadedBy === ctx.user.id
      );
    }),

  upload: permissionProcedure("upload:documents")
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      fileData: z.string(),
      mimeType: z.string(),
      fileSize: z.number(),
      category: z.enum(["contract", "blueprint", "report", "certificate", "invoice", "other"]),
      projectId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const fileBuffer = Buffer.from(input.fileData, 'base64');
      const fileExtension = input.mimeType.split('/')[1] || 'bin';
      const fileKey = `documents/${ctx.user.id}/${nanoid()}.${fileExtension}`;

      const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);

      // Save to local documents directory for RAG ingestion
      try {
        const fs = await import('fs');
        const path = await import('path');
        const ragDocsDir = path.join(process.cwd(), 'rag_poc', 'documents', String(ctx.user.id));
        if (!fs.existsSync(ragDocsDir)) {
          fs.mkdirSync(ragDocsDir, { recursive: true });
        }
        
        // Use a safe filename, fallback to nanoid if no name
        const safeName = input.name.replace(/[^a-zA-Z0-9.-]/g, '_') || `${nanoid()}.${fileExtension}`;
        const localFilePath = path.join(ragDocsDir, safeName);
        fs.writeFileSync(localFilePath, fileBuffer);

        // Trigger Python backend to ingest the new document
        await fetch('http://127.0.0.1:8000/ingest', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: ctx.user.id, filename: safeName })
        });
      } catch (e) {
        console.error("Failed to save local copy or trigger RAG ingest", e);
      }

      await db.createDocument({
        name: input.name,
        description: input.description,
        fileKey,
        fileUrl: url,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        category: input.category,
        projectId: input.projectId,
        uploadedBy: ctx.user.id,
      });

      return { success: true, url };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const doc = await db.getDocumentById(input.id);
      if (!doc) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
      }

      if (ctx.user.role !== "admin" && doc.uploadedBy !== ctx.user.id) {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: "You do not have permission to delete this document" 
        });
      }

      await db.deleteDocument(input.id);
      return { success: true };
    }),
});
