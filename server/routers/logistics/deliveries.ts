import { logger } from '../../lib/logger';
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../../lib/trpc";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { getDb } from "../../db";
import { deliveries, deliveryStatusHistory, projects } from "../../../drizzle/schema";
import { storagePut } from "../../storage";
import { sendSMS } from "../../lib/sms";
import { nanoid } from "nanoid";
import * as db from "../../db";
import { invalidateDashboardCaches } from "../../lib/cacheKeys";

const VALID_TRANSITIONS: Record<string, string[]> = {
  scheduled: ['loaded', 'cancelled'],
  loaded: ['en_route', 'cancelled'],
  en_route: ['arrived', 'cancelled'],
  arrived: ['delivered', 'cancelled'],
  delivered: ['returning'],
  returning: ['completed'],
  completed: [],
  cancelled: [],
};

export function validateDeliveryTransition(currentStatus: string, nextStatus: string): boolean {
  if (currentStatus === nextStatus) return true;
  const allowed = VALID_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(nextStatus) : false;
}

// Internal helper for automated notifications
async function sendAutomatedNotification(dbConn: any, deliveryId: number, type: 'en_route' | 'delay') {
  // Fetch delivery along with project preferences
  const [data] = await dbConn
    .select({
      delivery: deliveries,
      project: projects
    })
    .from(deliveries)
    .leftJoin(projects, eq(deliveries.projectId, projects.id))
    .where(eq(deliveries.id, deliveryId));

  if (!data || !data.delivery || !data.delivery.customerPhone) return;
  const { delivery, project } = data;

  // Check project preferences
  if (project) {
    if (type === 'en_route' && !project.notifyOnEnRoute) return;
    if (type === 'delay' && !project.notifyOnDelay) return;
  }

  // Prevent duplicate notifications
  if (type === 'en_route' && delivery.smsNotificationSent) return;
  if (type === 'delay' && delivery.delayNotificationSent) return;

  const formattedETA = delivery.estimatedArrival 
    ? new Date(delivery.estimatedArrival * 1000).toLocaleTimeString() 
    : 'skoro / soon';

  let message = '';
  if (type === 'en_route') {
    message = `Azvirt: Vaša isporuka je na putu. Očekivano vrijeme dolaska: ${formattedETA}. Hvala Vam.`;
  } else if (type === 'delay') {
    message = `Azvirt OBAVJEŠTENJE: Vaša isporuka kasni. Novo vrijeme dolaska: ${formattedETA}. Izvinjavamo se na čekanju.`;
  }

  try {
    await sendSMS({
      phoneNumber: delivery.customerPhone,
      message
    });

    await dbConn.update(deliveries)
      .set({ 
        [type === 'en_route' ? 'smsNotificationSent' : 'delayNotificationSent']: true 
      })
      .where(eq(deliveries.id, deliveryId));
  } catch (error) {
    logger.error({ err: error }, `Failed to send automated ${type} notification:`);
  }
}

