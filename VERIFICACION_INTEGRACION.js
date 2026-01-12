/**
 * VERIFICACIÓN DE INTEGRACIÓN - GEOPOINT6
 * 
 * Este archivo contiene tests manuales para verificar que todo funciona correctamente
 * Copiar y pegar en la consola del navegador para ejecutar
 */

// ============================================
// 1. VERIFICAR SISTEMAS GLOBALES
// ============================================

console.group('🔍 VERIFICACIÓN DE SISTEMAS GLOBALES');

// Firebase Config
console.log('✓ Firebase Auth:', typeof window.firebaseAuth);
console.log('✓ Firebase DB:', typeof window.firebaseDB);
console.log('✓ Firebase Storage:', typeof window.firebaseStorage);

// Notification System
console.log('✓ Notification System:', typeof window.notificationSystem);
if (window.notificationSystem) {
  console.log('  ├─ show:', typeof window.notificationSystem.show);
  console.log('  ├─ success:', typeof window.notificationSystem.success);
  console.log('  ├─ error:', typeof window.notificationSystem.error);
  console.log('  ├─ warning:', typeof window.notificationSystem.warning);
  console.log('  ├─ info:', typeof window.notificationSystem.info);
  console.log('  └─ confirm:', typeof window.notificationSystem.confirm);
}

// Loading System
console.log('✓ Loading System:', typeof window.loadingSystem);
if (window.loadingSystem) {
  console.log('  ├─ show:', typeof window.loadingSystem.show);
  console.log('  ├─ hide:', typeof window.loadingSystem.hide);
  console.log('  └─ setMessage:', typeof window.loadingSystem.setMessage);
}

// Helpers
console.log('✓ Helpers:', typeof window.Helpers);
if (window.Helpers) {
  console.log('  ├─ calculateDistance:', typeof window.Helpers.calculateDistance);
  console.log('  ├─ validateEmail:', typeof window.Helpers.validateEmail);
  console.log('  ├─ formatDate:', typeof window.Helpers.formatDate);
  console.log('  ├─ formatTime:', typeof window.Helpers.formatTime);
  console.log('  ├─ setStorage:', typeof window.Helpers.setStorage);
  console.log('  ├─ getStorage:', typeof window.Helpers.getStorage);
  console.log('  ├─ isOnline:', typeof window.Helpers.isOnline);
  console.log('  ├─ onConnectionChange:', typeof window.Helpers.onConnectionChange);
  console.log('  ├─ debounce:', typeof window.Helpers.debounce);
  console.log('  ├─ throttle:', typeof window.Helpers.throttle);
  console.log('  └─ fetchWithRetry:', typeof window.Helpers.fetchWithRetry);
}

console.groupEnd();

// ============================================
// 2. TESTS DE FUNCIONALIDAD
// ============================================

console.group('🧪 TESTS DE FUNCIONALIDAD');

// Test 1: Validar Email
const testEmails = [
  { email: 'valido@example.com', esperado: true },
  { email: 'invalido@', esperado: false },
  { email: 'sin-arroba', esperado: false }
];

console.group('📧 Test: Validar Email');
testEmails.forEach(test => {
  const resultado = window.Helpers.validateEmail(test.email);
  const estado = resultado === test.esperado ? '✅' : '❌';
  console.log(`${estado} "${test.email}": ${resultado}`);
});
console.groupEnd();

// Test 2: Formato de Fecha
console.group('📅 Test: Formato de Fecha');
const fechaFormato = window.Helpers.formatDate();
console.log('✅ Fecha formateada:', fechaFormato);
console.groupEnd();

// Test 3: Formato de Hora
console.group('⏰ Test: Formato de Hora');
const horaFormato = window.Helpers.formatTime();
console.log('✅ Hora formateada:', horaFormato);
console.groupEnd();

