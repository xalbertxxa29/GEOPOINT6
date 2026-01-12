/**
 * DEBUG - Verificación de Funcionamiento
 * Ejecutar en consola del navegador (F12)
 */

// Verificar que todos los sistemas están cargados
function debugGeopoint() {
  console.log('=== DEBUG GEOPOINT6 ===\n');
  
  // 1. Firebase
  console.log('1. FIREBASE:');
  console.log('   ✓ firebaseAuth:', !!window.firebaseAuth);
  console.log('   ✓ firebaseDB:', !!window.firebaseDB);
  console.log('   ✓ firebaseStorage:', !!window.firebaseStorage);
  
  // 2. Sistemas Globales
  console.log('\n2. SISTEMAS GLOBALES:');
  console.log('   ✓ SessionManager:', !!window.SessionManager);
  console.log('   ✓ notificationSystem:', !!window.notificationSystem);
  console.log('   ✓ loadingSystem:', !!window.loadingSystem);
  console.log('   ✓ Helpers:', !!window.Helpers);
  
  // 3. Google Maps
  console.log('\n3. GOOGLE MAPS:');
  console.log('   ✓ google.maps:', !!window.google?.maps);
  console.log('   ✓ currentMap:', !!window.currentMap);
  
  // 4. Sesión
  console.log('\n4. SESIÓN:');
  const session = window.SessionManager?.getSession();
  const userData = window.SessionManager?.getUserData();
  console.log('   ✓ Sesión activa:', session?.isAuthenticated);
  console.log('   ✓ Usuario:', userData?.email);
  console.log('   ✓ Duración:', window.SessionManager?.getSessionDuration());
  
  // 5. DOM Elements
  console.log('\n5. ELEMENTOS DOM:');
  console.log('   ✓ #menu-btn:', !!document.getElementById('menu-btn'));
  console.log('   ✓ #main-fab:', !!document.getElementById('main-fab'));
  console.log('   ✓ #modal:', !!document.getElementById('modal'));
  console.log('   ✓ #map:', !!document.getElementById('map'));
  console.log('   ✓ .tab-btn:', document.querySelectorAll('.tab-btn').length, 'elementos');
  
  // 6. Errores en consola
  console.log('\n6. ERRORES:');
  console.log('   Si ves errores arriba, revisa los mensajes en rojo');
  
  console.log('\n=== FIN DEBUG ===');
}

// Ejecutar automáticamente si la página está cargada
if (document.readyState === 'complete') {
  debugGeopoint();
} else {
  window.addEventListener('load', debugGeopoint);
}

console.log('💡 Para ejecutar manualmente: debugGeopoint()');
