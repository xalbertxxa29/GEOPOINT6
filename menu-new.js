/**
 * Menu.js Mejorado - Gestión del Menú Principal
 * Versión profesional corporativa con sesión offline robusta
 */

// ========== PROTECCIÓN DE PÁGINA CON SESIÓN OFFLINE ==========

// Esperar a que SessionManager esté disponible
const waitForSessionManager = () => {
  return new Promise((resolve) => {
    if (window.SessionManager) {
      resolve();
    } else {
      const checkInterval = setInterval(() => {
        if (window.SessionManager) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);
      // Timeout de 5 segundos
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 5000);
    }
  });
};

window.firebaseAuth.onAuthStateChanged(async (user) => {
  // Si hay usuario en Firebase, todo OK
  if (user) {
    initializePage();
    return;
  }

  // Si NO hay usuario en Firebase, esperar a SessionManager
  await waitForSessionManager();

  // Verificar sesión local (offline)
  const session = window.SessionManager?.getSession();
  if (session && session.isAuthenticated) {
    // ✅ SESIÓN ACTIVA OFFLINE - NO REDIRIGIR
    initializePage();
  } else {
    // ❌ SIN SESIÓN - REDIRIGIR A LOGIN
    window.location.href = 'index.html';
  }
});

// ========== INICIALIZACIÓN DE PÁGINA ==========

function initializePage() {
  // Obtener usuario actual
  const user = window.firebaseAuth.currentUser;
  const userData = user ? {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || 'Usuario'
  } : window.SessionManager.getUserData();

  if (!userData) {
    window.location.href = 'index.html';
    return;
  }

  // Mostrar datos del usuario
  document.getElementById('fecha').innerText = Helpers.formatDate();
  document.getElementById('user-name').innerText = userData.displayName;
  document.getElementById('user-email').innerText = userData.email;

  // Inicializar componentes
  initMenu();
  initTabs();
  initLogout();
  initFab();
  
  // Cargar tareas
  cargarTareas(userData.email);
  
  // Monitorear conexión
  monitorearConexion();
}

// ========== MENÚ LATERAL ==========

function initMenu() {
  const menuBtn = document.getElementById('menu-btn');
  const sideMenu = document.getElementById('side-menu');
  const overlay = document.querySelector('.overlay') || createOverlay();

  if (!menuBtn) return;

  menuBtn.addEventListener('click', () => {
    sideMenu.classList.toggle('active');
    overlay.classList.toggle('active');
  });

  overlay.addEventListener('click', () => {
    sideMenu.classList.remove('active');
    overlay.classList.remove('active');
  });

  // Cerrar menú al hacer click en un enlace
  document.querySelectorAll('#side-menu a').forEach(link => {
    link.addEventListener('click', () => {
      sideMenu.classList.remove('active');
      overlay.classList.remove('active');
    });
  });
}

// ========== TABS ==========

function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      
      // Remover clase activa de todos
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Agregar clase activa al seleccionado
      btn.classList.add('active');
      document.getElementById(tabName)?.classList.add('active');
    });
  });
}

// ========== LOGOUT ==========

function initLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', () => {
    window.notificationSystem?.confirm(
      '¿Deseas cerrar sesión?',
      async () => {
        try {
          window.loadingSystem?.show('Cerrando sesión...');
          
          // Cerrar sesión Firebase
          try {
            await window.firebaseAuth.signOut();
          } catch (error) {
            console.warn('Firebase logout:', error);
          }
          
          // Limpiar sesión local
          window.SessionManager?.clearSession();
          
          window.loadingSystem?.hide();
          window.notificationSystem?.success('Sesión cerrada');
          
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 500);
        } catch (error) {
          window.loadingSystem?.hide();
          window.notificationSystem?.error('Error al cerrar sesión');
        }
      }
    );
  });
}

// ========== FAB (Floating Action Button) ==========

function initFab() {
  const mainFab = document.getElementById('main-fab');
  const modal = document.getElementById('modal');
  const closeModal = document.getElementById('close-modal');
  const modalOptions = document.querySelectorAll('.modal-option');

  if (!mainFab) {
    console.warn('FAB no encontrado en el DOM');
    return;
  }

  // ✅ Asegurar z-index alto (más que Google Maps)
  mainFab.style.zIndex = '9999';
  
  // ✅ Abrir modal al hacer click en FAB
  mainFab.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (modal) {
      modal.classList.add('active');
      modal.style.zIndex = '10000';
    }
  });

  // Cerrar modal
  closeModal?.addEventListener('click', (e) => {
    e.stopPropagation();
    modal?.classList.remove('active');
  });

  // Cerrar modal al hacer click fuera (en el overlay)
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });

  // Seleccionar opción del modal
  modalOptions.forEach(option => {
    option.addEventListener('click', () => {
      const tipo = option.getAttribute('data-tipo');
      window.location.href = `formulario.html?tipo=${encodeURIComponent(tipo)}`;
    });
  });
}

// ========== CARGAR TAREAS ==========

async function cargarTareas(userEmail) {
  try {
    const user = window.firebaseAuth.currentUser;
    
    if (user) {
      // Online: cargar desde Firebase
      await cargarTareasFirebase(user.uid);
    } else {
      // Offline: mostrar mensaje
      window.notificationSystem?.warning('Modo offline - datos pueden estar desactualizados');
    }
  } catch (error) {
    console.error('Error al cargar tareas:', error);
    window.notificationSystem?.error('Error al cargar tareas');
  }
}

