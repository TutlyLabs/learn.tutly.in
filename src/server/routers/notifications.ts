import { NotificationEvent, NotificationMedium } from "@prisma/client";
import webPush from "web-push";
import { z } from "zod";

// todo: remove usage of db directly
import db from "@/lib/db";
import { envOrThrow } from "@/lib/utils";

import { createTRPCRouter, protectedProcedure } from "../trpc";

webPush.setVapidDetails(
  envOrThrow("VAPID_SUBJECT"),
  envOrThrow("PUBLIC_VAPID_PUBLIC_KEY"),
  envOrThrow("VAPID_PRIVATE_KEY")
);

async function sendPushNotification(userId: string, message: string, notificationId: string) {
  const subscription = await db.pushSubscription.findFirst({
    where: { userId },
  });

  if (!subscription) return;

  try {
    await webPush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify({
        message,
        id: notificationId,
        type: "NOTIFICATION",
      })
    );
  } catch (error) {
    console.error("Failed to send push notification:", error);
    if ((error as any).statusCode === 410) {
      await db.pushSubscription.delete({
        where: { endpoint: subscription.endpoint },
      });
    }
  }
}

export const notificationsRouter = createTRPCRouter({
  getNotifications: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id!;
    const notifications = await ctx.db.notification.findMany({
      where: { intendedForId: userId },
      orderBy: { createdAt: "desc" },
    });
    return notifications;
  }),

  toggleReadStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const notification = await ctx.db.notification.findUnique({
        where: { id: input.id },
      });

      const updatedNotification = await ctx.db.notification.update({
        where: { id: input.id },
        data: {
          readAt: notification?.readAt ? null : new Date(),
        },
      });
      return updatedNotification;
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user?.id!;
    await ctx.db.notification.updateMany({
      where: {
        intendedForId: userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  }),

  getNotificationConfig: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const subscription = await ctx.db.pushSubscription.findFirst({
        where: { userId: input.userId },
      });
      return subscription;
    }),

  updateNotificationConfig: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        config: z.object({
          endpoint: z.string(),
          p256dh: z.string(),
          auth: z.string(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { userId, config } = input;
      const { endpoint, p256dh, auth } = config;

      // Delete existing subscription if endpoint is empty
      if (!endpoint) {
        await ctx.db.pushSubscription.deleteMany({
          where: { userId },
        });
        return null;
      }

      // Upsert subscription
      const subscription = await ctx.db.pushSubscription.upsert({
        where: {
          endpoint,
        },
        update: {
          p256dh,
          auth,
        },
        create: {
          userId,
          endpoint,
          p256dh,
          auth,
        },
      });

      return subscription;
    }),

  notifyUser: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const notification = await ctx.db.notification.create({
        data: {
          message: input.message,
          eventType: NotificationEvent.CUSTOM_MESSAGE,
          causedById: ctx.user?.id!,
          intendedForId: input.userId,
          mediumSent: NotificationMedium.NOTIFICATION,
        },
      });

      await sendPushNotification(input.userId, input.message, notification.id);

      return notification;
    }),

  notifyBulkUsers: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        message: z.string(),
        customLink: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const enrolledUsers = await db.enrolledUsers.findMany({
        where: {
          courseId: input.courseId,
          user: {
            role: {
              in: ["STUDENT", "MENTOR"],
            },
            organizationId: ctx.user?.organizationId!,
          },
        },
        select: { user: { select: { id: true } } },
      });

      const notifications = await Promise.all(
        enrolledUsers.map((user) =>
          db.notification.create({
            data: {
              message: input.message,
              eventType: NotificationEvent.CUSTOM_MESSAGE,
              causedById: ctx.user?.id!,
              intendedForId: user.user.id,
              mediumSent: NotificationMedium.NOTIFICATION,
              customLink: input.customLink || null,
            },
          })
        )
      );

      await Promise.all(
        enrolledUsers.map(async (enrolled, index) => {
          const notification = notifications[index];
          if (!notification) {
            throw new Error("Notification not found");
          }
          await sendPushNotification(enrolled.user.id, input.message, notification.id);
        })
      );

      return notifications;
    }),
});
