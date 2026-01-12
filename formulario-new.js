/**
 * Formulario.js Mejorado - Gestión del Formulario de Tareas
 */

// Las instancias de Firebase ya están en window desde firebase-config.js
// window.firebaseAuth, window.firebaseDB, window.firebaseStorage

// Variables globales
let ubicacionMapa, userMarker, clienteMarker, clienteCircle;
let currentPosition = null;
let watchId = null;
const MAX_DISTANCE = 50; // metros

// Elementos del DOM
const menuBtn = document.getElementById('menu-btn');
const sideMenu = document.getElementById('side-menu');
const logoutBtn = document.getElementById('logout-btn');
const enviarBtn = document.getElementById('enviar');
const cancelarBtn = document.getElementById('cancelar');
const emergencyBtn = document.getElementById('emergency-btn');
const overlay = document.createElement('div');

overlay.classList.add('overlay');
document.body.appendChild(overlay);

// ========== PROTECCIÓN DE PÁGINA ==========

window.firebaseAuth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = 'index.html';
  } else {
    document.getElementById('fecha').innerText = Helpers.formatDate();
    document.getElementById('user-name').innerText = user.displayName || 'Usuario';
    document.getElementById('user-email').innerText = user.email;
    inicializar();
  }
});

async function inicializar() {
  try {
    console.log('🔄 Iniciando formulario...');
    console.log(`🌐 Estado de conexión: ${navigator.onLine ? '✅ ONLINE' : '❌ OFFLINE'}`);
    
    // Esperar a que la autenticación esté lista
    const user = window.firebaseAuth.currentUser;
    if (!user) {
      console.warn('⏳ Usuario no autenticado, esperando...');
      // Esperar un poco para que la autenticación se establezca
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`👤 Usuario autenticado: ${user?.email || 'No disponible'}`);
    
    cargarTipoDeTarea();
    initUbicacionesMapa();
    console.log('📋 Llamando a populateDropdowns...');
    await populateDropdowns(); // Esperar a que se carguen los clientes
    console.log('✅ Formulario inicializado correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar:', error);
    window.notificationSystem.error('Error al inicializar: ' + error.message);
  }
}

// ========== MENÚ LATERAL ==========

menuBtn.addEventListener('click', () => {
  sideMenu.classList.toggle('active');
  overlay.classList.toggle('active');
});

overlay.addEventListener('click', () => {
  sideMenu.classList.remove('active');
  overlay.classList.remove('active');
});

logoutBtn.addEventListener('click', async () => {
  window.notificationSystem.confirm(
    '¿Deseas cerrar sesión?',
    async () => {
      try {
        window.loadingSystem.show('Cerrando sesión...');
        await window.firebaseAuth.signOut();
        window.loadingSystem.hide();
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 500);
      } catch (error) {
        window.loadingSystem.hide();
        window.notificationSystem.error('Error: ' + error.message);
      }
    }
  );
});

// ========== MONITOR DE CONEXIÓN ==========

window.addEventListener('online', () => {
  console.log('✅ CONEXIÓN RESTAURADA');
  window.notificationSystem.success('Conexión restaurada. Ya puedes cargar clientes.');
});

window.addEventListener('offline', () => {
  console.log('❌ PERDISTE CONEXIÓN A INTERNET');
  window.notificationSystem.warning('Sin conexión a internet. No puedes descargar datos nuevos.', 'warning', 0);
});

// ========== GEOLOCALIZACIÓN ==========

