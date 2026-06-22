const CACHE_NAME = 'escom-reservas-v2'; 
const ASSETS_TO_CACHE = [
    '/',             // Guardar la ruta raíz
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json',
    'https://cdn-icons-png.flaticon.com/512/1944/1944200.png'
];

// EVENTO DE INSTALACIÓN
self.addEventListener('install', event => {
    // skipWaiting() fuerza a que el nuevo SW se active inmediatamente
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            console.log("Caché abierto correctamente. Guardando assets...");
            return cache.addAll(ASSETS_TO_CACHE);
        })
        .catch(error => {
            console.error("Error al guardar en caché durante la instalación:", error);
        })
    );
});

// EVENTO DE ACTIVACIÓN: Limpiar cachés antiguos
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log("Limpiando caché antiguo:", cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim(); // Tomar control de todos los clientes inmediatamente
});

// EVENTO DE INTERCEPCIÓN (FETCH)
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // 1. Peticiones a la API (Backend)
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(event.request).catch(() => {
                // Si la API falla (estamos offline), devolvemos el JSON de error
                return new Response(JSON.stringify({ 
                    success: false, 
                    message: "Estás en modo sin conexión. No puedes hacer reservas ahora mismo." 
                }), { 
                    headers: { 'Content-Type': 'application/json' },
                    status: 503 // Servicio no disponible
                });
            })
        );
        return; // Termina la ejecución para peticiones de API
    }

    // 2. Peticiones Estáticas (HTML, CSS, JS) - Cache First, then Network
    event.respondWith(
        caches.match(event.request)
        .then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse; // Si está en caché, lo devolvemos
            }
            
            // Si no está en caché, intentamos obtenerlo de la red
            return fetch(event.request).then(networkResponse => {
                return networkResponse;
            }).catch(error => {
                console.error("Fallo al buscar en caché y en red:", event.request.url, error);
                
                // Como último recurso, si pedían una página y no hay red, podríamos devolver el index
                if (event.request.mode === 'navigate') {
                     return caches.match('/index.html');
                }
                
                throw error; // Lanza el error para que el navegador sepa que falló
            });
        })
    );
});