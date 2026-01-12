/**
 * Menu.js Mejorado - Gestión del Menú Principal
 */

// Las instancias de Firebase ya están en window desde firebase-config.js
// window.firebaseAuth, window.firebaseDB, window.firebaseStorage

// Elementos del DOM
const menuBtn = document.getElementById('menu-btn');
const sideMenu = document.getElementById('side-menu');
const logoutBtn = document.getElementById('logout-btn');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const mainFab = document.getElementById('main-fab');
const addFab = document.getElementById('add-fab');
const modal = document.getElementById('modal');
const closeModal = document.getElementById('close-modal');
const modalOptions = document.querySelectorAll('.modal-option');
const overlay = document.createElement('div');

// Setup overlay
overlay.classList.add('overlay');
document.body.appendChild(overlay);

// Proteger página
window.firebaseAuth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = 'index.html';
  } else {
    document.getElementById('fecha').innerText = Helpers.formatDate();
    document.getElementById('user-name').innerText = user.displayName || 'Usuario';
    document.getElementById('user-email').innerText = user.email;
    cargarTareasIniciadas(user.email);
    cargarTareasCompletadas(user.email);
  }
});

// ========== MENÚ LATERAL ==========

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

// Cerrar sesión
logoutBtn.addEventListener('click', async () => {
  window.notificationSystem.confirm(
    '¿Deseas cerrar sesión?',
    async () => {
      try {
        window.loadingSystem.show('Cerrando sesión...');
        await window.firebaseAuth.signOut();
        window.loadingSystem.hide();
        window.notificationSystem.success('Sesión cerrada');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 500);
      } catch (error) {
        window.loadingSystem.hide();
        window.notificationSystem.error('Error al cerrar sesión: ' + error.message);
      }
    }
  );
});

// ========== TABS ==========

tabBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    tabBtns.forEach((b) => b.classList.remove('active'));
    tabContents.forEach((content) => content.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// ========== TAREAS ==========

function cargarTareasIniciadas(userEmail) {
  const container = document.getElementById('iniciados-container');
  if (!container) return;

  container.innerHTML = '<p style="text-align: center; color: #a0a0cc;">Cargando tareas...</p>';

  window.firebaseDB.collection('tareas')
    .where('userEmail', '==', userEmail)
    .where('estado', '==', 'pendiente')
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        container.innerHTML = '<p style="text-align: center; color: #a0a0cc; padding: 40px 0;">No hay tareas iniciadas</p>';
        return;
      }

      container.innerHTML = '';
      snapshot.forEach((doc) => {
        const tarea = { id: doc.id, ...doc.data() };
        container.appendChild(crearElementoTarea(tarea));
      });
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
    .then((snapshot) => {
      if (snapshot.empty) {
        container.innerHTML = '<p style="text-align: center; color: #a0a0cc; padding: 40px 0;">No hay tareas completadas</p>';
        return;
      }

      container.innerHTML = '';
      snapshot.forEach((doc) => {
        const tarea = { id: doc.id, ...doc.data() };
        container.appendChild(crearElementoTareaCompletada(tarea));
      });
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
  sideMenu.classList.remove('active');
});

modalOptions.forEach((btn) => {
  btn.addEventListener('click', () => {
    const tipoTarea = btn.dataset.tipo;
    Helpers.setStorage('tipoDeTarea', tipoTarea);
    window.loadingSystem.show('Redirigiendo a formulario...');
    setTimeout(() => {
      window.location.href = 'formulario.html';
    }, 800);
  });
});

// ========== RECARGAR DATOS ==========

document.addEventListener('DOMContentLoaded', () => {
  // Botón para recargar (si existe)
  const reloadBtn = document.querySelector('[title="Recargar información"]');
  if (reloadBtn) {
    reloadBtn.addEventListener('click', () => {
      window.loadingSystem.show('Recargando datos...');
      setTimeout(() => {
        const user = window.firebaseAuth.currentUser;
        if (user) {
          cargarTareasIniciadas(user.email);
          cargarTareasCompletadas(user.email);
        }
        window.loadingSystem.hide();
        window.notificationSystem.success('Datos recargados');
      }, 1000);
    });
  }
});

// ========== MONITOR DE CONEXIÓN ==========

Helpers.onConnectionChange((isOnline) => {
  if (isOnline) {
    window.notificationSystem.success('Conexión restaurada', 'success', 3000);
  } else {
    window.notificationSystem.warning('Sin conexión a internet', 'warning', 0);
  }
});

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
        console.log('Geolocalización no disponible:', error);
        window.notificationSystem.warning('No se pudo obtener tu ubicación');
      }
    );
  }

  // Guardar el mapa en window para usarlo en otras funciones
  window.currentMap = map;
}

// Esperar a que Google Maps se cargue correctamente
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Esperar un poco más a que Google Maps API esté disponible
    setTimeout(() => {
      if (typeof google !== 'undefined' && google.maps) {
        initMap();
      } else {
        console.warn('Google Maps API no disponible aún');
      }
    }, 100);
  });
} else {
  // El DOM ya está cargado
  setTimeout(() => {
    if (typeof google !== 'undefined' && google.maps) {
      initMap();
    }
  }, 100);
}
