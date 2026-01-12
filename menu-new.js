/**
 * Menu.js Mejorado - Gestión del Menú Principal
 * Sistema robusto con sesión persistente, offline y sincronización
 */

// ========== VARIABLES GLOBALES ==========
const menuBtn = document.getElementById('menu-btn');
const sideMenu = document.getElementById('side-menu');
const logoutBtn = document.getElementById('logout-btn');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const mainFab = document.getElementById('main-fab');
const closeModal = document.getElementById('close-modal');
const modal = document.getElementById('modal');
const modalOptions = document.querySelectorAll('.modal-option');
const overlay = document.createElement('div');

// Setup overlay
overlay.classList.add('overlay');
document.body.appendChild(overlay);

// ========== AUTENTICACIÓN Y SESIÓN ==========

/**
 * Monitor de estado de autenticación con sesión persistente
 */
async function initAuthState() {
  window.firebaseAuth.onAuthStateChanged(async (user) => {
    if (!user) {
      // Intentar recuperar usuario desde sesión persistente
      try {
        const sessionData = await window.SessionPersistence?.getSession();
        
        if (sessionData && sessionData.userData) {
          loadUserData(sessionData.userData);
          if (navigator.onLine) {
            cargarTareasIniciadas(sessionData.userData.email);
            cargarTareasCompletadas(sessionData.userData.email);
          } else {
            cargarTareasDelCache(sessionData.userData.email);
          }
        } else {
          window.location.href = 'index.html';
        }
      } catch (error) {
        console.error('Error al recuperar sesión:', error);
        window.location.href = 'index.html';
      }
    } else {
      // Usuario autenticado en Firebase
      loadUserData({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Usuario',
        lastLogin: new Date().toISOString()
      });

      // Guardar sesión en persistencia
      const sessionData = {
        userData: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Usuario',
          lastLogin: new Date().toISOString()
        },
        sessionToken: user.uid
      };
      
      await window.SessionPersistence?.saveSession(sessionData);
      
      cargarTareasIniciadas(user.email);
      cargarTareasCompletadas(user.email);
    }
  });
}

/**
 * Cargar datos del usuario en la UI
 */
function loadUserData(userData) {
  const fechaEl = document.getElementById('fecha');
  const userNameEl = document.getElementById('user-name');
  const userEmailEl = document.getElementById('user-email');

  if (fechaEl) fechaEl.innerText = Helpers.formatDate();
  if (userNameEl) userNameEl.innerText = userData.displayName || 'Usuario';
  if (userEmailEl) userEmailEl.innerText = userData.email;
}

// ========== MENÚ LATERAL ==========

function initSideMenu() {
  if (!menuBtn || !sideMenu) return;

  menuBtn.addEventListener('click', () => {
    sideMenu.classList.toggle('active');
    overlay.classList.toggle('active');
  });

  overlay.addEventListener('click', () => {
    sideMenu.classList.remove('active');
    overlay.classList.remove('active');
  });

  document.addEventListener('click', (event) => {
    if (sideMenu.classList.contains('active') &&
        !sideMenu.contains(event.target) &&
        !menuBtn.contains(event.target)) {
      sideMenu.classList.remove('active');
      overlay.classList.remove('active');
    }
  });
}

// ========== LOGOUT ==========

function initLogout() {
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', async () => {
    window.notificationSystem?.confirm(
      '¿Deseas cerrar sesión?',
      async () => {
        try {
          window.loadingSystem?.show('Cerrando sesión...');
          await window.firebaseAuth.signOut();
          await window.SessionPersistence?.clearSession();
          
          window.loadingSystem?.hide();
          window.notificationSystem?.success('Sesión cerrada');
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 500);
        } catch (error) {
          window.loadingSystem?.hide();
          window.notificationSystem?.error('Error al cerrar sesión: ' + error.message);
        }
      }
    );
  });
}

// ========== TABS ==========

function initTabs() {
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      tabContents.forEach((content) => content.classList.remove('active'));
      btn.classList.add('active');
      const tabId = btn.dataset.tab;
      const tabContent = document.getElementById(tabId);
      if (tabContent) {
        tabContent.classList.add('active');
      }
    });
  });
}

// ========== SINCRONIZACIÓN OFFLINE/ONLINE ==========

// Detectar cuando vuelve la conexión y sincronizar
window.addEventListener('online', async () => {
  console.log('Conexión restaurada, sincronizando datos...');
  try {
    const sessionData = await window.SessionPersistence.getSession();
    if (sessionData && sessionData.userData) {
      cargarTareasIniciadas(sessionData.userData.email);
      cargarTareasCompletadas(sessionData.userData.email);
    }
  } catch (error) {
    console.error('Error al sincronizar en reconexión:', error);
  }
});

