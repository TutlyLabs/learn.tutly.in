import { NotificationEvent, NotificationMedium } from "@prisma/client";
import { defineAction } from "astro:actions";
import admin from "firebase-admin";
import { z } from "zod";

import db from "@/lib/db";
import { env } from "@/lib/utils";

if (!admin.apps.length) {
  const projectId = env("FIREBASE_PROJECT_ID");
  const clientEmail = env("FIREBASE_CLIENT_EMAIL");
  const rawPrivateKey = env("FIREBASE_PRIVATE_KEY");

  const privateKey = rawPrivateKey
    ?.replace(/\\\\n/g, "\n")
    ?.replace(/\\n/g, "\n")
    ?.replace(/\n\s+/g, "\n")
    ?.trim();

  if (!projectId || !clientEmail || !privateKey) {
    console.error(
      "Missing Firebase credentials. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables."
    );
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } catch (error) {
      console.error("Failed to initialize Firebase Admin:", error);
    }
  }
}

async function sendCapacitorPushNotification(
  userId: string,
  message: string,
  notificationId: string
) {
  const subscription = await db.pushSubscription.findFirst({
    where: { userId },
  });

  if (!subscription) return;

  const hasCapacitorToken = subscription.deviceToken;
  const hasWebPushEndpoint = subscription.endpoint;

  if (!hasCapacitorToken && !hasWebPushEndpoint) {
    console.log("No valid push subscription found for user:", userId);
    return;
  }

  try {
    if (hasCapacitorToken && subscription.deviceToken) {
      const payload = {
        notification: {
          title: "Tutly",
          body: message,
        },
        data: {
          notificationId,
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
        token: subscription.deviceToken,
      };

      const response = await admin.messaging().send(payload);
      console.log("Successfully sent Capacitor push notification:", response);
    } else if (hasWebPushEndpoint) {
      console.log("Falling back to web push notification:", {
        endpoint: subscription.endpoint,
        message,
        notificationId,
      });
      // TODO: Implement web push notification
    }
  } catch (error) {
    console.error("Failed to send push notification:", error);

    if (
      hasCapacitorToken &&
      ((error as any).code === "messaging/registration-token-not-registered" ||
        (error as any).code === "messaging/invalid-registration-token")
    ) {
      await db.pushSubscription.delete({
        where: { id: subscription.id },
      });
    } else if (hasWebPushEndpoint && (error as any).statusCode === 410) {
      await db.pushSubscription.delete({
        where: { id: subscription.id },
      });
    }
  }
}

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
    deviceToken: z.string(),
    platform: z.string().optional(),
  }),
  async handler({ userId, deviceToken, platform }) {
    if (!deviceToken) {
      await db.pushSubscription.deleteMany({
        where: { userId },
      });
      return null;
    }

    const existingSubscription = await db.pushSubscription.findFirst({
      where: {
        deviceToken,
        userId: { not: userId },
      },
    });

    if (existingSubscription) {
      await db.pushSubscription.delete({
        where: { id: existingSubscription.id },
      });
    }

    const userSubscription = await db.pushSubscription.findFirst({
      where: { userId },
    });

    if (userSubscription) {
      const subscription = await db.pushSubscription.update({
        where: { id: userSubscription.id },
        data: {
          deviceToken,
          platform: platform || "unknown",
          endpoint: deviceToken,
          p256dh: platform || "unknown",
          auth: "",
        },
      });
      return subscription;
    } else {
      const subscription = await db.pushSubscription.create({
        data: {
          userId,
          deviceToken,
          platform: platform || "unknown",
          endpoint: deviceToken,
          p256dh: platform || "unknown",
          auth: "",
        },
      });
      return subscription;
    }
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

    await sendCapacitorPushNotification(userId, message, notification.id);

    return notification;
  },
});
export const notifyBulkUsers = defineAction({
  input: z.object({
    courseId: z.string(),
    message: z.string(),
    customLink: z.string().optional(),
  }),
  async handler({ courseId, message, customLink }, { locals }) {
    const enrolledUsers = await db.enrolledUsers.findMany({
      where: {
        courseId,
        user: {
          role: {
            in: ["STUDENT", "MENTOR"],
          },
          organizationId: locals.user?.organizationId!,
        },
      },
      select: { user: { select: { id: true } } },
    });

    const notifications = await Promise.all(
      enrolledUsers.map((user) =>
        db.notification.create({
          data: {
            message,
            eventType: NotificationEvent.CUSTOM_MESSAGE,
            causedById: locals.user?.id!,
            intendedForId: user.user.id,
            mediumSent: NotificationMedium.NOTIFICATION,
            customLink: customLink || null,
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
        await sendCapacitorPushNotification(enrolled.user.id, message, notification.id);
      })
    );

    return notifications;
  },
});