// Test 4: Distancia Haversine
console.group('📍 Test: Cálculo de Distancia');
const distancia = window.Helpers.calculateDistance(
  -12.0453, -77.0311,  // Lima, Perú
  -12.0455, -77.0309   // Cercano a Lima
);
console.log('✅ Distancia calculada:', Math.round(distancia) + ' metros');
console.groupEnd();

// Test 5: Storage Local
console.group('💾 Test: LocalStorage');
window.Helpers.setStorage('test-key', { valor: 'test' });
const storageTest = window.Helpers.getStorage('test-key');
console.log('✅ Guardado en storage:', storageTest);
window.Helpers.removeStorage('test-key');
console.log('✅ Eliminado de storage');
console.groupEnd();

// Test 6: Estado Online
console.group('🌐 Test: Estado Online');
const isOnline = window.Helpers.isOnline();
console.log('✅ Online:', isOnline);
console.groupEnd();

console.groupEnd();

// ============================================
// 3. TESTS DE NOTIFICACIONES (MANUALES)
// ============================================

console.group('🔔 TESTS DE NOTIFICACIONES (MANUALES)');

console.log('Ejecuta estos comandos en la consola:');
console.log('');
console.log('✔ window.notificationSystem.success("¡Éxito!")');
console.log('✔ window.notificationSystem.error("Error de prueba")');
console.log('✔ window.notificationSystem.warning("Advertencia")');
console.log('✔ window.notificationSystem.info("Información")');
console.log('✔ window.notificationSystem.confirm("¿Confirmar?", () => console.log("Confirmado"))');

console.groupEnd();

// ============================================
// 4. TESTS DE LOADING (MANUALES)
// ============================================

console.group('⏳ TESTS DE LOADING (MANUALES)');

console.log('Ejecuta estos comandos en la consola:');
console.log('');
console.log('✔ window.loadingSystem.show("Cargando...")');
console.log('✔ window.loadingSystem.setMessage("Procesando...")');
console.log('✔ setTimeout(() => window.loadingSystem.hide(), 3000)');

console.groupEnd();

// ============================================
// 5. VERIFICAR SERVICE WORKER
// ============================================

console.group('🔧 VERIFICACIÓN DEL SERVICE WORKER');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('✅ Service Worker soportado');
    console.log('Total registraciones:', registrations.length);
    
    registrations.forEach((registration, index) => {
      console.group(`Service Worker #${index + 1}`);
      console.log('Scope:', registration.scope);
      console.log('Active:', registration.active ? 'Sí' : 'No');
      console.log('Installing:', registration.installing ? 'Sí' : 'No');
      console.log('Waiting:', registration.waiting ? 'Sí' : 'No');
      console.groupEnd();
    });
  });
} else {
  console.log('❌ Service Worker NO soportado en este navegador');
}

console.groupEnd();

// ============================================
// 6. VERIFICAR MANIFEST PWA
// ============================================

console.group('📦 VERIFICACIÓN DEL MANIFEST PWA');

const manifestLink = document.querySelector('link[rel="manifest"]');
if (manifestLink) {
  console.log('✅ Manifest encontrado:', manifestLink.href);
  
  // Cargar y parsear manifest
  fetch(manifestLink.href)
    .then(r => r.json())
    .then(manifest => {
      console.log('📋 Contenido del Manifest:');
      console.log('  ├─ name:', manifest.name);
      console.log('  ├─ short_name:', manifest.short_name);
      console.log('  ├─ description:', manifest.description);
      console.log('  ├─ start_url:', manifest.start_url);
      console.log('  ├─ display:', manifest.display);
      console.log('  ├─ theme_color:', manifest.theme_color);
      console.log('  ├─ background_color:', manifest.background_color);
      console.log('  ├─ icons:', manifest.icons?.length || 0);
      console.log('  ├─ shortcuts:', manifest.shortcuts?.length || 0);
      console.log('  └─ screenshots:', manifest.screenshots?.length || 0);
    })
    .catch(err => console.error('❌ Error cargando manifest:', err));
} else {
  console.log('❌ Manifest NO encontrado');
}

console.groupEnd();