async function cargarTareasFirebase(userId) {
  const iniciasContainer = document.getElementById('iniciados-container');
  const completasContainer = document.getElementById('completados-container');

  try {
    window.loadingSystem?.show('Cargando tareas...');

    // Tareas iniciadas
    const iniciadas = await window.firebaseDB
      .collection('tareas')
      .where('userId', '==', userId)
      .where('estado', '==', 'iniciada')
      .get();

    // Tareas completadas
    const completadas = await window.firebaseDB
      .collection('tareas')
      .where('userId', '==', userId)
      .where('estado', '==', 'completada')
      .get();

    // Mostrar tareas iniciadas
    if (iniciadas.empty) {
      iniciasContainer.innerHTML = '<p style="text-align:center; color:#a0a0cc; padding:20px;">No hay tareas iniciadas</p>';
    } else {
      iniciasContainer.innerHTML = '';
      iniciadas.forEach(doc => {
        const tarea = doc.data();
        iniciasContainer.appendChild(crearTarjetaTarea(tarea, doc.id));
      });
    }

    // Mostrar tareas completadas
    if (completadas.empty) {
      completasContainer.innerHTML = '<p style="text-align:center; color:#a0a0cc; padding:20px;">No hay tareas completadas</p>';
    } else {
      completasContainer.innerHTML = '';
      completadas.forEach(doc => {
        const tarea = doc.data();
        completasContainer.appendChild(crearTarjetaTarea(tarea, doc.id));
      });
    }

    window.loadingSystem?.hide();
  } catch (error) {
    window.loadingSystem?.hide();
    console.error('Error al cargar tareas de Firebase:', error);
    window.notificationSystem?.error('Error al cargar tareas');
  }
}

function crearTarjetaTarea(tarea, id) {
  const card = document.createElement('div');
  card.className = 'tarea-card';
  card.innerHTML = `
    <div class="tarea-header">
      <h3>${tarea.descripcion || 'Sin descripción'}</h3>
      <span class="tarea-estado">${tarea.estado}</span>
    </div>
    <div class="tarea-body">
      <p><strong>Cliente:</strong> ${tarea.cliente || '-'}</p>
      <p><strong>Unidad:</strong> ${tarea.unidad || '-'}</p>
      ${tarea.distancia ? `<p><strong>Distancia:</strong> ${Math.round(tarea.distancia)}m</p>` : ''}
      <p><strong>Fecha:</strong> ${tarea.fechaCreacion ? Helpers.formatDate(new Date(tarea.fechaCreacion.toDate())) : '-'}</p>
    </div>
  `;
  return card;
}

// ========== MONITOREO DE CONEXIÓN ==========

function monitorearConexion() {
  Helpers.onConnectionChange((isOnline) => {
    if (isOnline) {
      window.notificationSystem?.success('Conexión restaurada', 'success', 3000);
    } else {
      window.notificationSystem?.warning('Sin conexión - modo offline', 'warning', 0);
    }
  });
}

// ========== UTILIDADES ==========

function createOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  document.body.appendChild(overlay);
  return overlay;
}

// ========== INICIALIZACIÓN DE GOOGLE MAPS ==========

function initMap() {
  const mapContainer = document.getElementById('map');
  
  if (!mapContainer) {
    console.warn('Contenedor del mapa no encontrado');
    return;
  }

  // Mostrar overlay de carga mientras obtiene GPS
  const gpsOverlay = document.createElement('div');
  gpsOverlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(5, 8, 18, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    z-index: 10;
    color: #00d4ff;
    font-weight: bold;
  `;
  gpsOverlay.innerHTML = '📍 Buscando ubicación...';
  mapContainer.style.position = 'relative';
  mapContainer.appendChild(gpsOverlay);

  // Ubicación por defecto (Lima)
  const defaultLocation = { lat: -12.0464, lng: -77.0428 };

  // Crear mapa
  const map = new google.maps.Map(mapContainer, {
    zoom: 15,
    center: defaultLocation,
    mapTypeControl: false,
    fullscreenControl: true,
    styles: [
      { elementType: 'geometry', stylers: [{ color: '#050812' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#00d4ff' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a1f3e' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a1929' }] }
    ]
  });

  // Agregar marcador por defecto
  new google.maps.Marker({
    position: defaultLocation,
    map: map,
    title: 'Ubicación por defecto (Lima)',
    icon: { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#00d4ff', fillOpacity: 0.8, strokeColor: '#00ffff', strokeWeight: 2 }
  });

  // Obtener ubicación del usuario (con timeout de 10 segundos)
  if (navigator.geolocation) {
    const timeoutId = setTimeout(() => {
      // Si tarda más de 10 segundos, usar ubicación por defecto
      gpsOverlay.remove();
      window.notificationSystem?.warning('GPS no disponible, usando ubicación por defecto');
    }, 10000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        // Centrar en ubicación real
        map.setCenter(userLocation);

        // Agregar marcador de usuario
        new google.maps.Marker({
          position: userLocation,
          map: map,
          title: 'Mi ubicación',
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#ff0055', fillOpacity: 0.9, strokeColor: '#ff88cc', strokeWeight: 3 }
        });

        // Remover overlay
        gpsOverlay.remove();
      },
      (error) => {
        clearTimeout(timeoutId);
        console.warn('Error de geolocalización:', error);
        gpsOverlay.remove();
        window.notificationSystem?.warning('No se pudo obtener ubicación');
      }
    );
  } else {
    gpsOverlay.remove();
  }

  window.currentMap = map;
}

// Inicializar mapa cuando Google Maps esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (typeof google !== 'undefined' && google.maps) {
        initMap();
      }
    }, 500);
  });
} else {
  setTimeout(() => {
    if (typeof google !== 'undefined' && google.maps) {
      initMap();
    }
  }, 500);
}