// Función para cargar tareas desde caché local
async function cargarTareasDelCache(userEmail) {
  try {
    const iniciadas = await window.SessionPersistence?.getTasks(userEmail, 'iniciadas') || [];
    const completadas = await window.SessionPersistence?.getTasks(userEmail, 'completadas') || [];
    
    const containerIniciadas = document.getElementById('iniciados-container');
    const containerCompletadas = document.getElementById('completados-container');
    
    if (containerIniciadas) {
      if (iniciadas.length === 0) {
        containerIniciadas.innerHTML = '<p style="text-align: center; color: #a0a0cc; padding: 40px 0;">No hay tareas iniciadas (modo offline)</p>';
      } else {
        containerIniciadas.innerHTML = '';
        iniciadas.forEach((tarea) => {
          containerIniciadas.appendChild(crearElementoTarea(tarea));
        });
      }
    }
    
    if (containerCompletadas) {
      if (completadas.length === 0) {
        containerCompletadas.innerHTML = '<p style="text-align: center; color: #a0a0cc; padding: 40px 0;">No hay tareas completadas (modo offline)</p>';
      } else {
        containerCompletadas.innerHTML = '';
        completadas.forEach((tarea) => {
          containerCompletadas.appendChild(crearElementoTareaCompletada(tarea));
        });
      }
    }
  } catch (error) {
    console.error('Error al cargar tareas del caché:', error);
    // Fallback a localStorage si IndexedDB falla
    try {
      const iniciadas = Helpers.getStorage('tareasIniciadas') || [];
      const completadas = Helpers.getStorage('tareasCompletadas') || [];
      
      const containerIniciadas = document.getElementById('iniciados-container');
      const containerCompletadas = document.getElementById('completados-container');
      
      if (containerIniciadas) {
        if (iniciadas.length === 0) {
          containerIniciadas.innerHTML = '<p style="text-align: center; color: #a0a0cc; padding: 40px 0;">No hay tareas iniciadas (modo offline)</p>';
        } else {
          containerIniciadas.innerHTML = '';
          iniciadas.forEach((tarea) => {
            containerIniciadas.appendChild(crearElementoTarea(tarea));
          });
        }
      }
      
      if (containerCompletadas) {
        if (completadas.length === 0) {
          containerCompletadas.innerHTML = '<p style="text-align: center; color: #a0a0cc; padding: 40px 0;">No hay tareas completadas (modo offline)</p>';
        } else {
          containerCompletadas.innerHTML = '';
          completadas.forEach((tarea) => {
            containerCompletadas.appendChild(crearElementoTareaCompletada(tarea));
          });
        }
      }
    } catch (fallbackError) {
      console.error('Error al cargar tareas del localStorage:', fallbackError);
      window.notificationSystem?.error('No se pudieron cargar las tareas');
    }
  }
}

// ========== TAREAS ==========

function cargarTareasIniciadas(userEmail) {
  const container = document.getElementById('iniciados-container');
  if (!container) return;

  container.innerHTML = '<p style="text-align: center; color: #a0a0cc;">Cargando tareas...</p>';

  window.firebaseDB.collection('tareas')
    .where('userEmail', '==', userEmail)
    .where('estado', '==', 'pendiente')
    .get()
    .then(async (snapshot) => {
      if (snapshot.empty) {
        container.innerHTML = '<p style="text-align: center; color: #a0a0cc; padding: 40px 0;">No hay tareas iniciadas</p>';
        await window.SessionPersistence.saveTasks(userEmail, 'iniciadas', []);
        Helpers.setStorage('tareasIniciadas', []);
        return;
      }

      const tareas = [];
      container.innerHTML = '';
      snapshot.forEach((doc) => {
        const tarea = { id: doc.id, ...doc.data() };
        tareas.push(tarea);
        container.appendChild(crearElementoTarea(tarea));
      });
      
      // Guardar tareas en SessionPersistence para acceso offline
      await window.SessionPersistence.saveTasks(userEmail, 'iniciadas', tareas);
      Helpers.setStorage('tareasIniciadas', tareas);
    })
    .catch((error) => {
      window.notificationSystem.error('Error al cargar tareas: ' + error.message);
      console.error(error);
    });
}

