/**
 * Debug Script v2 - Validación de Sistemas GEOPOINT6 v4
 * Ejecutar en consola: debugGeopoint() o debugv2()
 */

window.debugv2 = window.debugGeopointv2 = function() {
  const results = {
    timestamp: new Date().toISOString(),
    checks: {}
  };

  console.clear();
  console.log('%c🔍 GEOPOINT6 v4 Enhanced Debug System', 'color: #00d4ff; font-size: 16px; font-weight: bold;');
  console.log('─'.repeat(60));

  // ========== 1. Firebase Config ==========
  console.log('\n%c✓ Firebase Configuration', 'color: #00ffff; font-weight: bold;');
  results.checks.firebase = {
    auth: !!window.firebaseAuth,
    firestore: !!window.firebaseDB,
    storage: !!window.firebaseStorage,
    currentUser: window.firebaseAuth?.currentUser?.email || 'anonymous',
    userId: window.firebaseAuth?.currentUser?.uid || 'no-uid'
  };
  console.table(results.checks.firebase);

  // ========== 2. Session Manager ==========
  console.log('%c✓ Session Manager & Offline Support', 'color: #00ffff; font-weight: bold;');
  const session = window.SessionManager?.getSession();
  results.checks.session = {
    'Manager Available': !!window.SessionManager,
    'Session Active': session?.isAuthenticated || false,
    'User Email': session?.userData?.email || 'none',
    'Offline Credentials': !!session?.hasOfflineCredentials,
    'Session Duration': window.SessionManager?.getSessionDuration?.() || 'n/a'
  };
  console.table(results.checks.session);

  // ========== 3. DOM Elements ==========
  console.log('%c✓ Critical DOM Elements', 'color: #00ffff; font-weight: bold;');
  results.checks.dom = {
    'Main FAB': !!document.getElementById('main-fab'),
    'Modal Window': !!document.getElementById('modal'),
    'Map Container': !!document.getElementById('map'),
    'Menu Button': !!document.getElementById('menu-btn'),
    'Logout Button': !!document.getElementById('logout-btn'),
    'Side Menu': !!document.getElementById('side-menu')
  };
  console.table(results.checks.dom);

  // ========== 4. Z-Index Hierarchy ==========
  console.log('%c✓ Z-Index Layer Analysis', 'color: #00ffff; font-weight: bold;');
  const fab = document.getElementById('main-fab');
  const modal = document.getElementById('modal');
  const mapDiv = document.getElementById('map');
  
  const fabZIndex = parseInt(window.getComputedStyle(fab)?.zIndex || fab?.style.zIndex || '0');
  const modalZIndex = parseInt(window.getComputedStyle(modal)?.zIndex || modal?.style.zIndex || '0');
  
  results.checks.zIndex = {
    'FAB Element': `${fabZIndex} (CSS: ${window.getComputedStyle(fab)?.zIndex}, Inline: ${fab?.style.zIndex || 'none'})`,
    'Modal Element': `${modalZIndex} (CSS: ${window.getComputedStyle(modal)?.zIndex}, Inline: ${modal?.style.zIndex || 'none'})`,
    'Map Container': window.getComputedStyle(mapDiv)?.zIndex || 'auto (relative)',
    'FAB Above Maps': fabZIndex >= 9999 ? '✅ Yes' : '❌ No - FAB may not respond'
  };
  console.table(results.checks.zIndex);

  // ========== 5. Service Worker Status ==========
  console.log('%c✓ Service Worker & PWA', 'color: #00ffff; font-weight: bold;');
  results.checks.serviceWorker = {
    'SW Registered': !!navigator.serviceWorker,
    'SW Active': navigator.serviceWorker?.controller ? 'active' : 'not active',
    'SW State': navigator.serviceWorker?.controller?.state || 'unknown',
    'Cache API': !!window.caches ? 'available' : 'not available',
    'Manifest': !!document.querySelector('link[rel="manifest"]') ? 'linked' : 'not linked'
  };
  console.table(results.checks.serviceWorker);

  // ========== 6. Network & Connectivity ==========
  console.log('%c✓ Network Status', 'color: #00ffff; font-weight: bold;');
  results.checks.network = {
    'Online': navigator.onLine ? '✅ Yes' : '❌ No',
    'Connection Type': navigator.connection?.effectiveType || 'unknown',
    'Device Memory': navigator.deviceMemory || 'unknown',
    'CPU Cores': navigator.hardwareConcurrency || 'unknown'
  };
  console.table(results.checks.network);

  // ========== 7. Notification System ==========
  console.log('%c✓ Notification & Alert Systems', 'color: #00ffff; font-weight: bold;');
  results.checks.notifications = {
    'Notification System': !!window.notificationSystem ? 'available' : 'missing',
    'Success Method': typeof window.notificationSystem?.success === 'function' ? '✓' : '✗',
    'Error Method': typeof window.notificationSystem?.error === 'function' ? '✓' : '✗',
    'Loading System': !!window.loadingSystem ? 'available' : 'missing'
  };
  console.table(results.checks.notifications);

  // ========== 8. Auth State Detailed ==========
  console.log('%c✓ Authentication & Authorization', 'color: #00ffff; font-weight: bold;');
  results.checks.authState = {
    'Firebase User': window.firebaseAuth?.currentUser ? 'authenticated' : 'not authenticated',
    'Firebase Email': window.firebaseAuth?.currentUser?.email || 'none',
    'Session User': session?.userData ? 'cached' : 'not cached',
    'Session Email': session?.userData?.email || 'none',
    'Can Access App': (window.firebaseAuth?.currentUser || session?.isAuthenticated) ? '✅ Yes' : '❌ No',
    'Auth Persistence': 'LOCAL'
  };
  console.table(results.checks.authState);

  // ========== 9. FAB Functionality Test ==========
  console.log('%c✓ FAB Button Functionality', 'color: #00ffff; font-weight: bold;');
  const fabBtn = document.getElementById('main-fab');
  results.checks.fab = {
    'FAB Exists': !!fabBtn ? '✓' : '✗',
    'Z-Index >= 9999': (fabZIndex >= 9999) ? '✅ Yes' : '❌ No',
    'Pointer Events': fabBtn?.style.pointerEvents !== 'none' ? 'enabled' : 'disabled',
    'Clickable': fabBtn?.disabled === false ? '✓' : '✗',
    'Modal Target': !!document.getElementById('modal') ? '✓' : '✗'
  };
  console.table(results.checks.fab);

  // ========== 10. Responsive Design ==========
  console.log('%c✓ Responsive & Viewport', 'color: #00ffff; font-weight: bold;');
  const deviceType = window.innerWidth <= 480 ? 'Mobile' : window.innerWidth <= 768 ? 'Tablet' : 'Desktop';
  results.checks.responsive = {
    'Window Width': `${window.innerWidth}px`,
    'Window Height': `${window.innerHeight}px`,
    'Device Type': deviceType,
    'Mobile View': window.innerWidth <= 480 ? '✓' : '✗',
    'Tablet View': (window.innerWidth > 480 && window.innerWidth <= 768) ? '✓' : '✗',
    'Desktop View': window.innerWidth > 768 ? '✓' : '✗',
    'Device Pixel Ratio': window.devicePixelRatio
  };
  console.table(results.checks.responsive);

  // ========== 11. Helper Utilities ==========
  console.log('%c✓ Helper Utilities', 'color: #00ffff; font-weight: bold;');
  results.checks.helpers = {
    'Helpers Object': !!window.Helpers ? 'available' : 'missing',
    'formatDate Method': typeof window.Helpers?.formatDate === 'function' ? '✓' : '✗',
    'showLoader Method': typeof window.Helpers?.showLoader === 'function' ? '✓' : '✗',
    'validateEmail Method': typeof window.Helpers?.validateEmail === 'function' ? '✓' : '✗'
  };
  console.table(results.checks.helpers);

  // ========== COMPREHENSIVE SUMMARY ==========
  console.log('\n%c📊 COMPREHENSIVE SYSTEM SUMMARY', 'color: #00ffff; font-size: 14px; font-weight: bold;');
  
  const criticalSystems = [
    { name: 'Firebase Auth', status: results.checks.firebase.auth },
    { name: 'Session Manager', status: results.checks.session['Manager Available'] },
    { name: 'FAB Button', status: results.checks.fab['FAB Exists'] && results.checks.fab['Z-Index >= 9999'] },
    { name: 'Service Worker', status: !!navigator.serviceWorker },
    { name: 'Modal Window', status: results.checks.dom['Modal Window'] },
    { name: 'Notification System', status: !!window.notificationSystem },
    { name: 'Offline Support', status: results.checks.session['Offline Credentials'] }
  ];

  console.log('\n%c🎯 Critical Systems Status:', 'color: #00d4ff; font-weight: bold;');
  criticalSystems.forEach(sys => {
    const icon = sys.status ? '✅' : '⚠️';
    console.log(`${icon} ${sys.name.padEnd(25)} ${sys.status ? 'OK' : 'CHECK'}`);
  });

  const okCount = criticalSystems.filter(s => s.status).length;
  const totalCount = criticalSystems.length;
  const percentage = Math.round((okCount / totalCount) * 100);

  console.log(`\n%c🚀 Overall System Health: ${percentage}% (${okCount}/${totalCount})`, 
    percentage >= 80 ? 'color: #00ff00; font-weight: bold; font-size: 12px;' : 'color: #ff6600; font-weight: bold; font-size: 12px;');

  // ========== QUICK ACTIONS ==========
  console.log('\n%c⚡ Quick Actions (Copy & Paste):', 'color: #00d4ff; font-size: 12px; font-weight: bold;');
  console.log('%c  testFab()          - Simulate FAB click', 'color: #00ffff;');
  console.log('%c  testSession()      - Show session details', 'color: #00ffff;');
  console.log('%c  testNotification() - Test notifications', 'color: #00ffff;');
  console.log('%c  testNetwork()      - Show network details', 'color: #00ffff;');
  console.log('%c  clearCache()       - Clear SW cache', 'color: #00ffff;');
  console.log('%c  localStorage.clear() - Clear local storage', 'color: #00ffff;');

  console.log('\n' + '─'.repeat(60));
  console.log('%c✨ Debug Report Generated - ' + new Date().toLocaleTimeString(), 'color: #00ffff; font-size: 11px;');

  return results;
};

