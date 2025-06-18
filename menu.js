// Inicializar Firebase Auth
const auth = firebase.auth();
const db = firebase.firestore();

// Proteger la página (verificar si hay usuario autenticado)
auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = 'index.html';
    } else {
        document.getElementById('fecha').innerText = new Date().toLocaleDateString();
        document.getElementById('user-name').innerText = user.displayName || 'Usuario';
        document.getElementById('user-email').innerText = user.email;
        cargarTareasIniciadas(user.email); // Cargar tareas iniciadas basadas en el userEmail
        cargarTareasCompletadas(user.email); // Cargar tareas completadas
    }
});

// Función para cargar las tareas completadas del usuario autenticado
function cargarTareasCompletadas(userEmail) {
    const completadosContainer = document.getElementById("completados");
    completadosContainer.innerHTML = ""; // Limpiar contenido previo

    db.collection("tareas")
        .where("userEmail", "==", userEmail)
        .where("estado", "==", "completado")
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                completadosContainer.innerHTML = "<p>No hay tareas completadas.</p>";
                return;
            }

            querySnapshot.forEach((doc) => {
                const tarea = { id: doc.id, ...doc.data() }; // Obtener los datos y el ID de la tarea
                const tareaElement = crearElementoTareaCompletada(tarea);
                completadosContainer.appendChild(tareaElement);
            });
        })
        .catch((error) => {
            console.error("Error al cargar las tareas completadas:", error);
        });
}

// Crear un elemento visual para una tarea completada
function crearElementoTareaCompletada(tarea) {
    const div = document.createElement("div");
    div.classList.add("tarea-card");

    div.innerHTML = `
        <div class="tarea-info">
            <h4>${tarea.clienteId}</h4>
            <p>${tarea.tipoTarea}</p>
            <p>${tarea.distrito} - ${tarea.fecha}</p>
        </div>
        <div class="tarea-actions">
            <button class="btn-lupa" title="Ver detalles">🔍</button>
        </div>
    `;

    // El botón de lupa no realiza ninguna acción por ahora

    return div;
}

// Función para cargar las tareas iniciadas del usuario autenticado
function cargarTareasIniciadas(userEmail) {
    const iniciadosContainer = document.getElementById("iniciados");
    iniciadosContainer.innerHTML = ""; // Limpiar contenido previo

    db.collection("tareas")
        .where("userEmail", "==", userEmail)
        .where("estado", "==", "pendiente")
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                iniciadosContainer.innerHTML = "<p>No hay tareas iniciadas.</p>";
                return;
            }

            querySnapshot.forEach((doc) => {
                const tarea = { id: doc.id, ...doc.data() }; // Obtener los datos y el ID de la tarea
                const tareaElement = crearElementoTarea(tarea);
                iniciadosContainer.appendChild(tareaElement);
            });
        })
        .catch((error) => {
            console.error("Error al cargar las tareas iniciadas:", error);
        });
}

// Crear un elemento visual para una tarea
function crearElementoTarea(tarea) {
    const div = document.createElement("div");
    div.classList.add("tarea-card");

    div.innerHTML = `
        <div class="tarea-info">
            <h4>${tarea.clienteId}</h4>
            <p>${tarea.tipoTarea}</p>
            <p>${tarea.distrito} - ${tarea.fecha}</p>
        </div>
        <div class="tarea-actions">
            <button class="btn-check" title="Marcar como completado">✔</button>
            <button class="btn-location" title="Ver ubicación">📍</button>
        </div>
    `;

    // Agregar eventos a los botones
    div.querySelector(".btn-check").addEventListener("click", () => {
        marcarTareaComoCompletada(tarea.id);
    });

    div.querySelector(".btn-location").addEventListener("click", () => {
        alert(`Ubicación: Lat ${tarea.latitudCliente}, Lng ${tarea.longitudCliente}`);
    });

    return div;
}



// Función para cerrar sesión
document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
        await auth.signOut();
        alert('Sesión cerrada. Redirigiendo al inicio de sesión.');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error al cerrar sesión:', error.message);
        alert('Error al cerrar sesión. Intenta nuevamente.');
    }
});

// Mostrar/Ocultar el menú lateral
const menuBtn = document.getElementById('menu-btn');
const sideMenu = document.getElementById('side-menu');
const overlay = document.createElement('div');
overlay.classList.add('overlay');
document.body.appendChild(overlay);

menuBtn.addEventListener('click', () => {
    sideMenu.classList.toggle('active');
    overlay.classList.toggle('active');
});

overlay.addEventListener('click', () => {
    sideMenu.classList.remove('active');
    overlay.classList.remove('active');
});

// Cambio de pestañas
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        const tab = button.getAttribute('data-tab');
        button.classList.add('active');
        document.getElementById(tab).classList.add('active');
    });
});

// Inicializar FAB y opciones
document.addEventListener("DOMContentLoaded", () => {
    const fabContainer = document.querySelector(".fab-container");
    const mainFab = document.getElementById("main-fab");
    const modal = document.getElementById("modal");
    const closeModalBtn = document.getElementById("close-modal");

    // Alternar las opciones del FAB
    mainFab.addEventListener("click", () => {
        fabContainer.classList.toggle("open");
    });

    // Abrir el modal al hacer clic en el FAB de opciones
    const addFab = document.getElementById("add-fab");
    if (addFab) {
        addFab.addEventListener("click", () => {
            modal.style.display = "block";
        });
    }

    // Cerrar el modal principal
    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", () => {
            modal.style.display = "none";
        });
    }
});

// Redirigir al formulario.html al presionar los botones del modal
document.querySelectorAll('.modal-option').forEach(button => {
    button.addEventListener('click', () => {
        const tipoDeTarea = button.getAttribute('data-tipo'); // Obtén el tipo de tarea
        localStorage.setItem('tipoDeTarea', tipoDeTarea); // Almacena el tipo de tarea en localStorage
        window.location.href = "formulario.html"; // Cambiar de página
    });
});

// Inicializar mapa principal
let map, marker;

function initMap() {
    const initialPosition = { lat: -12.0453, lng: -77.0311 }; // Posición inicial por defecto
    map = new google.maps.Map(document.getElementById("map"), {
        center: initialPosition,
        zoom: 15,
    });

    marker = new google.maps.Marker({
        position: initialPosition,
        map: map,
        title: "Tu ubicación",
    });

    trackUserLocation((position) => {
        // Actualiza la ubicación en el mapa principal
        marker.setPosition(position);
        map.setCenter(position);
    });
}

// Función para rastrear ubicación del usuario
function trackUserLocation(callback) {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (position) => {
                const currentPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                if (typeof callback === "function") {
                    callback(currentPosition);
                }
            },
            (error) => {
                console.error("Error obteniendo la ubicación:", error.message);
                alert("No se pudo obtener tu ubicación. Por favor, habilita el GPS.");
            },
            { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
        );
    } else {
        alert("Tu navegador no soporta la geolocalización.");
    }
}



// Inicializar todo al cargar la página
document.addEventListener("DOMContentLoaded", () => {
    initMap();
    const fabContainer = document.querySelector(".fab-container");
    const mainFab = document.getElementById("main-fab");
    const modal = document.getElementById("modal");
    const closeModalBtn = document.getElementById("close-modal");
});