export const deliveriesRouter = router({
  list: protectedProcedure
    .input(z.object({
      projectId: z.number().optional(),
      status: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      return await db.getDeliveries(input);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const delivery = await db.getDeliveryById(input.id);
      if (!delivery) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Delivery not found' });
      }
      return delivery;
    }),

  create: protectedProcedure
    .input(z.object({
      projectId: z.number().optional(),
      projectName: z.string(),
      concreteType: z.string(),
      volume: z.number(),
      scheduledTime: z.date(),
      status: z.enum(["scheduled", "loaded", "en_route", "arrived", "delivered", "returning", "completed", "cancelled"]).default("scheduled"),
      driverName: z.string().optional(),
      vehicleNumber: z.string().optional(),
      notes: z.string().optional(),
      gpsLocation: z.string().optional(),
      deliveryPhotos: z.string().optional(),
      estimatedArrival: z.number().optional(),
      actualArrivalTime: z.number().optional(),
      actualDeliveryTime: z.number().optional(),
      driverNotes: z.string().optional(),
      customerName: z.string().optional(),
      customerPhone: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await db.createDelivery({
        ...input,
        createdBy: ctx.user.id,
      });
      await invalidateDashboardCaches();
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      projectId: z.number().optional(),
      projectName: z.string().optional(),
      concreteType: z.string().optional(),
      volume: z.number().optional(),
      scheduledTime: z.date().optional(),
      actualTime: z.date().optional(),
      status: z.enum(["scheduled", "loaded", "en_route", "arrived", "delivered", "returning", "completed", "cancelled"]).optional(),
      driverName: z.string().optional(),
      vehicleNumber: z.string().optional(),
      notes: z.string().optional(),
      gpsLocation: z.string().optional(),
      deliveryPhotos: z.string().optional(),
      estimatedArrival: z.number().optional(),
      actualArrivalTime: z.number().optional(),
      actualDeliveryTime: z.number().optional(),
      driverNotes: z.string().optional(),
      customerName: z.string().optional(),
      customerPhone: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateDelivery(id, data);
      await invalidateDashboardCaches();
      return { success: true };
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["scheduled", "loaded", "en_route", "arrived", "delivered", "returning", "completed", "cancelled"]),
      gpsLocation: z.string().optional(),
      driverNotes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, status, gpsLocation, driverNotes } = input;
      const updateData: any = { status };

      if (gpsLocation) updateData.gpsLocation = gpsLocation;
      if (driverNotes) updateData.driverNotes = driverNotes;

      // Track timestamps
      const now = Math.floor(Date.now() / 1000);
      if (status === 'arrived') updateData.actualArrivalTime = now;
      if (status === 'delivered') updateData.actualDeliveryTime = now;

      await db.updateDelivery(id, updateData);
      await invalidateDashboardCaches();
      return { success: true };
    }),

  uploadDeliveryPhoto: protectedProcedure
    .input(z.object({
      deliveryId: z.number(),
      photoData: z.string(),
      mimeType: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const photoBuffer = Buffer.from(input.photoData, 'base64');
      const fileExtension = input.mimeType.split('/')[1] || 'jpg';
      const fileKey = `delivery-photos/${ctx.user.id}/${nanoid()}.${fileExtension}`;

      const { url } = await storagePut(fileKey, photoBuffer, input.mimeType);

      // Fetch single delivery by ID (avoids loading entire table)
      const delivery = await db.getDeliveryById(input.deliveryId);
      if (!delivery) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Delivery not found' });
      }
      const existingPhotos: string[] = Array.isArray(delivery.deliveryPhotos)
        ? delivery.deliveryPhotos as string[]
        : typeof delivery.deliveryPhotos === 'string'
          ? JSON.parse(delivery.deliveryPhotos as string)
          : [];
          
      existingPhotos.push(url);
      await db.updateDelivery(input.deliveryId, { deliveryPhotos: existingPhotos });

      return { success: true, url, totalPhotos: existingPhotos.length };
    }),

  updateGpsLocation: protectedProcedure
    .input(z.object({
      id: z.number(),
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    }))
    .mutation(async ({ input }) => {
      const gpsLocation = `${input.latitude},${input.longitude}`;
      await db.updateDelivery(input.id, { gpsLocation });
      return { success: true, gpsLocation };
    }),

  // Public endpoint for driver mobile app — uses vehicleNumber as lightweight shared secret.
  driverUpdateStatus: publicProcedure
    .input(z.object({
      deliveryId: z.number(),
      vehicleNumber: z.string(),
      status: z.enum(["loaded", "en_route", "arrived", "delivered", "returning", "completed"]),
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
      driverNotes: z.string().max(1000).optional(),
    }))
    .mutation(async ({ input }) => {
      const delivery = await db.getDeliveryById(input.deliveryId);
      if (!delivery) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Delivery not found' });
      }
      if (delivery.vehicleNumber !== input.vehicleNumber) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid vehicle number for this delivery' });
      }

      const now = Math.floor(Date.now() / 1000);
      const updateData: Record<string, unknown> = { status: input.status };

      if (input.latitude !== undefined && input.longitude !== undefined) {
        updateData.gpsLocation = `${input.latitude},${input.longitude}`;
      }
      if (input.driverNotes) updateData.driverNotes = input.driverNotes;
      if (input.status === 'arrived')   updateData.actualArrivalTime   = now;
      if (input.status === 'delivered') updateData.actualDeliveryTime  = now;

      await db.updateDelivery(input.deliveryId, updateData as any);
      await invalidateDashboardCaches();
      return { success: true, status: input.status };
    }),

  getActiveDeliveries: protectedProcedure.query(async () => {
    return await db.getDeliveries({ statusGroup: 'active' });
  }),

  sendCustomerNotification: protectedProcedure
    .input(z.object({
      deliveryId: z.number(),
      message: z.string().max(160),
    }))
    .mutation(async ({ input }) => {
      const delivery = await db.getDeliveryById(input.deliveryId);

      if (!delivery) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Delivery not found' });
      }
      if (!delivery.customerPhone) {
        return { success: false, message: 'No customer phone number on this delivery' };
      }

      const smsResult = await sendSMS({
        phoneNumber: delivery.customerPhone,
        message: input.message,
      }).catch((err: unknown) => {
        logger.error({ err: err }, '[SMS] Failed to send customer notification:');
        return { success: false };
      });

      if (smsResult.success) {
        await db.updateDelivery(input.deliveryId, { smsNotificationSent: true });
      }

      return {
        success: smsResult.success,
        message: smsResult.success ? 'SMS sent successfully' : 'SMS service unavailable',
      };
    }),

  getHistory: protectedProcedure
    .input(z.object({ deliveryId: z.number() }))
    .query(async ({ input }) => {
      return await db.getDeliveryStatusHistory(input.deliveryId);
    }),

  calculateETA: protectedProcedure
    .input(z.object({
      deliveryId: z.number(),
      startLocation: z.string(),
      endLocation: z.string(),
    }))
    .mutation(async ({ input }) => {
      const eta = await db.calculateETA(input.deliveryId, input.startLocation, input.endLocation);
      return { success: true, eta };
    }),

  // Original methods from deliveries.ts
  updateDeliveryStatus: protectedProcedure
    .input(z.object({
      deliveryId: z.number(),
      status: z.enum(["scheduled", "loaded", "en_route", "arrived", "delivered", "returning", "completed", "cancelled"]),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      notes: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const dbConn = await getDb();
      if (!dbConn) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection not available",
        });
      }

      // Fetch current status
      const [delivery] = await dbConn.select().from(deliveries).where(eq(deliveries.id, input.deliveryId));
      
      if (!delivery) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Delivery not found",
        });
      }

      if (!validateDeliveryTransition(delivery.status, input.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid status transition from ${delivery.status} to ${input.status}`,
        });
      }

      // Update delivery and insert history transactionally
      await dbConn.transaction(async (tx) => {
        await tx.update(deliveries)
          .set({ 
            status: input.status,
            ...(input.latitude !== undefined && input.longitude !== undefined ? {
               latitude: input.latitude,
               longitude: input.longitude,
               gpsLocation: `${input.latitude},${input.longitude}`
            } : {}),
            updatedAt: new Date()
          })
          .where(eq(deliveries.id, input.deliveryId));

        await tx.insert(deliveryStatusHistory).values({
          deliveryId: input.deliveryId,
          status: input.status,
          userId: ctx.user.id,
          latitude: input.latitude,
          longitude: input.longitude,
          gpsLocation: (input.latitude !== undefined && input.longitude !== undefined) ? `${input.latitude},${input.longitude}` : undefined,
          notes: input.notes,
        });
      });

      // Auto-trigger notification if en_route
      if (input.status === 'en_route') {
        await sendAutomatedNotification(dbConn, input.deliveryId, 'en_route');
      }

      await invalidateDashboardCaches();
      return { success: true, status: input.status };
    }),

  getAllDeliveries: protectedProcedure
    .input(z.object({
      statusFilter: z.enum(['all', 'active', 'completed', 'delayed']).optional().default('all')
    }))
    .query(async ({ input }) => {
      const dbConn = await getDb();
      if (!dbConn) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection not available",
        });
      }

      const now = Math.floor(Date.now() / 1000);
      const fifteenMinutes = 15 * 60;

      let conditions: any[] = [];

      if (input.statusFilter === 'active') {
        conditions.push(or(
          eq(deliveries.status, 'scheduled'),
          eq(deliveries.status, 'loaded'),
          eq(deliveries.status, 'en_route'),
          eq(deliveries.status, 'arrived')
        ));
      } else if (input.statusFilter === 'completed') {
        conditions.push(or(
          eq(deliveries.status, 'delivered'),
          eq(deliveries.status, 'completed'),
          eq(deliveries.status, 'returning')
        ));
      } else if (input.statusFilter === 'delayed') {
        conditions.push(and(
          sql`${deliveries.estimatedArrival} IS NOT NULL`,
          or(
            and(
              or(
                eq(deliveries.status, 'scheduled'),
                eq(deliveries.status, 'loaded'),
                eq(deliveries.status, 'en_route')
              ),
              sql`${now} > ${deliveries.estimatedArrival} + ${fifteenMinutes}`
            ),
            and(
              sql`${deliveries.actualArrivalTime} IS NOT NULL`,
              sql`${deliveries.actualArrivalTime} > ${deliveries.estimatedArrival} + ${fifteenMinutes}`
            )
          )
        ));
      }

      const deliveriesData = await dbConn.select({
        id: deliveries.id,
        projectId: deliveries.projectId,
        projectName: deliveries.projectName,
        projectLocation: projects.location,
        concreteType: deliveries.concreteType,
        volume: deliveries.volume,
        scheduledTime: deliveries.scheduledTime,
        status: deliveries.status,
        driverName: deliveries.driverName,
        vehicleNumber: deliveries.vehicleNumber,
        latitude: deliveries.latitude,
        longitude: deliveries.longitude,
        etaUpdatedAt: deliveries.etaUpdatedAt,
        estimatedArrival: deliveries.estimatedArrival,
        actualArrivalTime: deliveries.actualArrivalTime,
        actualDeliveryTime: deliveries.actualDeliveryTime,
        driverNotes: deliveries.driverNotes,
        deliveryPhotos: deliveries.deliveryPhotos,
        customerPhone: deliveries.customerPhone,
        smsNotificationSent: deliveries.smsNotificationSent,
      })
      .from(deliveries)
      .leftJoin(projects, eq(deliveries.projectId, projects.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(deliveries.scheduledTime));

      return deliveriesData;
    }),

  getDeliveryAnalytics: protectedProcedure
    .query(async () => {
      const analytics = await db.getDeliveryAnalytics();
      if (!analytics) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not fetch delivery analytics",
        });
      }
      return analytics;
    }),
});