// ========== QUICK TEST FUNCTIONS ==========

window.testFab = function() {
  const fab = document.getElementById('main-fab');
  if (!fab) {
    console.error('❌ FAB element not found in DOM');
    return;
  }
  
  console.log('%c🎬 Testing FAB click...', 'color: #00d4ff;');
  const event = new MouseEvent('click', { bubbles: true, cancelable: true });
  fab.dispatchEvent(event);
  console.log('✅ FAB click event triggered - check if modal opened above');
};

window.testSession = function() {
  console.log('%c📋 Session Details:', 'color: #00d4ff;');
  const session = window.SessionManager?.getSession();
  console.log('Full Session Object:', session);
  console.log('Is Authenticated:', session?.isAuthenticated);
  console.log('User Data:', session?.userData);
  console.log('Offline Credentials:', session?.hasOfflineCredentials);
  console.log('Session Duration:', window.SessionManager?.getSessionDuration?.());
};

window.testNotification = function() {
  console.log('%c🔔 Testing Notification System...', 'color: #00d4ff;');
  window.notificationSystem?.success('✅ Success notification test');
  setTimeout(() => window.notificationSystem?.info('ℹ️ Info notification test'), 600);
  setTimeout(() => window.notificationSystem?.warning('⚠️ Warning notification test'), 1200);
  setTimeout(() => window.notificationSystem?.error('❌ Error notification test'), 1800);
};