function initUbicacionesMapa() {
  if (!document.getElementById('ubicaciones-mapa')) {
    window.notificationSystem.error('Contenedor del mapa no encontrado');
    return;
  }

  const initialPosition = { lat: -12.0453, lng: -77.0311 };
  ubicacionMapa = new google.maps.Map(document.getElementById('ubicaciones-mapa'), {
    center: initialPosition,
    zoom: 15,
    mapTypeControl: false,
    fullscreenControl: false,
    styles: [
      { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#00d4ff' }] }
    ]
  });

  userMarker = new google.maps.Marker({
    map: ubicacionMapa,
    title: 'Tu ubicación',
    icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32"%3E%3Ccircle cx="16" cy="16" r="14" fill="%2300d4ff" stroke="white" stroke-width="2"/%3E%3C/svg%3E'
  });

  clienteMarker = new google.maps.Marker({
    map: ubicacionMapa,
    title: 'Ubicación del Cliente',
    icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32"%3E%3Ccircle cx="16" cy="16" r="14" fill="%23ff0055" stroke="white" stroke-width="2"/%3E%3C/svg%3E'
  });

  clienteCircle = new google.maps.Circle({
    map: ubicacionMapa,
    radius: MAX_DISTANCE,
    fillColor: '#ff0055',
    fillOpacity: 0.15,
    strokeColor: '#ff0055',
    strokeOpacity: 0.6,
    strokeWeight: 2,
    clickable: false
  });

  trackUserLocation();
}

function trackUserLocation() {
  if (!navigator.geolocation) {
    window.notificationSystem.error('Tu navegador no soporta geolocalización');
    return;
  }

  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
  }

  window.loadingSystem.show('Obteniendo ubicación...');

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      currentPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      userMarker.setPosition(currentPosition);
      ubicacionMapa.setCenter(currentPosition);
      verificarDistancia();
      window.loadingSystem.hide();

      console.log('Ubicación actualizada:', currentPosition);
    },
    (error) => {
      window.loadingSystem.hide();

      const errorMessages = {
        1: 'Permiso denegado. Por favor habilita la geolocalización.',
        2: 'No se pudo obtener la ubicación. Verifica tu GPS.',
        3: 'Tiempo agotado. Intenta nuevamente.'
      };

      window.notificationSystem.error(errorMessages[error.code] || 'Error de geolocalización');
      console.warn('Error de geolocalización:', error);
    },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
  );
}

// ========== DISTANCIA ==========

function verificarDistancia() {
  const clienteLat = parseFloat(document.getElementById('latitud').value);
  const clienteLng = parseFloat(document.getElementById('longitud').value);

  if (!currentPosition || isNaN(clienteLat) || isNaN(clienteLng)) {
    enviarBtn.disabled = true;
    enviarBtn.title = 'Datos incompletos';
    return;
  }

  const distancia = Helpers.calculateDistance(
    currentPosition.lat,
    currentPosition.lng,
    clienteLat,
    clienteLng
  );

  if (distancia > MAX_DISTANCE) {
    enviarBtn.disabled = true;
    enviarBtn.title = `A ${Math.round(distancia)}m de distancia (máximo ${MAX_DISTANCE}m)`;
  } else {
    enviarBtn.disabled = false;
    enviarBtn.title = `A ${Math.round(distancia)}m de distancia - ¡Listo!`;
  }
}

function actualizarClienteMapa(lat, lng) {
  if (!isNaN(lat) && !isNaN(lng)) {
    const clientePosition = { lat: parseFloat(lat), lng: parseFloat(lng) };
    clienteMarker.setPosition(clientePosition);
    clienteCircle.setCenter(clientePosition);
    ubicacionMapa.setCenter(clientePosition);
    verificarDistancia();
  }
}

// ========== DESPLEGABLES ==========

