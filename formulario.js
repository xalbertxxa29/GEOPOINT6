// Inicializar Firebase Auth y Firestore
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// Proteger la página (verificar si hay usuario autenticado)
auth.onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = "index.html";
    } else {
        document.getElementById("fecha").innerText = new Date().toLocaleDateString();
        document.getElementById("user-name").innerText = user.displayName || "Usuario";
        document.getElementById("user-email").innerText = user.email;
    }
});

// Variables globales para el mapa
let ubicacionMapa, userMarker, clienteMarker, clienteCircle;
let currentPosition = null;
let watchId = null;

// Función para cargar el tipo de tarea desde localStorage
function cargarTipoDeTarea() {
    const tipoDeTarea = localStorage.getItem("tipoDeTarea");
    if (tipoDeTarea) {
        const tipoInput = document.getElementById("tipoTarea");
        if (tipoInput) tipoInput.value = tipoDeTarea;
    } else {
        console.warn("No se encontró el tipo de tarea en localStorage.");
    }
}


// Inicializar el mapa en el formulario
function initUbicacionesMapa() {
    // Verificar que el contenedor del mapa exista en el DOM
    if (!document.getElementById("ubicaciones-mapa")) {
        console.error("El contenedor del mapa no está disponible en el DOM.");
        return;
    }

    if (ubicacionMapa) {
        google.maps.event.clearInstanceListeners(ubicacionMapa);
        if (userMarker) userMarker.setMap(null);
        if (clienteMarker) clienteMarker.setMap(null);
        if (clienteCircle) clienteCircle.setMap(null);
    }


    const initialPosition = { lat: -12.0453, lng: -77.0311 };
    ubicacionMapa = new google.maps.Map(document.getElementById("ubicaciones-mapa"), {
        center: initialPosition,
        zoom: 15,
    });

    userMarker = new google.maps.Marker({
        map: ubicacionMapa,
        title: "Tu ubicación",
        icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    });

    clienteMarker = new google.maps.Marker({
        map: ubicacionMapa,
        title: "Ubicación del Cliente",
        icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
    });

    clienteCircle = new google.maps.Circle({
        map: ubicacionMapa,
        radius: 50,
        fillColor: "#FF0000",
        fillOpacity: 0.3,
        strokeColor: "#FF0000",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        clickable: false,
    });
    // Iniciar el rastreo de la ubicación del usuario
    trackUserLocation((position) => {
        currentPosition = position;
        userMarker.setPosition(position);
        ubicacionMapa.setCenter(position);
        verificarDistancia();
    });
}
// Función para rastrear la ubicación del usuario en tiempo real
function trackUserLocation(callback) {
    if (navigator.geolocation) {
        // Limpiar cualquier rastreo existente
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
        }

        watchId = navigator.geolocation.watchPosition(
            (position) => {
                const currentPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                console.log("Ubicación actual:", currentPosition);
                if (typeof callback === "function") callback(currentPosition);
            },
            (error) => {
                console.warn("Error obteniendo la ubicación:", error.message);
                if (error.code === 1) {
                    alert("Permiso denegado para acceder a la ubicación. Por favor, habilítalo.");
                } else if (error.code === 2) {
                    alert("No se pudo determinar la ubicación. Verifica tu conexión o GPS.");
                } else {
                    alert("Error desconocido al obtener la ubicación.");
                }
            },
            { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 } // Incrementar el timeout
        );
    } else {
        alert("Tu navegador no soporta la geolocalización.");
    }
}
// Función para calcular la distancia entre dos puntos usando la fórmula del Haversine
function calcularDistancia(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // Radio de la Tierra en metros
    const toRad = (value) => (value * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distancia en metros
}

// Verificar la distancia entre la ubicación del usuario y el cliente/unidad
function verificarDistancia() {
    const clienteLat = parseFloat(document.getElementById("latitud").value);
    const clienteLng = parseFloat(document.getElementById("longitud").value);

    const enviarBtn = document.getElementById("enviar");

    if (!currentPosition || isNaN(clienteLat) || isNaN(clienteLng)) {
        enviarBtn.disabled = true;
        enviarBtn.title = "Datos incompletos o ubicación no disponible.";
        return;
    }

    const distancia = calcularDistancia(
        currentPosition.lat,
        currentPosition.lng,
        clienteLat,
        clienteLng
    );

    if (distancia > 50) {
        enviarBtn.disabled = true;
        enviarBtn.title = `Distancia mayor a 50 metros (${Math.round(distancia)}m).`;
    } else {
        enviarBtn.disabled = false;
        enviarBtn.title = "";
    }
}

// Función para actualizar el círculo alrededor de la ubicación del cliente
function actualizarClienteMapa(lat, lng) {
    if (!isNaN(lat) && !isNaN(lng)) {
        const clientePosition = { lat: parseFloat(lat), lng: parseFloat(lng) };
        clienteMarker.setPosition(clientePosition);
        ubicacionMapa.setCenter(clientePosition);
        // Actualizar la posición del círculo
        clienteCircle.setCenter(clientePosition);
        verificarDistancia(); // Verifica la distancia al actualizar la ubicación del cliente
    }
}

// Llenar desplegables de cliente y unidad desde la estructura de Firebase
async function populateDropdowns() {
    const clienteDropdown = document.getElementById("buscarCliente");
    const unidadDropdown = document.getElementById("buscarUnidad");

    clienteDropdown.innerHTML = "<option value=''>Seleccionar cliente</option>";
    unidadDropdown.innerHTML = "<option value=''>Seleccionar unidad</option>";

    try {
        const clientesSnapshot = await db.collection("clientes").get();

        // Llenar el desplegable de clientes
        clientesSnapshot.forEach((doc) => {
            const option = document.createElement("option");
            option.value = doc.id; // ID del documento cliente
            option.textContent = doc.id; // Nombre del cliente
            clienteDropdown.appendChild(option);
        });

        // Evento al seleccionar cliente
        clienteDropdown.addEventListener("change", async () => {
            const selectedClienteId = clienteDropdown.value;
            unidadDropdown.innerHTML = "<option value=''>Seleccionar unidad</option>";

            if (selectedClienteId) {
                // Buscar las unidades del cliente seleccionado
                const unidadesSnapshot = await db
                    .collection(`clientes/${selectedClienteId}/unidades`)
                    .get();

                unidadesSnapshot.forEach((unidadDoc) => {
                    const option = document.createElement("option");
                    option.value = unidadDoc.id; // ID del documento de unidad
                    option.textContent = unidadDoc.id; // Nombre de la unidad
                    unidadDropdown.appendChild(option);
                });
            }
        });
    } catch (error) {
        console.error("Error al llenar los desplegables:", error.message);
    }
}
        // Evento al seleccionar unidad
document.getElementById("buscarUnidad").addEventListener("change", async () => {
    const clienteId = document.getElementById("buscarCliente").value;
    const unidadId = document.getElementById("buscarUnidad").value;

    if (clienteId && unidadId) {
        const unidadDoc = await db.doc(`clientes/${clienteId}/unidades/${unidadId}`).get();
        if (unidadDoc.exists) {
            const unidadData = unidadDoc.data();
            document.getElementById("dniRuc").value = unidadData.ruc || "";
            document.getElementById("departamento").value = unidadData.departamento || "";
            document.getElementById("distrito").value = unidadData.distrito || "";
            document.getElementById("direccion").value = unidadData.direccion || "";
            document.getElementById("latitud").value = unidadData.latitud || "";
            document.getElementById("longitud").value = unidadData.longitud || "";

            actualizarClienteMapa(unidadData.latitud, unidadData.longitud);
        }
    }
});
  

// Función para cerrar sesión
document.getElementById("logout-btn").addEventListener("click", async () => {
    try {
        await auth.signOut();
        alert("Sesión cerrada. Redirigiendo al inicio de sesión.");
        window.location.href = "index.html";
    } catch (error) {
        console.error("Error al cerrar sesión:", error.message);
        alert("Error al cerrar sesión. Intenta nuevamente.");
    }
});

// Mostrar/Ocultar el menú lateral
const menuBtn = document.getElementById("menu-btn");
const sideMenu = document.getElementById("side-menu");
const overlay = document.createElement("div");
overlay.classList.add("overlay");
document.body.appendChild(overlay);

menuBtn.addEventListener("click", () => {
    sideMenu.classList.toggle("active");
    overlay.classList.toggle("active");
});

// Cerrar el menú al hacer clic fuera de él
document.addEventListener("click", (event) => {
    if (
        sideMenu.classList.contains("active") &&
        !sideMenu.contains(event.target) &&
        !menuBtn.contains(event.target)
    ) {
        sideMenu.classList.remove("active");
        overlay.classList.remove("active");
    }
});

// Botón Enviar
document.getElementById("enviar").addEventListener("click", async () => {
    console.log("Botón Enviar presionado.");

    // Verificar si el usuario está autenticado
    const user = auth.currentUser;
    if (!user) {
        alert("No estás autenticado. Por favor, inicia sesión.");
        return;
    }

    // Obtener datos del formulario
    const clienteId = document.getElementById("buscarCliente").value;
    const unidadId = document.getElementById("buscarUnidad").value;
    const dniRuc = document.getElementById("dniRuc").value;
    const departamento = document.getElementById("departamento").value;
    const distrito = document.getElementById("distrito").value;
    const direccion = document.getElementById("direccion").value;
    const latitudCliente = document.getElementById("latitud").value;
    const longitudCliente = document.getElementById("longitud").value;
    const tipoTarea = document.getElementById("tipoTarea").value;

    // Validar campos
    if (!clienteId || !unidadId || !tipoTarea || !latitudCliente || !longitudCliente) {
        alert("Por favor, completa todos los campos antes de enviar.");
        return;
    }

    // Obtener la fecha y hora actuales
    const now = new Date();
    const fecha = now.toLocaleDateString();
    const hora = now.toLocaleTimeString();

    // Crear objeto de tarea
    const tarea = {
        clienteId,
        unidadId,
        dniRuc,
        departamento,
        distrito,
        direccion,
        userId: user.uid,
        userEmail: user.email,
        tipoTarea,
        latitudCliente: parseFloat(latitudCliente),
        longitudCliente: parseFloat(longitudCliente),
        estado: "pendiente",
        fecha,
        hora,
    };

    try {
        // Guardar la tarea en Firestore
        const docRef = await db.collection("tareas").add(tarea);
        alert(`Tarea creada con éxito. ID: ${docRef.id}`);
        window.location.href = "menu.html"; // Redirigir al menú
    } catch (error) {
        console.error("Error al guardar la tarea:", error);
        alert("Ocurrió un error al guardar la tarea. Inténtalo nuevamente.");
    }
});


// Función para actualizar los estilos de los botones
function setupButtonEffects() {
    const cancelButton = document.getElementById("cancelar");
    const submitButton = document.getElementById("enviar");

    // Cancelar: Redirigir al menú
    cancelButton.addEventListener("click", () => {
        window.location.href = "menu.html";
    });

    // Efectos de hover y clic para los botones
    [cancelButton, submitButton].forEach((button) => {
        button.addEventListener("mouseover", () => {
            button.style.transform = "scale(1.05)";
            button.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
        });
        button.addEventListener("mouseout", () => {
            button.style.transform = "scale(1)";
            button.style.boxShadow = "none";
        });
        button.addEventListener("mousedown", () => {
            button.style.transform = "scale(0.95)";
        });
        button.addEventListener("mouseup", () => {
            button.style.transform = "scale(1)";
        });
    });
}

//estado de boton enviar
function actualizarEstadoBoton(boton, deshabilitado, mensaje = "") {
    boton.disabled = deshabilitado;
    boton.title = mensaje;
    boton.style.opacity = deshabilitado ? "0.5" : "1";
}

// Función para verificar si habilitar o deshabilitar el botón ENVIAR
function verificarDistancia() {
    const clienteLat = parseFloat(document.getElementById("latitud").value);
    const clienteLng = parseFloat(document.getElementById("longitud").value);
    const enviarBtn = document.getElementById("enviar");

    // Verificar si la posición actual o los datos del cliente son válidos
    if (!currentPosition || isNaN(clienteLat) || isNaN(clienteLng)) {
        actualizarEstadoBoton(enviarBtn, true, "Datos incompletos o ubicación no disponible.");
        return;
    }

    // Calcular la distancia entre la posición actual y la del cliente
    const distancia = calcularDistancia(
        currentPosition.lat,
        currentPosition.lng,
        clienteLat,
        clienteLng
    );

    // Actualizar el estado del botón según la distancia
    if (distancia > 50) {
        actualizarEstadoBoton(enviarBtn, true, `Distancia mayor a 50 metros (${Math.round(distancia)}m).`);
    } else {
        actualizarEstadoBoton(enviarBtn, false); // Habilita el botón sin mensaje
    }
}

document.getElementById("emergency-btn").addEventListener("click", () => {
    alert("Recargando informacion.");

    // Reinicializar Firebase
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    } else {
        firebase.app();
    }

    // Volver a solicitar permisos de GPS
    solicitarPermisosGPS();

    // Reinicializar el mapa y los desplegables
    initUbicacionesMapa();
    populateDropdowns();

    // Reconfigurar eventos de botones
    setupButtonEffects();
    setupEventListeners();

    alert("Datos recargados. Si el problema persiste, verifica tu conexión a internet.");
});

// Inicializar al cargar la página
document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("emergency-btn");
    if (!btn) {
        console.error("El botón de emergencia no existe en el DOM.");
        return;
    }
    console.log("Botón encontrado:", btn);

    cargarTipoDeTarea();
    initUbicacionesMapa();
    populateDropdowns();
    setupButtonEffects(); // Configurar efectos en botones
});