function cargarTareasCompletadas(userEmail) {
  const container = document.getElementById('completados-container');
  if (!container) return;

  container.innerHTML = '<p style="text-align: center; color: #a0a0cc;">Cargando tareas...</p>';

  window.firebaseDB.collection('tareas')
    .where('userEmail', '==', userEmail)
    .where('estado', '==', 'completado')
    .get()
    .then(async (snapshot) => {
      if (snapshot.empty) {
        container.innerHTML = '<p style="text-align: center; color: #a0a0cc; padding: 40px 0;">No hay tareas completadas</p>';
        await window.SessionPersistence.saveTasks(userEmail, 'completadas', []);
        Helpers.setStorage('tareasCompletadas', []);
        return;
      }

      const tareas = [];
      container.innerHTML = '';
      snapshot.forEach((doc) => {
        const tarea = { id: doc.id, ...doc.data() };
        tareas.push(tarea);
        container.appendChild(crearElementoTareaCompletada(tarea));
      });
      
      // Guardar tareas en SessionPersistence para acceso offline
      await window.SessionPersistence.saveTasks(userEmail, 'completadas', tareas);
      Helpers.setStorage('tareasCompletadas', tareas);
    })
    .catch((error) => {
      window.notificationSystem.error('Error al cargar tareas: ' + error.message);
      console.error(error);
    });
}

function crearElementoTarea(tarea) {
  const div = document.createElement('div');
  div.classList.add('tarea-card');

  div.innerHTML = `
    <div class="tarea-info">
      <h4>${tarea.clienteId}</h4>
      <p><strong>Tipo:</strong> ${tarea.tipoTarea}</p>
      <p><strong>Ubicación:</strong> ${tarea.distrito}</p>
      <p><strong>Fecha:</strong> ${tarea.fecha}</p>
    </div>
    <div class="tarea-actions">
      <button class="btn-lupa" title="Ver detalles">📋</button>
    </div>
  `;

  div.querySelector('.btn-lupa').addEventListener('click', () => {
    verDetallesTarea(tarea);
  });

  return div;
}

function crearElementoTareaCompletada(tarea) {
  const div = document.createElement('div');
  div.classList.add('tarea-card');

  div.innerHTML = `
    <div class="tarea-info">
      <h4>${tarea.clienteId}</h4>
      <p><strong>Tipo:</strong> ${tarea.tipoTarea}</p>
      <p><strong>Ubicación:</strong> ${tarea.distrito}</p>
      <p><strong>Completada:</strong> ${tarea.fecha}</p>
    </div>
    <div class="tarea-actions">
      <button class="btn-lupa" title="Ver detalles">✓</button>
    </div>
  `;

  div.querySelector('.btn-lupa').addEventListener('click', () => {
    verDetallesTarea(tarea);
  });

  return div;
}

function verDetallesTarea(tarea) {
  const mensaje = `
    <strong>Cliente:</strong> ${tarea.clienteId}
    <strong>Unidad:</strong> ${tarea.unidadId}
    <strong>Tipo:</strong> ${tarea.tipoTarea}
    <strong>Dirección:</strong> ${tarea.direccion}
    <strong>Distrito:</strong> ${tarea.distrito}
    <strong>Fecha:</strong> ${tarea.fecha}
  `;
  window.notificationSystem.info(mensaje, 'info', 5000);
}

// ========== FAB & MODAL ==========

function initFabModal() {
  if (!mainFab || !modal || !closeModal || !overlay) return;

  mainFab.addEventListener('click', () => {
    modal.classList.toggle('show');
    overlay.classList.toggle('active');
  });

  closeModal.addEventListener('click', () => {
    modal.classList.remove('show');
    overlay.classList.remove('active');
  });

  overlay.addEventListener('click', () => {
    modal.classList.remove('show');
    overlay.classList.remove('active');
    if (sideMenu) {
      sideMenu.classList.remove('active');
    }
  });

  modalOptions.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tipoTarea = btn.dataset.tipo;
      if (tipoTarea) {
        Helpers.setStorage('tipoDeTarea', tipoTarea);
        window.loadingSystem?.show('Redirigiendo a formulario...');
        setTimeout(() => {
          window.location.href = 'formulario.html';
        }, 800);
      }
    });
  });
}

// ========== RECARGAR DATOS ==========

function initReloadButton() {
  const reloadBtn = document.querySelector('[title="Recargar información"]');
  if (reloadBtn) {
    reloadBtn.addEventListener('click', () => {
      window.loadingSystem?.show('Recargando datos...');
      const user = window.firebaseAuth?.currentUser;
      if (user) {
        cargarTareasIniciadas(user.email);
        cargarTareasCompletadas(user.email);
      }
      setTimeout(() => {
        window.loadingSystem?.hide();
        window.notificationSystem?.success('Datos recargados');
      }, 1000);
    });
  }
}

