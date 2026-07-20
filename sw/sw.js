self.__WB_MANIFEST;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => self.clients.claim());

const DB_NAME = "push-notifications";
const DB_VERSION = 1;
const STORE_NAME = "notifications";
const DEFAULT_TITLE = "Green Ball";
const DEFAULT_ICON = "/notification-icon.png";
const DEFAULT_BADGE = "/notification-badge.png";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME, {
        keyPath: "id",
        autoIncrement: true,
      });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function storeNotification(data) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).add({
      title: data.title || DEFAULT_TITLE,
      body: data.body || "",
      url: data.url || "/",
      timestamp: Date.now(),
      read: false,
    });
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = (e) => reject(e.target.error);
    });
  } catch {
    // IndexedDB might fail in some contexts
  }
}

async function getStoredNotifications() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const all = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (e) => reject(e.target.error);
    });
    return all.slice(-50).reverse();
  } catch {
    return [];
  }
}

/**
 * Normalize FCM / Web Push payloads into a flat { title, body, url, icon, badge, tag }.
 * FCM delivers several shapes depending on SDK version and data-only vs notification messages.
 */
function parsePushPayload(raw) {
  if (!raw || typeof raw !== "object") return {};

  // Unwrap common FCM wrappers
  const root =
    raw.FCM_MSG && typeof raw.FCM_MSG === "object"
      ? raw.FCM_MSG
      : raw.payload && typeof raw.payload === "object"
        ? raw.payload
        : raw;

  const nestedData =
    root.data && typeof root.data === "object" ? root.data : null;
  const nestedNotif =
    root.notification && typeof root.notification === "object"
      ? root.notification
      : null;
  // webpush.notification sometimes lands as web_notification / webpushNotification
  const webNotif =
    root.webpush?.notification ||
    root.web_push?.notification ||
    root.webNotification ||
    null;

  const pick = (...vals) => {
    for (const v of vals) {
      if (v == null) continue;
      const s = String(v).trim();
      if (s) return s;
    }
    return "";
  };

  return {
    title: pick(
      root.title,
      nestedData?.title,
      nestedNotif?.title,
      webNotif?.title,
    ),
    body: pick(
      root.body,
      nestedData?.body,
      nestedNotif?.body,
      webNotif?.body,
      root.message,
      nestedData?.message,
    ),
    url: pick(
      root.url,
      nestedData?.url,
      nestedNotif?.click_action,
      nestedData?.click_action,
      root.link,
      nestedData?.link,
      webNotif?.data?.url,
      "/",
    ),
    icon: pick(
      root.icon,
      nestedData?.icon,
      nestedNotif?.icon,
      webNotif?.icon,
      DEFAULT_ICON,
    ),
    badge: pick(
      root.badge,
      nestedData?.badge,
      nestedNotif?.badge,
      webNotif?.badge,
      DEFAULT_BADGE,
    ),
    tag: pick(root.tag, nestedData?.tag, nestedNotif?.tag),
  };
}

function parseEventData(eventData) {
  if (!eventData) return {};
  try {
    return parsePushPayload(eventData.json());
  } catch {
    // ignore
  }
  try {
    const text = eventData.text();
    if (!text) return {};
    try {
      return parsePushPayload(JSON.parse(text));
    } catch {
      // Plain text body only
      return { title: DEFAULT_TITLE, body: text };
    }
  } catch {
    return {};
  }
}

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      const data = parseEventData(event.data);
      const title = data.title || DEFAULT_TITLE;
      const body = data.body || "";
      const url = data.url || "/";
      const icon = data.icon || DEFAULT_ICON;
      const badge = data.badge || DEFAULT_BADGE;
      const tag = data.tag || "league-" + Date.now();

      const notifRecord = {
        title,
        body,
        url,
        timestamp: Date.now(),
        read: false,
      };

      await storeNotification(notifRecord);

      // Broadcast to open clients (in-app notification bell)
      const clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of clientList) {
        client.postMessage({
          type: "NEW_PUSH_NOTIFICATION",
          notification: notifRecord,
        });
      }

      await self.registration.showNotification(title, {
        body,
        icon,
        badge,
        image: undefined,
        data: { url, title, body },
        vibrate: [200, 100, 200, 100, 200],
        dir: "rtl",
        lang: "ar",
        requireInteraction: true,
        tag,
        timestamp: Date.now(),
        renotify: true,
        silent: false,
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Prefer focusing an existing same-origin window, then navigate
        for (const client of windowClients) {
          if ("focus" in client) {
            return client.focus().then((c) => {
              if (c && "navigate" in c && url) {
                try {
                  return c.navigate(url);
                } catch {
                  return clients.openWindow(url);
                }
              }
              return c;
            });
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      }),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }
  if (event.data?.type === "GET_PUSH_NOTIFICATIONS" && event.ports?.[0]) {
    getStoredNotifications().then((notifs) => {
      event.ports[0].postMessage({
        type: "PUSH_NOTIFICATIONS",
        notifications: notifs,
      });
    });
    return;
  }
});
