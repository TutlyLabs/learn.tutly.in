/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core";
import type { WorkboxPlugin } from "workbox-core";
import { ExpirationPlugin } from "workbox-expiration";
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, StaleWhileRevalidate } from "workbox-strategies";

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

clientsClaim();
self.skipWaiting();

registerRoute(
  ({ request }) => request.mode === "navigate",
  new StaleWhileRevalidate({
    cacheName: "pages-cache",
  })
);

registerRoute(
  ({ request }) => request.destination === "image",
  new CacheFirst({
    cacheName: "images-cache",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }) as WorkboxPlugin,
    ],
  })
);

registerRoute(
  ({ request }) =>
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "worker",
  new StaleWhileRevalidate({
    cacheName: "assets-cache",
  })
);

self.addEventListener("push", async function (event) {
  if (event.data) {
    const data = JSON.parse(event.data.text());

    if (["PUSH_MESSAGE", "MESSAGE"].includes(data?.type)) {
      self.clients.matchAll().then((clients) => {
        if (clients.length > 0) {
          clients[0]?.postMessage(data);
        }
      });
    } else if (data.type === "NOTIFICATION") {
      event.waitUntil(
        self.registration.showNotification("Tutly", {
          body: data.message,
          tag: data.id,
          icon: "/logo-192x192.png",
          badge: "/logo-192x192.png",
          data: {
            notificationId: data.id,
            url: `/notifications/${data.id}`,
          },
        } as NotificationOptions)
      );
    }
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const notificationId = event.notification.data?.notificationId;

  if (!notificationId) {
    console.error("No notification ID found");
    return;
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientsArr) => {
      const hadWindowToFocus = clientsArr.some((windowClient) => {
        const url = `/notifications/${notificationId}`;
        if (windowClient.url.includes(url)) {
          return windowClient.focus();
        }
        return false;
      });

      if (!hadWindowToFocus) {
        self.clients
          .openWindow(`/notifications/${notificationId}`)
          .then((windowClient) => windowClient?.focus());
      }
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