async function populateDropdowns() {
  const clienteDropdown = document.getElementById('buscarCliente');
  const unidadDropdown = document.getElementById('buscarUnidad');

  if (!navigator.onLine) {
    window.notificationSystem.warning('Sin conexión a internet');
    return;
  }

  try {
    window.loadingSystem.show('Cargando clientes...');
    
    // Obtenemos el snapshot para depurar mejor
    console.log('🔍 Consultando colección CLIENTES...');
    const snapshot = await window.firebaseDB.collection('CLIENTES').get();

    console.log(`📊 Total documentos encontrados: ${snapshot.size}`);
    console.log('Revisando documentos encontrados...');
    
    clienteDropdown.innerHTML = '<option value="">Seleccionar Cliente</option>';
    unidadDropdown.innerHTML = '<option value="">Seleccionar Unidad</option>';
    unidadDropdown.disabled = true;

    if (snapshot.empty) {
      console.error('❌ La colección está vacía. Verifica que los IDs de clientes NO estén en cursiva en Firebase Console.');
      console.warn('💡 Si los documentos aparecen en cursiva, es porque son "virtuales" (solo tienen subcolecciones)');
      console.warn('💡 Solución: Crea un documento físico con al menos un campo (ejemplo: existe: true)');
      window.notificationSystem.warning('No se encontraron clientes físicos. Verifica Firebase Console.');
      return;
    }

    let clientesValidos = 0;
    snapshot.forEach((doc) => {
      console.log(`✅ ID encontrado: ${doc.id}`, doc.data());
      const opt = document.createElement('option');
      opt.value = doc.id;
      opt.textContent = doc.id;
      clienteDropdown.appendChild(opt);
      clientesValidos++;
    });

    console.log(`✨ Total de clientes válidos cargados: ${clientesValidos}`);

    // Evento para cargar unidades
    clienteDropdown.addEventListener('change', async () => {
      const selectedClienteId = clienteDropdown.value;
      console.log(`👤 Cliente seleccionado: ${selectedClienteId}`);
      unidadDropdown.innerHTML = '<option value="">Seleccionar Unidad</option>';

      if (selectedClienteId) {
        try {
          window.loadingSystem.show('Cargando unidades...');
          console.log(`🔍 Consultando unidades para: CLIENTES/${selectedClienteId}/UNIDADES`);
          
          const unidadesSnapshot = await window.firebaseDB
            .collection(`CLIENTES/${selectedClienteId}/UNIDADES`)
            .get();

          console.log(`📊 Unidades encontradas: ${unidadesSnapshot.size}`);

          if (unidadesSnapshot.empty) {
            console.warn(`⚠️ El cliente ${selectedClienteId} no tiene unidades`);
            window.notificationSystem.warning('Este cliente no tiene unidades');
            return;
          }

          unidadesSnapshot.forEach((unidadDoc) => {
            console.log(`✅ Unidad encontrada: ${unidadDoc.id}`);
            const opt = document.createElement('option');
            opt.value = unidadDoc.id;
            opt.textContent = unidadDoc.id;
            unidadDropdown.appendChild(opt);
          });

          unidadDropdown.disabled = false;
          console.log('✨ Dropdown de unidades habilitado');
        } catch (error) {
          console.error('❌ Error de Firestore al cargar unidades:', error);
          window.notificationSystem.error('Error: ' + error.code);
        } finally {
          window.loadingSystem.hide();
        }
      } else {
        unidadDropdown.disabled = true;
      }
    });

  } catch (error) {
    console.error('❌ Error de Firestore:', error);
    window.notificationSystem.error('Error: ' + error.code);
  } finally {
    window.loadingSystem.hide();
  }
}

document.getElementById('buscarUnidad').addEventListener('change', async () => {
  const clienteId = document.getElementById('buscarCliente').value;
  const unidadId = document.getElementById('buscarUnidad').value;

  console.log(`📍 Unidad seleccionada - Cliente: ${clienteId}, Unidad: ${unidadId}`);

  if (clienteId && unidadId) {
    try {
      window.loadingSystem.show('Cargando datos de la unidad...');
      console.log(`🔍 Obteniendo datos: CLIENTES/${clienteId}/UNIDADES/${unidadId}`);
      
      const unidadDoc = await window.firebaseDB.doc(`CLIENTES/${clienteId}/UNIDADES/${unidadId}`).get();
      
      if (unidadDoc.exists) {
        const unidadData = unidadDoc.data();
        console.log('📊 Datos de unidad obtenidos:', unidadData);
        
        document.getElementById('latitud').value = unidadData.latitud || '';
        document.getElementById('longitud').value = unidadData.longitud || '';

        console.log(`📍 Coordenadas: ${unidadData.latitud}, ${unidadData.longitud}`);
        actualizarClienteMapa(unidadData.latitud, unidadData.longitud);
        window.loadingSystem.hide();
        console.log('✅ Datos de unidad cargados correctamente');
      } else {
        window.loadingSystem.hide();
        console.warn('⚠️ El documento de la unidad no existe');
        window.notificationSystem.error('No se encontraron datos de la unidad');
      }
    } catch (error) {
      window.loadingSystem.hide();
      console.error('❌ Error al cargar datos de unidad:', error);
      window.notificationSystem.error('Error: ' + error.message);
    }
  }
});