window.testNetwork = function() {
  console.log('%c🌐 Network Information:', 'color: #00d4ff;');
  console.table({
    'Online': navigator.onLine,
    'Connection Type': navigator.connection?.effectiveType || 'unknown',
    'Downlink Speed (Mbps)': navigator.connection?.downlink || 'unknown',
    'Effective Type': navigator.connection?.effectiveType || 'unknown',
    'Device Memory (GB)': navigator.deviceMemory || 'unknown',
    'CPU Cores': navigator.hardwareConcurrency || 'unknown',
    'User Agent': navigator.userAgent.substring(0, 80) + '...'
  });
};

window.clearCache = function() {
  console.log('%c🗑️ Clearing Service Worker Cache...', 'color: #00d4ff;');
  caches.keys().then(names => {
    names.forEach(name => {
      caches.delete(name).then(() => {
        console.log(`✓ Cleared: ${name}`);
      });
    });
    console.log(`✅ Total caches deleted: ${names.length}`);
  });
};

window.testOffline = function() {
  console.log('%c📴 Testing Offline Mode...', 'color: #00d4ff;');
  
  // Simulate offline
  const wasOnline = navigator.onLine;
  console.log('Current online status:', wasOnline);
  
  // Check if can access offline resources
  const session = window.SessionManager?.getSession();
  console.log('Has offline session:', session?.isAuthenticated);
  
  if (session?.isAuthenticated && session?.hasOfflineCredentials) {
    console.log('%c✅ App can function offline with cached session', 'color: #00ff00;');
  } else {
    console.log('%c⚠️ No offline session available', 'color: #ff6600;');
  }
};

// Auto-announce when debug system loads
console.log('%c🚀 GEOPOINT6 Debug System Ready!', 'color: #00ffff; font-size: 12px; font-weight: bold;');
console.log('%cRun: debugv2() or debugGeopointv2() for full system analysis', 'color: #00ffff; font-size: 11px;');
