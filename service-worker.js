/**
 * Service Worker v4 - Estrategia mejorada (Offline-First + SWR)
 * Basada en BBVA3 pero adaptada para GEOPOINT6
 */

const CACHE_VERSION = 'v4';
const CACHE_NAMES = {
  static: `lidercontrol-static-${CACHE_VERSION}`,
  dynamic: `lidercontrol-dynamic-${CACHE_VERSION}`,
  images: `lidercontrol-images-${CACHE_VERSION}`,
  api: `lidercontrol-api-${CACHE_VERSION}`
};

const STATIC_ASSETS = [
  './',
  './index.html',
  './menu.html',
  './formulario.html',
  './styles.css',
  './menu.css',
  './menu-new.css',
  './formulario.css',
  './neon-styles.css',
  './script.js',
  './menu-new.js',
  './formulario.js',
  './firebase-config.js',
  './notification-system.js',
  './loader-system.js',
  './helpers.js',
  './session-persistence.js',
  './offline-queue.js',
  './manifest.json'
];

// URLs a excluir del caché (Firebase, Google, etc)
const EXCLUDE_PATTERNS = [
  /^https:\/\/firebase\.googleapis\.com/,
  /^https:\/\/www\.gstatic\.com/,
  /^https:\/\/maps\.googleapis\.com/,
  /^https:\/\/accounts\.google\.com/,
  /^chrome:\/\//,
  /^https:\/\/.*\.firebaseio\.com/
];

// ========== INSTALACIÓN ==========
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...', CACHE_NAMES.static);
  
  event.waitUntil(
    caches.open(CACHE_NAMES.static).then((cache) => {
      console.log('Cacheando assets estáticos');
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })))
        .catch((error) => {
          console.warn('Algunos assets no se pudieron cachear:', error);
        });
    }).then(() => self.skipWaiting())
  );
});

// ========== ACTIVACIÓN ==========
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activando...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            const isOldCache = !Object.values(CACHE_NAMES).includes(cacheName);
            if (isOldCache) {
              console.log('Eliminando caché antiguo:', cacheName);
            }
            return isOldCache;
          })
          .map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      // Habilitar Navigation Preload si está disponible
      if (self.registration.navigationPreload) {
        return self.registration.navigationPreload.enable();
      }
    }).then(() => {
      // Avisar a los clientes que el SW está listo
      return self.clients.claim();
    })
  );
});

// ========== MANEJO DE SOLICITUDES ==========
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Excluir ciertos dominios
  if (EXCLUDE_PATTERNS.some((pattern) => pattern.test(request.url))) {
    return;
  }

  // Solo GET
  if (request.method !== 'GET') {
    return event.respondWith(fetch(request));
  }

  // Solicitudes a API de Firebase/Firestore - Network First
  if (url.origin.includes('firebase') || url.origin.includes('firebaseio')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Imágenes - Cache First
  if (request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.images));
    return;
  }

  // Documentos HTML - Network First
  if (request.destination === 'document') {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Scripts y estilos - Cache First
  if (['script', 'style'].includes(request.destination)) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.static));
    return;
  }

  // Por defecto: Stale While Revalidate (SWR)
  event.respondWith(staleWhileRevalidate(request));
});

// ========== ESTRATEGIAS ==========

/**
 * Stale While Revalidate (SWR)
 * Sirve desde caché pero actualiza en background
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAMES.dynamic);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response && response.ok && response.type === 'basic') {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => undefined);

  return cached || fetchPromise;
}

/**
 * Cache First Strategy
 * Intenta usar el caché primero, luego la red
 */
async function cacheFirstStrategy(request, cacheName = CACHE_NAMES.dynamic) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('Cache HIT:', request.url);
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn('Cache First Strategy error:', error);
    return caches.match(request) || createOfflineResponse();
  }
}

/**
 * Network First Strategy
 * Intenta la red primero, luego usa el caché
 */
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
    ]);

    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAMES.dynamic);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn('Network First Strategy error:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return createOfflineResponse();
  }
}

// ========== RESPUESTA OFFLINE ==========
function createOfflineResponse() {
  const offlineHTML = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Modo Offline</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          background: linear-gradient(135deg, #050812 0%, #0a0e27 100%);
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          color: #e0e0ff;
          padding: 20px;
        }
        .offline-container {
          text-align: center;
          padding: 40px;
          background: rgba(10, 14, 39, 0.7);
          border: 2px solid #00d4ff;
          border-radius: 16px;
          box-shadow: 0 0 40px rgba(0, 212, 255, 0.3);
          max-width: 500px;
          backdrop-filter: blur(10px);
        }
        .offline-icon {
          font-size: 80px;
          margin-bottom: 20px;
          animation: pulse 2s ease-in-out infinite;
        }
        h1 {
          color: #00d4ff;
          margin-bottom: 15px;
          font-size: 28px;
          text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
        }
        p {
          color: #a0a0cc;
          line-height: 1.6;
          margin-bottom: 20px;
          font-size: 16px;
        }
        .info {
          background: rgba(0, 212, 255, 0.1);
          border-left: 3px solid #00d4ff;
          padding: 15px;
          border-radius: 5px;
          margin-top: 20px;
          text-align: left;
          font-size: 14px;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="offline-icon">📡</div>
        <h1>Modo Offline</h1>
        <p>Estás trabajando sin conexión a internet.</p>
        <p>Puedes continuar usando la aplicación con los datos cacheados.</p>
        <div class="info">
          <strong>💾 Datos en caché disponibles:</strong>
          <ul style="list-style: none; margin-top: 10px;">
            <li>✓ Páginas visitadas</li>
            <li>✓ Estilos y scripts</li>
            <li>✓ Información local</li>
          </ul>
        </div>
      </div>
    </body>
    </html>
  `;

  return new Response(offlineHTML, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// ========== SINCRONIZACIÓN EN BACKGROUND ==========
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tareas') {
    event.waitUntil(syncTareas());
  }
});

async function syncTareas() {
  try {
    console.log('Sincronizando tareas...');
    // Aquí iría la lógica para sincronizar tareas guardadas localmente
  } catch (error) {
    console.error('Error sincronizando tareas:', error);
  }
}

// ========== MENSAJES DESDE CLIENTES ==========
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    });
  }
});

console.log('Service Worker cargado y listo');
