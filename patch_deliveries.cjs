const fs = require('fs');

let content = fs.readFileSync('server/routers/logistics/deliveries.ts', 'utf-8');

// Replace imports at the top
content = content.replace(
`import { z } from "zod";
import { router, protectedProcedure } from "../lib/trpc";
import { TRPCError } from "@trpc/server";
import { eq, inArray } from "drizzle-orm";
import { getDb } from "../../db";
import { deliveries, deliveryStatusHistory } from "../../drizzle/schema";

const VALID_TRANSITIONS`,
`import { z } from "zod";
import { router, protectedProcedure } from "../lib/trpc";
import { TRPCError } from "@trpc/server";
import { eq, inArray } from "drizzle-orm";
import { getDb } from "../../db";
import { deliveries, deliveryStatusHistory, projects } from "../../drizzle/schema";
import { storagePut } from "../../storage";
import { sendSMS } from "../lib/sms";
import { nanoid } from "nanoid";

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

const VALID_TRANSITIONS`
);

// Add procedures at the end
const endToReplace = `      return activeDeliveries;
    }),
});`;

const newProcedures = `      return activeDeliveries;
    }),

  uploadDeliveryPhoto: protectedProcedure
    .input(z.object({
      deliveryId: z.number(),
      photoData: z.string(), // base64
      mimeType: z.string(),
      latitude: z.number().optional(),
      longitude: z.number().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      // Validate file type
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedMimeTypes.includes(input.mimeType)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid file type. Only JPEG, PNG, and WebP are allowed."
        });
      }

      // Base64 size estimation
      const base64Data = input.photoData.replace(/^data:image\\/\\w+;base64,/, "");
      const sizeInBytes = (base64Data.length * 3) / 4;
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (sizeInBytes > MAX_SIZE) {
        throw new TRPCError({
          code: "PAYLOAD_TOO_LARGE",
          message: "Photo size exceeds the maximum limit of 5MB."
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection not available"
        });
      }

      const [delivery] = await db.select().from(deliveries).where(eq(deliveries.id, input.deliveryId));
      if (!delivery) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Delivery not found" });
      }

      const buffer = Buffer.from(base64Data, 'base64');
      const ext = input.mimeType.split('/')[1] || 'jpg';
      const fileKey = \`deliveries/\${input.deliveryId}/\${nanoid()}.\${ext}\`;

      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      const newPhotoRecord = {
        url,
        timestamp: new Date().toISOString(),
        latitude: input.latitude,
        longitude: input.longitude,
        uploadedBy: ctx.user.id
      };

      const existingPhotos = Array.isArray(delivery.deliveryPhotos) 
        ? delivery.deliveryPhotos 
        : [];
      const updatedPhotos = [...existingPhotos, newPhotoRecord];

      await db.update(deliveries)
        .set({ deliveryPhotos: updatedPhotos, updatedAt: new Date() })
        .where(eq(deliveries.id, input.deliveryId));

      return { success: true, url };
    }),

  getDeliveryHistory: protectedProcedure
    .input(z.object({
      deliveryId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection not available"
        });
      }

      const history = await db.select()
        .from(deliveryStatusHistory)
        .where(eq(deliveryStatusHistory.deliveryId, input.deliveryId))
        .orderBy(deliveryStatusHistory.timestamp);

      return history;
    }),

  calculateETA: protectedProcedure
    .input(z.object({
      deliveryId: z.number(),
      latitude: z.number(),
      longitude: z.number()
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection not available"
        });
      }

      const [delivery] = await db.select().from(deliveries).where(eq(deliveries.id, input.deliveryId));
      if (!delivery) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Delivery not found" });
      }

      if (!delivery.projectId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Delivery has no associated project ID" });
      }

      const [project] = await db.select().from(projects).where(eq(projects.id, delivery.projectId));
      if (!project || !project.location) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project destination location not found" });
      }

      // Try parsing project.location as "lat,lng"
      const [destLatStr, destLngStr] = project.location.split(',');
      const destLat = parseFloat(destLatStr);
      const destLng = parseFloat(destLngStr);

      if (isNaN(destLat) || isNaN(destLng)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Project location is not in lat,lng format" });
      }

      const distanceKm = calculateHaversineDistance(input.latitude, input.longitude, destLat, destLng);

      // Assume base speed is 40 km/h
      let speedKmh = 40;

      // Simulated traffic modifier based on current hour
      const currentHour = new Date().getHours();
      if ((currentHour >= 7 && currentHour <= 9) || (currentHour >= 16 && currentHour <= 18)) {
        // Rush hour: 50% slower
        speedKmh *= 0.5;
      }

      const hoursNeeded = distanceKm / speedKmh;
      const secondsNeeded = hoursNeeded * 3600;

      const estimatedArrival = Math.floor(Date.now() / 1000) + secondsNeeded;
      const etaUpdatedAt = new Date();

      await db.update(deliveries)
        .set({
          estimatedArrival,
          etaUpdatedAt,
          latitude: input.latitude,
          longitude: input.longitude,
          gpsLocation: \`\${input.latitude},\${input.longitude}\`
        })
        .where(eq(deliveries.id, input.deliveryId));

      return {
        estimatedArrival,
        etaUpdatedAt,
        distanceKm
      };
    }),

  sendCustomerNotification: protectedProcedure
    .input(z.object({
      deliveryId: z.number()
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection not available"
        });
      }

      const [delivery] = await db.select().from(deliveries).where(eq(deliveries.id, input.deliveryId));
      
      if (!delivery) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Delivery not found" });
      }

      if (!delivery.customerPhone) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Customer phone number not available" });
      }

      const formattedETA = delivery.estimatedArrival 
        ? new Date(delivery.estimatedArrival * 1000).toLocaleTimeString() 
        : 'soon';

      const message = \`Azvirt Delivery: Your concrete delivery is currently \${delivery.status.replace('_', ' ')} and is expected to arrive at \${formattedETA}.\`;

      try {
        await sendSMS({
          phoneNumber: delivery.customerPhone,
          message
        });

        await db.update(deliveries)
          .set({ smsNotificationSent: true })
          .where(eq(deliveries.id, input.deliveryId));

        return { success: true, sentTo: delivery.customerPhone };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: \`Failed to send SMS: \${error.message}\`
        });
      }
    }),
});`;

content = content.replace(endToReplace, newProcedures);
content = content.replace(endToReplace + '\n', newProcedures + '\n');

fs.writeFileSync('server/routers/deliveries.ts', content);
console.log('Patched deliveries.ts successfully');