// ========== INICIALIZACIÓN GENERAL ==========

async function initializeApp() {
  try {
    // Esperar a que los módulos necesarios estén disponibles
    let attempts = 0;
    while (!window.SessionPersistence && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    // Inicializar componentes
    initAuthState();
    initSideMenu();
    initLogout();
    initTabs();
    initFabModal();
    initConnectivityMonitoring();
    initReloadButton();

    // Esperar a que Firebase esté listo
    if (window.firebaseAuth) {
      window.firebaseAuth.onAuthStateChanged((user) => {
        if (user) {
          loadUserData(user.email);
        }
      });
    }
  } catch (error) {
    console.error('Error durante la inicialización:', error);
    window.notificationSystem?.error('Error al inicializar la aplicación');
  }
}

// ========== DOMContentLoaded ==========

document.addEventListener('DOMContentLoaded', initializeApp);

// ========== MONITOR DE CONEXIÓN ==========

function initConnectivityMonitoring() {
  if (typeof Helpers !== 'undefined' && typeof Helpers.onConnectionChange === 'function') {
    Helpers.onConnectionChange((isOnline) => {
      if (isOnline) {
        window.notificationSystem?.success('Conexión restaurada', 'success', 3000);
        // Sincronizar cola de tareas pendientes
        if (window.offlineQueue?.syncQueue) {
          window.offlineQueue.syncQueue();
        }
      } else {
        window.notificationSystem?.warning('Sin conexión a internet', 'warning', 0);
      }
    });
  }
}

// ========== INICIALIZACIÓN DE GOOGLE MAPS ==========

/**
 * Inicializa Google Maps cuando la API se carga
 * Esta función es llamada por el callback de Google Maps
 */
function initMap() {
  const mapContainer = document.getElementById('map');
  
  if (!mapContainer) {
    console.warn('Contenedor del mapa no encontrado');
    return;
  }

  // Ubicación por defecto (Lima, Perú)
  const defaultLocation = {
    lat: -12.0464,
    lng: -77.0428
  };

  // Crear el mapa
  const map = new google.maps.Map(mapContainer, {
    zoom: 15,
    center: defaultLocation,
    mapTypeControl: false,
    fullscreenControl: true,
    styles: [
      {
        elementType: 'geometry',
        stylers: [{ color: '#050812' }]
      },
      {
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#050812' }]
      },
      {
        elementType: 'labels.text.fill',
        stylers: [{ color: '#00d4ff' }]
      },
      {
        featureType: 'administrative.locality',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#00ffff' }]
      },
      {
        featureType: 'poi',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#ff0055' }]
      },
      {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#1a1f3e' }]
      },
      {
        featureType: 'road',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#00d4ff' }]
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#00ffff' }]
      },
      {
        featureType: 'transit',
        elementType: 'geometry',
        stylers: [{ color: '#0a0e27' }]
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#0a1929' }]
      }
    ]
  });

  // Agregar marcador de ubicación por defecto
  const defaultMarker = new google.maps.Marker({
    position: defaultLocation,
    map: map,
    title: 'Ubicación por defecto (Lima)',
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: '#00d4ff',
      fillOpacity: 0.8,
      strokeColor: '#00ffff',
      strokeWeight: 2
    }
  });

  // Obtener ubicación actual del usuario
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        // Centrar en la ubicación actual
        map.setCenter(userLocation);

        // Agregar marcador de usuario
        const userMarker = new google.maps.Marker({
          position: userLocation,
          map: map,
          title: 'Mi ubicación',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#ff0055',
            fillOpacity: 0.9,
            strokeColor: '#ff88cc',
            strokeWeight: 3
          }
        });
      },
      (error) => {
        console.warn('Geolocalización no disponible:', error);
        window.notificationSystem?.warning('No se pudo obtener tu ubicación');
      }
    );
  }

  // Guardar el mapa en window para usarlo en otras funciones
  window.currentMap = map;
}

// Esperar a que Google Maps se cargue correctamente
function ensureMapInitialized() {
  if (typeof google !== 'undefined' && google.maps) {
    initMap();
  } else {
    console.warn('Google Maps API no disponible, reintentando...');
    setTimeout(ensureMapInitialized, 500);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(ensureMapInitialized, 100);
  });
} else {
  setTimeout(ensureMapInitialized, 100);
}
