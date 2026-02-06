// NeumorStudio Service Worker
// Versión: 1.0.0

const CACHE_NAME = 'neumorstudio-v1'
const OFFLINE_URL = '/'

// Assets a pre-cachear
const PRECACHE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/images/logoneumor.jpeg',
]

// Instalar: pre-cachear assets críticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      // Pre-cachear assets críticos
      await cache.addAll(PRECACHE_ASSETS)
      // Activar inmediatamente
      await self.skipWaiting()
    })()
  )
})

// Activar: limpiar caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Limpiar caches antiguos
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
      // Tomar control de clientes inmediatamente
      await self.clients.claim()
    })()
  )
})

// Fetch: estrategia stale-while-revalidate para assets
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Solo manejar requests del mismo origen
  if (url.origin !== location.origin) return

  // Ignorar requests de API y _next/webpack
  if (url.pathname.startsWith('/api/') || url.pathname.includes('webpack')) {
    return
  }

  // Para navegación: network-first con fallback a cache
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Intentar red primero
          const networkResponse = await fetch(request)
          // Guardar en cache si es exitoso
          if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME)
            cache.put(request, networkResponse.clone())
          }
          return networkResponse
        } catch {
          // Fallback a cache
          const cachedResponse = await caches.match(request)
          return cachedResponse || caches.match(OFFLINE_URL)
        }
      })()
    )
    return
  }

  // Para assets estáticos: stale-while-revalidate
  if (
    request.destination === 'image' ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    url.pathname.match(/\.(mp4|webm|png|jpg|jpeg|gif|svg|ico|woff2?)$/i)
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME)
        const cachedResponse = await cache.match(request)

        // Revalidar en background
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone())
            }
            return networkResponse
          })
          .catch(() => cachedResponse)

        // Devolver cache inmediatamente si existe, sino esperar red
        return cachedResponse || fetchPromise
      })()
    )
    return
  }
})

// Manejar mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting()
  }
})

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'Nueva reserva'
  const options = {
    body: data.body || 'Tienes una nueva cita pendiente.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: data.tag || 'neumorstudio-booking',
    data: {
      url: data.url || '/dashboard',
      ...data.data,
    },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
      return undefined
    })
  )
})
