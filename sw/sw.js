self.__WB_MANIFEST;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => self.clients.claim());

const DB_NAME = "push-notifications";
const DB_VERSION = 1;
const STORE_NAME = "notifications";

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
      title: data.title || "Green Ball",
      body: data.body || "",
      url: data.data?.url || "/",
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

self.addEventListener("push", (event) => {
  if (!event.data) return;
  event.waitUntil(
    (async () => {
      try {
        const data = event.data.json();
        await storeNotification(data);
        const options = {
          body: data.body || "",
          icon: data.icon || "/favicon.svg",
          badge: data.badge || "/favicon.svg",
          data: data.data || {},
          actions: data.actions || [],
          vibrate: [200, 100, 200, 100, 200],
          sound: "/notification-sound.wav",
          dir: "rtl",
          lang: "ar",
          requireInteraction: true,
          tag: data.tag || "league-" + (data.timestamp || Date.now()),
          timestamp: data.timestamp || Date.now(),
          renotify: false,
          silent: false,
        };
        await self.registration.showNotification(
          data.title || "Green Ball",
          options,
        );
        // Notify all open clients so the in-app bell updates without refresh
        const clients = await self.clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });
        for (const client of clients) {
          client.postMessage({
            type: "NEW_PUSH_NOTIFICATION",
            notification: {
              title: data.title || "Green Ball",
              body: data.body || "",
              url: data.data?.url || "/",
              timestamp: Date.now(),
              read: false,
            },
          });
        }
      } catch {
        await self.registration.showNotification(event.data.text(), {
          icon: "/favicon.svg",
        });
      }
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
        const matching = windowClients.find((c) => c.url === url);
        if (matching) {
          matching.focus();
        } else {
          clients.openWindow(url);
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