// ========== TIPO DE TAREA ==========

function cargarTipoDeTarea() {
  const tipoDeTarea = Helpers.getStorage('tipoDeTarea');
  if (tipoDeTarea) {
    document.getElementById('tipoTarea').value = tipoDeTarea;
  }
}

// ========== BOTONES ==========

cancelarBtn.addEventListener('click', () => {
  window.notificationSystem.confirm(
    '¿Descartar cambios y volver?',
    () => {
      window.location.href = 'menu.html';
    }
  );
});

enviarBtn.addEventListener('click', async () => {
  const clienteId = document.getElementById('buscarCliente').value;
  const unidadId = document.getElementById('buscarUnidad').value;
  const tipoTarea = document.getElementById('tipoTarea').value;
  const latitudCliente = document.getElementById('latitud').value;
  const longitudCliente = document.getElementById('longitud').value;

  if (!clienteId || !unidadId || !tipoTarea || !latitudCliente || !longitudCliente) {
    window.notificationSystem.error('Por favor completa todos los campos');
    return;
  }

  if (!currentPosition) {
    window.notificationSystem.error('No se puede obtener tu ubicación');
    return;
  }

  const distancia = Helpers.calculateDistance(
    currentPosition.lat,
    currentPosition.lng,
    parseFloat(latitudCliente),
    parseFloat(longitudCliente)
  );

  if (distancia > MAX_DISTANCE) {
    window.notificationSystem.error(`Debes estar a menos de ${MAX_DISTANCE}m del cliente`);
    return;
  }

  window.loadingSystem.show('Guardando tarea...');
  enviarBtn.disabled = true;

  try {
    const user = window.firebaseAuth.currentUser;
    const tarea = {
      clienteId,
      unidadId,
      userId: user.uid,
      userEmail: user.email,
      tipoTarea,
      latitudCliente: parseFloat(latitudCliente),
      longitudCliente: parseFloat(longitudCliente),
      latitudUsuario: currentPosition.lat,
      longitudUsuario: currentPosition.lng,
      distancia: Math.round(distancia),
      estado: 'pendiente',
      fecha: Helpers.formatDate(),
      hora: Helpers.formatTime(),
      createdAt: new Date().toISOString()
    };

    const docRef = await window.firebaseDB.collection('tareas').add(tarea);

    window.loadingSystem.hide();
    window.notificationSystem.success(`Tarea creada: ${docRef.id}`);

    setTimeout(() => {
      window.location.href = 'menu.html';
    }, 1500);
  } catch (error) {
    window.loadingSystem.hide();
    enviarBtn.disabled = false;
    window.notificationSystem.error('Error al guardar tarea: ' + error.message);
    console.error(error);
  }
});

emergencyBtn.addEventListener('click', () => {
  window.notificationSystem.confirm(
    'Recargar todos los datos y permisos',
    () => {
      window.loadingSystem.show('Recargando...');
      
      // Limpiar y reinicializar
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }

      setTimeout(() => {
        inicializar();
        window.loadingSystem.hide();
        window.notificationSystem.success('Datos recargados');
      }, 1000);
    }
  );
});

// ========== MONITOR DE CONEXIÓN ==========

Helpers.onConnectionChange((isOnline) => {
  if (isOnline) {
    window.notificationSystem.success('Conexión restaurada', 'success', 3000);
  } else {
    window.notificationSystem.warning('Sin conexión a internet', 'warning', 0);
  }
});

// ========== LIMPIAR RECURSOS AL DESCARGAR ==========

window.addEventListener('beforeunload', () => {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
  }
});
