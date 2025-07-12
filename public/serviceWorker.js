const CACHE_NAME = "weather-app-v6";
const urlsToCache = [
  `index.html`,
  `offline.html`,
];

// install sw

// Listen for push events (Push Notifications)
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Weather Update';
  const options = {
    body: data.body || 'Check today\'s weather!',
    icon: data.icon || '/logo.png',
    badge: data.badge || '/logo.png',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Listen for notificationclick events
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Background Sync for queued searches
self.addEventListener('sync', function(event) {
  if (event.tag === 'sync-weather-queue') {
    event.waitUntil(
      (async () => {
        // Simulate processing queued searches (actual UI update must be handled by app)
        const queue = await getQueue();
        for (const city of queue) {
          // You would fetch weather here and maybe send a notification
          self.registration.showNotification('Weather Request Synced', {
            body: `Weather for ${city} will be updated in the app!`,
            icon: '/logo.png',
          });
        }
        await clearQueue();
      })()
    );
  }
});

// Helpers for queue (IndexedDB or localStorage via idb-keyval or similar)
function getQueue() {
  return new Promise((resolve) => {
    self.clients.matchAll().then(() => {
      const queue = JSON.parse(self.localStorage?.getItem('offlineWeatherQueue') || '[]');
      resolve(queue);
    });
  });
}
function clearQueue() {
  return new Promise((resolve) => {
    self.clients.matchAll().then(() => {
      self.localStorage?.removeItem('offlineWeatherQueue');
      resolve();
    });
  });
}


self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Cache opened!");
      return cache.addAll(urlsToCache);
    })
  );
});

// listen for requests

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => caches.match("offline.html"));
    })
  );
});

// activate sw

self.addEventListener("activate", (event) => {
  const cacheWhiteList = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhiteList.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
