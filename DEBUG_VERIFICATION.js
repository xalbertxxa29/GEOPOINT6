#!/usr/bin/env node
/**
 * Verificación Final del Código GEOPOINT6
 * Ejecutar en consola del navegador en menu.html
 */

const VerificationChecklist = {
  // 1. Verificar que todos los módulos estén cargados
  checkModules: function() {
    console.group('🔍 Verificación de Módulos');
    
    const modules = {
      'SessionPersistence': typeof window.SessionPersistence,
      'offlineQueue': typeof window.offlineQueue,
      'Helpers': typeof window.Helpers,
      'notificationSystem': typeof window.notificationSystem,
      'loadingSystem': typeof window.loadingSystem,
      'firebaseAuth': typeof window.firebaseAuth,
      'firebaseDB': typeof window.firebaseDB
    };
    
    Object.entries(modules).forEach(([name, type]) => {
      const status = type !== 'undefined' ? '✅' : '❌';
      console.log(`${status} ${name}: ${type}`);
    });
    
    console.groupEnd();
  },

  // 2. Verificar DOM elements
  checkDOMElements: function() {
    console.group('🔍 Verificación de Elementos DOM');
    
    const elements = {
      'menu-btn': document.getElementById('menu-btn'),
      'side-menu': document.getElementById('side-menu'),
      'logout-btn': document.getElementById('logout-btn'),
      'main-fab': document.getElementById('main-fab'),
      'modal': document.getElementById('modal'),
      'iniciados-container': document.getElementById('iniciados-container'),
      'completados-container': document.getElementById('completados-container')
    };
    
    Object.entries(elements).forEach(([name, element]) => {
      const status = element ? '✅' : '❌';
      console.log(`${status} ${name}`);
    });
    
    console.groupEnd();
  },

  // 3. Verificar autenticación
  checkAuthentication: async function() {
    console.group('🔍 Verificación de Autenticación');
    
    const user = window.firebaseAuth?.currentUser;
    if (user) {
      console.log('✅ Usuario autenticado:', user.email);
      console.log('  UID:', user.uid);
    } else {
      console.log('❌ No hay usuario autenticado');
    }
    
    // Verificar SessionPersistence
    if (window.SessionPersistence) {
      const session = await window.SessionPersistence.getSession();
      if (session && session.userData) {
        console.log('✅ Sesión persistente encontrada:', session.userData.email);
      } else {
        console.log('⚠️  No hay sesión persistente');
      }
    }
    
    console.groupEnd();
  },

  // 4. Verificar conectividad
  checkConnectivity: function() {
    console.group('🔍 Verificación de Conectividad');
    
    console.log('Online:', navigator.onLine ? '✅' : '❌');
    console.log('Service Worker:', 'serviceWorker' in navigator ? '✅' : '❌');
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        console.log('✅ Service Worker activo');
      }).catch(() => {
        console.log('❌ Service Worker no está activo');
      });
    }
    
    console.groupEnd();
  },

  // 5. Verificar almacenamiento
  checkStorage: async function() {
    console.group('🔍 Verificación de Almacenamiento');
    
    // localStorage
    const localStorageTasks = localStorage.getItem('tareasIniciadas');
    console.log('localStorage - tareasIniciadas:', localStorageTasks ? '✅' : '❌');
    
    // IndexedDB
    if (window.SessionPersistence && window.SessionPersistence.db) {
      console.log('✅ IndexedDB inicializado');
      
      const user = window.firebaseAuth?.currentUser;
      if (user) {
        const tareas = await window.SessionPersistence.getTasks(user.email, 'iniciadas');
        console.log(`✅ Tareas en caché: ${tareas.length} encontradas`);
      }
    } else {
      console.log('❌ IndexedDB no inicializado');
    }
    
    console.groupEnd();
  },

  // 6. Ejecutar todas las verificaciones
  runAll: async function() {
    console.clear();
    console.log('%c🚀 VERIFICACIÓN FINAL GEOPOINT6', 'font-size: 16px; color: #00d4ff; font-weight: bold;');
    console.log('═'.repeat(50));
    
    this.checkModules();
    this.checkDOMElements();
    await this.checkAuthentication();
    this.checkConnectivity();
    await this.checkStorage();
    
    console.log('═'.repeat(50));
    console.log('%c✅ Verificación completada', 'color: #00ff00; font-weight: bold;');
  }
};

// Ejecutar verificación automáticamente
console.log('%c Para ejecutar verificación completa, usa: VerificationChecklist.runAll()', 'color: #00d4ff;');
console.log('%c O ejecuta cada una individuamente:', 'color: #00d4ff;');
console.log('  - VerificationChecklist.checkModules()');
console.log('  - VerificationChecklist.checkDOMElements()');
console.log('  - VerificationChecklist.checkAuthentication()');
console.log('  - VerificationChecklist.checkConnectivity()');
console.log('  - VerificationChecklist.checkStorage()');
