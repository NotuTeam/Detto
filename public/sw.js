const CACHE_NAME = "detto-v3";
const STATIC_ASSETS = [];

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate") return;

  const url = new URL(event.request.url);

  // Skip Next.js internal requests (RSC, chunks, HMR, etc.)
  if (url.pathname.startsWith("/_next")) return;

  // API calls: network first
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/calendar") || url.pathname.startsWith("/home")) {
    event.respondWith(
      fetch(event.request, { redirect: "follow" }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Images (cloudinary): stale-while-revalidate
  if (url.hostname.includes("cloudinary.com") || url.hostname.includes("res.cloudinary.com")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetched = fetch(event.request, { redirect: "follow" }).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
        return cached || fetched;
      })
    );
    return;
  }

  // Static assets: cache first (only cache OK responses, skip redirects)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request, { redirect: "follow" }).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

// Push notification handler
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Detto", body: event.data.text() };
  }

  const options = {
    body: data.body || "",
    icon: data.icon || "/logo/main.png",
    badge: "/logo/main.png",
    tag: data.tag || "detto-notification",
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: data.url || "/" },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Detto", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