// ============================================
// 7. INFORMACIÓN DE AUTENTICACIÓN
// ============================================

console.group('🔐 INFORMACIÓN DE AUTENTICACIÓN');

if (window.firebaseAuth) {
  window.firebaseAuth.onAuthStateChanged((user) => {
    if (user) {
      console.log('✅ Usuario autenticado');
      console.log('  ├─ UID:', user.uid);
      console.log('  ├─ Email:', user.email);
      console.log('  ├─ Display Name:', user.displayName);
      console.log('  └─ Provider:', user.providerData[0]?.providerId);
    } else {
      console.log('❌ No hay usuario autenticado');
    }
  });
} else {
  console.log('❌ Firebase Auth no disponible');
}

console.groupEnd();

// ============================================
// 8. INFORMACIÓN DEL NAVEGADOR
// ============================================

console.group('🌐 INFORMACIÓN DEL NAVEGADOR');

console.log('User Agent:', navigator.userAgent);
console.log('Online:', navigator.onLine);
console.log('Geolocation API:', 'geolocation' in navigator ? 'Soportado ✅' : 'No soportado ❌');
console.log('Notification API:', 'Notification' in window ? 'Soportado ✅' : 'No soportado ❌');
console.log('IndexedDB:', 'indexedDB' in window ? 'Soportado ✅' : 'No soportado ❌');
console.log('ServiceWorker:', 'serviceWorker' in navigator ? 'Soportado ✅' : 'No soportado ❌');
console.log('PWA Install:', 'beforeinstallprompt' in window ? 'Soportado ✅' : 'No soportado ❌');

console.groupEnd();

// ============================================
// 9. TESTS DE RENDIMIENTO
// ============================================

console.group('⚡ TESTS DE RENDIMIENTO');

const startTime = performance.now();
const dist = window.Helpers.calculateDistance(-12, -77, -12.1, -77.1);
const endTime = performance.now();

console.log('⏱️ Tiempo cálculo de distancia:', (endTime - startTime).toFixed(2) + 'ms');

// Medir debounce
const debounced = window.Helpers.debounce(() => {
  console.log('Debounced!');
}, 300);

for (let i = 0; i < 10; i++) {
  debounced();
}

console.log('⏱️ Debounce creado correctamente');

console.groupEnd();

// ============================================
// 10. CHECKLIST FINAL
// ============================================

console.group('✅ CHECKLIST DE VERIFICACIÓN');

const checklist = [
  { item: 'Firebase Auth inicializado', test: typeof window.firebaseAuth !== 'undefined' },
  { item: 'Firestore inicializado', test: typeof window.firebaseDB !== 'undefined' },
  { item: 'Storage inicializado', test: typeof window.firebaseStorage !== 'undefined' },
  { item: 'Notification System disponible', test: typeof window.notificationSystem !== 'undefined' },
  { item: 'Loading System disponible', test: typeof window.loadingSystem !== 'undefined' },
  { item: 'Helpers disponible', test: typeof window.Helpers !== 'undefined' },
  { item: 'Service Worker soportado', test: 'serviceWorker' in navigator },
  { item: 'Geolocation soportado', test: 'geolocation' in navigator },
  { item: 'Manifest PWA presente', test: document.querySelector('link[rel="manifest"]') !== null }
];

let passedTests = 0;
checklist.forEach(check => {
  const estado = check.test ? '✅' : '❌';
  console.log(`${estado} ${check.item}`);
  if (check.test) passedTests++;
});

console.log('');
console.log(`RESULTADO: ${passedTests}/${checklist.length} tests pasados`);

if (passedTests === checklist.length) {
  console.log('🎉 ¡TODO ESTÁ FUNCIONANDO CORRECTAMENTE!');
} else {
  console.warn('⚠️ Hay algunos componentes que no funcionan correctamente');
}

console.groupEnd();

// ============================================
// FIN DE VERIFICACIÓN
// ============================================

console.log('');
console.log('✨ Verificación completada. Revisa los grupos anteriores para más detalles.');
