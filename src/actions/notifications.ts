import { NotificationEvent, NotificationMedium } from "@prisma/client";
import { defineAction } from "astro:actions";
import { z } from "zod";

import db from "@/lib/db";

export const getNotifications = defineAction({
  async handler(_, { locals }) {
    const userId = locals.user?.id!;
    const notifications = await db.notification.findMany({
      where: { intendedForId: userId },
      orderBy: { createdAt: "desc" },
    });
    return notifications;
  },
});

export const toggleNotificationAsReadStatus = defineAction({
  input: z.object({
    id: z.string(),
  }),
  async handler({ id }) {
    const notification = await db.notification.findUnique({
      where: { id },
    });

    const updatedNotification = await db.notification.update({
      where: { id },
      data: {
        readAt: notification?.readAt ? null : new Date(),
      },
    });
    return updatedNotification;
  },
});

export const markAllNotificationsAsRead = defineAction({
  async handler(_, { locals }) {
    const userId = locals.user?.id!;
    await db.notification.updateMany({
      where: {
        intendedForId: userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  },
});

export const getNotificationConfig = defineAction({
  input: z.object({
    userId: z.string(),
  }),
  async handler({ userId }) {
    const subscription = await db.pushSubscription.findFirst({
      where: { userId },
    });
    return subscription;
  },
});

export const updateNotificationConfig = defineAction({
  input: z.object({
    userId: z.string(),
    config: z.object({
      endpoint: z.string(),
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
  async handler({ userId, config }) {
    const { endpoint, p256dh, auth } = config;

    // Delete existing subscription if endpoint is empty
    if (!endpoint) {
      await db.pushSubscription.deleteMany({
        where: { userId },
      });
      return null;
    }

    // Upsert subscription
    const subscription = await db.pushSubscription.upsert({
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
  },
});

export const notifyUser = defineAction({
  input: z.object({
    userId: z.string(),
    message: z.string(),
  }),
  async handler({ userId, message }, { locals }) {
    const notification = await db.notification.create({
      data: {
        message,
        eventType: NotificationEvent.CUSTOM_MESSAGE,
        causedById: locals.user?.id!,
        intendedForId: userId,
        mediumSent: NotificationMedium.NOTIFICATION,
      },
    });
    return notification;
  },
});
